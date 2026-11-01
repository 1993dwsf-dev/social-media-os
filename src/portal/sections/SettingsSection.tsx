// Configurações do workspace: quem é o gestor, como o espaço se comporta e as
// ferramentas de dados (backup, dados de exemplo, reset).

import { useState } from "react";
import {
  Download,
  FileJson,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CSV_NAMES, CSV_TABLES, type CsvTable } from "@/data/csv";
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
  const [dataBusy, setDataBusy] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [confirmImport, setConfirmImport] = useState(false);
  const [csvTable, setCsvTable] = useState<CsvTable>("clients");
  const [csvClient, setCsvClient] = useState("");
  const [recoveryPassword, setRecoveryPassword] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [recoveryBusy, setRecoveryBusy] = useState(false);
  const issueRecovery = useAction(api.access.issueRecoveryCode);
  const totalRows =
    ws.clients.length +
    ws.content.length +
    ws.tasks.length +
    ws.requests.length +
    ws.meetings.length +
    ws.deliverables.length +
    ws.finance.length;

  const dataOperation = async (operation: () => Promise<void>) => {
    if (dataBusy) return;
    setDataBusy(true);
    try {
      await operation();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível concluir a operação.",
      );
    } finally {
      setDataBusy(false);
    }
  };

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
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar as configurações",
      );
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
        <Button
          size="sm"
          className="gap-1.5"
          disabled={!dirty || saving}
          onClick={() => void save()}
        >
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
                onChange={(e) =>
                  patch({ currency: e.target.value.slice(0, 3) })
                }
                placeholder="R$"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="week-start">A semana começa em</Label>
              <select
                id="week-start"
                value={form.weekStart}
                onChange={(e) =>
                  patch({
                    weekStart: e.target.value as WorkspaceProfile["weekStart"],
                  })
                }
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
                onChange={(e) =>
                  patch({ approvalTurnaroundDays: Number(e.target.value || 1) })
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="density">Densidade das tabelas</Label>
              <select
                id="density"
                value={form.density}
                onChange={(e) =>
                  patch({
                    density: e.target.value as WorkspaceProfile["density"],
                  })
                }
                className={SELECT_CLASS}
              >
                <option value="comfortable">{label("comfortable")}</option>
                <option value="compact">{label("compact")}</option>
              </select>
            </div>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Preferências salvas. O envio de notificações por e-mail ainda não
            está disponível.
          </p>
          <div className="mt-2 space-y-3 border-t border-border/60 pt-4">
            {[
              { key: "notifyEmail" as const, label: "Notificações por e-mail" },
              {
                key: "notifyApprovals" as const,
                label: "Lembrar de aprovações pendentes",
              },
              {
                key: "notifyFinance" as const,
                label: "Acompanhar faturas e despesas em aberto",
              },
            ].map((row) => (
              <div
                key={row.key}
                className="flex items-center justify-between gap-3"
              >
                <span className="text-sm">{row.label}</span>
                <Switch
                  checked={boolean(form[row.key])}
                  disabled={row.key === "notifyEmail"}
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
            Seu espaço de trabalho fica na sua conta. Exporte um backup em JSON
            a qualquer momento ou importe um para levar tudo para outra conta.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Limites do piloto: 1.000 registros no total e 500 KB de dados. A
            importação adiciona registros; repetir pode duplicar dados.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={dataBusy || !ws.ready}
              onClick={() => void dataOperation(ws.exportJSON)}
            >
              <Download className="size-4" /> Exportar JSON
            </Button>
            <label className="grid gap-1.5 text-xs">
              <span>Selecionar backup JSON</span>
              <Input
                type="file"
                accept="application/json,.json"
                disabled={dataBusy}
                onChange={(event) => {
                  setPendingFile(event.target.files?.[0] ?? null);
                  setConfirmImport(false);
                }}
              />
            </label>
            {pendingFile && (
              <div className="w-full space-y-2">
                <p className="text-xs">
                  {pendingFile.name} · {Math.ceil(pendingFile.size / 1_000)} KB
                  · {totalRows} registros já existentes.
                </p>
                <label className="flex items-start gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={confirmImport}
                    onChange={(event) => setConfirmImport(event.target.checked)}
                  />
                  Entendo que a importação acrescenta dados e pode criar
                  duplicatas. Guardei um backup atual.
                </label>
                <Button
                  size="sm"
                  disabled={dataBusy || !confirmImport}
                  onClick={() =>
                    void dataOperation(async () => {
                      await ws.importJSON(pendingFile, totalRows > 0);
                      setPendingFile(null);
                      setConfirmImport(false);
                      toast.success("Backup importado");
                    })
                  }
                >
                  <Upload className="mr-1.5 size-4" /> Confirmar importação
                </Button>
              </div>
            )}
          </div>
          <div className="mt-4 grid gap-2 border-t pt-4">
            <Label htmlFor="csv-table">Exportar dados reais em CSV</Label>
            <select
              id="csv-table"
              className={SELECT_CLASS}
              value={csvTable}
              onChange={(event) => setCsvTable(event.target.value as CsvTable)}
            >
              {CSV_TABLES.map((table) => (
                <option key={table} value={table}>
                  {CSV_NAMES[table]}
                </option>
              ))}
            </select>
            <select
              aria-label="Cliente do CSV"
              className={SELECT_CLASS}
              value={csvClient}
              onChange={(event) => setCsvClient(event.target.value)}
            >
              <option value="">Todos os clientes</option>
              {ws.clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="outline"
              disabled={dataBusy}
              onClick={() =>
                void dataOperation(() => ws.exportCSV(csvTable, csvClient))
              }
            >
              Baixar CSV
            </Button>
          </div>
        </section>

        <section className="rounded-xl border border-border/70 bg-card p-4">
          <h2 className="text-sm font-semibold">Recuperação de acesso</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Gere uma chave de emergência e guarde-a fora deste dispositivo. Ela
            permite redefinir a senha sem e-mail e preserva sua conta. Gerar
            outra invalida a anterior.
          </p>
          <label className="mt-3 grid gap-1.5 text-sm">
            Confirme sua senha atual
            <Input
              type="password"
              autoComplete="current-password"
              maxLength={128}
              value={recoveryPassword}
              onChange={(event) => setRecoveryPassword(event.target.value)}
            />
          </label>
          <Button
            className="mt-3"
            size="sm"
            disabled={recoveryBusy || !recoveryPassword}
            onClick={async () => {
              setRecoveryBusy(true);
              setRecoveryCode("");
              try {
                setRecoveryCode(
                  await issueRecovery({ password: recoveryPassword }),
                );
                toast.success("Guarde sua nova chave em um local seguro.");
              } catch {
                toast.error(
                  "Não foi possível gerar a chave. Confira sua senha e sessão.",
                );
              } finally {
                setRecoveryBusy(false);
                setRecoveryPassword("");
              }
            }}
          >
            {recoveryBusy ? "Gerando…" : "Gerar chave de emergência"}
          </Button>
          {recoveryCode && (
            <div className="mt-3 space-y-2">
              <p className="text-xs">
                Esta chave aparece somente agora. Ela não faz parte do backup
                JSON.
              </p>
              <Input
                aria-label="Chave de emergência gerada"
                readOnly
                value={recoveryCode}
                className="font-mono text-xs"
                onFocus={(event) => event.target.select()}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRecoveryCode("")}
              >
                Já guardei — ocultar chave
              </Button>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-border/70 bg-card p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="size-4" /> Dados de exemplo e reset
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            O exemplo carrega quatro clientes fictícios com conteúdo, tarefas,
            reuniões e finanças para você explorar o espaço. Disponível somente
            se não houver registros; seu perfil é preservado.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={bulkBusy !== null || dataBusy || totalRows > 0}
              onClick={async () => {
                setBulkBusy("demo");
                try {
                  await ws.seedDemo();
                  toast.success("Espaço de exemplo carregado");
                } catch (error) {
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : "Não foi possível carregar o exemplo",
                  );
                } finally {
                  setBulkBusy(null);
                }
              }}
            >
              <Sparkles className="size-4" />
              {bulkBusy === "demo"
                ? "Carregando…"
                : "Carregar dados de exemplo"}
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
                      toast.error(
                        error instanceof Error
                          ? error.message
                          : "Não foi possível limpar",
                      );
                    } finally {
                      setBulkBusy(null);
                      setConfirmReset(false);
                    }
                  }}
                >
                  <Trash2 className="size-4" />
                  {bulkBusy === "clear" ? "Excluindo…" : "Sim, excluir tudo"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmReset(false)}
                >
                  Cancelar
                </Button>
              </span>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "gap-1.5 text-muted-foreground hover:text-destructive",
                )}
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
