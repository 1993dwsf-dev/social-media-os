// Approvals: the manager records what the client decided about each piece of
// content, so the pipeline always reflects reality.

import { useEffect, useMemo, useState } from "react";
import { Check, Clock, MessageSquare, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { RecordDialog } from "@/components/portal/RecordDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClientChip, EmptyState, PlatformChip, SectionHeader, StatusChip } from "@/components/portal/Shared";
import { formatDate, todayISO } from "@/data/constants";
import type { ContentItem, ContentStatus } from "@/data/types";
import type { Workspace } from "@/data/workspace";
import type { ClientFocus } from "../useClientFocus";
import { cn } from "@/lib/utils";

const COLUMNS: { key: string; title: string; hint: string; statuses: ContentStatus[] }[] = [
  {
    key: "review",
    title: "Waiting on the client",
    hint: "Sent and awaiting a decision",
    statuses: ["In Review"],
  },
  {
    key: "changes",
    title: "Changes requested",
    hint: "Rework, then send it back",
    statuses: ["Changes Requested"],
  },
  {
    key: "ready",
    title: "Approved & scheduled",
    hint: "Cleared to publish",
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

  // Follow the workspace-wide client focus from the topbar.
  useEffect(() => {
    setClientFilter(focus.clientId || "all");
  }, [focus.clientId]);

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
      await ws.saveContent({ ...item, status } as Omit<ContentItem, "id">, item.id);
      toast.success(`“${item.topic}” marked ${status.toLowerCase()}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the item");
    }
  };

  const waiting = COLUMNS.reduce(
    (sum, column) => sum + scoped.filter((item) => column.statuses.includes(item.status)).length,
    0,
  );

  return (
    <div>
      <SectionHeader
        title="Approvals"
        description={`${waiting} piece${waiting === 1 ? "" : "s"} of content still moving through review. Record each client decision here and the calendar updates automatically.`}
      >
        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          aria-label="Filter by client"
        >
          <option value="all">All clients</option>
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
            <section key={column.key} className="rounded-xl border border-border/70 bg-card">
              <header className="flex items-center justify-between gap-2 border-b border-border/70 px-3 py-2.5">
                <div>
                  <h2 className="text-sm font-semibold">{column.title}</h2>
                  <p className="text-[11px] text-muted-foreground">{column.hint}</p>
                </div>
                <Badge variant="outline" className="tabular">
                  {items.length}
                </Badge>
              </header>
              <div className="space-y-2 p-2.5">
                {items.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border/70 px-3 py-6 text-center text-xs text-muted-foreground">
                    Nothing here.
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
                      <p className="mt-1.5 text-sm font-medium leading-snug">{item.topic}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <ClientChip name={ws.clientName(item.clientId)} />
                        <span className="text-[11px] text-muted-foreground">{item.format}</span>
                      </div>
                      {item.clientComments ? (
                        <p className="mt-2 rounded-md bg-amber-50 p-1.5 text-[11px] leading-relaxed text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                          {item.clientComments}
                        </p>
                      ) : null}
                      {item.managerNotes ? (
                        <p className="mt-1.5 text-[11px] text-muted-foreground">{item.managerNotes}</p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.status === "In Review" || item.status === "Changes Requested" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 px-2 text-[11px]"
                            onClick={() => void setStatus(item, "Approved")}
                          >
                            <Check className="size-3" /> Approved
                          </Button>
                        ) : null}
                        {(item.status === "In Review" || item.status === "Approved") && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 px-2 text-[11px]"
                            onClick={() => void setStatus(item, "Changes Requested")}
                          >
                            <MessageSquare className="size-3" /> Changes
                          </Button>
                        )}
                        {item.status === "Approved" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 px-2 text-[11px]"
                            onClick={() => void setStatus(item, "Scheduled")}
                          >
                            <Clock className="size-3" /> Scheduled
                          </Button>
                        ) : null}
                        {item.status === "Approved" || item.status === "Scheduled" ? (
                          <Button
                            size="sm"
                            className="h-7 gap-1 px-2 text-[11px]"
                            onClick={() => void setStatus(item, "Published")}
                          >
                            <Send className="size-3" /> Published
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 gap-1 px-2 text-[11px] text-muted-foreground"
                          onClick={() => setEditing(item)}
                        >
                          <Sparkles className="size-3" /> Feedback
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
            <span className="text-sm font-semibold">Published</span>
            <span className="ml-2 text-xs text-muted-foreground">
              {published.length} piece{published.length === 1 ? "" : "s"} live
            </span>
          </span>
          <Badge variant="outline">{showPublished ? "Hide" : "Show"}</Badge>
        </button>
        {showPublished ? (
          published.length === 0 ? (
            <div className="mt-3">
              <EmptyState title="Nothing published yet" hint="Mark items published as they go live." />
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
                  <span className="text-xs text-muted-foreground">{formatDate(item.date)}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-[11px]"
                    onClick={() => void setStatus(item, "Approved")}
                  >
                    Reopen
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
          title="Client feedback"
          description={`${editing.topic} · ${ws.clientName(editing.clientId)}`}
          clients={ws.clients}
          fields={[
            { key: "status", label: "Approval status", type: "select", options: ["In Review", "Changes Requested", "Approved", "Scheduled", "Published"] },
            { key: "clientComments", label: "What the client said", type: "textarea" },
            { key: "managerNotes", label: "My notes", type: "textarea" },
          ]}
          initial={{
            status: editing.status,
            clientComments: editing.clientComments,
            managerNotes: editing.managerNotes,
          }}
          submitLabel="Save feedback"
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
              toast.success("Feedback saved");
              setEditing(null);
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Could not save the feedback");
            }
          }}
        />
      ) : null}
    </div>
  );
}
