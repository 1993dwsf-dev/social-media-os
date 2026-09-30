// Dinheiro que entra e que sai: mensalidades, projetos, ferramentas e
// freelancers. As mensalidades podem ser faturadas em um clique a partir do
// valor de cada cliente; o resto o gestor mantém à mão — sem integração bancária.

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
import { todayISO } from "@/data/constants";
import { FINANCE_CATEGORIES } from "@/data/types";
import type { FinanceEntry } from "@/data/types";
import type { Workspace } from "@/data/workspace";
import type { ClientFocus } from "../useClientFocus";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { cn } from "@/lib/utils";

const FIELDS: FieldSpec[] = [
  { key: "date", label: "Data", type: "date", required: true },
  { key: "description", label: "Descrição", required: true, placeholder: "Mensalidade" },
  { key: "clientId", label: "Cliente", type: "client" },
  { key: "type", label: "Tipo", type: "select", options: ["Income", "Expense"], required: true },
  { key: "amount", label: "Valor", type: "number", required: true },
  { key: "category", label: "Categoria", type: "select", options: FINANCE_CATEGORIES },
  { key: "status", label: "Status de pagamento", type: "select", options: ["Paid", "Pending", "Overdue"] },
  { key: "dueDate", label: "Vencimento", type: "date" },
  { key: "paidDate", label: "Data de pagamento", type: "date" },
];

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

function monthLabel(key: string): string {
  return new Date(`${key}-01T00:00:00`).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
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

  // Resumo de faturamento recorrente, calculado a partir da carteira de clientes.
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
          ? "Tudo já estava faturado"
          : `${result.created} fatura${result.created === 1 ? "" : "s"} gerada${result.created === 1 ? "" : "s"}`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível gerar as faturas");
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
    // Linha "Sem cliente": receitas avulsas do negócio e custos fixos —
    // receita entra como receita, despesa como custo (sem sinal invertido).
    const unassigned = scoped.filter((f) => !f.clientId);
    if (unassigned.length > 0) {
      const income = unassigned
        .filter((f) => f.type === "Income")
        .reduce((s, f) => s + f.amount, 0);
      const cost = unassigned
        .filter((f) => f.type === "Expense")
        .reduce((s, f) => s + f.amount, 0);
      rows.push({
        client: { id: "none", name: "Sem cliente / custos do negócio" } as never,
        income,
        cost,
        net: income - cost,
      });
    }
    return rows.sort((a, b) => b.net - a.net);
  }, [ws.clients, scoped]);

  const maxNet = Math.max(...perClient.map((row) => Math.abs(row.net)), 1);

  return (
    <div>
      <SectionHeader
        title="Financeiro"
        description="Acompanhe o que cada cliente paga e quanto custa o trabalho — mensalidades, projetos, ferramentas, freelancers e anúncios."
      >
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          aria-label="Filtrar por mês"
        >
          <option value="all">Todo o período</option>
          {months.map((key) => (
            <option key={key} value={key}>
              {monthLabel(key)}
            </option>
          ))}
        </select>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={billing || billingSummary.activeCount === 0}
          title="Criar as faturas de mensalidade do mês a partir do valor de cada cliente ativo"
          onClick={() => void billMonth(1)}
        >
          <FileSpreadsheet className="size-4" />
          Faturar este mês
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={billing || billingSummary.activeCount === 0}
          title="Faturar o mês atual e o próximo"
          onClick={() => void billMonth(2)}
        >
          <Repeat className="size-4" />
          Faturar 2 meses
        </Button>
      </SectionHeader>

      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-border/70 bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Repeat className="size-3.5 text-primary" />
          <strong className="font-semibold text-foreground">
            {billingSummary.activeCount}
          </strong>{" "}
          cliente{billingSummary.activeCount === 1 ? "" : "s"} com mensalidade
        </span>
        <span>
          Receita recorrente: <strong className="font-semibold text-foreground">{ws.money(billingSummary.mrr)}/mês</strong>
        </span>
        <span>
          Faturado no mês: <strong className="font-semibold text-foreground">{billingSummary.billedThisMonth}</strong> de {billingSummary.activeCount}
        </span>
        {pendingInvoices.length > 0 ? (
          <span className="ml-auto inline-flex items-center gap-2">
            {pendingInvoices.length} fatura{pendingInvoices.length === 1 ? "" : "s"} aguardando pagamento
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              onClick={async () => {
                try {
                  await Promise.all(pendingInvoices.map((f) => markPaid({ id: f.id })));
                  toast.success("Faturas marcadas como pagas");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Não foi possível atualizar as faturas");
                }
              }}
            >
              <CheckCheck className="size-3.5" /> Marcar todas como pagas
            </Button>
          </span>
        ) : null}
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={month === "all" ? "Receitas (todo o período)" : "Receitas do mês"}
          value={ws.money(totals.income)}
          icon={<ArrowUpRight className="size-4" />}
        />
        <KpiCard
          label={month === "all" ? "Despesas (todo o período)" : "Despesas do mês"}
          value={ws.money(totals.expense)}
          icon={<ArrowDownRight className="size-4" />}
        />
        <KpiCard
          label="Resultado líquido"
          value={ws.money(totals.net)}
          icon={<PiggyBank className="size-4" />}
        />
        <KpiCard
          label="A receber"
          value={ws.money(totals.pending)}
          icon={<Wallet className="size-4" />}
        />
        <KpiCard
          label="Receita recorrente"
          value={`${ws.money(billingSummary.mrr)}/mês`}
          delta={`${billingSummary.activeCount} mensalidade${billingSummary.activeCount === 1 ? "" : "s"} ativa${billingSummary.activeCount === 1 ? "" : "s"}`}
          icon={<Repeat className="size-4" />}
        />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-[2fr_3fr]">
        <div className="rounded-xl border border-border/70 bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Receitas x despesas
          </p>
          <div className="mt-4 space-y-3">
            {[
              { label: "Receitas", value: totals.income, className: "bg-teal-500" },
              { label: "Despesas", value: totals.expense, className: "bg-rose-400" },
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
              Você ainda tem {ws.money(totals.unpaid)} em despesas não pagas.
            </p>
          ) : null}
        </div>

        <div className="rounded-xl border border-border/70 bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Por cliente — {month === "all" ? "todo o período" : monthLabel(month)}
          </p>
          <ul className="mt-3 space-y-3">
            {perClient.map((row) => (
              <li key={row.client.id}>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate font-medium">{row.client.name}</span>
                  <span className="tabular whitespace-nowrap text-muted-foreground">
                    {ws.money(row.income)} entrando · {ws.money(row.cost)} saindo
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
        addLabel="Novo lançamento"
        entityName="Lançamentos"
        statusKey="status"
        emptyTitle="Nenhum lançamento financeiro ainda"
        emptyHint="Registre mensalidades, projetos e seus custos fixos para ver sua margem."
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
            toast.success(id ? "Lançamento atualizado" : "Lançamento adicionado");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Não foi possível salvar o lançamento");
          }
        }}
        onDelete={async (id) => {
          await ws.remove("finance", id);
          toast.success("Lançamento excluído");
        }}
      />
    </div>
  );
}
