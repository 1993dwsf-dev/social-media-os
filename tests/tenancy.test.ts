import { signedIdentity } from "./identity";
// Testes de isolamento entre contas do Social Media OS.
//
// Regra do produto: **cada gestor só acessa o que é dele**. Todo registro tem
// `ownerId` e todas as consultas/mutations de `src/convex/portal.ts` e
// `src/convex/demo.ts` são limitadas à conta logada. Estes testes rodam as
// funções Convex de verdade (backend em memória do `convex-test`) com duas
// contas e verificam que nenhuma delas lê ou escreve no espaço da outra.
//
// Rode com: bun test

import { describe, expect, test } from "bun:test";
import { convexTest } from "convex-test";

import { api } from "../src/convex/_generated/api";
import schema from "../src/convex/schema";
import type { Id } from "../src/convex/_generated/dataModel";

// O `convex-test` espera o mapa de módulos das funções Convex. Os caminhos são
// relativos a este arquivo e a entrada em `_generated` é o que permite ao
// harness descobrir a raiz do diretório de funções.
const modules = {
  "../src/convex/_generated/api.js": () =>
    import("../src/convex/_generated/api"),
  "../src/convex/portal.ts": () => import("../src/convex/portal"),
  "../src/convex/demo.ts": () => import("../src/convex/demo"),
};

const today = "2026-09-30";

function clientRow(ownerId: Id<"users">, name: string) {
  return {
    ownerId,
    name,
    contactName: "Contato",
    email: "contato@exemplo.com",
    phone: "",
    website: "",
    industry: "",
    packageName: "Mensalidade",
    monthlyFee: 1000,
    startDate: today,
    status: "Active",
    socials: {},
    notes: "",
    onboarding: {},
    strategy: [],
    kpis: [],
    createdAt: Date.now(),
  };
}

function taskRow(ownerId: Id<"users">, clientId: Id<"clients">, title: string) {
  return {
    ownerId,
    clientId,
    title,
    project: "Mensalidade",
    category: "Design",
    priority: "Medium",
    status: "Backlog",
    startDate: today,
    dueDate: today,
    completedAt: "",
    dependsOn: "",
    notes: "",
  };
}

function contentRow(
  ownerId: Id<"users">,
  clientId: Id<"clients">,
  topic: string,
) {
  return {
    ownerId,
    clientId,
    date: today,
    platform: "Instagram",
    format: "Reel",
    topic,
    caption: "",
    assetNote: "",
    status: "Idea",
    managerNotes: "",
    clientComments: "",
    pillar: "Education",
    owner: "Ana",
  };
}

function financeRow(ownerId: Id<"users">, description: string) {
  return {
    ownerId,
    date: today,
    type: "Income",
    amount: 100,
    category: "Retainer",
    description,
    status: "Pending",
    dueDate: today,
    paidDate: "",
  };
}

/** Duas contas, cada uma com um cliente, uma tarefa, um conteúdo e um lançamento. */
async function twoWorkspaces() {
  const t = convexTest(schema, modules);

  const ids = await t.run(async (ctx) => {
    const alice = await ctx.db.insert("users", { email: "alice@exemplo.com" });
    const bob = await ctx.db.insert("users", { email: "bob@exemplo.com" });

    const aliceClient = await ctx.db.insert(
      "clients",
      clientRow(alice, "Cliente da Alice"),
    );
    const aliceSpare = await ctx.db.insert(
      "clients",
      clientRow(alice, "Segundo cliente da Alice"),
    );
    const bobClient = await ctx.db.insert(
      "clients",
      clientRow(bob, "Cliente do Bob"),
    );

    return {
      alice,
      bob,
      aliceClient,
      aliceSpare,
      bobClient,
      aliceTask: await ctx.db.insert(
        "tasks",
        taskRow(alice, aliceClient, "Tarefa da Alice"),
      ),
      bobTask: await ctx.db.insert(
        "tasks",
        taskRow(bob, bobClient, "Tarefa do Bob"),
      ),
      aliceContent: await ctx.db.insert(
        "content",
        contentRow(alice, aliceClient, "Conteúdo da Alice"),
      ),
      bobContent: await ctx.db.insert(
        "content",
        contentRow(bob, bobClient, "Conteúdo do Bob"),
      ),
      aliceFinance: await ctx.db.insert(
        "finance",
        financeRow(alice, "Receita da Alice"),
      ),
      bobFinance: await ctx.db.insert(
        "finance",
        financeRow(bob, "Receita do Bob"),
      ),
    };
  });

  return {
    t,
    ids,
    asAlice: await signedIdentity(t, ids.alice),
    asBob: await signedIdentity(t, ids.bob),
  };
}

describe("isolamento entre contas — leitura", () => {
  test("sem sessão, nenhuma lista devolve dados e o perfil é nulo", async () => {
    const t = convexTest(schema, modules);
    expect(await t.query(api.portal.listClients)).toEqual([]);
    expect(await t.query(api.portal.listContent)).toEqual([]);
    expect(await t.query(api.portal.listTasks)).toEqual([]);
    expect(await t.query(api.portal.listRequests)).toEqual([]);
    expect(await t.query(api.portal.listMeetings)).toEqual([]);
    expect(await t.query(api.portal.listDeliverables)).toEqual([]);
    expect(await t.query(api.portal.listFinance)).toEqual([]);
    expect(await t.query(api.portal.getWorkspace)).toBeNull();
  });

  test("cada conta vê apenas os próprios registros", async () => {
    const { asAlice, asBob } = await twoWorkspaces();

    expect(
      (await asAlice.query(api.portal.listClients)).map((c) => c.name),
    ).toEqual(["Cliente da Alice", "Segundo cliente da Alice"]);
    expect(
      (await asBob.query(api.portal.listClients)).map((c) => c.name),
    ).toEqual(["Cliente do Bob"]);

    expect(
      (await asAlice.query(api.portal.listTasks)).map((t) => t.title),
    ).toEqual(["Tarefa da Alice"]);
    expect(
      (await asBob.query(api.portal.listTasks)).map((t) => t.title),
    ).toEqual(["Tarefa do Bob"]);

    expect(
      (await asAlice.query(api.portal.listContent)).map((c) => c.topic),
    ).toEqual(["Conteúdo da Alice"]);
    expect(
      (await asAlice.query(api.portal.listFinance)).map((f) => f.description),
    ).toEqual(["Receita da Alice"]);
    expect(
      (await asBob.query(api.portal.listFinance)).map((f) => f.description),
    ).toEqual(["Receita do Bob"]);
  });

  test("o perfil do espaço é de quem salvou", async () => {
    const { asAlice, asBob } = await twoWorkspaces();
    await asAlice.mutation(api.portal.saveWorkspace, {
      patch: { managerName: "Ana (Alice)" },
    });

    expect((await asAlice.query(api.portal.getWorkspace))?.managerName).toBe(
      "Ana (Alice)",
    );
    expect(await asBob.query(api.portal.getWorkspace)).toBeNull();
  });
});

describe("isolamento entre contas — escrita", () => {
  test("sem sessão, nenhuma escrita passa", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(api.portal.createClient, { data: { name: "Invasor" } }),
    ).rejects.toThrow("Não autenticado");
    await expect(t.mutation(api.portal.clearWorkspace, {})).rejects.toThrow(
      "Não autenticado",
    );
    await expect(t.mutation(api.demo.seedDemo, {})).rejects.toThrow(
      "Não autenticado",
    );
  });

  test("não dá para editar nem apagar registro de outra conta", async () => {
    const { asBob, ids, t } = await twoWorkspaces();

    await expect(
      asBob.mutation(api.portal.updateClient, {
        id: ids.aliceClient,
        patch: { name: "Invadido" },
      }),
    ).rejects.toThrow("Cliente não encontrado neste espaço de trabalho");
    await expect(
      asBob.mutation(api.portal.removeClient, { id: ids.aliceClient }),
    ).rejects.toThrow("Cliente não encontrado neste espaço de trabalho");
    await expect(
      asBob.mutation(api.portal.updateTask, {
        id: ids.aliceTask,
        patch: { title: "Invadida" },
      }),
    ).rejects.toThrow("Registro não encontrado neste espaço de trabalho");
    await expect(
      asBob.mutation(api.portal.removeTask, { id: ids.aliceTask }),
    ).rejects.toThrow("Registro não encontrado neste espaço de trabalho");
    await expect(
      asBob.mutation(api.portal.updateContent, {
        id: ids.aliceContent,
        patch: { topic: "Invadido" },
      }),
    ).rejects.toThrow("Registro não encontrado neste espaço de trabalho");
    await expect(
      asBob.mutation(api.portal.markFinancePaid, { id: ids.aliceFinance }),
    ).rejects.toThrow("Registro não encontrado neste espaço de trabalho");
    await expect(
      asBob.mutation(api.portal.removeFinance, { id: ids.aliceFinance }),
    ).rejects.toThrow("Registro não encontrado neste espaço de trabalho");

    // Nada do espaço da Alice mudou.
    const aliceRows = await t.run(async (ctx) => ({
      clients: await ctx.db.get(ids.aliceClient),
      tasks: await ctx.db.get(ids.aliceTask),
      content: await ctx.db.get(ids.aliceContent),
      finance: await ctx.db.get(ids.aliceFinance),
    }));
    expect(aliceRows.clients?.name).toBe("Cliente da Alice");
    expect(aliceRows.tasks?.title).toBe("Tarefa da Alice");
    expect(aliceRows.content?.topic).toBe("Conteúdo da Alice");
    expect(aliceRows.finance?.status).toBe("Pending");
  });

  test("id de outra tabela vira “não encontrado”, não erro do runtime", async () => {
    const { asAlice, ids } = await twoWorkspaces();
    // Um id de cliente entregue onde se espera um id de tarefa.
    await expect(
      asAlice.mutation(api.portal.removeTask, { id: ids.aliceClient }),
    ).rejects.toThrow("Registro não encontrado neste espaço de trabalho");
    await expect(
      asAlice.mutation(api.portal.updateFinance, {
        id: ids.aliceTask,
        patch: { amount: 1 },
      }),
    ).rejects.toThrow("Registro não encontrado neste espaço de trabalho");
  });

  test("não dá para criar registro apontando para o cliente de outra conta", async () => {
    const { asBob, ids } = await twoWorkspaces();
    await expect(
      asBob.mutation(api.portal.createContent, {
        data: contentRow(ids.bob, ids.aliceClient, "Conteúdo enxertado"),
      }),
    ).rejects.toThrow("Cliente não encontrado neste espaço de trabalho");
    await expect(
      asBob.mutation(api.portal.createTask, {
        data: taskRow(ids.bob, ids.aliceClient, "Tarefa enxertada"),
      }),
    ).rejects.toThrow("Cliente não encontrado neste espaço de trabalho");
  });

  test("não dá para reapontar um registro para o cliente de outra conta", async () => {
    const { asBob, ids } = await twoWorkspaces();
    await expect(
      asBob.mutation(api.portal.updateTask, {
        id: ids.bobTask,
        patch: { clientId: ids.aliceClient },
      }),
    ).rejects.toThrow("Cliente não encontrado neste espaço de trabalho");
    await expect(
      asBob.mutation(api.portal.updateContent, {
        id: ids.bobContent,
        patch: { clientId: ids.aliceClient },
      }),
    ).rejects.toThrow("Cliente não encontrado neste espaço de trabalho");
  });

  test("mover registro entre clientes da própria conta continua funcionando", async () => {
    const { asAlice, ids } = await twoWorkspaces();
    await asAlice.mutation(api.portal.updateTask, {
      id: ids.aliceTask,
      patch: { clientId: ids.aliceSpare, title: "Tarefa movida" },
    });
    const task = await asAlice.query(api.portal.listTasks);
    expect(task[0].title).toBe("Tarefa movida");
    expect(task[0].clientId).toBe(ids.aliceSpare);
  });

  test("um patch não consegue trocar o dono do registro", async () => {
    const { asAlice, asBob, ids } = await twoWorkspaces();
    await asAlice.mutation(api.portal.updateClient, {
      id: ids.aliceClient,
      patch: { name: "Renomeado", ownerId: ids.bob },
    });

    expect(
      (await asAlice.query(api.portal.listClients)).map((c) => c.name),
    ).toEqual(["Renomeado", "Segundo cliente da Alice"]);
    expect(
      (await asBob.query(api.portal.listClients)).map((c) => c.name),
    ).toEqual(["Cliente do Bob"]);
    expect(
      (await asBob.query(api.portal.listTasks)).map((t) => t.title),
    ).toEqual(["Tarefa do Bob"]);
  });

  test("faturas recorrentes não podem ser geradas para o cliente de outra conta", async () => {
    const { asBob, ids, t } = await twoWorkspaces();
    await expect(
      asBob.mutation(api.portal.generateInvoices, {
        clientId: ids.aliceClient,
      }),
    ).rejects.toThrow("Cliente não encontrado neste espaço de trabalho");

    const aliceFinance = await asAliceFinance(t, ids.alice);
    expect(aliceFinance).toBe(1); // só a receita original, nenhuma fatura nova
  });

  test("apagar cliente só apaga os registros daquele cliente", async () => {
    const { asAlice, asBob, ids } = await twoWorkspaces();
    await asAlice.mutation(api.portal.removeClient, { id: ids.aliceClient });

    expect(await asBob.query(api.portal.listClients)).toHaveLength(1);
    expect(
      (await asBob.query(api.portal.listTasks)).map((t) => t.title),
    ).toEqual(["Tarefa do Bob"]);
    expect(
      (await asBob.query(api.portal.listContent)).map((c) => c.topic),
    ).toEqual(["Conteúdo do Bob"]);
    expect(
      (await asBob.query(api.portal.listFinance)).map((f) => f.description),
    ).toEqual(["Receita do Bob"]);
    // Os registros da Alice presos àquele cliente foram junto com ele.
    expect(await asAlice.query(api.portal.listTasks)).toEqual([]);
  });
});

async function asAliceFinance(
  t: Awaited<ReturnType<typeof twoWorkspaces>>["t"],
  alice: Id<"users">,
) {
  const rows = await t.run(async (ctx) =>
    ctx.db
      .query("finance")
      .withIndex("by_owner", (q) => q.eq("ownerId", alice))
      .collect(),
  );
  return rows.length;
}

describe("dados de exemplo e limpeza", () => {
  test("carregar o exemplo só mexe no espaço de quem pediu", async () => {
    const { asAlice, asBob } = await twoWorkspaces();
    await expect(asAlice.mutation(api.demo.seedDemo, {})).rejects.toThrow(
      "espaço vazio",
    );

    expect(
      (await asBob.query(api.portal.listClients)).map((c) => c.name),
    ).toEqual(["Cliente do Bob"]);
    expect(
      (await asBob.query(api.portal.listFinance)).map((f) => f.description),
    ).toEqual(["Receita do Bob"]);
    // A carteira existente foi preservada.
    expect(await asAlice.query(api.portal.listClients)).toHaveLength(2);
  });

  test("limpar o espaço não toca no espaço da outra conta", async () => {
    const { asAlice, asBob } = await twoWorkspaces();
    await asAlice.mutation(api.portal.clearWorkspace, {});

    expect(await asAlice.query(api.portal.listClients)).toEqual([]);
    expect(await asAlice.query(api.portal.listTasks)).toEqual([]);
    expect(await asAlice.query(api.portal.getWorkspace)).toBeNull();

    expect(
      (await asBob.query(api.portal.listClients)).map((c) => c.name),
    ).toEqual(["Cliente do Bob"]);
    expect(
      (await asBob.query(api.portal.listTasks)).map((t) => t.title),
    ).toEqual(["Tarefa do Bob"]);
  });
});

// ---- caminho feliz do financeiro -------------------------------------------

// O planejador puro (`planInvoices`) já é testado em `tests/workbook.test.ts`;
// aqui o que entra no banco de verdade é o handler `generateInvoices`, que só
// aparecia nos testes por recusa (cliente de outra conta).

// Referências de função do Convex como o `convex-test` as aceita.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = any;

describe("caminho feliz do financeiro", () => {
  test("generateInvoices cria as faturas no banco, marca como pago e o patch de receita funciona", async () => {
    const { asAlice, asBob, ids } = await twoWorkspaces();

    // Duas janelas de um mês, com o plano idempotente no banco: a segunda
    // passada não duplica as faturas do mês corrente.
    expect(await asAlice.mutation(api.portal.generateInvoices, {})).toEqual({
      created: 2,
    });
    expect(
      await asAlice.mutation(api.portal.generateInvoices, { months: 1 }),
    ).toEqual({
      created: 0,
    });

    const invoices = (await asAlice.query(api.portal.listFinance)).filter(
      (f) => f.kind === "invoice",
    );
    expect(invoices).toHaveLength(2);
    expect(invoices[0].amount).toBe(1000);
    expect(invoices[0].status).toBe("Pending");
    expect(invoices.every((f) => f.dueDate.endsWith("-10"))).toBe(true);
    expect(
      invoices.every((f) =>
        [ids.aliceClient, ids.aliceSpare].includes(f.clientId),
      ),
    ).toBe(true);

    // Receita avulsa criada e editada (o updateFinance só era exercitado por
    // recusa, com id de outra conta).
    const extra = await asAlice.mutation(api.portal.createFinance, {
      data: financeRow(ids.alice, "Diária de fotos"),
    });
    await asAlice.mutation(api.portal.updateFinance, {
      id: extra,
      patch: { amount: 250, status: "Paid" },
    });
    const patched = (await asAlice.query(api.portal.listFinance)).find(
      (f) => f._id === extra,
    );
    expect(patched?.amount).toBe(250);
    expect(patched?.status).toBe("Paid");

    // A fatura gerada sai de "Pending" com a data de pagamento de hoje.
    await asAlice.mutation(api.portal.markFinancePaid, { id: invoices[0]._id });
    const paid = (await asAlice.query(api.portal.listFinance)).find(
      (f) => f._id === invoices[0]._id,
    );
    expect(paid?.status).toBe("Paid");
    expect(paid?.paidDate).toBe(new Date().toISOString().slice(0, 10));

    // E o Bob segue sem fatura: a janela de um mês é por conta.
    expect(
      (await asBob.query(api.portal.listFinance)).filter(
        (f) => f.kind === "invoice",
      ),
    ).toEqual([]);
  });

  test("as seis tabelas por cliente passam pelo ciclo completo criar → atualizar → remover", async () => {
    const { asAlice, ids } = await twoWorkspaces();

    const cycle = async (
      list: AnyFn,
      create: AnyFn,
      update: AnyFn,
      remove: AnyFn,
      data: Record<string, unknown>,
      changed: Record<string, unknown>,
      readKey: "topic" | "title" | "name",
    ) => {
      const created = (await asAlice.mutation(create, { data })) as string;
      expect(created.length).toBeGreaterThan(0);

      // Procura pelo id criado: o cenário já vem com dados de exemplo.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = async () => (await asAlice.query(list)) as any[];

      let row = (await rows()).find((r) => r._id === created);
      expect(row).toBeDefined();
      expect(row[readKey]).toBe(data[readKey]);

      await asAlice.mutation(update, { id: created, patch: changed });
      row = (await rows()).find((r) => r._id === created);
      for (const [key, value] of Object.entries(changed)) {
        expect(row[key]).toBe(value);
      }

      await asAlice.mutation(remove, { id: created });
      expect((await rows()).some((r) => r._id === created)).toBe(false);
    };

    await cycle(
      api.portal.listContent,
      api.portal.createContent,
      api.portal.updateContent,
      api.portal.removeContent,
      contentRow(ids.alice, ids.aliceClient, "Conteúdo novo"),
      { topic: "Conteúdo editado", status: "Drafting" },
      "topic",
    );
    await cycle(
      api.portal.listRequests,
      api.portal.createRequest,
      api.portal.updateRequest,
      api.portal.removeRequest,
      {
        clientId: ids.aliceClient,
        title: "Solicitação nova",
        category: "Design",
        priority: "High",
        dateSubmitted: today,
        status: "New",
        assignedTo: "",
        dueDate: today,
        comments: "",
      },
      { status: "In Progress" },
      "title",
    );
    await cycle(
      api.portal.listMeetings,
      api.portal.createMeeting,
      api.portal.updateMeeting,
      api.portal.removeMeeting,
      {
        clientId: ids.aliceClient,
        title: "Reunião nova",
        date: today,
        time: "09:00",
        agenda: "",
        participants: "",
        status: "Scheduled",
        notes: "",
        actionItems: "",
      },
      { time: "14:00" },
      "title",
    );
    await cycle(
      api.portal.listDeliverables,
      api.portal.createDeliverable,
      api.portal.updateDeliverable,
      api.portal.removeDeliverable,
      {
        clientId: ids.aliceClient,
        name: "Entrega nova.pdf",
        category: "Documents",
        description: "",
        date: today,
        status: "Shared",
        relatedContent: "",
        relatedProject: "Mensalidade",
      },
      { status: "In progress" },
      "name",
    );
  });
});
