// Money in and money out: retainers, project fees, tools and contractors.
// Retainers can be billed in one click from each client's monthly fee; the
// manager keeps everything else up to date by hand — no bank integration.

import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCheck,
  FileSpreadsheet,
  PiggyBank,
  Repeat,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { EntityTable, type FieldSpec } from "@/components/portal/EntityTable";
import { Button } from "@/components/ui/button";
import { KpiCard, SectionHeader } from "@/components/portal/Shared";
import { formatDate, todayISO } from "@/data/constants";
import { FINANCE_CATEGORIES } from "@/data/types";
import type { FinanceEntry } from "@/data/types";
import type { Workspace } from "@/data/workspace";
import type { ClientFocus } from "../useClientFocus";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { cn } from "@/lib/utils";

const FIELDS: FieldSpec[] = [
  { key: "date", label: "Date", type: "date", required: true },
  { key: "description", label: "Description", required: true, placeholder: "Monthly retainer" },
  { key: "clientId", label: "Client", type: "client" },
  { key: "type", label: "Type", type: "select", options: ["Income", "Expense"], required: true },
  { key: "amount", label: "Amount", type: "number", required: true },
  { key: "category", label: "Category", type: "select", options: FINANCE_CATEGORIES },
  { key: "status", label: "Payment status", type: "select", options: ["Paid", "Pending", "Overdue"] },
  { key: "dueDate", label: "Due date", type: "date" },
  { key: "paidDate", label: "Payment date", type: "date" },
];

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

export function FinanceSection({ ws, focus }: { ws: Workspace; focus: ClientFocus }) {
  const thisMonth = monthKey(todayISO());
  const [month, setMonth] = useState(thisMonth);
  const [billing, setBilling] = useState(false);

  const months = useMemo(() => {
    const keys = new Set<string>([thisMonth]);
    for (const entry of ws.finance) if (entry.date) keys.add(monthKey(entry.date));
    return [...keys].sort().reverse();
  }, [ws.finance, thisMonth]);

  const scoped = useMemo(
    () => ws.finance.filter((entry) => month === "all" || monthKey(entry.date) === month),
    [ws.finance, month],
  );

  const totals = useMemo(() => {
    const income = scoped.filter((f) => f.type === "Income").reduce((s, f) => s + f.amount, 0);
    const expense = scoped.filter((f) => f.type === "Expense").reduce((s, f) => s + f.amount, 0);
    const pending = scoped
      .filter((f) => f.type === "Income" && f.status !== "Paid")
      .reduce((s, f) => s + f.amount, 0);
    const unpaid = scoped
      .filter((f) => f.type === "Expense" && f.status !== "Paid")
      .reduce((s, f) => s + f.amount, 0);
    return { income, expense, net: income - expense, pending, unpaid };
  }, [scoped]);

  // Recurring billing summary, computed from the client roster.
  const billingSummary = useMemo(() => {
    const active = ws.clients.filter((c) => c.status === "Active" && c.monthlyFee > 0);
    const mrr = active.reduce((s, c) => s + c.monthlyFee, 0);
    const billedThisMonth = ws.finance.filter(
      (f) => f.kind === "invoice" && f.date.startsWith(thisMonth),
    ).length;
    return { activeCount: active.length, mrr, billedThisMonth };
  }, [ws.clients, ws.finance, thisMonth]);

  const generateInvoices = useMutation(api.portal.generateInvoices);
  const markPaid = useMutation(api.portal.markFinancePaid);

  const billMonth = async (months: number) => {
    setBilling(true);
    try {
      const result = await generateInvoices({ months });
      toast.success(
        result.created === 0
          ? "Everything already billed"
          : `${result.created} invoice${result.created === 1 ? "" : "s"} created`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not generate the invoices");
    } finally {
      setBilling(false);
    }
  };

  const pendingInvoices = useMemo(
    () => scoped.filter((f) => f.kind === "invoice" && f.type === "Income" && f.status !== "Paid"),
    [scoped],
  );

  const perClient = useMemo(() => {
    const rows = ws.clients.map((client) => {
      const income = scoped
        .filter((f) => f.clientId === client.id && f.type === "Income")
        .reduce((s, f) => s + f.amount, 0);
      const cost = scoped
        .filter((f) => f.clientId === client.id && f.type === "Expense")
        .reduce((s, f) => s + f.amount, 0);
      return { client, income, cost, net: income - cost };
    });
    const unassigned = scoped.filter((f) => !f.clientId);
    if (unassigned.length > 0) {
      const cost = unassigned.reduce((s, f) => s + (f.type === "Expense" ? f.amount : -f.amount), 0);
      rows.push({
        client: { id: "none", name: "Unassigned / business costs" } as never,
        income: 0,
        cost,
        net: -cost,
      });
    }
    return rows.sort((a, b) => b.net - a.net);
  }, [ws.clients, scoped]);

  const maxNet = Math.max(...perClient.map((row) => Math.abs(row.net)), 1);

  return (
    <div>
      <SectionHeader
        title="Finance"
        description="Track what each client pays you and what the work costs — retainers, project fees, tools, contractors and ads."
      >
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          aria-label="Filter by month"
        >
          <option value="all">All time</option>
          {months.map((key) => (
            <option key={key} value={key}>
              {new Date(`${key}-01T00:00:00`).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </option>
          ))}
        </select>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={billing || billingSummary.activeCount === 0}
          title="Create this month's retainer invoices from each active client's fee"
          onClick={() => void billMonth(1)}
        >
          <FileSpreadsheet className="size-4" />
          Bill this month
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={billing || billingSummary.activeCount === 0}
          title="Bill the current and next month"
          onClick={() => void billMonth(2)}
        >
          <Repeat className="size-4" />
          Bill 2 months
        </Button>
      </SectionHeader>

      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-border/70 bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Repeat className="size-3.5 text-primary" />
          <strong className="font-semibold text-foreground">
            {billingSummary.activeCount}
          </strong>{" "}
          client{billingSummary.activeCount === 1 ? "" : "s"} on retainer
        </span>
        <span>
          Recurring revenue: <strong className="font-semibold text-foreground">{ws.money(billingSummary.mrr)}/mo</strong>
        </span>
        <span>
          Billed this month: <strong className="font-semibold text-foreground">{billingSummary.billedThisMonth}</strong> of {billingSummary.activeCount}
        </span>
        {pendingInvoices.length > 0 ? (
          <span className="ml-auto inline-flex items-center gap-2">
            {pendingInvoices.length} invoice{pendingInvoices.length === 1 ? "" : "s"} awaiting payment
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              onClick={async () => {
                try {
                  await Promise.all(pendingInvoices.map((f) => markPaid({ id: f.id })));
                  toast.success("Invoices marked as paid");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not update the invoices");
                }
              }}
            >
              <CheckCheck className="size-3.5" /> Mark all paid
            </Button>
          </span>
        ) : null}
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={month === "all" ? "Income (all time)" : "Income this month"}
          value={ws.money(totals.income)}
          icon={<ArrowUpRight className="size-4" />}
        />
        <KpiCard
          label={month === "all" ? "Expenses (all time)" : "Expenses this month"}
          value={ws.money(totals.expense)}
          icon={<ArrowDownRight className="size-4" />}
        />
        <KpiCard
          label="Net result"
          value={ws.money(totals.net)}
          icon={<PiggyBank className="size-4" />}
        />
        <KpiCard
          label="Awaiting payment"
          value={ws.money(totals.pending)}
          icon={<Wallet className="size-4" />}
        />
        <KpiCard
          label="Recurring revenue"
          value={`${ws.money(billingSummary.mrr)}/mo`}
          delta={`${billingSummary.activeCount} active retainer${billingSummary.activeCount === 1 ? "" : "s"}`}
          icon={<Repeat className="size-4" />}
        />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-[2fr_3fr]">
        <div className="rounded-xl border border-border/70 bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Income vs expenses
          </p>
          <div className="mt-4 space-y-3">
            {[
              { label: "Income", value: totals.income, className: "bg-teal-500" },
              { label: "Expenses", value: totals.expense, className: "bg-rose-400" },
            ].map((bar) => (
              <div key={bar.label}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{bar.label}</span>
                  <span className="tabular font-medium">{ws.money(bar.value)}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full", bar.className)}
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          (bar.value / Math.max(totals.income, totals.expense, 1)) * 100,
                        ),
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          {totals.unpaid > 0 ? (
            <p className="mt-4 text-xs text-muted-foreground">
              You still owe {ws.money(totals.unpaid)} in unpaid expenses.
            </p>
          ) : null}
        </div>

        <div className="rounded-xl border border-border/70 bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Per client — {month === "all" ? "all time" : formatDate(`${month}-01`).slice(0, -6)}
          </p>
          <ul className="mt-3 space-y-3">
            {perClient.map((row) => (
              <li key={row.client.id}>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate font-medium">{row.client.name}</span>
                  <span className="tabular whitespace-nowrap text-muted-foreground">
                    {ws.money(row.income)} in · {ws.money(row.cost)} out
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        row.net >= 0 ? "bg-teal-500" : "bg-rose-400",
                      )}
                      style={{ width: `${Math.round((Math.abs(row.net) / maxNet) * 100)}%` }}
                    />
                  </div>
                  <span
                    className={cn(
                      "tabular w-24 text-right text-xs font-medium",
                      row.net >= 0 ? "text-teal-700 dark:text-teal-400" : "text-rose-600 dark:text-rose-400",
                    )}
                  >
                    {ws.money(row.net)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <EntityTable<FinanceEntry>
        rows={ws.finance}
        fields={FIELDS}
        clients={ws.clients}
        clientIdOf={(row) => row.clientId}
        rowTitle={(row) => `${row.description} (${ws.money(row.amount)})`}
        searchText={(row) =>
          [row.description, row.category, ws.clientName(row.clientId), row.type].join(" ")
        }
        addLabel="New entry"
        entityName="Entries"
        statusKey="status"
        emptyTitle="No financial entries yet"
        emptyHint="Log retainers, project fees and your running costs to see your margin."
        defaults={{
          date: todayISO(),
          type: "Income",
          status: "Pending",
          category: "Retainer",
          clientId: focus.defaultClientId || ws.clients[0]?.id || "",
        }}
        onSave={async (values, id) => {
          try {
            await ws.saveFinance(
              {
                clientId: values.clientId,
                date: values.date || todayISO(),
                type: (values.type || "Income") as FinanceEntry["type"],
                amount: Number(values.amount || 0),
                category: values.category,
                description: values.description,
                status: (values.status || "Pending") as FinanceEntry["status"],
                dueDate: values.dueDate,
                paidDate: values.paidDate || (values.status === "Paid" ? todayISO() : ""),
              },
              id,
            );
            toast.success(id ? "Entry updated" : "Entry added");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not save the entry");
          }
        }}
        onDelete={async (id) => {
          await ws.remove("finance", id);
          toast.success("Entry deleted");
        }}
      />
    </div>
  );
}
