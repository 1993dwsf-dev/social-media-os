import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { StatusChip, EmptyState } from "@/components/portal/Shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, todayISO } from "@/data/constants";
import type { PortalState, Priority, RequestItem, RequestStatus } from "@/data/types";
import { REQUEST_STATUSES } from "@/data/types";

interface Props {
  state: PortalState;
  update: (fn: (prev: PortalState) => PortalState) => void;
}

const DEFAULT_TEAM = ["Maya Okafor", "Priya Raman", "Jonas Feld"];

export function RequestsSection({ state, update }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Content");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [details, setDetails] = useState("");
  const [dueDate, setDueDate] = useState("");

  const filtered = useMemo(() => {
    return state.requests
      .filter((r) => statusFilter === "all" || r.status === statusFilter)
      .filter((r) => search === "" || r.title.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.dateSubmitted.localeCompare(a.dateSubmitted));
  }, [state.requests, statusFilter, search]);

  const submit = () => {
    if (!title.trim()) return;
    const item: RequestItem = {
      id: `R-${Math.floor(100 + Math.random() * 900)}`,
      title: title.trim(),
      category,
      priority,
      dateSubmitted: todayISO(),
      status: "New",
      assignedTo: "Unassigned",
      dueDate: dueDate || "",
      comments: details,
    };
    update((prev) => ({ ...prev, requests: [item, ...prev.requests] }));
    setTitle("");
    setDetails("");
    setDueDate("");
    setPriority("Medium");
    setOpen(false);
  };

  const setStatus = (id: string, status: RequestStatus) => {
    update((prev) => ({
      ...prev,
      requests: prev.requests.map((r) => (r.id === id ? { ...r, status } : r)),
    }));
  };

  const remove = (id: string) => {
    update((prev) => ({ ...prev, requests: prev.requests.filter((r) => r.id !== id) }));
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Requests</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask for anything — new content, design tweaks, reports, access.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-1.5 size-4" /> New request
        </Button>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search requests…"
          className="h-9 w-full sm:w-56"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {REQUEST_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="card-lift overflow-hidden rounded-xl border border-border/70 bg-card">
        <div className="divide-y divide-border/60">
          {filtered.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
              <div className="min-w-0 flex-1 basis-56">
                <p className="font-medium">{r.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {r.category} · submitted {formatDate(r.dateSubmitted)}
                  {r.dueDate ? ` · due ${formatDate(r.dueDate)}` : ""} · {r.assignedTo}
                </p>
                {r.comments && (
                  <p className="mt-1 max-w-xl truncate text-xs text-muted-foreground">
                    {r.comments}
                  </p>
                )}
              </div>
              <StatusChip status={r.priority} />
              <Select value={r.status} onValueChange={(v) => setStatus(r.id, v as RequestStatus)}>
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REQUEST_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-destructive"
                onClick={() => remove(r.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-5 py-10">
              <EmptyState
                title="No requests found"
                hint="Submit one with the button above, or clear the filters."
              />
            </div>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New request</DialogTitle>
            <DialogDescription>
              The team is notified immediately and will confirm scope.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="req-title">What do you need?</Label>
              <Input
                id="req-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Add a Reel for the fall menu"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Content", "Design", "Strategy", "Report", "Access", "Budget", "Other"].map(
                      (c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["Low", "Medium", "High"] as Priority[]).map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="req-due">Due date (optional)</Label>
              <Input
                id="req-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="req-details">Details</Label>
              <Textarea
                id="req-details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                placeholder="Context, links, examples…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={!title.trim()}>
              Submit request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* DEFAULT_TEAM retained for manager-side assignment; client sees 'Unassigned' until triage. */}
      <span className="hidden">{DEFAULT_TEAM.length}</span>
    </div>
  );
}
