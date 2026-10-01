// Testes do reparo das faturas antigas gravadas sem `clientId`.
//
// O `portal.generateInvoices` já gravou faturas órfãs: o planejador puro espera
// clientes no formato `{ id, ... }` e recebia a linha crua do banco (`_id`), então
// o `clientId` saía indefinido. O handler foi corrigido; quem arruma o passado é a
// função interna `repair.relinkOrphanInvoices` (simulação por padrão, `apply`
// grava), apoiada pelo matcher puro `matchInvoiceToClient`.
//
// A cena abaixo reproduz o estrago real, com as pistas que o planejador gravou —
// descrição `Mensalidade — <nome>` e valor igual à mensalidade — e confere que o
// reparo só religa o que é inconfundível, nunca atravessa contas e não cria
// duplicata.
//
// Rode com: bun test

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, expect, test } from "bun:test";
import { convexTest } from "convex-test";

import { api, internal } from "../src/convex/_generated/api";
import schema from "../src/convex/schema";
import type { Id } from "../src/convex/_generated/dataModel";

import { matchInvoiceToClient } from "../src/data/invoicing";

// Caminhos relativos a este arquivo; a entrada em `_generated` é o que permite
// ao harness descobrir a raiz do diretório de funções.
const modules = {
  "../src/convex/_generated/api.js": () =>
    import("../src/convex/_generated/api"),
  "../src/convex/portal.ts": () => import("../src/convex/portal"),
  "../src/convex/repair.ts": () => import("../src/convex/repair"),
};

/** Primeiro dia do mês `offset` meses à frente de hoje (ISO aaaa-mm-dd). */
function monthStart(offset: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return d.toISOString().slice(0, 10);
}

function clientRow(ownerId: Id<"users">, name: string, monthlyFee: number) {
  return {
    ownerId,
    name,
    contactName: "Contato",
    email: "contato@exemplo.com",
    phone: "",
    website: "",
    industry: "",
    packageName: "Mensalidade",
    monthlyFee,
    startDate: monthStart(-6),
    status: "Active",
    socials: {},
    notes: "",
    onboarding: {},
    strategy: [],
    kpis: [],
    createdAt: Date.now(),
  };
}

type FinanceOverrides = Partial<{
  clientId: Id<"clients">;
  kind: string;
  type: string;
  amount: number;
  date: string;
  category: string;
  status: string;
  paidDate: string;
}>;

/** Uma fatura exatamente como o planejador gravava (com ou sem o defeito). */
function invoiceRow(
  ownerId: Id<"users">,
  description: string,
  amount: number,
  date: string,
  overrides: FinanceOverrides = {},
) {
  return {
    ownerId,
    date,
    type: "Income",
    amount,
    category: "Retainer",
    description,
    status: "Pending",
    dueDate: `${date.slice(0, 7)}-10`,
    paidDate: "",
    kind: "invoice",
    ...overrides,
  };
}

/**
 * Duas contas. A da Alice tem clientes homônimos de mensalidades diferentes
 * ("Clínica Já" a 1500 e a 900) e uma duplicata sem desempate ("Loja Dupla"
 * duas vezes a 700); o Bob tem um cliente com o **mesmo nome e mensalidade** da
 * Alice, para provar que a religação não atravessa contas.
 */
async function brokenInvoices() {
  const t = convexTest(schema, modules);

  const ids = await t.run(async (ctx) => {
    const alice = await ctx.db.insert("users", { email: "alice@exemplo.com" });
    const bob = await ctx.db.insert("users", { email: "bob@exemplo.com" });

    const aliceJa1500 = await ctx.db.insert(
      "clients",
      clientRow(alice, "Clínica Já", 1500),
    );
    const aliceJa900 = await ctx.db.insert(
      "clients",
      clientRow(alice, "Clínica Já", 900),
    );
    const beta = await ctx.db.insert(
      "clients",
      clientRow(alice, "Estúdio Beta", 2200),
    );
    const lojaA = await ctx.db.insert(
      "clients",
      clientRow(alice, "Loja Dupla", 700),
    );
    const lojaB = await ctx.db.insert(
      "clients",
      clientRow(alice, "Loja Dupla", 700),
    );
    const bobJa = await ctx.db.insert(
      "clients",
      clientRow(bob, "Clínica Já", 1500),
    );

    // Fatura legítima, já com cliente: a base contra a qual a duplicata é medida.
    const legit = await ctx.db.insert(
      "finance",
      invoiceRow(alice, "Mensalidade — Estúdio Beta", 2200, monthStart(0), {
        clientId: beta,
      }),
    );

    // --- as órfãs do defeito -------------------------------------------
    // Nome e mensalidade fecham: religáveis.
    const orfaOk = await ctx.db.insert(
      "finance",
      invoiceRow(alice, "Mensalidade — Clínica Já", 1500, monthStart(-3)),
    );
    // Nome sem acento, com caixa baixa e espaço dobrado: a mensalidade
    // (900) desambigua entre os dois "Clínica Já".
    const orphaHomony = await ctx.db.insert(
      "finance",
      invoiceRow(alice, "Mensalidade —  clinica   ja ", 900, monthStart(-2)),
    );
    const orfaBeta = await ctx.db.insert(
      "finance",
      invoiceRow(alice, "Mensalidade — Estúdio Beta", 2200, monthStart(-1)),
    );
    // Mês corrente da Alice, usada para provar que a dedupe volta a valer.
    const orfaCorrente = await ctx.db.insert(
      "finance",
      invoiceRow(alice, "Mensalidade — Clínica Já", 1500, monthStart(0)),
    );
    // A mesma órfã, agora do Bob: casa com o cliente **dele**.
    const orfaDoBob = await ctx.db.insert(
      "finance",
      invoiceRow(bob, "Mensalidade — Clínica Já", 1500, monthStart(-3)),
    );

    // --- as que precisam de olho humano ---------------------------------
    const orfaAmbigua = await ctx.db.insert(
      "finance",
      invoiceRow(alice, "Mensalidade — Loja Dupla", 700, monthStart(-4)),
    );
    const orfaDesconhecida = await ctx.db.insert(
      "finance",
      invoiceRow(alice, "Mensalidade — Loja Fantasma", 500, monthStart(-5)),
    );
    const orfaValor = await ctx.db.insert(
      "finance",
      invoiceRow(alice, "Mensalidade — Clínica Já", 42, monthStart(-6)),
    );
    // Viraria a segunda fatura do mês corrente do Estúdio Beta.
    const orfaDuplicata = await ctx.db.insert(
      "finance",
      invoiceRow(alice, "Mensalidade — Estúdio Beta", 2200, monthStart(0)),
    );
    // Fatura gerada com descrição fora do padrão (editada à mão depois).
    const orfaSemPrefixo = await ctx.db.insert(
      "finance",
      invoiceRow(alice, "Ajuste avulso", 100, monthStart(-7)),
    );

    // --- o que **não** é órfã por defeito -------------------------------
    // Receita solta digitada pela gestor (sem `kind`) com o mesmo texto de
    // mensalidade: continuar sem cliente é o comportamento certo.
    const receitaSolta = await ctx.db.insert(
      "finance",
      invoiceRow(alice, "Mensalidade — Loja Dupla", 700, monthStart(0), {
        kind: undefined,
      }),
    );
    // Despesa fixa sem cliente: idem.
    const despesa = await ctx.db.insert(
      "finance",
      {
        ownerId: alice,
        date: monthStart(-1),
        type: "Expense",
        amount: 89,
        category: "Software",
        description: "Assinatura do suíte de edição",
        status: "Paid",
        dueDate: monthStart(-1),
        paidDate: monthStart(-1),
      },
    );

    return {
      alice,
      bob,
      aliceJa1500,
      aliceJa900,
      beta,
      lojaA,
      lojaB,
      bobJa,
      legit,
      orfaOk,
      orphaHomony,
      orfaBeta,
      orfaCorrente,
      orfaDoBob,
      orfaAmbigua,
      orfaDesconhecida,
      orfaValor,
      orfaDuplicata,
      orfaSemPrefixo,
      receitaSolta,
      despesa,
    };
  });

  return {
    t,
    ids,
    asAlice: t.withIdentity({ subject: ids.alice }),
    asBob: t.withIdentity({ subject: ids.bob }),
  };
}

type Broken = Awaited<ReturnType<typeof brokenInvoices>>;

/** Estado do financeiro da Alice, do jeito que a tela lê. */
async function financeOf(t: Broken["t"], ownerId: Id<"users">) {
  return await t.run(async (ctx) =>
    ctx.db
      .query("finance")
      .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
      .collect(),
  );
}

const byId = <T extends { _id: string }>(rows: T[], id: string) =>
  rows.find((row) => row._id === id);

// ---- o matcher puro -------------------------------------------------------

describe("casamento da fatura órfã com o cliente", () => {
  const clientes = [
    { id: "c1", name: "Clínica Já", monthlyFee: 1500 },
    { id: "c2", name: "Clínica Já", monthlyFee: 900 },
    { id: "c3", name: "Estúdio Beta", monthlyFee: 2200 },
  ];

  test("nome e mensalidade fechando: religa", () => {
    expect(
      matchInvoiceToClient(
        { description: "Mensalidade — Clínica Já", amount: 1500 },
        clientes,
      ),
    ).toEqual({ outcome: "matched", clientId: "c1", clientName: "Clínica Já" });
  });

  test("acento, caixa e espaço não atrapalham; a mensalidade desambata homônimos", () => {
    expect(
      matchInvoiceToClient(
        { description: "  mensalidade - clinica  JA  ", amount: 900 },
        clientes,
      ),
    ).toEqual({ outcome: "matched", clientId: "c2", clientName: "Clínica Já" });
  });

  test("cliente inexistente, valor divergente e descrição fora do padrão não viram reparo", () => {
    expect(
      matchInvoiceToClient(
        { description: "Mensalidade — Loja Fantasma", amount: 500 },
        clientes,
      ).outcome,
    ).toBe("unmatched");
    expect(
      matchInvoiceToClient(
        { description: "Mensalidade — Clínica Já", amount: 42 },
        clientes,
      ),
    ).toEqual({
      outcome: "fee-mismatch",
      candidates: ["Clínica Já", "Clínica Já"],
    });
    expect(
      matchInvoiceToClient({ description: "Ajuste avulso", amount: 1500 }, clientes)
        .outcome,
    ).toBe("unmatched");
  });

  test("dois clientes com o mesmo nome e a mesma mensalidade ficam ambíguos", () => {
    expect(
      matchInvoiceToClient(
        { description: "Mensalidade — Loja Dupla", amount: 700 },
        [
          { id: "l1", name: "Loja Dupla", monthlyFee: 700 },
          { id: "l2", name: "Loja Dupla", monthlyFee: 700 },
        ],
      ),
    ).toEqual({
      outcome: "ambiguous",
      candidates: ["Loja Dupla", "Loja Dupla"],
    });
  });
});

// ---- o reparo no banco ----------------------------------------------------

describe("religação das faturas órfãs", () => {
  test("a simulação relata o que faria e não escreve nada", async () => {
    const { t, ids } = await brokenInvoices();

    const report = await t.mutation(internal.repair.relinkOrphanInvoices, {});
    expect(report.dryRun).toBe(true);
    // 10 faturas geradas sem cliente (a legítima tem `clientId`).
    expect(report.scanned).toBe(10);
    expect(report.relinked).toBe(0);
    // Quatro religáveis na Alice + uma no Bob.
    expect(report.matchedCount).toBe(5);
    // Ambígua, duplicata, valor divergente, cliente desconhecido e sem prefixo.
    expect(report.skippedCount).toBe(5);
    expect(report.skipped.map((row) => row.outcome).sort()).toEqual([
      "ambiguous",
      "duplicate",
      "fee-mismatch",
      "unmatched",
      "unmatched",
    ]);

    // Nada mudou: as órfãs continuam sem cliente.
    const rows = await financeOf(t, ids.alice);
    expect(byId(rows, ids.orfaOk)?.clientId).toBeUndefined();
    expect(byId(rows, ids.orfaCorrente)?.clientId).toBeUndefined();
  });

  test("com apply as faturas inconfundíveis voltam ao cliente, e do dono certo", async () => {
    const { t, ids } = await brokenInvoices();

    const report = await t.mutation(internal.repair.relinkOrphanInvoices, {
      apply: true,
    });
    expect(report.dryRun).toBe(false);
    expect(report.relinked).toBe(5);

    const alice = await financeOf(t, ids.alice);
    // A mensalidade separou as duas "Clínica Já".
    expect(byId(alice, ids.orfaOk)?.clientId).toBe(ids.aliceJa1500);
    expect(byId(alice, ids.orphaHomony)?.clientId).toBe(ids.aliceJa900);
    expect(byId(alice, ids.orfaBeta)?.clientId).toBe(ids.beta);
    expect(byId(alice, ids.orfaCorrente)?.clientId).toBe(ids.aliceJa1500);

    // O homônimo do Bob casou com o cliente do Bob, não com o da Alice.
    const bob = await financeOf(t, ids.bob);
    expect(byId(bob, ids.orfaDoBob)?.clientId).toBe(ids.bobJa);
    expect(byId(bob, ids.orfaDoBob)?.clientId).not.toBe(ids.aliceJa1500);

    // As cinco pendentes seguem intactas, sem cliente.
    for (const id of [
      ids.orfaAmbigua,
      ids.orfaDesconhecida,
      ids.orfaValor,
      ids.orfaDuplicata,
      ids.orfaSemPrefixo,
    ] as const) {
      expect(byId(alice, id)?.clientId).toBeUndefined();
    }

    // Receita solta, despesa fixa e a fatura legítima não foram encostadas.
    expect(byId(alice, ids.receitaSolta)?.clientId).toBeUndefined();
    expect(byId(alice, ids.despesa)?.clientId).toBeUndefined();
    expect(byId(alice, ids.legit)?.clientId).toBe(ids.beta);
    expect(byId(alice, ids.legit)?.status).toBe("Pending");
  });

  test("rodar de novo não religa nada: o reparo é idempotente", async () => {
    const { t } = await brokenInvoices();
    await t.mutation(internal.repair.relinkOrphanInvoices, { apply: true });

    // Sobram apenas as cinco pendentes — que continuam órfãs de propósito, à
    // espera de decisão humana. Nenhuma é religada de novo.
    const second = await t.mutation(internal.repair.relinkOrphanInvoices, {
      apply: true,
    });
    expect(second.dryRun).toBe(false);
    expect(second.relinked).toBe(0);
    expect(second.matched).toEqual([]);
    expect(second.scanned).toBe(5);
    expect(second.skippedCount).toBe(5);
    expect(second.skipped.map((row) => row.outcome).sort()).toEqual([
      "ambiguous",
      "duplicate",
      "fee-mismatch",
      "unmatched",
      "unmatched",
    ]);
  });

  test("sem o reparo, a deduplicação não enxerga as faturas órfãs", async () => {
    const { asAlice } = await brokenInvoices();

    // Das cinco faturas do mês corrente, só a legítima (o Estúdio Beta, que tem
    // `clientId`) bloqueia a duplicata: as órfãs são invisíveis para o
    // planejador, e o mês corrente é faturado de novo.
    expect(await asAlice.mutation(api.portal.generateInvoices, {})).toEqual({
      created: 4,
    });
  });

  test("depois do reparo a geração volta a deduplicar e a tela deixa de ver órfã", async () => {
    const { asAlice, ids, t } = await brokenInvoices();
    await t.mutation(internal.repair.relinkOrphanInvoices, { apply: true });

    // A fatura reparada da "Clínica Já" (1500) volta a bloquear o mês dela: só
    // os três clientes sem fatura no mês são faturados.
    expect(await asAlice.mutation(api.portal.generateInvoices, {})).toEqual({
      created: 3,
    });

    // E no financeiro a fatura reparada aparece ligada ao cliente, não na faixa
    // de lançamentos sem vínculo — só a duplicata recusada continua solta.
    const invoices = (await asAlice.query(api.portal.listFinance)).filter(
      (row) => row.kind === "invoice" && row.date === monthStart(0),
    );
    expect(
      invoices.filter((row) => row.clientId === ids.aliceJa1500),
    ).toHaveLength(1);
    expect(
      invoices.filter((row) => row.clientId === undefined).map((row) => row._id),
    ).toEqual([ids.orfaDuplicata]);
  });
});
