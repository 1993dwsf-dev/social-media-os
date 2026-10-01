// API do espaço de trabalho do gestor no Contentplane.
//
// Cada consulta e mutation é limitada ao gestor logado (`ownerId`), então duas
// contas nunca veem os clientes, conteúdos, tarefas ou finanças uma da outra.
//
// As criações recebem um registro completo dos helpers tipados do cliente
// (`data`) e as atualizações recebem um patch parcial; o modelo TypeScript em
// `src/data/types.ts` continua sendo a fonte de verdade dos campos.

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { planInvoices } from "../data/invoicing";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

type Ctx = QueryCtx | MutationCtx;
type Owner = Id<"users">;

const OWNED_TABLES = [
  "clients",
  "content",
  "tasks",
  "requests",
  "meetings",
  "deliverables",
  "finance",
] as const;
type OwnedTable = (typeof OWNED_TABLES)[number];
type PerClientTable = Exclude<OwnedTable, "clients">;

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = (ctx: Ctx) => ctx.db as any;

async function currentOwner(ctx: Ctx): Promise<Owner | null> {
  return await getAuthUserId(ctx);
}

async function requireOwner(ctx: Ctx): Promise<Owner> {
  const ownerId = await currentOwner(ctx);
  if (!ownerId) throw new Error("Não autenticado");
  return ownerId;
}

/** Nunca deixe um payload sobrescrever campos de identidade/sistema. */
function sanitize(patch: unknown): Record<string, unknown> {
  if (!patch || typeof patch !== "object") return {};
  const { ownerId: _ownerId, _id: _docId, _creationTime: _createdAt, ...rest } =
    patch as Record<string, unknown>;
  return rest;
}

async function listOwned(ctx: Ctx, ownerId: Owner, table: OwnedTable) {
  return (await db(ctx)
    .query(table)
    .withIndex("by_owner", (q: any) => q.eq("ownerId", ownerId))
    .collect()) as any[];
}

/**
 * Busca um registro **do dono**. O `normalizeId` confere antes se o id é mesmo
 * daquela tabela: um id de outra tabela (ou um id inválido) vira `null` em vez
 * de estourar um erro do runtime, e o dono é comparado depois da leitura.
 */
async function getOwned(
  ctx: Ctx,
  ownerId: Owner,
  table: OwnedTable,
  id: string,
) {
  const normalized = ctx.db.normalizeId(table, id);
  if (!normalized) return null;
  const doc = await db(ctx).get(normalized);
  if (!doc || doc.ownerId !== ownerId) return null;
  return doc;
}

/** Rejeita gravações que apontem para um cliente de outra pessoa. */
async function assertOwnedClient(ctx: Ctx, ownerId: Owner, clientId?: string) {
  if (!clientId) return;
  const client = await getOwned(ctx, ownerId, "clients", clientId);
  if (!client) throw new Error("Cliente não encontrado neste espaço de trabalho");
}

// ---- workspace profile ----------------------------------------------------

export const getWorkspace = query({
  args: {},
  handler: async (ctx) => {
    const ownerId = await currentOwner(ctx);
    if (!ownerId) return null;
    return await ctx.db
      .query("workspaces")
      .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
      .unique();
  },
});

export const saveWorkspace = mutation({
  args: { patch: v.any() },
  handler: async (ctx, { patch }) => {
    const ownerId = await requireOwner(ctx);
    const existing = await ctx.db
      .query("workspaces")
      .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
      .unique();
    const clean = sanitize(patch);
    if (existing) {
      await ctx.db.patch(existing._id, clean);
      return existing._id;
    }
    return await ctx.db.insert("workspaces", {
      ownerId,
      managerName: "",
      agency: "",
      email: "",
      currency: "R$",
      weekStart: "Monday",
      approvalTurnaroundDays: 3,
      notifyEmail: true,
      notifyApprovals: true,
      notifyFinance: false,
      density: "comfortable",
      ...clean,
    });
  },
});

// ---- clients --------------------------------------------------------------

export const listClients = query({
  args: {},
  handler: async (ctx) => {
    const ownerId = await currentOwner(ctx);
    if (!ownerId) return [];
    const rows = await listOwned(ctx, ownerId, "clients");
    return rows.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  },
});

export const createClient = mutation({
  args: { data: v.any() },
  handler: async (ctx, { data }) => {
    const ownerId = await requireOwner(ctx);
    return await db(ctx).insert("clients", { ...sanitize(data), ownerId });
  },
});

export const updateClient = mutation({
  args: { id: v.string(), patch: v.any() },
  handler: async (ctx, { id, patch }) => {
    const ownerId = await requireOwner(ctx);
    const doc = await getOwned(ctx, ownerId, "clients", id);
    if (!doc) throw new Error("Cliente não encontrado neste espaço de trabalho");
    await ctx.db.patch(doc._id, sanitize(patch));
  },
});

export const removeClient = mutation({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const ownerId = await requireOwner(ctx);
    const doc = await getOwned(ctx, ownerId, "clients", id);
    if (!doc) throw new Error("Cliente não encontrado neste espaço de trabalho");
    // Remove tudo que pertence ao cliente para não sobrar registro órfão.
    for (const table of OWNED_TABLES.filter((t): t is PerClientTable => t !== "clients")) {
      const rows = (await db(ctx)
        .query(table)
        .withIndex("by_client", (q: any) => q.eq("clientId", doc._id))
        .collect()) as any[];
      for (const row of rows) await ctx.db.delete(row._id);
    }
    await ctx.db.delete(doc._id);
  },
});

// ---- registros por cliente (conteúdo, tarefas, solicitações, reuniões, arquivos, dinheiro) -

function perClientApi(table: PerClientTable) {
  return {
    list: query({
      args: {},
      handler: async (ctx) => {
        const ownerId = await currentOwner(ctx);
        if (!ownerId) return [];
        return await listOwned(ctx, ownerId, table);
      },
    }),
    create: mutation({
      args: { data: v.any() },
      handler: async (ctx, { data }) => {
        const ownerId = await requireOwner(ctx);
        const record = sanitize(data);
        await assertOwnedClient(ctx, ownerId, record.clientId as string | undefined);
        return await db(ctx).insert(table, { ...record, ownerId });
      },
    }),
    update: mutation({
      args: { id: v.string(), patch: v.any() },
      handler: async (ctx, { id, patch }) => {
        const ownerId = await requireOwner(ctx);
        const doc = await getOwned(ctx, ownerId, table, id);
        if (!doc) throw new Error("Registro não encontrado neste espaço de trabalho");
        const record = sanitize(patch);
        // Um patch não pode reapontar o registro para o cliente de outra pessoa.
        await assertOwnedClient(ctx, ownerId, record.clientId as string | undefined);
        await ctx.db.patch(doc._id, record);
      },
    }),
    remove: mutation({
      args: { id: v.string() },
      handler: async (ctx, { id }) => {
        const ownerId = await requireOwner(ctx);
        const doc = await getOwned(ctx, ownerId, table, id);
        if (!doc) throw new Error("Registro não encontrado neste espaço de trabalho");
        await ctx.db.delete(doc._id);
      },
    }),
  };
}

// Cada função do Convex precisa ser exportada individualmente para o codegen vê-la.
const content = perClientApi("content");
export const listContent = content.list;
export const createContent = content.create;
export const updateContent = content.update;
export const removeContent = content.remove;

const tasks = perClientApi("tasks");
export const listTasks = tasks.list;
export const createTask = tasks.create;
export const updateTask = tasks.update;
export const removeTask = tasks.remove;

const requests = perClientApi("requests");
export const listRequests = requests.list;
export const createRequest = requests.create;
export const updateRequest = requests.update;
export const removeRequest = requests.remove;

const meetings = perClientApi("meetings");
export const listMeetings = meetings.list;
export const createMeeting = meetings.create;
export const updateMeeting = meetings.update;
export const removeMeeting = meetings.remove;

const deliverables = perClientApi("deliverables");
export const listDeliverables = deliverables.list;
export const createDeliverable = deliverables.create;
export const updateDeliverable = deliverables.update;
export const removeDeliverable = deliverables.remove;

const finance = perClientApi("finance");
export const listFinance = finance.list;
export const createFinance = finance.create;
export const updateFinance = finance.update;
export const removeFinance = finance.remove;

// ---- recurring invoices ---------------------------------------------------

/**
 * Gera lançamentos de receita a partir da mensalidade de cada cliente ativo.
 *
 * O plano é calculado pelo helper puro em `src/data/invoicing.ts` (testado
 * lá); este handler apenas converte o plano em inserções no banco.
 * Para cada cliente ativo (mensalidade > 0) cria um lançamento "invoice" por
 * mês da janela, a menos que o cliente já tenha uma fatura daquele mês — por
 * isso é seguro clicar várias vezes. Cada fatura vence no dia 10.
 */
export const generateInvoices = mutation({
  args: {
    /** Quantos meses faturar: 1 = só o mês atual, 2 = atual + próximo. */
    months: v.optional(v.number()),
    /** Restringe a geração a um cliente (padrão: todos os clientes ativos). */
    clientId: v.optional(v.string()),
  },
  handler: async (ctx, { months = 1, clientId }) => {
    const ownerId = await requireOwner(ctx);
    // O filtro opcional também precisa ser do dono (defesa em profundidade).
    await assertOwnedClient(ctx, ownerId, clientId);
    // O planejador espera `{ id, name, status, monthlyFee }`: as linhas do
    // banco têm `_id`, e passar o documento cru fazia o plano sair com
    // `clientId` indefinido (faturas sem cliente, deduplicação por acidente e
    // o filtro por cliente devolvendo sempre zero).
    const clients = ((await listOwned(ctx, ownerId, "clients")) as any[]).map(
      (row) => ({
        id: row._id as string,
        name: row.name as string,
        status: row.status as string,
        monthlyFee: row.monthlyFee as number,
      }),
    );
    const existing = (await db(ctx)
      .query("finance")
      .withIndex("by_owner", (q: any) => q.eq("ownerId", ownerId))
      .collect()) as any[];

    const plan = planInvoices(clients, existing, months, clientId);

    for (const invoice of plan) {
      await db(ctx).insert("finance", {
        ownerId,
        clientId: invoice.clientId,
        date: invoice.month,
        type: "Income",
        amount: invoice.amount,
        category: "Retainer",
        description: invoice.description,
        status: "Pending",
        dueDate: invoice.dueDate,
        paidDate: "",
        kind: "invoice",
      });
    }
    return { created: plan.length };
  },
});

/** Marca um lançamento de receita como pago hoje. */
export const markFinancePaid = mutation({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const ownerId = await requireOwner(ctx);
    const doc = await getOwned(ctx, ownerId, "finance", id);
    if (!doc) throw new Error("Registro não encontrado neste espaço de trabalho");
    await ctx.db.patch(doc._id, { status: "Paid", paidDate: new Date().toISOString().slice(0, 10) });
  },
});

// ---- destructive ----------------------------------------------------------

export const clearWorkspace = mutation({
  args: {},
  handler: async (ctx) => {
    const ownerId = await requireOwner(ctx);
    for (const table of OWNED_TABLES) {
      const rows = await listOwned(ctx, ownerId, table);
      for (const row of rows) await ctx.db.delete(row._id);
    }
    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
      .unique();
    if (workspace) await ctx.db.delete(workspace._id);
    return null;
  },
});
