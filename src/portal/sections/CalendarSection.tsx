// O coração operacional do workspace: um calendário com o conteúdo planejado e
// as tarefas de todos os clientes, com filtros de cliente/plataforma/status.

import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LayoutList,
  ListChecks,
  Plus,
  Rows3,
} from "lucide-react";
import { toast } from "sonner";

import { RecordDialog } from "@/components/portal/RecordDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClientChip, PlatformChip, SectionHeader, StatusChip } from "@/components/portal/Shared";
import type { FieldSpec } from "@/components/portal/EntityTable";
import { CONTENT_FORMATS } from "@/data/constants";
import { PILLARS, PLATFORMS, TASK_CATEGORIES, TASK_STATUSES, WORKFLOW_STATUSES } from "@/data/types";
import type { ContentItem, TaskItem } from "@/data/types";
import type { Workspace } from "@/data/workspace";
import type { ClientFocus } from "../useClientFocus";
import { cn } from "@/lib/utils";

const SELECT_CLASS =
  "flex h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const CONTENT_FIELDS: FieldSpec[] = [
  { key: "topic", label: "Tema", required: true, placeholder: "Cold brew x café gelado" },
  { key: "clientId", label: "Cliente", type: "client", required: true },
  { key: "date", label: "Data", type: "date", required: true },
  { key: "platform", label: "Plataforma", type: "select", options: PLATFORMS, required: true },
  { key: "format", label: "Formato", type: "select", options: CONTENT_FORMATS },
  { key: "pillar", label: "Pilar de conteúdo", type: "select", options: PILLARS },
  { key: "status", label: "Status", type: "select", options: WORKFLOW_STATUSES },
  { key: "owner", label: "Responsável" },
  { key: "assetNote", label: "Material necessário" },
  { key: "caption", label: "Legenda", type: "textarea" },
  { key: "managerNotes", label: "Observações do gestor", type: "textarea" },
  { key: "clientComments", label: "Comentários do cliente", type: "textarea" },
];

const TASK_FIELDS: FieldSpec[] = [
  { key: "title", label: "Tarefa", required: true, placeholder: "Gravar lote: 10 peças" },
  { key: "clientId", label: "Cliente", type: "client", required: true },
  { key: "dueDate", label: "Prazo", type: "date", required: true },
  { key: "status", label: "Status", type: "select", options: TASK_STATUSES },
  { key: "priority", label: "Prioridade", type: "select", options: ["Low", "Medium", "High"] },
  { key: "category", label: "Categoria", type: "select", options: TASK_CATEGORIES },
  { key: "project", label: "Projeto / campanha" },
  { key: "notes", label: "Observações", type: "textarea" },
];

function iso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

export function CalendarSection({
  ws,
  focus,
}: {
  ws: Workspace;
  focus: ClientFocus;
}) {
  const [cursor, setCursor] = useState(() => new Date());
  const [clientFilter, setClientFilter] = useState(focus.clientId || "all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [showContent, setShowContent] = useState(true);
  const [showTasks, setShowTasks] = useState(true);
  const [view, setView] = useState<"month" | "list">("month");
  const [contentDraft, setContentDraft] = useState<{ date: string; item?: ContentItem } | null>(null);
  const [taskDraft, setTaskDraft] = useState<{ date: string; item?: TaskItem } | null>(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;

  const matches = useMemo(
    () => (clientId: string) => clientFilter === "all" || clientId === clientFilter,
    [clientFilter],
  );

  // Acompanha o foco de cliente da barra superior: ajusta o estado durante o
  // render quando a prop muda (padrão recomendado pelo React) em vez de efeito.
  const [lastFocus, setLastFocus] = useState(focus.clientId);
  if (lastFocus !== focus.clientId) {
    setLastFocus(focus.clientId);
    setClientFilter(focus.clientId || "all");
  }

  const monthContent = useMemo(
    () =>
      ws.content.filter(
        (item) =>
          item.date.startsWith(monthPrefix) &&
          matches(item.clientId) &&
          (platformFilter === "all" || item.platform === platformFilter),
      ),
    [ws.content, monthPrefix, matches, platformFilter],
  );

  const monthTasks = useMemo(
    () => ws.tasks.filter((task) => task.dueDate.startsWith(monthPrefix) && matches(task.clientId)),
    [ws.tasks, monthPrefix, matches],
  );

  const byDay = useMemo(() => {
    const map = new Map<string, { content: ContentItem[]; tasks: TaskItem[] }>();
    const ensure = (date: string) => {
      if (!map.has(date)) map.set(date, { content: [], tasks: [] });
      return map.get(date)!;
    };
    if (showContent) for (const item of monthContent) ensure(item.date).content.push(item);
    if (showTasks) for (const task of monthTasks) ensure(task.dueDate).tasks.push(task);
    return map;
  }, [monthContent, monthTasks, showContent, showTasks]);

  const listDays = useMemo(() => [...byDay.keys()].sort(), [byDay]);

  const firstDay = new Date(year, month, 1);
  const leading = ws.profile.weekStart === "Sunday" ? firstDay.getDay() : (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weekdays =
    ws.profile.weekStart === "Sunday"
      ? ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
      : ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  const todayIso = iso(new Date());

  const openContent = (date: string, item?: ContentItem) => setContentDraft({ date, item });
  const openTask = (date: string, item?: TaskItem) => setTaskDraft({ date, item });

  const saveContent = async (values: Record<string, string>) => {
    try {
      const existing = contentDraft?.item;
      await ws.saveContent(
        {
          clientId: values.clientId,
          date: values.date,
          platform: (values.platform || "Instagram") as ContentItem["platform"],
          format: values.format || "Single post",
          topic: values.topic,
          caption: values.caption,
          assetNote: values.assetNote,
          status: (values.status || "Idea") as ContentItem["status"],
          managerNotes: values.managerNotes,
          clientComments: values.clientComments,
          pillar: values.pillar || PILLARS[0],
          owner: values.owner,
        },
        existing?.id,
      );
      toast.success(existing ? "Conteúdo atualizado" : "Conteúdo adicionado ao calendário");
      setContentDraft(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o conteúdo");
    }
  };

  const saveTask = async (values: Record<string, string>) => {
    try {
      const existing = taskDraft?.item;
      await ws.saveTask(
        {
          clientId: values.clientId,
          title: values.title,
          project: values.project,
          category: values.category,
          priority: (values.priority || "Medium") as TaskItem["priority"],
          status: (values.status || "Backlog") as TaskItem["status"],
          startDate: existing?.startDate ?? values.dueDate,
          dueDate: values.dueDate,
          completedAt: existing?.completedAt ?? "",
          dependsOn: existing?.dependsOn ?? "",
          notes: values.notes,
        },
        existing?.id,
      );
      toast.success(existing ? "Tarefa atualizada" : "Tarefa adicionada ao calendário");
      setTaskDraft(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar a tarefa");
    }
  };

  const monthLabel = cursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div>
      <SectionHeader
        title="Calendário de conteúdo"
        description="Posts planejados e tarefas de todos os clientes em uma só visão. Clique em um dia ou item para adicionar e editar."
      >
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openTask(iso(new Date()))}>
          <ListChecks className="size-4" />
          Adicionar tarefa
        </Button>
        <Button size="sm" className="gap-1.5" onClick={() => openContent(iso(new Date()))}>
          <Plus className="size-4" />
          Adicionar conteúdo
        </Button>
      </SectionHeader>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-md border border-border/70 p-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Mês anterior"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-36 text-center text-sm font-medium">{monthLabel}</span>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Próximo mês"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>
          Hoje
        </Button>

        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className={cn(SELECT_CLASS, "min-w-40")}
          aria-label="Filtrar por cliente"
        >
          <option value="all">Todos os clientes</option>
          {ws.clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>

        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className={cn(SELECT_CLASS, "min-w-32")}
          aria-label="Filtrar por plataforma"
        >
          <option value="all">Todas as plataformas</option>
          {PLATFORMS.map((platform) => (
            <option key={platform} value={platform}>
              {platform}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1 rounded-md border border-border/70 p-0.5">
          <Button
            variant={showContent ? "secondary" : "ghost"}
            size="sm"
            className="h-8 gap-1 px-2 text-xs"
            onClick={() => setShowContent((v) => !v)}
          >
            <CalendarDays className="size-3.5" /> Conteúdo
          </Button>
          <Button
            variant={showTasks ? "secondary" : "ghost"}
            size="sm"
            className="h-8 gap-1 px-2 text-xs"
            onClick={() => setShowTasks((v) => !v)}
          >
            <ListChecks className="size-3.5" /> Tarefas
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-1 rounded-md border border-border/70 p-0.5">
          <Button
            variant={view === "month" ? "secondary" : "ghost"}
            size="icon"
            className="size-8"
            aria-label="Visão mensal"
            onClick={() => setView("month")}
          >
            <Rows3 className="size-4" />
          </Button>
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="icon"
            className="size-8"
            aria-label="Visão em lista"
            onClick={() => setView("list")}
          >
            <LayoutList className="size-4" />
          </Button>
        </div>
      </div>

      {view === "month" ? (
        <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
          <div className="grid grid-cols-7 border-b border-border/70 bg-muted/30">
            {weekdays.map((day) => (
              <div
                key={day}
                className="px-2 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: leading }).map((_, i) => (
              <div key={`lead-${i}`} className="min-h-28 border-b border-r border-border/50 bg-muted/10" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const date = iso(new Date(year, month, i + 1));
              const day = byDay.get(date);
              const items = [
                ...(day?.content ?? []).map((item) => ({ kind: "content" as const, item })),
                ...(day?.tasks ?? []).map((item) => ({ kind: "task" as const, item })),
              ];
              return (
                <div
                  key={date}
                  className={cn(
                    "min-h-28 border-b border-r border-border/50 p-1.5",
                    date === todayIso && "bg-primary/5",
                  )}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span
                      className={cn(
                        "text-xs font-medium",
                        date === todayIso ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {i + 1}
                    </span>
                    <button
                      type="button"
                      aria-label={`Adicionar em ${date}`}
                      className="rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-primary focus:opacity-100 [div:hover>&]:opacity-100"
                      onClick={() => openContent(date)}
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {items.slice(0, 3).map((entry) =>
                      entry.kind === "content" ? (
                        <button
                          key={`c-${entry.item.id}`}
                          type="button"
                          onClick={() => openContent(date, entry.item)}
                          className="block w-full truncate rounded border border-border/70 bg-background px-1.5 py-1 text-left text-[11px] hover:border-primary/40"
                          title={`${entry.item.topic} · ${ws.clientName(entry.item.clientId)}`}
                        >
                          <span className="mr-1 inline-flex align-middle">
                            <PlatformChip platform={entry.item.platform} className="px-1 py-0" />
                          </span>
                          <span className="align-middle">{entry.item.topic}</span>
                        </button>
                      ) : (
                        <button
                          key={`t-${entry.item.id}`}
                          type="button"
                          onClick={() => openTask(date, entry.item)}
                          className={cn(
                            "block w-full truncate rounded border px-1.5 py-1 text-left text-[11px]",
                            entry.item.status === "Done"
                              ? "border-teal-200 bg-teal-50/60 text-teal-800 line-through dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-200"
                              : entry.item.priority === "High"
                                ? "border-rose-200 bg-rose-50/70 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"
                                : "border-border/70 bg-muted/40 text-foreground",
                          )}
                          title={`${entry.item.title} · ${ws.clientName(entry.item.clientId)}`}
                        >
                          {entry.item.title}
                        </button>
                      ),
                    )}
                    {items.length > 3 ? (
                      <p className="px-1 text-[10px] text-muted-foreground">
                        +{items.length - 3} mais
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {listDays.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 bg-muted/30 px-6 py-10 text-center text-sm text-muted-foreground">
              Nada agendado em {monthLabel} ainda.
            </div>
          ) : (
            listDays.map((date) => {
              const day = byDay.get(date)!;
              return (
                <div key={date} className="rounded-xl border border-border/70 bg-card p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <p className="text-sm font-semibold">
                      {new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                    {date === todayIso ? <Badge variant="outline">Hoje</Badge> : null}
                    <div className="ml-auto flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs"
                        onClick={() => openTask(date)}
                      >
                        <Plus className="size-3.5" /> Tarefa
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs"
                        onClick={() => openContent(date)}
                      >
                        <Plus className="size-3.5" /> Conteúdo
                      </Button>
                    </div>
                  </div>
                  <ul className="space-y-1.5">
                    {day.content.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => openContent(date, item)}
                          className="flex w-full items-center gap-2 rounded-lg border border-border/60 px-2 py-1.5 text-left text-sm hover:border-primary/40"
                        >
                          <PlatformChip platform={item.platform} />
                          <span className="min-w-0 flex-1 truncate">{item.topic}</span>
                          <ClientChip name={ws.clientName(item.clientId)} />
                          <StatusChip status={item.status} />
                        </button>
                      </li>
                    ))}
                    {day.tasks.map((task) => (
                      <li key={task.id}>
                        <button
                          type="button"
                          onClick={() => openTask(date, task)}
                          className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border/70 px-2 py-1.5 text-left text-sm hover:border-primary/40"
                        >
                          <ListChecks className="size-3.5 text-muted-foreground" />
                          <span className="min-w-0 flex-1 truncate">{task.title}</span>
                          <ClientChip name={ws.clientName(task.clientId)} />
                          <StatusChip status={task.status} />
                          <StatusChip status={task.priority} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })
          )}
        </div>
      )}

      {contentDraft ? (
        <RecordDialog
          open
          onOpenChange={(open) => {
            if (!open) setContentDraft(null);
          }}
          title={contentDraft.item ? "Editar conteúdo" : "Novo conteúdo"}
          description={
            contentDraft.item
              ? `${ws.clientName(contentDraft.item.clientId)} · ${contentDraft.item.date}`
              : `Planejado para ${contentDraft.date}`
          }
          fields={CONTENT_FIELDS}
          clients={ws.clients}
          submitLabel={contentDraft.item ? "Salvar conteúdo" : "Adicionar ao calendário"}
          initial={{
            topic: contentDraft.item?.topic ?? "",
            clientId:
              contentDraft.item?.clientId ??
              (clientFilter !== "all" ? clientFilter : ws.clients[0]?.id ?? ""),
            date: contentDraft.item?.date ?? contentDraft.date,
            platform: contentDraft.item?.platform ?? (platformFilter !== "all" ? platformFilter : "Instagram"),
            format: contentDraft.item?.format ?? "Single post",
            pillar: contentDraft.item?.pillar ?? PILLARS[0],
            status: contentDraft.item?.status ?? "Idea",
            owner: contentDraft.item?.owner ?? ws.profile.managerName,
            assetNote: contentDraft.item?.assetNote ?? "",
            caption: contentDraft.item?.caption ?? "",
            managerNotes: contentDraft.item?.managerNotes ?? "",
            clientComments: contentDraft.item?.clientComments ?? "",
          }}
          onSubmit={saveContent}
        />
      ) : null}

      {taskDraft ? (
        <RecordDialog
          open
          onOpenChange={(open) => {
            if (!open) setTaskDraft(null);
          }}
          title={taskDraft.item ? "Editar tarefa" : "Nova tarefa"}
          description={
            taskDraft.item
              ? `${ws.clientName(taskDraft.item.clientId)} · prazo ${taskDraft.item.dueDate}`
              : `Prazo ${taskDraft.date}`
          }
          fields={TASK_FIELDS}
          clients={ws.clients}
          submitLabel={taskDraft.item ? "Salvar tarefa" : "Adicionar tarefa"}
          initial={{
            title: taskDraft.item?.title ?? "",
            clientId: taskDraft.item?.clientId ?? (clientFilter !== "all" ? clientFilter : ws.clients[0]?.id ?? ""),
            dueDate: taskDraft.item?.dueDate ?? taskDraft.date,
            status: taskDraft.item?.status ?? "Backlog",
            priority: taskDraft.item?.priority ?? "Medium",
            category: taskDraft.item?.category ?? TASK_CATEGORIES[0],
            project: taskDraft.item?.project ?? "",
            notes: taskDraft.item?.notes ?? "",
          }}
          onSubmit={saveTask}
        />
      ) : null}
    </div>
  );
}
