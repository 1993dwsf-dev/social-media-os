// Painel do gestor: toda a carteira em um só olhar — clientes, trabalho em
// andamento, dinheiro que entra e sai, e o que precisa de atenção hoje.

import { useMemo } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarPlus,
  CheckSquare,
  ListChecks,
  Plus,
  Users,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ClientChip,
  KpiCard,
  SectionHeader,
  StatusChip,
} from "@/components/portal/Shared";
import { formatDate, todayISO } from "@/data/constants";
import type { SectionId } from "@/data/types";
import type { Workspace } from "@/data/workspace";
import { cn } from "@/lib/utils";

function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function DashboardSection({
  ws,
  navigate,
}: {
  ws: Workspace;
  navigate: (id: SectionId) => void;
}) {
  const today = todayISO();
  const month = today.slice(0, 7);

  const metrics = useMemo(() => {
    const activeClients = ws.clients.filter((c) => c.status === "Active");
    const monthContent = ws.content.filter((item) =>
      item.date.startsWith(month),
    );
    const waiting = ws.content.filter(
      (item) =>
        item.status === "In Review" || item.status === "Changes Requested",
    );
    const openTasks = ws.tasks.filter((t) => t.status !== "Done");
    const overdue = openTasks.filter((t) => t.dueDate && t.dueDate < today);
    const income = ws.finance
      .filter((f) => f.type === "Income" && f.date.startsWith(month))
      .reduce((sum, f) => sum + f.amount, 0);
    const expenses = ws.finance
      .filter((f) => f.type === "Expense" && f.date.startsWith(month))
      .reduce((sum, f) => sum + f.amount, 0);
    const awaitingPayment = ws.finance
      .filter((f) => f.type === "Income" && f.status !== "Paid")
      .reduce((sum, f) => sum + f.amount, 0);
    return {
      activeClients,
      monthContent,
      waiting,
      openTasks,
      overdue,
      income,
      expenses,
      awaitingPayment,
    };
  }, [ws.clients, ws.content, ws.tasks, ws.finance, month, today]);

  const agenda = useMemo(() => {
    const horizon = addDays(today, 7);
    const entries: {
      date: string;
      kind: string;
      title: string;
      clientId: string;
      extra?: string;
    }[] = [];
    for (const item of ws.content) {
      if (
        item.date >= today &&
        item.date <= horizon &&
        item.status !== "Published"
      ) {
        entries.push({
          date: item.date,
          kind: "content",
          title: item.topic,
          clientId: item.clientId,
          extra: item.platform,
        });
      }
    }
    for (const task of ws.tasks) {
      if (
        task.dueDate >= today &&
        task.dueDate <= horizon &&
        task.status !== "Done"
      ) {
        entries.push({
          date: task.dueDate,
          kind: "task",
          title: task.title,
          clientId: task.clientId,
          extra: task.priority,
        });
      }
    }
    for (const meeting of ws.meetings) {
      if (
        meeting.date >= today &&
        meeting.date <= horizon &&
        meeting.status === "Scheduled"
      ) {
        entries.push({
          date: meeting.date,
          kind: "meeting",
          title: meeting.title,
          clientId: meeting.clientId,
          extra: meeting.time,
        });
      }
    }
    return entries.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 12);
  }, [ws.content, ws.tasks, ws.meetings, today]);

  const perClient = useMemo(
    () =>
      ws.clients.map((client) => {
        const planned = ws.content.filter(
          (item) => item.clientId === client.id && item.date.startsWith(month),
        );
        const published = planned.filter(
          (item) => item.status === "Published",
        ).length;
        const open = ws.tasks.filter(
          (t) => t.clientId === client.id && t.status !== "Done",
        );
        const overdue = open.filter(
          (t) => t.dueDate && t.dueDate < today,
        ).length;
        const net = ws.finance
          .filter((f) => f.clientId === client.id && f.date.startsWith(month))
          .reduce(
            (sum, f) => sum + (f.type === "Income" ? f.amount : -f.amount),
            0,
          );
        return {
          client,
          planned: planned.length,
          published,
          open: open.length,
          overdue,
          net,
        };
      }),
    [ws.clients, ws.content, ws.tasks, ws.finance, month, today],
  );

  return (
    <div>
      <SectionHeader
        title={`Olá${ws.profile.managerName ? `, ${ws.profile.managerName.split(" ")[0]}` : ""}`}
        description={`${metrics.activeClients.length} cliente${metrics.activeClients.length === 1 ? "" : "s"} ativo${metrics.activeClients.length === 1 ? "" : "s"} · ${metrics.monthContent.length} posts planejados no mês · ${metrics.openTasks.length} tarefas abertas.`}
      >
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => navigate("clients")}
        >
          <Plus className="size-4" /> Novo cliente
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => navigate("tasks")}
        >
          <ListChecks className="size-4" /> Adicionar tarefa
        </Button>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => navigate("calendar")}
        >
          <CalendarPlus className="size-4" /> Adicionar conteúdo
        </Button>
      </SectionHeader>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Clientes ativos"
          value={String(metrics.activeClients.length)}
          delta={`${ws.clients.length} no total`}
          icon={<Users className="size-4" />}
        />
        <KpiCard
          label="Aguardando aprovação"
          value={String(metrics.waiting.length)}
          icon={<CheckSquare className="size-4" />}
        />
        <KpiCard
          label="Tarefas abertas"
          value={String(metrics.openTasks.length)}
          delta={
            metrics.overdue.length > 0
              ? `-${metrics.overdue.length} atrasadas`
              : undefined
          }
          icon={<ListChecks className="size-4" />}
        />
        <KpiCard
          label="Receita do mês"
          value={ws.money(metrics.income)}
          delta={
            metrics.awaitingPayment > 0
              ? `${ws.money(metrics.awaitingPayment)} a receber`
              : undefined
          }
          icon={<ArrowUpRight className="size-4" />}
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Despesas do mês"
          value={ws.money(metrics.expenses)}
          icon={<Wallet className="size-4" />}
        />
        <KpiCard
          label="Resultado do mês"
          value={ws.money(metrics.income - metrics.expenses)}
          icon={<Wallet className="size-4" />}
        />
        <KpiCard
          label="Posts planejados"
          value={String(metrics.monthContent.length)}
          delta={`${metrics.monthContent.filter((c) => c.status === "Published").length} publicados`}
          icon={<CalendarPlus className="size-4" />}
        />
        <KpiCard
          label="Tarefas atrasadas"
          value={String(metrics.overdue.length)}
          icon={<AlertTriangle className="size-4" />}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[3fr_2fr]">
        <section className="rounded-xl border border-border/70 bg-card">
          <header className="flex items-center justify-between gap-2 border-b border-border/70 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold">Próximos 7 dias</h2>
              <p className="text-[11px] text-muted-foreground">
                Conteúdos no ar, prazos e chamadas
              </p>
            </div>
            <Badge variant="outline" className="tabular">
              {agenda.length}
            </Badge>
          </header>
          {agenda.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Nada previsto para a próxima semana.
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {agenda.map((entry, index) => (
                <li
                  key={`${entry.kind}-${index}`}
                  className="flex items-center gap-2.5 px-4 py-2.5"
                >
                  <span
                    className={cn(
                      "size-1.5 shrink-0 rounded-full",
                      entry.kind === "content"
                        ? "bg-primary"
                        : entry.kind === "task"
                          ? "bg-amber-500"
                          : "bg-sky-500",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{entry.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {entry.kind === "content"
                        ? "Conteúdo"
                        : entry.kind === "task"
                          ? "Tarefa"
                          : "Reunião"}
                      {entry.extra ? ` · ${entry.extra}` : ""}
                    </p>
                  </div>
                  <ClientChip name={ws.clientName(entry.clientId)} />
                  <span className="tabular w-20 text-right text-xs text-muted-foreground">
                    {formatDate(entry.date)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-border/70 bg-card">
          <header className="border-b border-border/70 px-4 py-3">
            <h2 className="text-sm font-semibold">Precisa de atenção</h2>
            <p className="text-[11px] text-muted-foreground">
              Trabalho atrasado e valores a receber
            </p>
          </header>
          <div className="space-y-3 p-4">
            {metrics.overdue.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma tarefa atrasada. Ótimo.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {metrics.overdue.slice(0, 6).map((task) => (
                  <li key={task.id} className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="size-3.5 shrink-0 text-rose-500" />
                    <span className="min-w-0 flex-1 truncate">
                      {task.title}
                    </span>
                    <ClientChip name={ws.clientName(task.clientId)} />
                    <span className="tabular text-[11px] text-rose-600 dark:text-rose-400">
                      {formatDate(task.dueDate)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {metrics.awaitingPayment > 0 ? (
              <p className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                {ws.money(metrics.awaitingPayment)} em receitas ainda estão
                marcados como não pagos.{" "}
                <button
                  type="button"
                  className="font-medium underline"
                  onClick={() => navigate("finance")}
                >
                  Revisar financeiro
                </button>
              </p>
            ) : null}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-border/70 bg-card">
        <header className="flex items-center justify-between gap-2 border-b border-border/70 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold">Clientes neste mês</h2>
            <p className="text-[11px] text-muted-foreground">
              Posts planejados, trabalho em aberto e resultado por cliente
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-xs"
            onClick={() => navigate("clients")}
          >
            Gerenciar clientes <ArrowUpRight className="size-3.5" />
          </Button>
        </header>
        {perClient.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            Adicione seu primeiro cliente para ver esta tabela.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Planejados</TableHead>
                  <TableHead className="text-right">Publicados</TableHead>
                  <TableHead className="text-right">Tarefas abertas</TableHead>
                  <TableHead className="text-right">Atrasadas</TableHead>
                  <TableHead className="text-right">Resultado do mês</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {perClient.map((row) => (
                  <TableRow key={row.client.id}>
                    <TableCell className="font-medium">
                      <span className="block">{row.client.name}</span>
                      <span className="text-[11px] font-normal text-muted-foreground">
                        {row.client.packageName || "Sem pacote"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusChip status={row.client.status} />
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {row.planned}
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {row.published}
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {row.open}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "tabular text-right",
                        row.overdue > 0 &&
                          "font-medium text-rose-600 dark:text-rose-400",
                      )}
                    >
                      {row.overdue}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "tabular text-right",
                        row.net > 0
                          ? "text-teal-700 dark:text-teal-400"
                          : row.net < 0
                            ? "text-rose-600 dark:text-rose-400"
                            : "",
                      )}
                    >
                      {ws.money(row.net)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
