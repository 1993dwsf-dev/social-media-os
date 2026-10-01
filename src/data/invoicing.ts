// Lógica pura de planejamento de faturas, compartilhada pela mutation
// `generateInvoices` do Convex e pelos testes. Nada aqui acessa banco ou rede.

export interface InvoiceClient {
  id: string;
  name: string;
  status: string;
  monthlyFee: number;
}

export interface FinanceLike {
  clientId: string;
  kind?: "invoice";
  date: string;
}

export interface PlannedInvoice {
  clientId: string;
  month: string; // ISO aaaa-mm-dd, primeiro dia do mês
  amount: number;
  description: string;
  dueDate: string; // ISO aaaa-mm-dd
}

export const INVOICE_DUE_DAY = 10;

/** Prefixo que o planejador escreve na descrição de toda fatura gerada. */
const INVOICE_PREFIX = /^mensalidade\s*[—–\-:·]\s*/i;

/** Nome comparável: sem acento, sem caixa e com espaços normalizados. */
export function normalizeClientName(value: string): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** O que a religação precisa saber de uma fatura supostamente órfã. */
export interface OrphanInvoice {
  description: string;
  amount: number;
}

/** O que a religação precisa saber de um cliente. */
export interface MatchClient {
  id: string;
  name: string;
  monthlyFee: number;
}

export type InvoiceMatch =
  | { outcome: "matched"; clientId: string; clientName: string }
  | {
      outcome: "unmatched" | "ambiguous" | "fee-mismatch";
      candidates: string[];
    };

/**
 * Decide a quem pertence uma fatura gerada que ficou sem `clientId`.
 *
 * O vínculo é reconstruído a partir de duas pistas que o planejador gravou:
 * a descrição (`Mensalidade — <nome do cliente>`) e o valor, que deve ser a
 * mensalidade vigente. Só há reparo automático quando as duas concordam e
 * apontam para um único cliente:
 *
 *  - nome fora do padrão ou cliente inexistente → `unmatched`;
 *  - nome que bate com vários clientes e o valor não separa → `ambiguous`;
 *  - nome de um cliente só, mas valor diferente da mensalidade → `fee-mismatch`.
 *
 * Os dois últimos casos ficam para decisão humana: um reparo automático errado
 * atribuiria dinheiro à pessoa errada.
 */
export function matchInvoiceToClient(
  invoice: OrphanInvoice,
  clients: MatchClient[],
): InvoiceMatch {
  const description = String(invoice.description ?? "").trim();
  if (!INVOICE_PREFIX.test(description)) {
    return { outcome: "unmatched", candidates: [] };
  }
  const wanted = normalizeClientName(description.replace(INVOICE_PREFIX, ""));
  if (!wanted) return { outcome: "unmatched", candidates: [] };

  const byName = clients.filter(
    (client) => normalizeClientName(client.name) === wanted,
  );
  if (byName.length === 0) return { outcome: "unmatched", candidates: [] };

  // A mensalidade é o desempate entre clientes homônimos.
  const byFee = byName.filter(
    (client) => Number(client.monthlyFee) === Number(invoice.amount),
  );
  if (byFee.length === 1) {
    return {
      outcome: "matched",
      clientId: byFee[0].id,
      clientName: byFee[0].name,
    };
  }
  if (byFee.length > 1) {
    return { outcome: "ambiguous", candidates: byFee.map((c) => c.name) };
  }
  return { outcome: "fee-mismatch", candidates: byName.map((c) => c.name) };
}

/** Primeiro dia do mês `offset` meses à frente (ISO aaaa-mm-dd). */
export function monthStart(offset: number, now = new Date()): string {
  const d = new Date(now);
  d.setHours(12, 0, 0, 0);
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return d.toISOString().slice(0, 10);
}

/**
 * Quais faturas devem existir em um faturamento: uma por mês da janela para
 * cada cliente ativo com mensalidade, menos os meses já faturados.
 * Idempotente por construção — repetir com as mesmas entradas devolve [].
 */
export function planInvoices(
  clients: InvoiceClient[],
  finance: FinanceLike[],
  months: number,
  clientId?: string,
  now = new Date(),
): PlannedInvoice[] {
  const count = Math.max(1, Math.min(12, Math.floor(months) || 1));
  const window = Array.from({ length: count }, (_, m) => monthStart(m, now).slice(0, 7));

  const plan: PlannedInvoice[] = [];
  for (const client of clients) {
    if (clientId && client.id !== clientId) continue;
    if (client.status !== "Active") continue;
    const fee = Number(client.monthlyFee ?? 0);
    if (!(fee > 0)) continue;

    for (const month of window) {
      const already = finance.some(
        (row) =>
          row.clientId === client.id &&
          row.kind === "invoice" &&
          typeof row.date === "string" &&
          row.date.slice(0, 7) === month,
      );
      if (already) continue;
      plan.push({
        clientId: client.id,
        month,
        amount: fee,
        description: `Mensalidade — ${client.name}`,
        dueDate: `${month}-${String(INVOICE_DUE_DAY).padStart(2, "0")}`,
      });
    }
  }
  return plan;
}
