import { useState } from "react";

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
import { CONTENT_FORMATS } from "@/data/constants";
import type { ContentItem, ContentStatus, Platform } from "@/data/types";
import { PLATFORMS, WORKFLOW_STATUSES } from "@/data/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: ContentItem | null;
  onSubmit: (item: ContentItem) => void;
}

export function ContentDialog({ open, onOpenChange, initial, onSubmit }: Props) {
  const [topic, setTopic] = useState(initial?.topic ?? "");
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10));
  const [platform, setPlatform] = useState<Platform>(initial?.platform ?? "Instagram");
  const [format, setFormat] = useState(initial?.format ?? "Reel");
  const [pillar, setPillar] = useState(initial?.pillar ?? "Education");
  const [caption, setCaption] = useState(initial?.caption ?? "");
  const [status, setStatus] = useState<ContentStatus>(initial?.status ?? "Idea");

  // reset form when the dialog opens for a different item
  const key = initial?.id ?? "new";
  const [lastKey, setLastKey] = useState(key);
  if (key !== lastKey) {
    setLastKey(key);
    setTopic(initial?.topic ?? "");
    setDate(initial?.date ?? new Date().toISOString().slice(0, 10));
    setPlatform(initial?.platform ?? "Instagram");
    setFormat(initial?.format ?? "Reel");
    setPillar(initial?.pillar ?? "Education");
    setCaption(initial?.caption ?? "");
    setStatus(initial?.status ?? "Idea");
  }

  const submit = () => {
    if (!topic.trim()) return;
    onSubmit({
      id: initial?.id ?? `C-${Math.floor(1000 + Math.random() * 9000)}`,
      date,
      platform,
      format,
      topic: topic.trim(),
      caption,
      assetNote: initial?.assetNote ?? "",
      status,
      managerNotes: initial?.managerNotes ?? "",
      clientComments: initial?.clientComments ?? "",
      pillar,
      owner: initial?.owner ?? "Maya Okafor",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit content" : "New content"}</DialogTitle>
          <DialogDescription>
            Content items appear in the calendar and the approval queue.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="topic">Topic</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Cold brew vs iced latte"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Platform</Label>
              <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label>Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_FORMATS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Pillar</Label>
              <Select value={pillar} onValueChange={setPillar}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Education", "Behind the scenes", "Product", "Community", "Promotion"].map(
                    (p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as ContentStatus)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORKFLOW_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              placeholder="Working caption or hook…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!topic.trim()}>
            {initial ? "Save changes" : "Add content"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
