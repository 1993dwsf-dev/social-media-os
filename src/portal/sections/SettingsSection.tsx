// Workspace settings: who the manager is, how the workspace behaves, and the
// data tools (backup, demo data, Notion export, reset).

import { useEffect, useRef, useState } from "react";
import {
  Download,
  FileJson,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SectionHeader } from "@/components/portal/Shared";
import { exportNotionPackage } from "@/data/notion-export";
import type { WorkspaceProfile } from "@/data/types";
import type { Workspace } from "@/data/workspace";
import { cn } from "@/lib/utils";

const SELECT_CLASS =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function SettingsSection({ ws }: { ws: Workspace }) {
  const [form, setForm] = useState<WorkspaceProfile>(ws.profile);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm(ws.profile);
    setDirty(false);
  }, [ws.profile]);

  const patch = (values: Partial<WorkspaceProfile>) => {
    setForm((prev) => ({ ...prev, ...values }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await ws.saveProfile(form);
      setDirty(false);
      toast.success("Settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the settings");
    } finally {
      setSaving(false);
    }
  };

  const notion = () => {
    exportNotionPackage({
      profile: ws.profile,
      clients: ws.clients,
      content: ws.content,
      tasks: ws.tasks,
      requests: ws.requests,
      meetings: ws.meetings,
      deliverables: ws.deliverables,
      finance: ws.finance,
    });
    toast.success("Notion package downloading", {
      description: "Markdown pages and CSV databases — check your downloads.",
    });
  };

  return (
    <div>
      <SectionHeader
        title="Settings"
        description="Your profile, workspace preferences and data tools. Everything is stored in your account, so it follows you between devices."
      >
        <Button size="sm" className="gap-1.5" disabled={!dirty || saving} onClick={() => void save()}>
          {saving ? "Saving…" : dirty ? "Save settings" : "Saved"}
        </Button>
      </SectionHeader>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border/70 bg-card p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <UserRound className="size-4" /> Manager profile
          </h2>
          <div className="mt-3 grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="manager-name">Your name</Label>
              <Input
                id="manager-name"
                value={form.managerName}
                onChange={(e) => patch({ managerName: e.target.value })}
                placeholder="Alex Moreno"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="manager-agency">Business / agency name</Label>
              <Input
                id="manager-agency"
                value={form.agency}
                onChange={(e) => patch({ agency: e.target.value })}
                placeholder="Marrow Social"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="manager-email">Contact email</Label>
              <Input
                id="manager-email"
                type="email"
                value={form.email}
                onChange={(e) => patch({ email: e.target.value })}
                placeholder="you@studio.com"
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border/70 bg-card p-4">
          <h2 className="text-sm font-semibold">Preferences</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="currency">Currency symbol</Label>
              <Input
                id="currency"
                value={form.currency}
                onChange={(e) => patch({ currency: e.target.value.slice(0, 3) })}
                placeholder="$"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="week-start">Week starts on</Label>
              <select
                id="week-start"
                value={form.weekStart}
                onChange={(e) => patch({ weekStart: e.target.value as WorkspaceProfile["weekStart"] })}
                className={SELECT_CLASS}
              >
                <option value="Monday">Monday</option>
                <option value="Sunday">Sunday</option>
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="turnaround">Approval turnaround (days)</Label>
              <Input
                id="turnaround"
                type="number"
                min={1}
                value={form.approvalTurnaroundDays}
                onChange={(e) => patch({ approvalTurnaroundDays: Number(e.target.value || 1) })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="density">Table density</Label>
              <select
                id="density"
                value={form.density}
                onChange={(e) => patch({ density: e.target.value as WorkspaceProfile["density"] })}
                className={SELECT_CLASS}
              >
                <option value="comfortable">Comfortable</option>
                <option value="compact">Compact</option>
              </select>
            </div>
          </div>

          <div className="mt-4 space-y-3 border-t border-border/60 pt-4">
            {[
              { key: "notifyEmail" as const, label: "Email notifications" },
              { key: "notifyApprovals" as const, label: "Remind me about pending approvals" },
              { key: "notifyFinance" as const, label: "Track unpaid invoices and expenses" },
            ].map((row) => (
              <div key={row.key} className="flex items-center justify-between gap-3">
                <span className="text-sm">{row.label}</span>
                <Switch
                  checked={boolean(form[row.key])}
                  onCheckedChange={(checked) => patch({ [row.key]: checked })}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border/70 bg-card p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <FileJson className="size-4" /> Backup & data
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Your workspace lives in your account. Export a JSON backup any time, or import one to
            move everything into another account.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={ws.exportJSON}>
              <Download className="size-4" /> Export JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="size-4" /> Import backup
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                try {
                  await ws.importJSON(file);
                  toast.success("Backup imported");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Import failed");
                } finally {
                  event.target.value = "";
                }
              }}
            />
            <Button variant="outline" size="sm" className="gap-1.5" onClick={notion}>
              <Sparkles className="size-4" /> Notion package
            </Button>
          </div>
        </section>

        <section className="rounded-xl border border-border/70 bg-card p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="size-4" /> Demo data & reset
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            The demo loads four fictional clients with content, tasks, meetings and finances so you
            can explore the workspace. Loading it replaces what is here now.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={async () => {
                try {
                  await ws.seedDemo();
                  toast.success("Demo workspace loaded");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not load the demo");
                }
              }}
            >
              <Sparkles className="size-4" /> Load demo data
            </Button>
            {confirmReset ? (
              <span className="inline-flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1.5"
                  onClick={async () => {
                    try {
                      await ws.clearWorkspace();
                      toast.success("Workspace cleared");
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Could not clear");
                    } finally {
                      setConfirmReset(false);
                    }
                  }}
                >
                  <Trash2 className="size-4" /> Yes, delete everything
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmReset(false)}>
                  Cancel
                </Button>
              </span>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className={cn("gap-1.5 text-muted-foreground hover:text-destructive")}
                onClick={() => setConfirmReset(true)}
              >
                <Trash2 className="size-4" /> Clear workspace
              </Button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function boolean(value: unknown): boolean {
  return value === true;
}
