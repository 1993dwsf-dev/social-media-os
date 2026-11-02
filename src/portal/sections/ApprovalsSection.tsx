// Aprovações: o gestor registra o que o cliente decidiu sobre cada conteúdo,
// para que o fluxo sempre reflita a realidade.

import { useMemo, useState } from "react";
import { Check, Clock, MessageSquare, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { RecordDialog } from "@/components/portal/RecordDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ClientChip,
  EmptyState,
  PlatformChip,
  SectionHeader,
  StatusChip,
} from "@/components/portal/Shared";
import { formatDate, todayISO } from "@/data/constants";
import { label } from "@/data/labels";
import type { ContentItem, ContentStatus } from "@/data/types";
import type { Workspace } from "@/data/workspace";
import type { ClientFocus } from "../useClientFocus";
import { cn } from "@/lib/utils";

const COLUMNS: {
  key: string;
  title: string;
  hint: string;
  statuses: ContentStatus[];
}[] = [
  {
    key: "review",
    title: "Aguardando o cliente",
    hint: "Enviado e esperando decisão",
    statuses: ["In Review"],
  },
  {
    key: "changes",
    title: "Alterações solicitadas",
    hint: "Ajuste e envie de volta",
    statuses: ["Changes Requested"],
  },
  {
    key: "ready",
    title: "Aprovado e agendado",
    hint: "Liberado para publicar",
    statuses: ["Approved", "Scheduled"],
  },
];

export function ApprovalsSection({
  ws,
  focus,
}: {
  ws: Workspace;
  focus: ClientFocus;
}) {
  const [clientFilter, setClientFilter] = useState(focus.clientId || "all");
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [showPublished, setShowPublished] = useState(false);

  // Acompanha o foco de cliente da barra superior: ajusta o estado durante o
  // render quando a prop muda (padrão recomendado pelo React) em vez de efeito.
  const [lastFocus, setLastFocus] = useState(focus.clientId);
  if (lastFocus !== focus.clientId) {
    setLastFocus(focus.clientId);
    setClientFilter(focus.clientId || "all");
  }

  const scoped = useMemo(
    () =>
      ws.content.filter(
        (item) => clientFilter === "all" || item.clientId === clientFilter,
      ),
    [ws.content, clientFilter],
  );

  const published = scoped.filter((item) => item.status === "Published");

  const setStatus = async (item: ContentItem, status: ContentStatus) => {
    try {
      await ws.saveContent(
        { ...item, status } as Omit<ContentItem, "id">,
        item.id,
      );
      toast.success(
        `“${item.topic}” marcado como ${label(status).toLowerCase()}`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o item",
      );
    }
  };

  const waiting = COLUMNS.reduce(
    (sum, column) =>
      sum +
      scoped.filter((item) => column.statuses.includes(item.status)).length,
    0,
  );

  return (
    <div>
      <SectionHeader
        title="Aprovações"
        description={`${waiting} conteúdo${waiting === 1 ? "" : "s"} ainda em análise. Registre aqui a decisão de cada cliente e o calendário se atualiza sozinho.`}
      >
        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          aria-label="Filtrar por cliente"
        >
          <option value="all">Todos os clientes</option>
          {ws.clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </SectionHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        {COLUMNS.map((column) => {
          const items = scoped
            .filter((item) => column.statuses.includes(item.status))
            .sort((a, b) => a.date.localeCompare(b.date));
          return (
            <section
              key={column.key}
              className="rounded-xl border border-border/70 bg-card"
            >
              <header className="flex items-center justify-between gap-2 border-b border-border/70 px-3 py-2.5">
                <div>
                  <h2 className="text-sm font-semibold">{column.title}</h2>
                  <p className="text-[11px] text-muted-foreground">
                    {column.hint}
                  </p>
                </div>
                <Badge variant="outline" className="tabular">
                  {items.length}
                </Badge>
              </header>
              <div className="space-y-2 p-2.5">
                {items.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border/70 px-3 py-6 text-center text-xs text-muted-foreground">
                    Nada por aqui.
                  </p>
                ) : (
                  items.map((item) => (
                    <article
                      key={item.id}
                      className="card-lift rounded-lg border border-border/70 bg-background p-2.5"
                    >
                      <div className="flex items-center gap-1.5">
                        <PlatformChip platform={item.platform} />
                        <span className="text-[11px] text-muted-foreground">
                          {formatDate(item.date)}
                        </span>
                        <span className="ml-auto">
                          <StatusChip status={item.status} />
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm font-medium leading-snug">
                        {item.topic}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <ClientChip name={ws.clientName(item.clientId)} />
                        <span className="text-[11px] text-muted-foreground">
                          {item.format}
                        </span>
                      </div>
                      {item.clientComments ? (
                        <p className="mt-2 rounded-md bg-amber-50 p-1.5 text-[11px] leading-relaxed text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                          {item.clientComments}
                        </p>
                      ) : null}
                      {item.managerNotes ? (
                        <p className="mt-1.5 text-[11px] text-muted-foreground">
                          {item.managerNotes}
                        </p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.status === "In Review" ||
                        item.status === "Changes Requested" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 px-2 text-[11px]"
                            onClick={() => void setStatus(item, "Approved")}
                          >
                            <Check className="size-3" /> Aprovar
                          </Button>
                        ) : null}
                        {(item.status === "In Review" ||
                          item.status === "Approved") && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 px-2 text-[11px]"
                            onClick={() =>
                              void setStatus(item, "Changes Requested")
                            }
                          >
                            <MessageSquare className="size-3" /> Alterações
                          </Button>
                        )}
                        {item.status === "Approved" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 px-2 text-[11px]"
                            onClick={() => void setStatus(item, "Scheduled")}
                          >
                            <Clock className="size-3" /> Agendar
                          </Button>
                        ) : null}
                        {item.status === "Approved" ||
                        item.status === "Scheduled" ? (
                          <Button
                            size="sm"
                            className="h-7 gap-1 px-2 text-[11px]"
                            onClick={() => void setStatus(item, "Published")}
                          >
                            <Send className="size-3" /> Publicar
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 gap-1 px-2 text-[11px] text-muted-foreground"
                          onClick={() => setEditing(item)}
                        >
                          <Sparkles className="size-3" /> Retorno
                        </Button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={() => setShowPublished((v) => !v)}
          className={cn(
            "flex w-full items-center justify-between rounded-xl border border-border/70 bg-card px-3 py-2.5 text-left",
          )}
        >
          <span>
            <span className="text-sm font-semibold">Publicados</span>
            <span className="ml-2 text-xs text-muted-foreground">
              {published.length} no ar
            </span>
          </span>
          <Badge variant="outline">
            {showPublished ? "Ocultar" : "Mostrar"}
          </Badge>
        </button>
        {showPublished ? (
          published.length === 0 ? (
            <div className="mt-3">
              <EmptyState
                title="Nada publicado ainda"
                hint="Marque os itens como publicados conforme forem ao ar."
              />
            </div>
          ) : (
            <ul className="mt-3 space-y-1.5">
              {published.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-2 text-sm"
                >
                  <PlatformChip platform={item.platform} />
                  <span className="min-w-0 flex-1 truncate">{item.topic}</span>
                  <ClientChip name={ws.clientName(item.clientId)} />
                  <span className="text-xs text-muted-foreground">
                    {formatDate(item.date)}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-[11px]"
                    onClick={() => void setStatus(item, "Approved")}
                  >
                    Reabrir
                  </Button>
                </li>
              ))}
            </ul>
          )
        ) : null}
      </div>

      {editing ? (
        <RecordDialog
          open
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
          title="Retorno do cliente"
          description={`${editing.topic} · ${ws.clientName(editing.clientId)}`}
          clients={ws.clients}
          fields={[
            {
              key: "status",
              label: "Status de aprovação",
              type: "select",
              options: [
                "In Review",
                "Changes Requested",
                "Approved",
                "Scheduled",
                "Published",
              ],
            },
            {
              key: "clientComments",
              label: "O que o cliente disse",
              type: "textarea",
            },
            {
              key: "managerNotes",
              label: "Minhas observações",
              type: "textarea",
            },
          ]}
          initial={{
            status: editing.status,
            clientComments: editing.clientComments,
            managerNotes: editing.managerNotes,
          }}
          submitLabel="Salvar retorno"
          onSubmit={async (values) => {
            try {
              await ws.saveContent(
                {
                  ...editing,
                  status: (values.status || editing.status) as ContentStatus,
                  clientComments: values.clientComments,
                  managerNotes: values.managerNotes,
                  date: editing.date || todayISO(),
                } as Omit<ContentItem, "id">,
                editing.id,
              );
              toast.success("Retorno salvo");
              setEditing(null);
            } catch (error) {
              toast.error(
                error instanceof Error
                  ? error.message
                  : "Não foi possível salvar o retorno",
              );
            }
          }}
        />
      ) : null}
    </div>
  );
}
