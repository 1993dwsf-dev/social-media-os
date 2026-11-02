// Reparo interno dos vínculos de faturas antigas gravadas sem `clientId`.
//
// Contexto: o `portal.generateInvoices` já entregou faturas órfãs. O planejador
// puro (`src/data/invoicing.ts`) espera clientes no formato `{ id, ... }`, mas o
// handler passava a linha crua do banco (`_id`). O plano saía com `clientId`
// indefinido e cada "Gerar faturas" gravava lançamentos de receita sem cliente,
// que apareciam como "sem vínculo" no financeiro e não bloqueavam a duplicata do
// mês seguinte. O handler foi corrigido; esta função cuida do passado.
//
// O reparo é deliberadamente conservador. Só entram as linhas com
// `kind: "invoice"` e sem `clientId` — despesas e receitas soltas (que também
// não têm cliente, de propósito) ficam fora. E só religa quando nome **e**
// mensalidade apontam para um único cliente; o resto volta no relatório para
// decisão humana (`unmatched`, `ambiguous`, `fee-mismatch`). Fatura que viraria
// duplicata de um mês já faturado também é apenas reportada.
//
// A função é **interna** (o cliente não alcança) e roda sob demanda, pelo
// painel do Convex. Padrão é simulação: `apply: true` grava.
//
//   npx convex run repair:relinkOrphanInvoices '{}'            # relatório
//   npx convex run repair:relinkOrphanInvoices '{"apply":true}' # grava

import { v } from "convex/values";

import { matchInvoiceToClient } from "../data/invoicing";
import { internalMutation } from "./_generated/server";

/* eslint-disable @typescript-eslint/no-explicit-any */

// A lista de pendências vai para o relatório do painel; um teto evita carregar
// o retorno com centenas de linhas (o total vem à parte).
const REPORT_LIMIT = 50;

interface ReportRow {
  id: string;
  date: string;
  description: string;
  amount: number;
}

interface MatchedRow extends ReportRow {
  clientName: string;
}

interface SkippedRow extends ReportRow {
  outcome: "unmatched" | "ambiguous" | "fee-mismatch" | "duplicate";
  candidates: string[];
}

export const relinkOrphanInvoices = internalMutation({
  args: {
    /** `true` grava; ausente ou `false` é simulação (não escreve nada). */
    apply: v.optional(v.boolean()),
  },
  handler: async (ctx, { apply = false }) => {
    const store = ctx.db as any;
    const rows = (await store.query("finance").collect()) as any[];

    // Fatura gerada que perdeu o vínculo. Nada mais entra na varredura.
    const orphans = rows.filter(
      (row) => row.kind === "invoice" && !row.clientId,
    );

    // Clientes por dono: o reparo nunca atravessa contas.
    const ownerIds = [...new Set(orphans.map((row) => row.ownerId as string))];
    const clientsByOwner = new Map<
      string,
      { id: string; name: string; monthlyFee: number }[]
    >();
    for (const ownerId of ownerIds) {
      const owned = (await store
        .query("clients")
        .withIndex("by_owner", (q: any) => q.eq("ownerId", ownerId))
        .collect()) as any[];
      clientsByOwner.set(
        ownerId,
        owned.map((client) => ({
          id: client._id as string,
          name: String(client.name ?? ""),
          monthlyFee: Number(client.monthlyFee ?? 0),
        })),
      );
    }

    // Meses já cobertos por faturas com cliente — evita religar algo que
    // viraria duplicata de um lançamento já correto.
    const taken = new Set(
      rows
        .filter((row) => row.kind === "invoice" && row.clientId)
        .map(
          (row) =>
            `${row.clientId as string}|${String(row.date ?? "").slice(0, 7)}`,
        ),
    );

    const matched: MatchedRow[] = [];
    const skipped: SkippedRow[] = [];
    let relinked = 0;

    for (const row of orphans) {
      const base = {
        id: row._id as string,
        date: String(row.date ?? ""),
        description: String(row.description ?? ""),
        amount: Number(row.amount ?? 0),
      };
      const match = matchInvoiceToClient(
        { description: base.description, amount: base.amount },
        clientsByOwner.get(row.ownerId as string) ?? [],
      );

      if (match.outcome !== "matched") {
        skipped.push({
          ...base,
          outcome: match.outcome,
          candidates: match.candidates,
        });
        continue;
      }

      const slot = `${match.clientId}|${base.date.slice(0, 7)}`;
      if (taken.has(slot)) {
        skipped.push({
          ...base,
          outcome: "duplicate",
          candidates: [match.clientName],
        });
        continue;
      }

      matched.push({ ...base, clientName: match.clientName });
      // O mês é ocupado mesmo na simulação: assim o relatório mostra exatamente
      // o que a gravação faria (dois órfãos do mesmo par não saem "ambos").
      taken.add(slot);
      if (apply) {
        await store.patch(row._id, { clientId: match.clientId });
        relinked += 1;
      }
    }

    return {
      dryRun: !apply,
      scanned: orphans.length,
      relinked,
      // `matched` é o que **seria** religado (ou foi, com `apply: true`).
      matchedCount: matched.length,
      matched: matched.slice(0, REPORT_LIMIT),
      skippedCount: skipped.length,
      skipped: skipped.slice(0, REPORT_LIMIT),
    };
  },
});
