import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import type { PortalState } from "@/data/types";

interface Props {
  state: PortalState;
  update: (fn: (prev: PortalState) => PortalState) => void;
  loadDemo: () => void;
  resetPortal: () => void;
  exportJSON: () => void;
  importJSONFile: (file: File) => Promise<void>;
}

export function SettingsSection({
  state,
  update,
  loadDemo,
  resetPortal,
  exportJSON,
  importJSONFile,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const setClient = (field: keyof PortalState["client"], value: string) =>
    update((prev) => ({ ...prev, client: { ...prev.client, [field]: value } }));

  const setSetting = <K extends keyof PortalState["settings"]>(
    key: K,
    value: PortalState["settings"][K],
  ) => update((prev) => ({ ...prev, settings: { ...prev.settings, [key]: value } }));

  return (
    <div className="space-y-5 max-w-3xl">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Client profile, preferences, and data management.
        </p>
      </header>

      {/* Client profile */}
      <section className="card-lift rounded-xl border border-border/70 bg-card">
        <div className="border-b border-border/70 px-5 py-4">
          <h2 className="text-sm font-semibold">Client profile</h2>
        </div>
        <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="c-name">Client / brand name</Label>
            <Input
              id="c-name"
              value={state.client.name}
              onChange={(e) => setClient("name", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="c-tag">Tagline</Label>
            <Input
              id="c-tag"
              value={state.client.tagline}
              onChange={(e) => setClient("tagline", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="c-ind">Industry</Label>
            <Input
              id="c-ind"
              value={state.client.industry}
              onChange={(e) => setClient("industry", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="c-web">Website</Label>
            <Input
              id="c-web"
              value={state.client.website}
              onChange={(e) => setClient("website", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="c-email">Email</Label>
            <Input
              id="c-email"
              type="email"
              value={state.client.email}
              onChange={(e) => setClient("email", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="c-tz">Time zone</Label>
            <Input
              id="c-tz"
              value={state.client.timezone}
              onChange={(e) => setClient("timezone", e.target.value)}
            />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="c-notes">Notes</Label>
            <Textarea
              id="c-notes"
              rows={2}
              value={state.client.notes}
              onChange={(e) => setClient("notes", e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Preferences */}
      <section className="card-lift rounded-xl border border-border/70 bg-card">
        <div className="border-b border-border/70 px-5 py-4">
          <h2 className="text-sm font-semibold">Preferences</h2>
        </div>
        <div className="divide-y divide-border/60">
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <div>
              <p className="text-sm font-medium">Theme</p>
              <p className="text-xs text-muted-foreground">Light or dark portal appearance</p>
            </div>
            <Select
              value={state.settings.theme}
              onValueChange={(v) => setSetting("theme", v as "light" | "dark")}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ToggleRow
            label="Approval notifications"
            hint="Email me when content needs review"
            checked={state.settings.notifyApprovals}
            onChange={(v) => setSetting("notifyApprovals", v)}
          />
          <ToggleRow
            label="Report notifications"
            hint="Email me when monthly reports are ready"
            checked={state.settings.notifyReports}
            onChange={(v) => setSetting("notifyReports", v)}
          />
          <ToggleRow
            label="General updates"
            hint="Occasional emails about your account"
            checked={state.settings.notifyEmail}
            onChange={(v) => setSetting("notifyEmail", v)}
          />
        </div>
      </section>

      {/* Data */}
      <section className="card-lift rounded-xl border border-border/70 bg-card">
        <div className="border-b border-border/70 px-5 py-4">
          <h2 className="text-sm font-semibold">Data</h2>
          <p className="text-xs text-muted-foreground">
            Everything is stored in this browser. Export regularly to keep a backup.
          </p>
        </div>
        <div className="divide-y divide-border/60">
          <ActionRow
            title="Export data (JSON)"
            hint="Download a full backup of this workspace"
            action={
              <Button variant="outline" size="sm" onClick={exportJSON}>
                <Download className="mr-1.5 size-3.5" /> Export
              </Button>
            }
          />
          <ActionRow
            title="Import backup"
            hint="Restore a previously exported JSON file"
            action={
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <Upload className="mr-1.5 size-3.5" /> Import
              </Button>
            }
          />
          <ActionRow
            title="Load demo data"
            hint="Replace current data with the Northwind Coffee example"
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  loadDemo();
                  toast.success("Demo data loaded", {
                    description: "The Northwind Coffee Roasters workspace is ready.",
                  });
                }}
              >
                Load demo
              </Button>
            }
          />
          <ActionRow
            title="Reset portal"
            hint="Start fresh with empty lists and a blank profile"
            action={
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  resetPortal();
                  toast.success("Portal reset", { description: "All data cleared." });
                }}
              >
                Reset
              </Button>
            }
          />
        </div>
      </section>

      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          try {
            await importJSONFile(file);
            toast.success("Backup restored", { description: "Your data has been imported." });
          } catch (err) {
            toast.error("Import failed", {
              description: err instanceof Error ? err.message : "Unknown error",
            });
          }
          e.target.value = "";
        }}
      />

      <Separator className="opacity-0" />
      <p className="text-xs text-muted-foreground">
        Contentplane · client portal v1.0 — companion to the Manager Workbook and the Notion
        package.
      </p>
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function ActionRow({
  title,
  hint,
  action,
}: {
  title: string;
  hint: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      {action}
    </div>
  );
}
