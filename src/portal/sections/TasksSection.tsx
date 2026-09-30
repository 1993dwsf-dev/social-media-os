// Lista de tarefas de todos os clientes — o que precisa acontecer, para quem e até quando.

import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, Clock, ListChecks } from "lucide-react";
import { toast } from "sonner";

import { EntityTable, type FieldSpec } from "@/components/portal/EntityTable";
import { SectionHeader } from "@/components/portal/Shared";
import { KpiCard } from "@/components/portal/Shared";
import { todayISO } from "@/data/constants";
import { TASK_CATEGORIES, TASK_STATUSES } from "@/data/types";
import type { TaskItem } from "@/data/types";
import type { Workspace } from "@/data/workspace";
import type { ClientFocus } from "../useClientFocus";

const FIELDS: FieldSpec[] = [
  { key: "title", label: "Tarefa", required: true, placeholder: "Gravar lote: 10 peças" },
  { key: "clientId", label: "Cliente", type: "client", required: true },
  { key: "project", label: "Projeto / campanha" },
  { key: "category", label: "Categoria", type: "select", options: TASK_CATEGORIES },
  { key: "priority", label: "Prioridade", type: "select", options: ["Low", "Medium", "High"] },
  { key: "status", label: "Status", type: "select", options: TASK_STATUSES },
  { key: "dueDate", label: "Prazo", type: "date" },
  { key: "startDate", label: "Data de início", type: "date", compact: true },
  { key: "completedAt", label: "Concluído em", type: "date", compact: true },
  { key: "dependsOn", label: "Depende de", compact: true },
  { key: "notes", label: "Observações", type: "textarea", compact: true },
];

export function TasksSection({ ws, focus }: { ws: Workspace; focus: ClientFocus }) {
  const today = todayISO();
  const summary = useMemo(() => {
    const scoped = focus.clientId
      ? ws.tasks.filter((t) => t.clientId === focus.clientId)
      : ws.tasks;
    const open = scoped.filter((t) => t.status !== "Done");
    const week = open.filter((t) => t.dueDate && t.dueDate <= addDays(today, 7));
    const overdue = open.filter((t) => t.dueDate && t.dueDate < today);
    const done = scoped.filter((t) => t.status === "Done");
    return { open, week, overdue, done };
  }, [ws.tasks, today, focus.clientId]);

  return (
    <div>
      <SectionHeader
        title="Tarefas"
        description="Tudo o que está na sua mesa em todos os clientes — prazos, prioridades e progresso em uma única lista."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Tarefas abertas"
          value={String(summary.open.length)}
          icon={<Clock className="size-4" />}
        />
        <KpiCard
          label="Vencem em até 7 dias"
          value={String(summary.week.length)}
          icon={<Clock className="size-4" />}
        />
        <KpiCard
          label="Atrasadas"
          value={String(summary.overdue.length)}
          icon={<AlertTriangle className="size-4" />}
        />
        <KpiCard
          label="Concluídas"
          value={String(summary.done.length)}
          icon={<CheckCircle2 className="size-4" />}
        />
      </div>

      <EntityTable<TaskItem>
        rows={ws.tasks}
        fields={FIELDS}
        clients={ws.clients}
        clientIdOf={(row) => row.clientId}
        rowTitle={(row) => row.title}
        searchText={(row) =>
          [row.title, row.project, row.category, row.notes, ws.clientName(row.clientId)].join(" ")
        }
        addLabel="Nova tarefa"
        entityName="Tarefas"
        statusKey="status"
        focusClientId={focus.clientId}
        emptyTitle="Nenhuma tarefa ainda"
        emptyHint="Adicione uma tarefa para manter o trabalho de cada cliente em andamento."
        emptyIcon={<ListChecks className="size-4" />}
        defaults={{
          status: "Backlog",
          priority: "Medium",
          startDate: today,
          dueDate: today,
          clientId: focus.defaultClientId || ws.clients[0]?.id || "",
        }}
        onSave={async (values, id) => {
          try {
            await ws.saveTask(
              {
                clientId: values.clientId,
                title: values.title,
                project: values.project,
                category: values.category,
                priority: (values.priority || "Medium") as TaskItem["priority"],
                status: (values.status || "Backlog") as TaskItem["status"],
                startDate: values.startDate,
                dueDate: values.dueDate,
                completedAt:
                  values.completedAt || (values.status === "Done" ? todayISO() : ""),
                dependsOn: values.dependsOn,
                notes: values.notes,
              },
              id,
            );
            toast.success(id ? "Tarefa atualizada" : "Tarefa adicionada");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Não foi possível salvar a tarefa");
          }
        }}
        onDelete={async (id) => {
          await ws.remove("task", id);
          toast.success("Tarefa excluída");
        }}
      />
    </div>
  );
}

function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}
