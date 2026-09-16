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
import { Textarea } from "@/components/ui/textarea";
import { formatDate, todayISO } from "@/data/constants";
import type { MeetingItem, PortalState } from "@/data/types";

interface Props {
  state: PortalState;
  update: (fn: (prev: PortalState) => PortalState) => void;
}

export function MeetingsSection({ state, update }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [agenda, setAgenda] = useState("");

  const sorted = useMemo(
    () => [...state.meetings].sort((a, b) => b.date.localeCompare(a.date)),
    [state.meetings],
  );

  const submit = () => {
    if (!title.trim() || !date) return;
    const item: MeetingItem = {
      id: `M-${Math.floor(100 + Math.random() * 900)}`,
      title: title.trim(),
      date,
      time,
      agenda,
      participants: state.client.name.split(" ")[0] + ", Manager",
      status: "Scheduled",
      notes: "",
      actionItems: "",
    };
    update((prev) => ({ ...prev, meetings: [item, ...prev.meetings] }));
    setTitle("");
    setDate("");
    setTime("10:00");
    setAgenda("");
    setOpen(false);
  };

  const remove = (id: string) => {
    update((prev) => ({ ...prev, meetings: prev.meetings.filter((m) => m.id !== id) }));
  };

  const setField = (id: string, field: keyof MeetingItem, value: string) => {
    update((prev) => ({
      ...prev,
      meetings: prev.meetings.map((m) => (m.id === id ? { ...m, [field]: value } : m)),
    }));
  };

  const today = todayISO();

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Meetings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Agendas, notes, and action items in one place.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-1.5 size-4" /> Schedule meeting
        </Button>
      </header>

      <div className="space-y-4">
        {sorted.map((m) => (
          <article key={m.id} className="card-lift rounded-xl border border-border/70 bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-4">
                <div className="w-14 shrink-0 rounded-lg border border-border/70 bg-muted/40 p-2 text-center">
                  <p className="text-[10px] uppercase text-muted-foreground">
                    {new Date(`${m.date}T00:00:00`).toLocaleDateString("en-US", { month: "short" })}
                  </p>
                  <p className="tabular text-xl font-semibold leading-none">
                    {m.date.slice(8, 10)}
                  </p>
                </div>
                <div>
                  <h2 className="text-base font-semibold">{m.title}</h2>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(m.date)} · {m.time} · {m.participants}
                  </p>
                  {m.agenda && (
                    <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{m.agenda}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusChip status={m.status} />
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive"
                  onClick={() => remove(m.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <div>
                <Label className="text-xs text-muted-foreground">Notes</Label>
                <Textarea
                  value={m.notes}
                  onChange={(e) => setField(m.id, "notes", e.target.value)}
                  rows={2}
                  placeholder="Meeting notes…"
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Action items</Label>
                <Textarea
                  value={m.actionItems}
                  onChange={(e) => setField(m.id, "actionItems", e.target.value)}
                  rows={2}
                  placeholder="Who does what by when…"
                  className="mt-1 text-sm"
                />
              </div>
            </div>
            {m.date < today && m.status === "Scheduled" && (
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                This date has passed — mark it complete or reschedule.
              </p>
            )}
          </article>
        ))}
        {sorted.length === 0 && (
          <EmptyState
            title="No meetings scheduled"
            hint="Schedule a check-in with the button above."
          />
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule meeting</DialogTitle>
            <DialogDescription>Both sides will see it on their dashboards.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="m-title">Title</Label>
              <Input
                id="m-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Monthly performance review"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="m-date">Date</Label>
                <Input
                  id="m-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="m-time">Time</Label>
                <Input
                  id="m-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="m-agenda">Agenda</Label>
              <Textarea
                id="m-agenda"
                value={agenda}
                onChange={(e) => setAgenda(e.target.value)}
                rows={3}
                placeholder="What should we cover?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={!title.trim() || !date}>
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
