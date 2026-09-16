import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, List, Pencil, Plus, Trash2 } from "lucide-react";

import { PlatformChip, StatusChip, EmptyState } from "@/components/portal/Shared";
import { ContentDialog } from "@/components/portal/ContentDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/data/constants";
import type { ContentItem, PortalState } from "@/data/types";
import { PLATFORMS, WORKFLOW_STATUSES } from "@/data/types";

interface Props {
  state: PortalState;
  update: (fn: (prev: PortalState) => PortalState) => void;
}

export function CalendarSection({ state, update }: Props) {
  const [view, setView] = useState<"list" | "grid">("list");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [cursorMonth, setCursorMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ContentItem | null>(null);

  const filtered = useMemo(() => {
    return state.content
      .filter((c) => platformFilter === "all" || c.platform === platformFilter)
      .filter((c) => statusFilter === "all" || c.status === statusFilter)
      .filter((c) => search === "" || c.topic.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [state.content, platformFilter, statusFilter, search]);

  const monthItems = filtered.filter((c) => c.date.startsWith(cursorMonth));

  const monthLabel = new Date(`${cursorMonth}-01T00:00:00`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const shiftMonth = (delta: number) => {
    const d = new Date(`${cursorMonth}-01T00:00:00`);
    d.setMonth(d.getMonth() + delta);
    setCursorMonth(d.toISOString().slice(0, 7));
  };

  const save = (item: ContentItem) => {
    update((prev) => {
      const exists = prev.content.some((c) => c.id === item.id);
      return {
        ...prev,
        content: exists
          ? prev.content.map((c) => (c.id === item.id ? item : c))
          : [...prev.content, item],
      };
    });
  };

  const remove = (id: string) => {
    update((prev) => ({ ...prev, content: prev.content.filter((c) => c.id !== id) }));
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Content Calendar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything planned, in production, or published for your channels.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-1.5 size-4" /> New content
        </Button>
      </header>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search topics…"
          className="h-9 w-full sm:w-56"
        />
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="h-9 w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All platforms</SelectItem>
            {PLATFORMS.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {WORKFLOW_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 gap-1.5 px-2.5"
            onClick={() => setView("list")}
          >
            <List className="size-3.5" /> List
          </Button>
          <Button
            variant={view === "grid" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 gap-1.5 px-2.5"
            onClick={() => setView("grid")}
          >
            <CalendarDays className="size-3.5" /> Grid
          </Button>
        </div>
      </div>

      {view === "list" ? (
        <div className="card-lift overflow-hidden rounded-xl border border-border/70 bg-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-24">Date</TableHead>
                  <TableHead className="w-20">Platform</TableHead>
                  <TableHead className="w-24">Format</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead className="w-40">Status</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="tabular text-xs">{formatDate(c.date)}</TableCell>
                    <TableCell>
                      <PlatformChip platform={c.platform} />
                    </TableCell>
                    <TableCell className="text-xs">{c.format}</TableCell>
                    <TableCell>
                      <p className="max-w-[280px] truncate font-medium">{c.topic}</p>
                      <p className="max-w-[280px] truncate text-xs text-muted-foreground">
                        {c.caption}
                      </p>
                    </TableCell>
                    <TableCell>
                      <StatusChip status={c.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => {
                            setEditing(c);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-destructive"
                          onClick={() => remove(c.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <EmptyState
                        title="No content matches your filters"
                        hint="Try clearing the search or choosing a different platform."
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* month switcher */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{monthLabel}</h2>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="size-8" onClick={() => shiftMonth(-1)}>
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="outline" size="icon" className="size-8" onClick={() => shiftMonth(1)}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {monthItems.map((c) => (
              <div
                key={c.id}
                className="card-lift card-lift-hover rounded-xl border border-border/70 bg-card p-4"
              >
                <div className="flex items-center justify-between">
                  <PlatformChip platform={c.platform} />
                  <span className="tabular text-xs text-muted-foreground">
                    {formatDate(c.date)}
                  </span>
                </div>
                <p className="mt-3 line-clamp-2 text-sm font-medium">{c.topic}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.caption}</p>
                <div className="mt-3 flex items-center justify-between">
                  <StatusChip status={c.status} />
                  <div className="flex gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => {
                        setEditing(c);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      onClick={() => remove(c.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {monthItems.length === 0 && (
              <div className="sm:col-span-2 lg:col-span-4">
                <EmptyState
                  title={`Nothing planned for ${monthLabel}`}
                  hint="Add content or switch months with the arrows."
                />
              </div>
            )}
          </div>
        </div>
      )}

      <ContentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        onSubmit={save}
      />
    </div>
  );
}
