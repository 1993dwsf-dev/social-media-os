// Configurações do workspace: quem é o gestor, como o espaço se comporta e as
// ferramentas de dados (backup, dados de exemplo, reset).

import { useRef, useState } from "react";
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
import { label } from "@/data/labels";
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
  // Guarda contra clique duplo: "Carregar exemplo" e "Limpar espaço" são
  // operações longas e destrutivas — um segundo toque as repetiria.
  const [bulkBusy, setBulkBusy] = useState<"demo" | "clear" | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Quando o perfil salvo muda (ex.: outra aba editou), recarrega o formulário:
  // ajusta o estado durante o render (padrão recomendado pelo React) em vez de
  // sincronizar via efeito.
  const [lastProfile, setLastProfile] = useState(ws.profile);
  if (lastProfile !== ws.profile) {
    setLastProfile(ws.profile);
    setForm(ws.profile);
    setDirty(false);
  }

  const patch = (values: Partial<WorkspaceProfile>) => {
    setForm((prev) => ({ ...prev, ...values }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await ws.saveProfile(form);
      setDirty(false);
      toast.success("Configurações salvas");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar as configurações");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="Configurações"
        description="Seu perfil, preferências do espaço e ferramentas de dados. Tudo fica salvo na sua conta, então acompanha você entre dispositivos."
      >
        <Button size="sm" className="gap-1.5" disabled={!dirty || saving} onClick={() => void save()}>
          {saving ? "Salvando…" : dirty ? "Salvar configurações" : "Salvo"}
        </Button>
      </SectionHeader>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border/70 bg-card p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <UserRound className="size-4" /> Perfil do gestor
          </h2>
          <div className="mt-3 grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="manager-name">Seu nome</Label>
              <Input
                id="manager-name"
                value={form.managerName}
                onChange={(e) => patch({ managerName: e.target.value })}
                placeholder="Ana Moreira"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="manager-agency">Nome do negócio / agência</Label>
              <Input
                id="manager-agency"
                value={form.agency}
                onChange={(e) => patch({ agency: e.target.value })}
                placeholder="Moreira Social"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="manager-email">E-mail de contato</Label>
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
          <h2 className="text-sm font-semibold">Preferências</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="currency">Símbolo da moeda</Label>
              <Input
                id="currency"
                value={form.currency}
                onChange={(e) => patch({ currency: e.target.value.slice(0, 3) })}
                placeholder="R$"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="week-start">A semana começa em</Label>
              <select
                id="week-start"
                value={form.weekStart}
                onChange={(e) => patch({ weekStart: e.target.value as WorkspaceProfile["weekStart"] })}
                className={SELECT_CLASS}
              >
                <option value="Monday">{label("Monday")}</option>
                <option value="Sunday">{label("Sunday")}</option>
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="turnaround">Prazo de aprovação (dias)</Label>
              <Input
                id="turnaround"
                type="number"
                min={1}
                value={form.approvalTurnaroundDays}
                onChange={(e) => patch({ approvalTurnaroundDays: Number(e.target.value || 1) })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="density">Densidade das tabelas</Label>
              <select
                id="density"
                value={form.density}
                onChange={(e) => patch({ density: e.target.value as WorkspaceProfile["density"] })}
                className={SELECT_CLASS}
              >
                <option value="comfortable">{label("comfortable")}</option>
                <option value="compact">{label("compact")}</option>
              </select>
            </div>
          </div>

          <div className="mt-4 space-y-3 border-t border-border/60 pt-4">
            {[
              { key: "notifyEmail" as const, label: "Notificações por e-mail" },
              { key: "notifyApprovals" as const, label: "Lembrar de aprovações pendentes" },
              { key: "notifyFinance" as const, label: "Acompanhar faturas e despesas em aberto" },
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
            <FileJson className="size-4" /> Backup e dados
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Seu espaço de trabalho fica na sua conta. Exporte um backup em JSON a qualquer momento
            ou importe um para levar tudo para outra conta.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={ws.exportJSON}>
              <Download className="size-4" /> Exportar JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="size-4" /> Importar backup
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
                  toast.success("Backup importado");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Falha na importação");
                } finally {
                  event.target.value = "";
                }
              }}
            />
          </div>
        </section>

        <section className="rounded-xl border border-border/70 bg-card p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="size-4" /> Dados de exemplo e reset
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            O exemplo carrega quatro clientes fictícios com conteúdo, tarefas, reuniões e finanças
            para você explorar o espaço. Carregá-lo substitui o que está aqui agora.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={bulkBusy !== null}
              onClick={async () => {
                setBulkBusy("demo");
                try {
                  await ws.seedDemo();
                  toast.success("Espaço de exemplo carregado");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Não foi possível carregar o exemplo");
                } finally {
                  setBulkBusy(null);
                }
              }}
            >
              <Sparkles className="size-4" />
              {bulkBusy === "demo" ? "Carregando…" : "Carregar dados de exemplo"}
            </Button>
            {confirmReset ? (
              <span className="inline-flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1-5"
                  disabled={bulkBusy !== null}
                  onClick={async () => {
                    setBulkBusy("clear");
                    try {
                      await ws.clearWorkspace();
                      toast.success("Espaço de trabalho limpo");
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Não foi possível limpar");
                    } finally {
                      setBulkBusy(null);
                      setConfirmReset(false);
                    }
                  }}
                >
                  <Trash2 className="size-4" />
                  {bulkBusy === "clear" ? "Excluindo…" : "Sim, excluir tudo"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmReset(false)}>
                  Cancelar
                </Button>
              </span>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className={cn("gap-1.5 text-muted-foreground hover:text-destructive")}
                onClick={() => setConfirmReset(true)}
              >
                <Trash2 className="size-4" /> Limpar espaço de trabalho
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
