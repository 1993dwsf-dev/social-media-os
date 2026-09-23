// Pure invoice-planning logic, shared by the Convex `generateInvoices`
// mutation and its tests. Nothing here touches a database or the network.

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
  month: string; // ISO yyyy-mm-dd, first day of the month
  amount: number;
  description: string;
  dueDate: string; // ISO yyyy-mm-dd
}

export const INVOICE_DUE_DAY = 10;

/** First day of the month `offset` months from now (ISO yyyy-mm-dd). */
export function monthStart(offset: number, now = new Date()): string {
  const d = new Date(now);
  d.setHours(12, 0, 0, 0);
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return d.toISOString().slice(0, 10);
}

/**
 * Which invoices should exist for a billing run: one per month in the window
 * for every Active client with a monthly fee, minus months already invoiced.
 * Idempotent by construction — re-running with the same inputs yields [].
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
        description: `Monthly retainer — ${client.name}`,
        dueDate: `${month}-${String(INVOICE_DUE_DAY).padStart(2, "0")}`,
      });
    }
  }
  return plan;
}
