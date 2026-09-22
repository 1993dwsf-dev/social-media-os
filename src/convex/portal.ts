// Contentplane manager workspace API.
//
// Every query and mutation is scoped to the signed-in manager (`ownerId`), so
// two accounts never see each other's clients, content, tasks, or finances.
//
// Creates take a complete record from the typed client helpers (`data`) and
// updates take a partial patch; the TypeScript model in `src/data/types.ts`
// stays the source of truth for the field shapes.

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

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
  if (!ownerId) throw new Error("Not authenticated");
  return ownerId;
}

/** Never let a client payload overwrite identity/system fields. */
function sanitize(patch: unknown): Record<string, unknown> {
  if (!patch || typeof patch !== "object") return {};
  const { ownerId: _o, _id: _i, _creationTime: _c, ...rest } = patch as Record<string, unknown>;
  return rest;
}

async function listOwned(ctx: Ctx, ownerId: Owner, table: OwnedTable) {
  return (await db(ctx)
    .query(table)
    .withIndex("by_owner", (q: any) => q.eq("ownerId", ownerId))
    .collect()) as any[];
}

async function getOwned(ctx: Ctx, ownerId: Owner, id: string) {
  const doc = await db(ctx).get(id);
  if (!doc || doc.ownerId !== ownerId) return null;
  return doc;
}

/** Reject writes that point at a client owned by somebody else. */
async function assertOwnedClient(ctx: Ctx, ownerId: Owner, clientId?: string) {
  if (!clientId) return;
  const client = await getOwned(ctx, ownerId, clientId);
  if (!client) throw new Error("Client not found in this workspace");
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
      currency: "$",
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
    const doc = await getOwned(ctx, ownerId, id);
    if (!doc) throw new Error("Client not found in this workspace");
    await ctx.db.patch(doc._id, sanitize(patch));
  },
});

export const removeClient = mutation({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const ownerId = await requireOwner(ctx);
    const doc = await getOwned(ctx, ownerId, id);
    if (!doc) throw new Error("Client not found in this workspace");
    // Remove everything that belongs to the client so no orphan rows remain.
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

// ---- per-client records (content, tasks, requests, meetings, files, money) -

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
        const doc = await getOwned(ctx, ownerId, id);
        if (!doc) throw new Error("Record not found in this workspace");
        await ctx.db.patch(doc._id, sanitize(patch));
      },
    }),
    remove: mutation({
      args: { id: v.string() },
      handler: async (ctx, { id }) => {
        const ownerId = await requireOwner(ctx);
        const doc = await getOwned(ctx, ownerId, id);
        if (!doc) throw new Error("Record not found in this workspace");
        await ctx.db.delete(doc._id);
      },
    }),
  };
}

// Each Convex function must be exported individually for codegen to pick it up.
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
