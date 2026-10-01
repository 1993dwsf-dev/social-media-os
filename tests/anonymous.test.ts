// Testes de isolamento da sessão anônima (visitante) do Contentplane.
//
// O botão "Continuar como visitante" cria uma conta anônima (`isAnonymous:
// true`, sem e-mail) e uma sessão comum. A regra do produto vale para ela
// também: **cada sessão só acessa o que é dela**. Aqui exercitamos o fluxo real
// de entrada (`auth:signIn` com o provider "anonymous") e, com a identidade
// devolvida, verificamos que um visitante não lê nem escreve no espaço de
// outras contas — e que ninguém alcança o espaço do visitante.
//
// Rode com: bun test

/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "bun:test";
import { convexTest } from "convex-test";

import { api } from "../src/convex/_generated/api";
import schema from "../src/convex/schema";
import type { Id } from "../src/convex/_generated/dataModel";

// Caminhos relativos a este arquivo; `auth.ts` precisa estar no mapa porque o
// `signIn` do visitante grava a conta/sessão via `auth:store`.
const modules = {
  "../src/convex/_generated/api.js": () =>
    import("../src/convex/_generated/api"),
  "../src/convex/auth.ts": () => import("../src/convex/auth"),
  "../src/convex/demo.ts": () => import("../src/convex/demo"),
  "../src/convex/portal.ts": () => import("../src/convex/portal"),
  "../src/convex/turnstile.ts": () => import("../src/convex/turnstile"),
  "../src/convex/users.ts": () => import("../src/convex/users"),
};

type TestConvex = ReturnType<typeof convexTest>;

const today = "2026-09-30";

// ---- linhas de teste -------------------------------------------------------

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

function taskRow(ownerId: Id<"users">, clientId: Id<"clients">, title: string) {
  return {
    ownerId,
    clientId,
    title,
    project: "Mensalidade",
    category: "Design",
    priority: "Medium",
    status: "Todo",
    startDate: today,
    dueDate: today,
    completedAt: "",
    dependsOn: "",
    notes: "",
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

/** Conta com e-mail e as sete tabelas do portal cheias, além do perfil. */
async function seedEmailAccount(t: TestConvex) {
  const ids = await t.run(async (ctx) => {
    const owner = await ctx.db.insert("users", { email: "gestora@exemplo.com" });
    const client = await ctx.db.insert(
      "clients",
      clientRow(owner, "Cliente da gestora"),
    );
    await ctx.db.insert(
      "content",
      contentRow(owner, client, "Conteúdo da gestora"),
    );
    await ctx.db.insert("tasks", taskRow(owner, client, "Tarefa da gestora"));
    await ctx.db.insert("requests", {
      ownerId: owner,
      clientId: client,
      title: "Solicitação da gestora",
      category: "",
      priority: "Medium",
      dateSubmitted: today,
      status: "New",
      assignedTo: "",
      dueDate: today,
      comments: "",
    });
    await ctx.db.insert("meetings", {
      ownerId: owner,
      clientId: client,
      title: "Reunião da gestora",
      date: today,
      time: "10:00",
      agenda: "",
      participants: "",
      status: "Scheduled",
      notes: "",
      actionItems: "",
    });
    await ctx.db.insert("deliverables", {
      ownerId: owner,
      clientId: client,
      name: "Entrega da gestora",
      category: "",
      description: "",
      date: today,
      status: "Shared",
      relatedContent: "",
      relatedProject: "",
    });
    await ctx.db.insert("finance", financeRow(owner, "Receita da gestora"));
    await ctx.db.insert("workspaces", {
      ownerId: owner,
      managerName: "Gestora de exemplo",
      agency: "Agência",
      email: "gestora@exemplo.com",
      currency: "R$",
      weekStart: "Monday",
      approvalTurnaroundDays: 3,
      notifyEmail: true,
      notifyApprovals: true,
      notifyFinance: false,
      density: "comfortable",
    });

    return { owner, client };
  });

  return { ...ids, asOwner: t.withIdentity({ subject: ids.owner }) };
}

// ---- entrada como visitante ------------------------------------------------

/**
 * Executa o fluxo real do cliente: `signIn` no provider "anonymous". O usuário
 * criado é o mais novo marcado como anônimo (o helper suporta mais de um
 * visitante na mesma sessão de teste) e vira uma identidade como no login de
 * verdade — `subject` no formato `userId|sessionId` usado pelo Convex Auth.
 */
async function signInVisitor(t: TestConvex, params: Record<string, unknown> = {}) {
  const before = await t.run(async (ctx) =>
    (await ctx.db.query("users").collect()).map((user) => user._id),
  );

  const result = (await t.action(api.auth.signIn, {
    provider: "anonymous",
    params,
  })) as unknown as {
    tokens?: { token?: string; refreshToken?: string } | null;
  } | null;

  const state = await t.run(async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const visitor = users.find(
      (user) => user.isAnonymous === true && !before.includes(user._id),
    );
    if (!visitor) return null;

    const session = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", visitor._id))
      .first();
    const account = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) =>
        q.eq("userId", visitor._id).eq("provider", "anonymous"),
      )
      .first();

    return { id: visitor._id, sessionId: session?._id ?? null, account };
  });

  if (!state) throw new Error("A entrada como visitante não criou o usuário anônimo");

  const subject = state.sessionId ? `${state.id}|${state.sessionId}` : state.id;
  return {
    visitorId: state.id,
    sessionId: state.sessionId,
    account: state.account,
    tokens: result?.tokens ?? null,
    asVisitor: t.withIdentity({ subject }),
  };
}

/** Instantâneo do que o fluxo de autenticação pode gravar. */
async function authSnapshot(t: TestConvex) {
  return await t.run(async (ctx) => ({
    users: await ctx.db.query("users").collect(),
    accounts: await ctx.db.query("authAccounts").collect(),
    sessions: await ctx.db.query("authSessions").collect(),
    refreshTokens: await ctx.db.query("authRefreshTokens").collect(),
    grants: await ctx.db.query("turnstileGrants").collect(),
  }));
}

/** Captura e confere a recusa, seja `ConvexError` (`.data`) ou `Error` comum. */
async function expectRefusal(promise: Promise<unknown>, expected: string) {
  let caught: unknown;
  try {
    await promise;
  } catch (error) {
    caught = error;
  }
  expect(caught, "a entrada deveria ter sido recusada").toBeDefined();

  const data = (caught as { data?: unknown })?.data;
  const message =
    typeof data === "string"
      ? data
      : caught instanceof Error
        ? caught.message
        : String(caught);
  expect(message).toContain(expected);
}

// A action `auth:signIn` sempre gera o JWT da sessão, então os testes precisam
// de uma chave de assinatura — gerada uma vez, só em memória.
let testPrivateKeyPem = "";

beforeAll(async () => {
  const pair = (await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  )) as CryptoKeyPair;

  const pkcs8 = await crypto.subtle.exportKey("pkcs8", pair.privateKey);
  const base64 = Buffer.from(pkcs8).toString("base64");
  const lines = base64.match(/.{1,64}/g)?.join("\n") ?? base64;
  testPrivateKeyPem = `-----BEGIN PRIVATE KEY-----\n${lines}\n-----END PRIVATE KEY-----\n`;
});

const realFetch = globalThis.fetch;
const realConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
};

beforeEach(() => {
  delete process.env.TURNSTILE_SECRET_KEY;
  process.env.JWT_PRIVATE_KEY = testPrivateKeyPem;
  process.env.CONVEX_SITE_URL = "https://contentplane.exemplo";
  // O Convex Auth loga em INFO a cada `auth:store`; silenciamos o ruído.
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
  console.error = () => {};
});

afterEach(() => {
  globalThis.fetch = realFetch;
  delete process.env.TURNSTILE_SECRET_KEY;
  delete process.env.JWT_PRIVATE_KEY;
  delete process.env.CONVEX_SITE_URL;
  console.log = realConsole.log;
  console.info = realConsole.info;
  console.warn = realConsole.warn;
  console.error = realConsole.error;
});

afterAll(() => {
  testPrivateKeyPem = "";
});

// ---- 1. o fluxo real -------------------------------------------------------

describe("entrada como visitante", () => {
  test("cria um usuário anônimo sem e-mail, conta 'anonymous' e sessão válida", async () => {
    const t = convexTest(schema, modules);
    const visitor = await signInVisitor(t);

    // O JWT da sessão saiu de verdade (a chave de teste assinou).
    expect(typeof visitor.tokens?.token).toBe("string");
    expect(visitor.tokens?.token?.length).toBeGreaterThan(0);

    const user = await t.run(async (ctx) => await ctx.db.get(visitor.visitorId));
    expect(user?.isAnonymous).toBe(true);
    expect(user?.email).toBeUndefined();

    const account = await t.run(async (ctx) =>
      ctx.db
        .query("authAccounts")
        .withIndex("userIdAndProvider", (q) =>
          q.eq("userId", visitor.visitorId).eq("provider", "anonymous"),
        )
        .first(),
    );
    expect(account?.providerAccountId.length).toBeGreaterThan(0);

    const sessions = await t.run(async (ctx) =>
      ctx.db
        .query("authSessions")
        .withIndex("userId", (q) => q.eq("userId", visitor.visitorId))
        .collect(),
    );
    expect(sessions).toHaveLength(1);
    expect(sessions[0]._id).toBe(visitor.sessionId);

    // A identidade do visitante é uma sessão comum.
    expect(await visitor.asVisitor.query(api.auth.isAuthenticated)).toBe(true);
    const current = await visitor.asVisitor.query(api.users.currentUser);
    expect(current?._id).toBe(visitor.visitorId);
    expect(current?.isAnonymous).toBe(true);
  });

  test("o visitante não vê nada de uma conta de e-mail já cheia", async () => {
    const t = convexTest(schema, modules);
    const owner = await seedEmailAccount(t);
    const visitor = await signInVisitor(t);

    // Todas as sete listas e o perfil continuam vazios para o visitante.
    expect(await visitor.asVisitor.query(api.portal.listClients)).toEqual([]);
    expect(await visitor.asVisitor.query(api.portal.listContent)).toEqual([]);
    expect(await visitor.asVisitor.query(api.portal.listTasks)).toEqual([]);
    expect(await visitor.asVisitor.query(api.portal.listRequests)).toEqual([]);
    expect(await visitor.asVisitor.query(api.portal.listMeetings)).toEqual([]);
    expect(
      await visitor.asVisitor.query(api.portal.listDeliverables),
    ).toEqual([]);
    expect(await visitor.asVisitor.query(api.portal.listFinance)).toEqual([]);
    expect(await visitor.asVisitor.query(api.portal.getWorkspace)).toBeNull();

    // A conta de e-mail continua enxergando o próprio espaço.
    expect((await owner.asOwner.query(api.portal.listClients)).map((c) => c.name)).toEqual([
      "Cliente da gestora",
    ]);
    expect((await owner.asOwner.query(api.portal.listTasks)).map((t) => t.title)).toEqual([
      "Tarefa da gestora",
    ]);
    expect(await owner.asOwner.query(api.portal.getWorkspace)).not.toBeNull();
  });
});

// ---- 2. isolamento ---------------------------------------------------------

describe("isolamento da sessão anônima", () => {
  test("o que o visitante cria fica só no espaço dele", async () => {
    const t = convexTest(schema, modules);
    const owner = await seedEmailAccount(t);
    const visitor = await signInVisitor(t);

    const client = await visitor.asVisitor.mutation(api.portal.createClient, {
      data: clientRow(visitor.visitorId, "Cliente do visitante"),
    });
    await visitor.asVisitor.mutation(api.portal.createTask, {
      data: taskRow(visitor.visitorId, client, "Tarefa do visitante"),
    });
    await visitor.asVisitor.mutation(api.portal.createContent, {
      data: contentRow(visitor.visitorId, client, "Conteúdo do visitante"),
    });
    await visitor.asVisitor.mutation(api.portal.createFinance, {
      data: { ...financeRow(visitor.visitorId, "Receita do visitante"), clientId: client },
    });
    await visitor.asVisitor.mutation(api.portal.saveWorkspace, {
      patch: { managerName: "Visitante" },
    });

    // O visitante vê somente o que criou.
    expect((await visitor.asVisitor.query(api.portal.listClients)).map((c) => c.name)).toEqual([
      "Cliente do visitante",
    ]);
    expect((await visitor.asVisitor.query(api.portal.listTasks)).map((t) => t.title)).toEqual([
      "Tarefa do visitante",
    ]);
    expect(
      (await visitor.asVisitor.query(api.portal.listContent)).map((c) => c.topic),
    ).toEqual(["Conteúdo do visitante"]);
    expect(
      (await visitor.asVisitor.query(api.portal.listFinance)).map((f) => f.description),
    ).toEqual(["Receita do visitante"]);
    expect((await visitor.asVisitor.query(api.portal.getWorkspace))?.managerName).toBe(
      "Visitante",
    );

    // A conta de e-mail continua com o espaço original, sem os registros novos.
    expect((await owner.asOwner.query(api.portal.listClients)).map((c) => c.name)).toEqual([
      "Cliente da gestora",
    ]);
    expect((await owner.asOwner.query(api.portal.listTasks)).map((t) => t.title)).toEqual([
      "Tarefa da gestora",
    ]);
    expect((await owner.asOwner.query(api.portal.getWorkspace))?.managerName).toBe(
      "Gestora de exemplo",
    );

    // E no banco cada linha pertence de fato a quem a criou.
    const owners = await t.run(async (ctx) => {
      const clients = await ctx.db.query("clients").collect();
      const visitorClient = clients.find((row) => row.name === "Cliente do visitante");
      return visitorClient?.ownerId;
    });
    expect(owners).toBe(visitor.visitorId);
  });

  test("o visitante não lê nem altera registros da conta de e-mail", async () => {
    const t = convexTest(schema, modules);
    const owner = await seedEmailAccount(t);
    const visitor = await signInVisitor(t);

    const ownerState = await t.run(async (ctx) => ({
      clients: await ctx.db.query("clients").collect(),
      tasks: await ctx.db.query("tasks").collect(),
      content: await ctx.db.query("content").collect(),
      finance: await ctx.db.query("finance").collect(),
    }));

    await expectRefusal(
      visitor.asVisitor.mutation(api.portal.updateClient, {
        id: owner.client,
        patch: { name: "Invadido" },
      }),
      "Cliente não encontrado neste espaço de trabalho",
    );
    await expectRefusal(
      visitor.asVisitor.mutation(api.portal.removeClient, { id: owner.client }),
      "Cliente não encontrado neste espaço de trabalho",
    );
    await expectRefusal(
      visitor.asVisitor.mutation(api.portal.updateTask, {
        id: ownerState.tasks[0]._id,
        patch: { title: "Invadida" },
      }),
      "Registro não encontrado neste espaço de trabalho",
    );
    await expectRefusal(
      visitor.asVisitor.mutation(api.portal.removeTask, {
        id: ownerState.tasks[0]._id,
      }),
      "Registro não encontrado neste espaço de trabalho",
    );
    await expectRefusal(
      visitor.asVisitor.mutation(api.portal.updateContent, {
        id: ownerState.content[0]._id,
        patch: { topic: "Invadido" },
      }),
      "Registro não encontrado neste espaço de trabalho",
    );
    await expectRefusal(
      visitor.asVisitor.mutation(api.portal.markFinancePaid, {
        id: ownerState.finance[0]._id,
      }),
      "Registro não encontrado neste espaço de trabalho",
    );
    await expectRefusal(
      visitor.asVisitor.mutation(api.portal.removeFinance, {
        id: ownerState.finance[0]._id,
      }),
      "Registro não encontrado neste espaço de trabalho",
    );

    // Nada do espaço da conta de e-mail mudou.
    const after = await t.run(async (ctx) => ({
      clients: await ctx.db.query("clients").collect(),
      tasks: await ctx.db.query("tasks").collect(),
      content: await ctx.db.query("content").collect(),
      finance: await ctx.db.query("finance").collect(),
    }));
    expect(after).toEqual(ownerState);
  });

  test("o visitante não consegue apontar registros para o cliente da conta de e-mail", async () => {
    const t = convexTest(schema, modules);
    const owner = await seedEmailAccount(t);
    const visitor = await signInVisitor(t);

    const client = await visitor.asVisitor.mutation(api.portal.createClient, {
      data: clientRow(visitor.visitorId, "Cliente do visitante"),
    });
    const task = await visitor.asVisitor.mutation(api.portal.createTask, {
      data: taskRow(visitor.visitorId, client, "Tarefa do visitante"),
    });

    await expectRefusal(
      visitor.asVisitor.mutation(api.portal.createContent, {
        data: contentRow(visitor.visitorId, owner.client, "Conteúdo enxertado"),
      }),
      "Cliente não encontrado neste espaço de trabalho",
    );
    await expectRefusal(
      visitor.asVisitor.mutation(api.portal.createTask, {
        data: taskRow(visitor.visitorId, owner.client, "Tarefa enxertada"),
      }),
      "Cliente não encontrado neste espaço de trabalho",
    );
    await expectRefusal(
      visitor.asVisitor.mutation(api.portal.updateTask, {
        id: task,
        patch: { clientId: owner.client },
      }),
      "Cliente não encontrado neste espaço de trabalho",
    );
    await expectRefusal(
      visitor.asVisitor.mutation(api.portal.generateInvoices, {
        clientId: owner.client,
      }),
      "Cliente não encontrado neste espaço de trabalho",
    );

    // Nem a tarefa foi reapontada nem a conta de e-mail ganhou faturas.
    const visitorTask = await visitor.asVisitor.query(api.portal.listTasks);
    expect(visitorTask).toHaveLength(1);
    expect(visitorTask[0].clientId).toBe(client);
    const ownerFinance = await owner.asOwner.query(api.portal.listFinance);
    expect(ownerFinance.map((row) => row.description)).toEqual(["Receita da gestora"]);
  });

  test("a conta de e-mail não vê nem toca no espaço do visitante", async () => {
    const t = convexTest(schema, modules);
    const owner = await seedEmailAccount(t);
    const visitor = await signInVisitor(t);

    const client = await visitor.asVisitor.mutation(api.portal.createClient, {
      data: clientRow(visitor.visitorId, "Cliente do visitante"),
    });
    const task = await visitor.asVisitor.mutation(api.portal.createTask, {
      data: taskRow(visitor.visitorId, client, "Tarefa do visitante"),
    });

    expect((await owner.asOwner.query(api.portal.listClients)).map((c) => c.name)).toEqual([
      "Cliente da gestora",
    ]);

    await expectRefusal(
      owner.asOwner.mutation(api.portal.updateClient, {
        id: client,
        patch: { name: "Invadido" },
      }),
      "Cliente não encontrado neste espaço de trabalho",
    );
    await expectRefusal(
      owner.asOwner.mutation(api.portal.removeClient, { id: client }),
      "Cliente não encontrado neste espaço de trabalho",
    );
    await expectRefusal(
      owner.asOwner.mutation(api.portal.updateTask, {
        id: task,
        patch: { title: "Invadida" },
      }),
      "Registro não encontrado neste espaço de trabalho",
    );

    // O espaço do visitante segue intacto.
    expect((await visitor.asVisitor.query(api.portal.listClients)).map((c) => c.name)).toEqual([
      "Cliente do visitante",
    ]);
    expect((await visitor.asVisitor.query(api.portal.listTasks)).map((t) => t.title)).toEqual([
      "Tarefa do visitante",
    ]);
  });

  test("dois visitantes ficam isolados entre si", async () => {
    const t = convexTest(schema, modules);
    const first = await signInVisitor(t);
    const client = await first.asVisitor.mutation(api.portal.createClient, {
      data: clientRow(first.visitorId, "Cliente do primeiro visitante"),
    });

    const second = await signInVisitor(t);
    expect(second.visitorId).not.toBe(first.visitorId);

    // O segundo visitante começa vazio e não alcança o primeiro.
    expect(await second.asVisitor.query(api.portal.listClients)).toEqual([]);
    await expectRefusal(
      second.asVisitor.mutation(api.portal.updateClient, {
        id: client,
        patch: { name: "Invadido" },
      }),
      "Cliente não encontrado neste espaço de trabalho",
    );

    // O primeiro visitante continua com o próprio espaço.
    expect(
      (await first.asVisitor.query(api.portal.listClients)).map((c) => c.name),
    ).toEqual(["Cliente do primeiro visitante"]);
  });

  test("limpar o espaço do visitante não toca no espaço da conta de e-mail", async () => {
    const t = convexTest(schema, modules);
    const owner = await seedEmailAccount(t);
    const visitor = await signInVisitor(t);

    const client = await visitor.asVisitor.mutation(api.portal.createClient, {
      data: clientRow(visitor.visitorId, "Cliente do visitante"),
    });
    await visitor.asVisitor.mutation(api.portal.createTask, {
      data: taskRow(visitor.visitorId, client, "Tarefa do visitante"),
    });
    await visitor.asVisitor.mutation(api.portal.saveWorkspace, {
      patch: { managerName: "Visitante" },
    });

    await visitor.asVisitor.mutation(api.portal.clearWorkspace, {});

    expect(await visitor.asVisitor.query(api.portal.listClients)).toEqual([]);
    expect(await visitor.asVisitor.query(api.portal.listTasks)).toEqual([]);
    expect(await visitor.asVisitor.query(api.portal.getWorkspace)).toBeNull();

    expect((await owner.asOwner.query(api.portal.listClients)).map((c) => c.name)).toEqual([
      "Cliente da gestora",
    ]);
    expect((await owner.asOwner.query(api.portal.listTasks)).map((t) => t.title)).toEqual([
      "Tarefa da gestora",
    ]);
    expect((await owner.asOwner.query(api.portal.getWorkspace))?.managerName).toBe(
      "Gestora de exemplo",
    );
  });

  test("carregar o exemplo como visitante não mexe no espaço da conta de e-mail", async () => {
    const t = convexTest(schema, modules);
    const owner = await seedEmailAccount(t);
    const visitor = await signInVisitor(t);

    await visitor.asVisitor.mutation(api.demo.seedDemo, {});

    // O exemplo populou só o espaço do visitante (4 clientes da demonstração).
    expect(await visitor.asVisitor.query(api.portal.listClients)).toHaveLength(4);
    expect((await owner.asOwner.query(api.portal.listClients)).map((c) => c.name)).toEqual([
      "Cliente da gestora",
    ]);
    expect((await owner.asOwner.query(api.portal.listFinance)).map((f) => f.description)).toEqual([
      "Receita da gestora",
    ]);
  });
});

// ---- 3. logout da sessão anônima -------------------------------------------

describe("logout da sessão anônima", () => {
  test("depois de signOut, a sessão some, o refresh não volta e o cliente deslogado não lê nem escreve", async () => {
    const t = convexTest(schema, modules);
    const visitor = await signInVisitor(t);
    const refreshToken = visitor.tokens?.refreshToken ?? "";
    expect(refreshToken.length).toBeGreaterThan(0);

    const client = await visitor.asVisitor.mutation(api.portal.createClient, {
      data: clientRow(visitor.visitorId, "Cliente do visitante"),
    });
    await visitor.asVisitor.mutation(api.portal.createTask, {
      data: taskRow(visitor.visitorId, client, "Tarefa do visitante"),
    });

    // O logout roda com a sessão do visitante.
    expect(await visitor.asVisitor.action(api.auth.signOut, {})).toBeNull();

    // No servidor, a sessão e os tokens de refresh foram apagados...
    const state = await t.run(async (ctx) => ({
      sessions: await ctx.db.query("authSessions").collect(),
      refreshTokens: await ctx.db.query("authRefreshTokens").collect(),
      clients: await ctx.db.query("clients").collect(),
      tasks: await ctx.db.query("tasks").collect(),
    }));
    expect(state.sessions).toEqual([]);
    expect(state.refreshTokens).toEqual([]);
    // ...e os dados do visitante continuam no banco: o logout não apaga nada.
    expect(state.clients).toHaveLength(1);
    expect(state.tasks).toHaveLength(1);

    // O refresh token emitido no login não recria a sessão encerrada.
    expect(await t.action(api.auth.signIn, { refreshToken })).toEqual({
      tokens: null,
    });

    // O cliente deslogado (sem credenciais) não vê mais nada...
    expect(await t.query(api.auth.isAuthenticated)).toBe(false);
    expect(await t.query(api.portal.listClients)).toEqual([]);
    expect(await t.query(api.portal.listContent)).toEqual([]);
    expect(await t.query(api.portal.listTasks)).toEqual([]);
    expect(await t.query(api.portal.listRequests)).toEqual([]);
    expect(await t.query(api.portal.listMeetings)).toEqual([]);
    expect(await t.query(api.portal.listDeliverables)).toEqual([]);
    expect(await t.query(api.portal.listFinance)).toEqual([]);
    expect(await t.query(api.portal.getWorkspace)).toBeNull();
    expect(await t.query(api.users.currentUser)).toBeNull();

    // ...e nenhuma escrita passa.
    await expectRefusal(
      t.mutation(api.portal.createClient, {
        data: clientRow(visitor.visitorId, "Invasor"),
      }),
      "Não autenticado",
    );
    await expectRefusal(
      t.mutation(api.portal.clearWorkspace, {}),
      "Não autenticado",
    );
    await expectRefusal(t.mutation(api.demo.seedDemo, {}), "Não autenticado");

    // Nada do espaço abandonado foi tocado.
    const after = await t.run(async (ctx) => ({
      clients: await ctx.db.query("clients").collect(),
      tasks: await ctx.db.query("tasks").collect(),
    }));
    expect(after.clients).toHaveLength(1);
    expect(after.tasks).toHaveLength(1);
  });
});

// ---- 4. anti-robô na entrada como visitante --------------------------------

describe("anti-robô na entrada como visitante", () => {
  test("com captcha exigido, visitante sem token é recusado e nada é gravado", async () => {
    process.env.TURNSTILE_SECRET_KEY = "sempre-passa";
    const t = convexTest(schema, modules);
    const before = await authSnapshot(t);

    expect(await t.query(api.turnstile.getTurnstileStatus)).toEqual({ enforced: true });
    await expectRefusal(
      t.action(api.auth.signIn, { provider: "anonymous", params: {} }),
      "Resolva a verificação de segurança",
    );

    expect(await authSnapshot(t)).toEqual(before);
  });

  test("com token recusado pelo Cloudflare, visitante é recusado e nada é gravado", async () => {
    process.env.TURNSTILE_SECRET_KEY = "sempre-bloqueia";
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({ success: false, "error-codes": ["invalid-input-secret"] }),
        { status: 200, headers: { "content-type": "application/json" } },
      )) as typeof fetch;

    const t = convexTest(schema, modules);
    const before = await authSnapshot(t);

    await expectRefusal(
      t.action(api.auth.signIn, {
        provider: "anonymous",
        params: { turnstileToken: "token-rejeitado" },
      }),
      "Não foi possível validar a verificação de segurança",
    );

    expect(await authSnapshot(t)).toEqual(before);
  });

  test("com token válido, visitante entra e nenhuma autorização de e-mail é criada", async () => {
    process.env.TURNSTILE_SECRET_KEY = "sempre-passa";
    const requested: { url: string; body: string }[] = [];
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      requested.push({ url: String(input), body: String(init?.body ?? "") });
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch;

    const t = convexTest(schema, modules);
    const visitor = await signInVisitor(t, { turnstileToken: "token-do-widget" });

    expect(typeof visitor.tokens?.token).toBe("string");
    expect(requested).toHaveLength(1);
    expect(requested[0].url).toBe(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    );
    expect(new URLSearchParams(requested[0].body).get("response")).toBe(
      "token-do-widget",
    );

    // Entrada como visitante valida o token na hora; não gera autorização de
    // envio de código (isso é exclusivo do fluxo por e-mail).
    expect(await t.run(async (ctx) => ctx.db.query("turnstileGrants").collect())).toEqual([]);
  });

  test("com o Cloudflare fora do ar, o visitante entra mesmo assim (degradação graciosa)", async () => {
    process.env.TURNSTILE_SECRET_KEY = "sempre-passa";
    globalThis.fetch = (async () => {
      throw new Error("offline");
    }) as typeof fetch;

    const t = convexTest(schema, modules);
    const visitor = await signInVisitor(t, { turnstileToken: "token-do-widget" });

    expect(typeof visitor.tokens?.token).toBe("string");
    const user = await t.run(async (ctx) => await ctx.db.get(visitor.visitorId));
    expect(user?.isAnonymous).toBe(true);
  });
});
