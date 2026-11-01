import { describe, expect, test } from "bun:test";
import { convexTest } from "convex-test";
import { api } from "../src/convex/_generated/api";
import schema from "../src/convex/schema";
import {
  assertBackupLimits,
  BACKUP_MAX_BYTES,
  DEFAULT_WORKSPACE_PROFILE,
  workspaceLoaded,
} from "../src/data/backup";
import { csvCell, tableCSV } from "../src/data/csv";
import { signedIdentity } from "./identity";

const modules = {
  "../src/convex/_generated/api.js": () =>
    import("../src/convex/_generated/api"),
  "../src/convex/portal.ts": () => import("../src/convex/portal"),
  "../src/convex/demo.ts": () => import("../src/convex/demo"),
};

const client = {
  name: "Empresa Ágil",
  contactName: "Contato",
  email: "contato@example.com",
  phone: "",
  website: "",
  industry: "",
  packageName: "Mensal",
  monthlyFee: 100,
  startDate: "2026-11-01",
  status: "Active",
  socials: {},
  notes: "",
  onboarding: {},
  strategy: [],
  kpis: [],
};

async function fixture() {
  const t = convexTest(schema, modules);
  const userId = await t.run((ctx) =>
    ctx.db.insert("users", { email: "owner@example.com" }),
  );
  return { t, userId, asUser: await signedIdentity(t, userId) };
}

describe("proteção dos dados comerciais", () => {
  test("demo preserva o perfil, recusa segunda carga e não modifica a carteira", async () => {
    const { asUser } = await fixture();
    await asUser.mutation(api.portal.saveWorkspace, {
      patch: { agency: "Minha agência" },
    });
    await asUser.mutation(api.demo.seedDemo, {});
    expect((await asUser.query(api.portal.getWorkspace))?.agency).toBe(
      "Minha agência",
    );
    const before = await asUser.query(api.portal.exportWorkspace);
    await expect(asUser.mutation(api.demo.seedDemo, {})).rejects.toThrow(
      "espaço vazio",
    );
    const after = await asUser.query(api.portal.exportWorkspace);
    expect({ ...after, exportedAt: "" }).toEqual({ ...before, exportedAt: "" });
  });

  test("snapshot completo restaura todas as coleções com novos IDs e proprietário", async () => {
    const { t, asUser } = await fixture();
    await asUser.mutation(api.demo.seedDemo, {});
    const snapshot = await asUser.query(api.portal.exportWorkspace);
    assertBackupLimits(snapshot);
    const second = await t.run((ctx) =>
      ctx.db.insert("users", { email: "other@example.com" }),
    );
    const asOther = await signedIdentity(t, second);
    await asOther.mutation(api.portal.importWorkspace, { snapshot });
    const restored = await asOther.query(api.portal.exportWorkspace);
    for (const table of [
      "clients",
      "content",
      "tasks",
      "requests",
      "meetings",
      "deliverables",
      "finance",
    ] as const) {
      const a = (snapshot as unknown as Record<string, { id: string }[]>)[
        table
      ];
      const b = (restored as unknown as Record<string, { id: string }[]>)[
        table
      ];
      expect(b).toHaveLength(a.length);
      expect(
        new Set(b.map((row) => row.id)).intersection(
          new Set(a.map((row) => row.id)),
        ).size,
      ).toBe(0);
    }
    expect(JSON.stringify(restored)).not.toContain("ownerId");
    await expect(
      asOther.mutation(api.portal.importWorkspace, { snapshot }),
    ).rejects.toThrow("já contém dados");
    expect(await asOther.query(api.portal.listClients)).toHaveLength(4);
  });

  test("ultrapassar a capacidade desfaz a gravação inteira", async () => {
    const { t, userId, asUser } = await fixture();
    await t.run(async (ctx) => {
      for (let i = 0; i < 1_000; i++)
        await ctx.db.insert("clients", {
          ...client,
          name: `Cliente ${i}`,
          ownerId: userId,
          createdAt: 1,
        });
    });
    await expect(
      asUser.mutation(api.portal.createClient, { data: client }),
    ).rejects.toThrow("1.000 registros");
    expect(await asUser.query(api.portal.listClients)).toHaveLength(1_000);
  });

  test("tamanho é medido em UTF-8 e a validação rejeita importação excessiva sem gravar", async () => {
    const { asUser } = await fixture();
    const snapshot = {
      clients: [{ ...client, id: "old", notes: "á".repeat(BACKUP_MAX_BYTES) }],
    };
    await expect(
      asUser.mutation(api.portal.importWorkspace, { snapshot }),
    ).rejects.toThrow("500 KB");
    expect(await asUser.query(api.portal.listClients)).toHaveLength(0);
    expect(
      workspaceLoaded([[], [], [], [], [], [], [], DEFAULT_WORKSPACE_PROFILE]),
    ).toBe(true);
    expect(
      workspaceLoaded([
        [],
        [],
        [],
        [],
        undefined,
        [],
        [],
        DEFAULT_WORKSPACE_PROFILE,
      ]),
    ).toBe(false);
  });

  test("sessão removida ou expirada não pode continuar lendo ou gravando com o token antigo", async () => {
    const { t, asUser } = await fixture();
    await asUser.mutation(api.portal.createClient, { data: client });
    await t.run(async (ctx) => {
      for (const session of await ctx.db.query("authSessions").collect())
        await ctx.db.delete(session._id);
    });
    expect(await asUser.query(api.portal.listClients)).toEqual([]);
    expect(await asUser.query(api.portal.exportWorkspace)).toBeNull();
    await expect(
      asUser.mutation(api.portal.createClient, { data: client }),
    ).rejects.toThrow("Não autenticado");
  });
});

describe("CSV de dados reais", () => {
  test("preserva acentos, aspas, quebras e decimais e neutraliza fórmulas", () => {
    const csv = tableCSV([
      {
        name: 'Ação; "Especial"\nLinha',
        amount: 19.9,
        notes: ' =HYPERLINK("x")',
      },
    ]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"19,9"');
    expect(csv).toContain('"Ação; ""Especial""\nLinha"');
    expect(csv).toContain("' =HYPERLINK");
    for (const input of ["=1+1", "\t+SUM(A1)", "\r@x", "-cmd", "\uFEFF=1"])
      expect(csvCell(input)).toContain("'");
    expect(csvCell(-12)).toBe('"-12"');
  });
});
