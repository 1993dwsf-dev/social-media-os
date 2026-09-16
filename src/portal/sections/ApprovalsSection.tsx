import { useMemo, useState } from "react";
import { CheckCircle2, MessageSquare, Undo2, XCircle } from "lucide-react";

import { PlatformChip, StatusChip, EmptyState } from "@/components/portal/Shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ContentItem, PortalState } from "@/data/types";
import { formatDate } from "@/data/constants";

interface Props {
  state: PortalState;
  update: (fn: (prev: PortalState) => PortalState) => void;
}

export function ApprovalsSection({ state, update }: Props) {
  const [filter, setFilter] = useState<"action" | "all">("action");
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});

  const items = useMemo(() => {
    const needsAction = (c: ContentItem) =>
      c.status === "In Review" || c.status === "Changes Requested";
    return state.content
      .filter((c) => filter === "all" || needsAction(c))
      .filter((c) => c.status !== "Idea" && c.status !== "Drafting" && c.status !== "Published")
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [state.content, filter]);

  const setStatus = (id: string, status: ContentItem["status"]) => {
    update((prev) => ({
      ...prev,
      content: prev.content.map((c) =>
        c.id === id
          ? { ...c, status, clientComments: commentDraft[id]?.trim() || c.clientComments }
          : c,
      ),
    }));
    setCommentDraft((d) => ({ ...d, [id]: "" }));
  };

  const addComment = (id: string) => {
    const text = commentDraft[id]?.trim();
    if (!text) return;
    update((prev) => ({
      ...prev,
      content: prev.content.map((c) =>
        c.id === id
          ? {
              ...c,
              clientComments: c.clientComments ? `${c.clientComments}\n— ${text}` : text,
              status: c.status === "In Review" ? "Changes Requested" : c.status,
            }
          : c,
      ),
    }));
    setCommentDraft((d) => ({ ...d, [id]: "" }));
  };

  const pendingCount = state.content.filter(
    (c) => c.status === "In Review" || c.status === "Changes Requested",
  ).length;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Approvals</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pendingCount > 0
              ? `${pendingCount} item${pendingCount === 1 ? "" : "s"} need${pendingCount === 1 ? "s" : ""} your attention.`
              : "You're all caught up."}
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
          <Button
            variant={filter === "action" ? "secondary" : "ghost"}
            size="sm"
            className="h-7"
            onClick={() => setFilter("action")}
          >
            Needs action
          </Button>
          <Button
            variant={filter === "all" ? "secondary" : "ghost"}
            size="sm"
            className="h-7"
            onClick={() => setFilter("all")}
          >
            All pipeline
          </Button>
        </div>
      </header>

      <div className="space-y-4">
        {items.map((c) => (
          <article
            key={c.id}
            className="card-lift rounded-xl border border-border/70 bg-card p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <PlatformChip platform={c.platform} />
                  <span className="text-xs text-muted-foreground">{c.format}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{formatDate(c.date)}</span>
                </div>
                <h2 className="mt-2 text-base font-semibold">{c.topic}</h2>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{c.caption}</p>
                {c.assetNote && (
                  <p className="mt-1 text-xs text-muted-foreground">Asset: {c.assetNote}</p>
                )}
              </div>
              <StatusChip status={c.status} />
            </div>

            {(c.managerNotes || c.clientComments) && (
              <div className="mt-4 space-y-2 rounded-lg bg-muted/40 p-3 text-sm">
                {c.managerNotes && (
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Manager note:</span>{" "}
                    {c.managerNotes}
                  </p>
                )}
                {c.clientComments && (
                  <p className="whitespace-pre-line text-muted-foreground">
                    <span className="font-medium text-foreground">Your feedback:</span>{" "}
                    {c.clientComments}
                  </p>
                )}
              </div>
            )}

            {c.status !== "Approved" && c.status !== "Scheduled" && (
              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                <Input
                  value={commentDraft[c.id] ?? ""}
                  onChange={(e) =>
                    setCommentDraft((d) => ({ ...d, [c.id]: e.target.value }))
                  }
                  placeholder="Leave a comment for the team…"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addComment(c.id);
                  }}
                />
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => addComment(c.id)}>
                    <MessageSquare className="mr-1 size-3.5" /> Comment
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-rose-700 hover:text-rose-800 dark:text-rose-400"
                    onClick={() => setStatus(c.id, "Changes Requested")}
                  >
                    <XCircle className="mr-1 size-3.5" /> Request changes
                  </Button>
                  <Button size="sm" onClick={() => setStatus(c.id, "Approved")}>
                    <CheckCircle2 className="mr-1 size-3.5" /> Approve
                  </Button>
                </div>
              </div>
            )}

            {(c.status === "Approved" || c.status === "Scheduled") && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Approved {c.status === "Scheduled" && "and scheduled"} — no action needed.
                </p>
                <Button variant="ghost" size="sm" onClick={() => setStatus(c.id, "In Review")}>
                  <Undo2 className="mr-1 size-3.5" /> Revoke
                </Button>
              </div>
            )}
          </article>
        ))}
        {items.length === 0 && (
          <EmptyState
            title="Nothing to approve right now"
            hint="New items appear here when your manager submits content for review."
          />
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Workflow: Draft → In Review → <span className="font-medium">Approved</span> → Scheduled →
        Published. Commenting on an item moves it back to “Changes Requested”.
      </p>
    </div>
  );
}
