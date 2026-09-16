import { useState } from "react";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/data/constants";
import type { PortalState, StrategySection } from "@/data/types";

interface Props {
  state: PortalState;
  update: (fn: (prev: PortalState) => PortalState) => void;
}

export function StrategySection({ state, update }: Props) {
  const setSection = (key: string, items: string[]) => {
    update((prev) => ({
      ...prev,
      strategy: prev.strategy.map((s) => (s.key === key ? { ...s, items } : s)),
    }));
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Strategy</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The game plan for your channels — agreed with your manager and reviewed monthly.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {state.strategy.map((section) => (
          <StrategyCard key={section.key} section={section} onChange={setSection} />
        ))}
        {state.strategy.length === 0 && (
          <div className="rounded-xl border border-dashed border-border/80 bg-muted/30 px-6 py-10 text-center lg:col-span-2">
            <p className="text-sm font-medium">No strategy defined yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Load the demo data from Settings to see an example strategy.
            </p>
          </div>
        )}
      </div>

      {state.kpis.length > 0 && (
        <section className="card-lift rounded-xl border border-border/70 bg-card">
          <div className="border-b border-border/70 px-5 py-4">
            <h2 className="text-sm font-semibold">KPI targets</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Tracked monthly and reported in Performance.
            </p>
          </div>
          <div className="grid gap-px bg-border/60 sm:grid-cols-2">
            {state.kpis.map((k) => (
              <div key={k.id} className="bg-card px-5 py-4">
                <p className="text-sm font-medium">{k.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Baseline {k.baseline} → Target {k.target} · now{" "}
                  <span className="font-medium text-foreground">{k.actual}</span> · by{" "}
                  {formatDate(k.deadline)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StrategyCard({
  section,
  onChange,
}: {
  section: StrategySection;
  onChange: (key: string, items: string[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const addItem = () => {
    const v = draft.trim();
    if (!v) return;
    onChange(section.key, [...section.items, v]);
    setDraft("");
    setAdding(false);
  };

  return (
    <section className="card-lift rounded-xl border border-border/70 bg-card p-5">
      <h2 className="text-sm font-semibold">{section.title}</h2>
      <ul className="mt-3 space-y-2">
        {section.items.map((item, i) => (
          <li key={i} className="group flex items-start gap-2 text-sm">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/60" />
            <span className="flex-1">{item}</span>
            <button
              type="button"
              aria-label="Remove item"
              className="mt-0.5 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/70 hover:!text-destructive"
              onClick={() =>
                onChange(
                  section.key,
                  section.items.filter((_, j) => j !== i),
                )
              }
            >
              <X className="size-3.5" />
            </button>
          </li>
        ))}
        {section.items.length === 0 && (
          <li className="text-sm text-muted-foreground">Nothing here yet.</li>
        )}
      </ul>
      {adding ? (
        <div className="mt-3 flex gap-2">
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addItem();
              if (e.key === "Escape") setAdding(false);
            }}
            placeholder="Add an item…"
            className="h-8 text-sm"
          />
          <Button size="sm" className="h-8" onClick={addItem}>
            Add
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 h-7 text-muted-foreground"
          onClick={() => setAdding(true)}
        >
          <Plus className="mr-1 size-3.5" /> Add item
        </Button>
      )}
    </section>
  );
}
