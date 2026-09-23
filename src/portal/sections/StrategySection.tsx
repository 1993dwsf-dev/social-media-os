// Estratégia por cliente: objetivos, público, pilares, voz e os indicadores
// combinados entre gestor e cliente.

import { useEffect, useMemo, useState } from "react";
import { Plus, Save, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState, SectionHeader } from "@/components/portal/Shared";
import type { ClientRecord, KpiItem, StrategySection as StrategyBlock } from "@/data/types";
import type { Workspace } from "@/data/workspace";
import type { ClientFocus } from "../useClientFocus";
import { cn } from "@/lib/utils";

const DEFAULT_SECTIONS: { key: string; title: string }[] = [
  { key: "business", title: "Objetivo de negócio" },
  { key: "social", title: "Objetivos de social media" },
  { key: "audience", title: "Público-alvo" },
  { key: "pillars", title: "Pilares de conteúdo" },
  { key: "voice", title: "Voz da marca" },
  { key: "positioning", title: "Posicionamento" },
  { key: "messages", title: "Mensagens-chave" },
  { key: "campaigns", title: "Temas de campanha" },
];

function normalize(client: ClientRecord): StrategyBlock[] {
  return DEFAULT_SECTIONS.map((definition) => {
    const existing = client.strategy.find((block) => block.key === definition.key);
    return existing ?? { key: definition.key, title: definition.title, items: [] };
  });
}

export function StrategySection({ ws, focus }: { ws: Workspace; focus: ClientFocus }) {
  // A seção segue o foco do workspace; sem cliente em foco, usa o primeiro
  // cliente para que o editor ainda tenha um destino.
  const client = ws.clientOf(focus.clientId) ?? ws.clients[0];

  const [blocks, setBlocks] = useState<StrategyBlock[]>([]);
  const [kpis, setKpis] = useState<KpiItem[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!client) return;
    setBlocks(normalize(client));
    setKpis(client.kpis ?? []);
    setDirty(false);
  }, [client]);

  const totals = useMemo(() => {
    const filled = blocks.reduce((sum, block) => sum + block.items.filter((i) => i.trim()).length, 0);
    const targets = kpis.length
      ? kpis.reduce((sum, kpi) => {
          const target = Number(kpi.target || 0);
          const actual = Number(kpi.actual || 0);
          if (!target) return sum;
          return sum + Math.min(1, actual / target);
        }, 0) / kpis.filter((k) => Number(k.target || 0) > 0).length || 0
      : 0;
    return { filled, completion: Math.round(targets * 100) };
  }, [blocks, kpis]);

  const updateBlock = (key: string, items: string[]) => {
    setBlocks((prev) => prev.map((block) => (block.key === key ? { ...block, items } : block)));
    setDirty(true);
  };

  if (!client) {
    return (
      <div>
        <SectionHeader title="Estratégia" description="O plano por trás do conteúdo de cada cliente." />
        <EmptyState
          title="Adicione um cliente primeiro"
          hint="A estratégia fica dentro de cada cliente — crie um cliente e volte aqui."
        />
      </div>
    );
  }

  const save = async () => {
    setSaving(true);
    try {
      await ws.saveClient({ strategy: blocks, kpis }, client.id);
      setDirty(false);
      toast.success(`Estratégia salva para ${client.name}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar a estratégia");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="Estratégia"
        description="Objetivos, público, pilares e indicadores por cliente — a referência para consultar antes de escrever qualquer legenda."
      >
        <select
          value={focus.clientId || client.id}
          onChange={(e) => focus.setFocus(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          aria-label="Cliente"
        >
          {ws.clients.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          className="gap-1.5"
          disabled={!dirty || saving}
          onClick={() => void save()}
        >
          <Save className="size-4" />
          {saving ? "Salvando…" : dirty ? "Salvar alterações" : "Salvo"}
        </Button>
      </SectionHeader>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-border/70 bg-muted/30 px-4 py-3">
        <Sparkles className="size-4 text-primary" />
        <p className="text-xs text-muted-foreground">
          {totals.filled} linha{totals.filled === 1 ? "" : "s"} de estratégia preenchida
          {totals.filled === 1 ? "" : "s"} · {kpis.length} indicador{kpis.length === 1 ? "" : "es"} acompanhado
          {kpis.length === 1 ? "" : "s"}
        </p>
        {kpis.length > 0 ? (
          <span className="ml-auto text-xs font-medium">
            Progresso médio: {totals.completion}%
          </span>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {blocks.map((block) => (
          <section key={block.key} className="rounded-xl border border-border/70 bg-card p-4">
            <h2 className="text-sm font-semibold">{block.title}</h2>
            <div className="mt-3 space-y-2">
              {block.items.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nada adicionado ainda.</p>
              ) : null}
              {block.items.map((item, index) => (
                <div key={`${block.key}-${index}`} className="flex items-center gap-2">
                  <Input
                    value={item}
                    onChange={(e) => {
                      const next = [...block.items];
                      next[index] = e.target.value;
                      updateBlock(block.key, next);
                    }}
                    placeholder="Escreva uma linha…"
                    className="h-9"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-destructive"
                    aria-label="Remover linha"
                    onClick={() =>
                      updateBlock(
                        block.key,
                        block.items.filter((_, i) => i !== index),
                      )
                    }
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => updateBlock(block.key, [...block.items, ""])}
              >
                <Plus className="size-3.5" /> Adicionar linha
              </Button>
            </div>
          </section>
        ))}
      </div>

      <section className="mt-6 rounded-xl border border-border/70 bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold">Indicadores</h2>
            <p className="text-[11px] text-muted-foreground">
              O que vocês dois combinaram medir — não métricas de plataforma.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              setKpis((prev) => [
                ...prev,
                { name: "", baseline: "", target: "", actual: "", unit: "", deadline: "" },
              ]);
              setDirty(true);
            }}
          >
            <Plus className="size-3.5" /> Adicionar indicador
          </Button>
        </div>

        {kpis.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Nenhum indicador definido ainda.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {kpis.map((kpi, index) => {
              const target = Number(kpi.target || 0);
              const actual = Number(kpi.actual || 0);
              const progress = target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : 0;
              const patch = (values: Partial<KpiItem>) => {
                setKpis((prev) =>
                  prev.map((row, i) => (i === index ? { ...row, ...values } : row)),
                );
                setDirty(true);
              };
              return (
                <div key={index} className="rounded-lg border border-border/60 p-3">
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
                    <div className="grid gap-1 lg:col-span-2">
                      <Label className="text-[11px]">Indicador</Label>
                      <Input
                        value={kpi.name}
                        onChange={(e) => patch({ name: e.target.value })}
                        className="h-8"
                        placeholder="Posts publicados / mês"
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-[11px]">Linha de base</Label>
                      <Input
                        value={kpi.baseline}
                        onChange={(e) => patch({ baseline: e.target.value })}
                        className="h-8"
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-[11px]">Meta</Label>
                      <Input
                        value={kpi.target}
                        onChange={(e) => patch({ target: e.target.value })}
                        className="h-8"
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-[11px]">Real</Label>
                      <Input
                        value={kpi.actual}
                        onChange={(e) => patch({ actual: e.target.value })}
                        className="h-8"
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-[11px]">Unidade</Label>
                      <Input
                        value={kpi.unit}
                        onChange={(e) => patch({ unit: e.target.value })}
                        className="h-8"
                        placeholder="posts"
                      />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <Input
                      type="date"
                      value={kpi.deadline}
                      onChange={(e) => patch({ deadline: e.target.value })}
                      className="h-8 w-40"
                    />
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          progress >= 100 ? "bg-teal-500" : progress >= 50 ? "bg-amber-500" : "bg-rose-400",
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="tabular w-12 text-right text-xs text-muted-foreground">
                      {progress}%
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      aria-label="Remover indicador"
                      onClick={() => {
                        setKpis((prev) => prev.filter((_, i) => i !== index));
                        setDirty(true);
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
