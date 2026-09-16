import { useMemo, useState } from "react";
import { FileText, Plus, Trash2 } from "lucide-react";

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
import { formatDate, todayISO } from "@/data/constants";
import type { DeliverableItem, FileCategory, PortalState } from "@/data/types";
import { FILE_CATEGORIES } from "@/data/constants";

interface Props {
  state: PortalState;
  update: (fn: (prev: PortalState) => PortalState) => void;
}

export function FilesSection({ state, update }: Props) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<FileCategory>("Documents");
  const [description, setDescription] = useState("");

  const filtered = useMemo(() => {
    return state.deliverables
      .filter((d) => filter === "all" || d.category === filter)
      .filter((d) => search === "" || d.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [state.deliverables, filter, search]);

  const submit = () => {
    if (!name.trim()) return;
    const item: DeliverableItem = {
      id: `D-${Math.floor(100 + Math.random() * 900)}`,
      name: name.trim(),
      category,
      description,
      date: todayISO(),
      status: "In progress",
      relatedContent: "—",
      relatedProject: "—",
      size: "—",
    };
    update((prev) => ({ ...prev, deliverables: [item, ...prev.deliverables] }));
    setName("");
    setDescription("");
    setOpen(false);
  };

  const remove = (id: string) => {
    update((prev) => ({
      ...prev,
      deliverables: prev.deliverables.filter((d) => d.id !== id),
    }));
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Files & Deliverables</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Brand assets, final artwork, reports — everything shared with you.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-1.5 size-4" /> Add file
        </Button>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search files…"
          className="h-9 w-full sm:w-56"
        />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="h-9 w-full sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {FILE_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((d) => (
          <div
            key={d.id}
            className="card-lift card-lift-hover flex flex-col rounded-xl border border-border/70 bg-card p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="size-4.5" />
              </span>
              <div className="flex items-center gap-1">
                <StatusChip status={d.status} />
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground hover:text-destructive"
                  onClick={() => remove(d.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
            <p className="mt-3 line-clamp-2 text-sm font-medium">{d.name}</p>
            <p className="mt-1 line-clamp-2 flex-1 text-xs text-muted-foreground">
              {d.description}
            </p>
            <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{d.category}</span>
              <span>
                {formatDate(d.date)} · {d.size}
              </span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3">
            <EmptyState title="No files found" hint="Try a different category or search term." />
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add file</DialogTitle>
            <DialogDescription>
              Register a deliverable so the client can find it here.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="f-name">File name</Label>
              <Input
                id="f-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Holiday campaign brief.pdf"
              />
            </div>
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as FileCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FILE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="f-desc">Description</Label>
              <Input
                id="f-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's inside?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={!name.trim()}>
              Add file
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
