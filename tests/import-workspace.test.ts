import { signedIdentity } from "./identity";
// Testes da importação atômica de backup.
// Execute com: bun test

import { describe, expect, test } from "bun:test";
import { convexTest } from "convex-test";

import { api } from "../src/convex/_generated/api";
import schema from "../src/convex/schema";

const modules = {
  "../src/convex/_generated/api.js": () =>
    import("../src/convex/_generated/api"),

  "../src/convex/portal.ts": () => import("../src/convex/portal"),
};

function backup(overrides: Record<string, unknown> = {}) {
  const client = {
    id: "source-client-1",
    name: "Cliente de teste",
    contactName: "Contato",
    email: "contato@example.com",
    phone: "11999999999",
    website: "https://example.com",
    industry: "Serviços",
    packageName: "Mensal",
    monthlyFee: 1200,
    startDate: "2026-10-12",
    status: "Active",
    socials: {},
    notes: "",
    onboarding: {},
    strategy: [],
    kpis: [],
    createdAt: 1_760_000_000_000,
  };

  const content = {
    id: "source-content-1",
    clientId: "source-client-1",
    date: "2026-10-15",
    platform: "Instagram",
    format: "Reel",
    topic: "Tema de teste",
    caption: "",
    assetNote: "",
    status: "Idea",
    managerNotes: "",
    clientComments: "",
    pillar: "Education",
    owner: "Gestor",
  };

  return {
    version: 1,
    exportedAt: "2026-10-12T12:00:00.000Z",

    profile: {
      managerName: "Gestor",
      agency: "Agência",
      email: "gestor@example.com",
      currency: "R$",
      weekStart: "Monday",
      approvalTurnaroundDays: 3,
      notifyEmail: true,
      notifyApprovals: true,
      notifyFinance: false,
      density: "comfortable",
    },

    clients: [client],
    content: [content],
    tasks: [],
    requests: [],
    meetings: [],
    deliverables: [],
    finance: [],

    ...overrides,
  };
}

async function signedInTest() {
  const t = convexTest(schema, modules);

  const userId = await t.run(async (ctx) =>
    ctx.db.insert("users", {
      email: "gestor@example.com",
    }),
  );

  return {
    t,
    asUser: await signedIdentity(t, userId),
  };
}

describe("importWorkspace", () => {
  test("importa dados e reconstrói o vínculo entre conteúdo e cliente", async () => {
    const { asUser } = await signedInTest();

    const result = await asUser.mutation(api.portal.importWorkspace, {
      snapshot: backup(),
    });

    expect(result.clients).toBe(1);
    expect(result.content).toBe(1);

    const clients = await asUser.query(api.portal.listClients);

    const contents = await asUser.query(api.portal.listContent);

    expect(clients).toHaveLength(1);
    expect(contents).toHaveLength(1);

    expect(contents[0].clientId).toBe(clients[0]._id);
  });

  test("rejeita referência a cliente ausente antes de gravar os dados", async () => {
    const { asUser } = await signedInTest();

    const badBackup = backup({
      content: [
        {
          id: "source-content-1",
          clientId: "missing-client",
          date: "2026-10-15",
          platform: "Instagram",
          format: "Reel",
          topic: "Tema de teste",
          caption: "",
          assetNote: "",
          status: "Idea",
          managerNotes: "",
          clientComments: "",
          pillar: "Education",
          owner: "Gestor",
        },
      ],
    });

    await expect(
      asUser.mutation(api.portal.importWorkspace, {
        snapshot: badBackup,
      }),
    ).rejects.toThrow("cliente ausente");

    expect(await asUser.query(api.portal.listClients)).toHaveLength(0);

    expect(await asUser.query(api.portal.listContent)).toHaveLength(0);
  });

  test("rejeita propriedades desconhecidas no registro do backup", async () => {
    const { asUser } = await signedInTest();

    const sourceClient = backup().clients[0] as unknown as Record<
      string,
      unknown
    >;

    const badClient = {
      ...sourceClient,
      isAdmin: true,
    };

    const badBackup = backup({
      clients: [badClient],
    });

    await expect(
      asUser.mutation(api.portal.importWorkspace, {
        snapshot: badBackup,
      }),
    ).rejects.toThrow("isAdmin");

    expect(await asUser.query(api.portal.listClients)).toHaveLength(0);
  });
});
