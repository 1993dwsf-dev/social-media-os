// Acompanhamento do checklist de entrada de cada cliente.
// Checklist de integração do cliente — o cadastro que você preenche uma vez
// por cliente. O progresso é simplesmente quantas etapas têm conteúdo.

import { useMemo, useState } from "react";
import { CheckCircle2, Circle, Save } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, SectionHeader, StatusChip } from "@/components/portal/Shared";
import { formatDate } from "@/data/constants";
import { label } from "@/data/labels";
import { ONBOARDING_STEPS } from "@/data/types";
import type { OnboardingStep } from "@/data/types";
import type { Workspace } from "@/data/workspace";
import type { ClientFocus } from "../useClientFocus";
import { cn } from "@/lib/utils";

export function OnboardingSection({ ws, focus }: { ws: Workspace; focus: ClientFocus }) {
  // Segue o foco do workspace; sem foco, usa o primeiro cliente.
  const client = ws.clientOf(focus.clientId) ?? ws.clients[0];

  const [answers, setAnswers] = useState<Partial<Record<OnboardingStep, string>>>({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // Ao trocar de cliente, recarrega o formulário a partir do registro: ajusta o
  // estado durante o render quando `client` muda (padrão recomendado pelo
  // React) em vez de sincronizar via efeito.
  const [lastClient, setLastClient] = useState(client);
  if (client !== lastClient) {
    setLastClient(client);
    setAnswers(client?.onboarding ?? {});
    setDirty(false);
  }

  const done = useMemo(
    () => ONBOARDING_STEPS.filter((step) => (answers[step] ?? "").trim().length > 0).length,
    [answers],
  );
  const progress = Math.round((done / ONBOARDING_STEPS.length) * 100);

  if (!client) {
    return (
      <div>
        <SectionHeader title="Integração" description="Cadastro de entrada de cada cliente." />
        <EmptyState
          title="Adicione um cliente primeiro"
          hint="As respostas de integração ficam salvas no cadastro do cliente."
        />
      </div>
    );
  }

  const save = async () => {
    setSaving(true);
    try {
      await ws.saveClient({ onboarding: answers }, client.id);
      setDirty(false);
      toast.success(`Integração salva para ${client.name}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar a integração");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="Integração"
        description="Tudo o que você precisa de um cliente novo em um só lugar — para nada ser perguntado duas vezes."
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
        <Button size="sm" className="gap-1.5" disabled={!dirty || saving} onClick={() => void save()}>
          <Save className="size-4" />
          {saving ? "Salvando…" : dirty ? "Salvar respostas" : "Salvo"}
        </Button>
      </SectionHeader>

      <div className="mb-4 rounded-xl border border-border/70 bg-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-52">
            <p className="text-sm font-semibold">{client.name}</p>
            <p className="text-xs text-muted-foreground">
              {client.industry || "Sem segmento"} · cliente desde {formatDate(client.startDate)}
            </p>
          </div>
          <StatusChip status={client.status} />
          {client.packageName ? <Badge variant="outline">{client.packageName}</Badge> : null}
          <div className="ml-auto min-w-56">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {done} de {ONBOARDING_STEPS.length} etapas respondidas
              </span>
              <span className="tabular font-medium">{progress}%</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  progress === 100 ? "bg-teal-500" : progress >= 50 ? "bg-amber-500" : "bg-rose-400",
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {ONBOARDING_STEPS.map((step) => {
          const filled = (answers[step] ?? "").trim().length > 0;
          return (
            <section key={step} className="rounded-xl border border-border/70 bg-card p-4">
              <div className="flex items-center gap-2">
                {filled ? (
                  <CheckCircle2 className="size-4 text-teal-600 dark:text-teal-400" />
                ) : (
                  <Circle className="size-4 text-muted-foreground/50" />
                )}
                <h2 className="text-sm font-semibold">{label(step)}</h2>
              </div>
              <Textarea
                className="mt-2"
                rows={3}
                value={answers[step] ?? ""}
                placeholder={`Escreva o que você sabe sobre ${label(step).toLowerCase()}…`}
                onChange={(e) => {
                  setAnswers((prev) => ({ ...prev, [step]: e.target.value }));
                  setDirty(true);
                }}
              />
            </section>
          );
        })}
      </div>
    </div>
  );
}
