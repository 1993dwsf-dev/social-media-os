// Task list for every client — what has to happen, for whom, and by when.

import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

import { EntityTable, type FieldSpec } from "@/components/portal/EntityTable";
import { SectionHeader } from "@/components/portal/Shared";
import { KpiCard } from "@/components/portal/Shared";
import { todayISO } from "@/data/constants";
import { TASK_CATEGORIES, TASK_STATUSES } from "@/data/types";
import type { TaskItem } from "@/data/types";
import type { Workspace } from "@/data/workspace";

const FIELDS: FieldSpec[] = [
  { key: "title", label: "Task", required: true, placeholder: "Shoot batch: 10 assets" },
  { key: "clientId", label: "Client", type: "client", required: true },
  { key: "project", label: "Project / campaign" },
  { key: "category", label: "Category", type: "select", options: TASK_CATEGORIES },
  { key: "priority", label: "Priority", type: "select", options: ["Low", "Medium", "High"] },
  { key: "status", label: "Status", type: "select", options: TASK_STATUSES },
  { key: "dueDate", label: "Due date", type: "date" },
  { key: "startDate", label: "Start date", type: "date", compact: true },
  { key: "completedAt", label: "Completed", type: "date", compact: true },
  { key: "dependsOn", label: "Depends on", compact: true },
  { key: "notes", label: "Notes", type: "textarea", compact: true },
];

export function TasksSection({ ws }: { ws: Workspace }) {
  const today = todayISO();
  const summary = useMemo(() => {
    const open = ws.tasks.filter((t) => t.status !== "Done");
    const week = open.filter((t) => t.dueDate && t.dueDate <= addDays(today, 7));
    const overdue = open.filter((t) => t.dueDate && t.dueDate < today);
    const done = ws.tasks.filter((t) => t.status === "Done");
    return { open, week, overdue, done };
  }, [ws.tasks, today]);

  return (
    <div>
      <SectionHeader
        title="Tasks"
        description="Everything on your plate across all clients — deadlines, priorities and progress in one list."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Open tasks"
          value={String(summary.open.length)}
          icon={<Clock className="size-4" />}
        />
        <KpiCard
          label="Due within 7 days"
          value={String(summary.week.length)}
          icon={<Clock className="size-4" />}
        />
        <KpiCard
          label="Overdue"
          value={String(summary.overdue.length)}
          icon={<AlertTriangle className="size-4" />}
        />
        <KpiCard
          label="Completed"
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
        addLabel="New task"
        entityName="Tasks"
        statusKey="status"
        emptyTitle="No tasks yet"
        emptyHint="Add a task to keep the work for each client moving."
        defaults={{
          status: "Backlog",
          priority: "Medium",
          startDate: today,
          dueDate: today,
          clientId: ws.clients[0]?.id ?? "",
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
            toast.success(id ? "Task updated" : "Task added");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not save the task");
          }
        }}
        onDelete={async (id) => {
          await ws.remove("task", id);
          toast.success("Task deleted");
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
