// Cadastro de clientes: dados da empresa, pacote, perfis sociais e espaço de
// anotações. É a porta de entrada do workspace — todo o resto parte de um cliente.

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  Check,
  Globe,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ClientAvatar, ClientChip, EmptyState, SectionHeader, StatusChip } from "@/components/portal/Shared";
import { formatDate, todayISO } from "@/data/constants";
import { label } from "@/data/labels";
import { CLIENT_STATUSES, PLATFORMS } from "@/data/types";
import type { ClientRecord, Platform, SectionId } from "@/data/types";
import type { Workspace } from "@/data/workspace";
import type { ClientFocus } from "../useClientFocus";
import { cn } from "@/lib/utils";

const SELECT_CLASS =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

interface FormState {
  name: string;
  status: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  industry: string;
  packageName: string;
  monthlyFee: string;
  startDate: string;
  notes: string;
  socials: Record<string, string>;
}

function emptyForm(): FormState {
  return {
    name: "",
    status: "Active",
    contactName: "",
    email: "",
    phone: "",
    website: "",
    industry: "",
    packageName: "",
    monthlyFee: "",
    startDate: todayISO(),
    notes: "",
    socials: {},
  };
}

function formFrom(client: ClientRecord): FormState {
  return {
    name: client.name,
    status: client.status,
    contactName: client.contactName,
    email: client.email,
    phone: client.phone,
    website: client.website,
    industry: client.industry,
    packageName: client.packageName,
    monthlyFee: client.monthlyFee ? String(client.monthlyFee) : "",
    startDate: client.startDate,
    notes: client.notes,
    socials: { ...(client.socials as Record<string, string>) },
  };
}

export function ClientsSection({
  ws,
  navigate,
  focus,
}: {
  ws: Workspace;
  navigate: (id: SectionId) => void;
  focus: ClientFocus;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editing, setEditing] = useState<ClientRecord | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const stats = useMemo(() => {
    const map = new Map<string, { planned: number; openTasks: number; overdue: number }>();
    for (const client of ws.clients) {
      map.set(client.id, { planned: 0, openTasks: 0, overdue: 0 });
    }
    const today = todayISO();
    for (const item of ws.content) {
      if (item.status === "Published") continue;
      const entry = map.get(item.clientId);
      if (entry) entry.planned += 1;
    }
    for (const task of ws.tasks) {
      const entry = map.get(task.clientId);
      if (!entry) continue;
      if (task.status === "Done") continue;
      entry.openTasks += 1;
      if (task.dueDate && task.dueDate < today) entry.overdue += 1;
    }
    return map;
  }, [ws.clients, ws.content, ws.tasks]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return ws.clients.filter((client) => {
      if (statusFilter !== "all" && client.status !== statusFilter) return false;
      if (!needle) return true;
      return [
        client.name,
        client.contactName,
        client.industry,
        client.email,
        client.website,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [ws.clients, query, statusFilter]);

  const startCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  };

  const startEdit = (client: ClientRecord) => {
    setEditing(client);
    setForm(formFrom(client));
    setOpen(true);
  };

  const submit = async () => {
    if (!form.name.trim()) {
      toast.error("Dê um nome ao cliente primeiro.");
      return;
    }
    setSaving(true);
    try {
      const payload: Partial<ClientRecord> = {
        name: form.name.trim(),
        status: form.status as ClientRecord["status"],
        contactName: form.contactName,
        email: form.email,
        phone: form.phone,
        website: form.website,
        industry: form.industry,
        packageName: form.packageName,
        monthlyFee: Number(form.monthlyFee || 0),
        startDate: form.startDate,
        notes: form.notes,
        socials: Object.fromEntries(
          Object.entries(form.socials).filter(([, value]) => value.trim() !== ""),
        ) as ClientRecord["socials"],
      };
      if (!editing) {
        payload.onboarding = {};
        payload.strategy = [];
        payload.kpis = [];
        payload.createdAt = Date.now();
      }
      await ws.saveClient(payload, editing?.id);
      toast.success(editing ? "Cliente atualizado" : `${payload.name} adicionado`);
      setOpen(false);
      setEditing(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o cliente");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (client: ClientRecord) => {
    try {
      await ws.deleteClient(client.id);
      toast.success(`${client.name} e seus registros foram excluídos`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível excluir o cliente");
    } finally {
      setConfirmId(null);
    }
  };

  return (
    <div>
      <SectionHeader
        title="Clientes"
        description="Cada empresa para a qual você cuida das redes sociais. Dados da empresa, pacote, perfis e anotações privadas — o resto do espaço se organiza em torno disso."
      >
        <Button size="sm" className="gap-1.5" onClick={startCreate}>
          <Plus className="size-4" />
          Novo cliente
        </Button>
      </SectionHeader>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar clientes, contatos, segmentos…"
            className="h-9 pl-8"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={cn(SELECT_CLASS, "h-9 w-auto min-w-36")}
          aria-label="Filtrar por status"
        >
          <option value="all">Todos os status</option>
          {CLIENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {label(status)}
            </option>
          ))}
        </select>
      </div>

      {ws.clients.length === 0 ? (
        <EmptyState
          title="Nenhum cliente ainda"
          hint="Adicione seu primeiro cliente para começar a planejar conteúdo, tarefas e faturas."
        />
      ) : visible.length === 0 ? (
        <EmptyState title="Nenhum cliente corresponde a este filtro" hint="Tente outro status ou termo de busca." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((client) => {
            const stat = stats.get(client.id) ?? { planned: 0, openTasks: 0, overdue: 0 };
            return (
              <article
                key={client.id}
                className="card-lift card-lift-hover flex flex-col rounded-xl border border-border/70 bg-card p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <ClientAvatar name={client.name} />
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-semibold tracking-tight">{client.name}</h2>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {client.industry || "Sem segmento definido"}
                      </p>
                    </div>
                  </div>
                  <StatusChip status={client.status} />
                </div>

                <dl className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                  {client.contactName ? (
                    <div className="flex items-center gap-1.5">
                      <User className="size-3.5" />
                      <span className="truncate">{client.contactName}</span>
                    </div>
                  ) : null}
                  {client.email ? (
                    <div className="flex items-center gap-1.5">
                      <Mail className="size-3.5" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  ) : null}
                  {client.phone ? (
                    <div className="flex items-center gap-1.5">
                      <Phone className="size-3.5" />
                      <span className="truncate">{client.phone}</span>
                    </div>
                  ) : null}
                  {client.website ? (
                    <div className="flex items-center gap-1.5">
                      <Globe className="size-3.5" />
                      <span className="truncate">{client.website}</span>
                    </div>
                  ) : null}
                  {client.startDate ? (
                    <div className="flex items-center gap-1.5">
                      <CalendarClock className="size-3.5" />
                      <span>Cliente desde {formatDate(client.startDate)}</span>
                    </div>
                  ) : null}
                </dl>

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {PLATFORMS.filter((p) => (client.socials as Record<string, string>)[p.toLowerCase()]).map(
                    (platform: Platform) => (
                      <ClientChip
                        key={platform}
                        name={`${platform} ${(client.socials as Record<string, string>)[platform.toLowerCase()]}`}
                      />
                    ),
                  )}
                  {(client.socials as Record<string, string>).other ? (
                    <ClientChip name={String((client.socials as Record<string, string>).other)} />
                  ) : null}
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg border border-border/60 bg-muted/30 p-2 text-center">
                  <div>
                    <p className="tabular text-sm font-semibold">{stat.planned}</p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Planejados
                    </p>
                  </div>
                  <div>
                    <p className="tabular text-sm font-semibold">{stat.openTasks}</p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Tarefas abertas
                    </p>
                  </div>
                  <div>
                    <p
                      className={cn(
                        "tabular text-sm font-semibold",
                        stat.overdue > 0 && "text-rose-600 dark:text-rose-400",
                      )}
                    >
                      {stat.overdue}
                    </p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Atrasadas
                    </p>
                  </div>
                </div>

                {client.packageName || client.monthlyFee > 0 ? (
                  <div className="mt-3 flex items-center justify-between gap-2 text-xs">
                    <span className="truncate text-muted-foreground">{client.packageName || "—"}</span>
                    <Badge variant="outline" className="tabular whitespace-nowrap">
                      {ws.money(client.monthlyFee)}/mês
                    </Badge>
                  </div>
                ) : null}

                {client.notes ? (
                  <p className="mt-3 line-clamp-3 rounded-lg bg-muted/40 p-2 text-xs leading-relaxed text-muted-foreground">
                    {client.notes}
                  </p>
                ) : null}

                <div className="mt-3 flex items-center gap-1.5 border-t border-border/60 pt-3">
                  {confirmId === client.id ? (
                    <>
                      <span className="mr-auto text-xs text-muted-foreground">
                        Excluir o cliente e todos os registros?
                      </span>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs"
                        onClick={() => void remove(client)}
                      >
                        <Check className="size-3.5" /> Excluir
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs"
                        onClick={() => setConfirmId(null)}
                      >
                        <X className="size-3.5" /> Manter
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs"
                        onClick={() => startEdit(client)}
                      >
                        <Pencil className="size-3.5" /> Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-destructive"
                        onClick={() => setConfirmId(client.id)}
                      >
                        <Trash2 className="size-3.5" /> Excluir
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto h-7 gap-1 px-2 text-xs text-primary"
                        onClick={() => {
                          focus.setFocus(client.id);
                          navigate("strategy");
                        }}
                      >
                        Abrir <ArrowRight className="size-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="size-4" />
              {editing ? editing.name : "Novo cliente"}
            </DialogTitle>
            <DialogDescription>
              Dados da empresa e anotações privadas. Só você vê este espaço de trabalho.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="client-name">Nome da empresa *</Label>
              <Input
                id="client-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Torrefação Vento Norte"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="client-status">Status</Label>
              <select
                id="client-status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className={SELECT_CLASS}
              >
                {CLIENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {label(status)}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="client-industry">Segmento / nicho</Label>
              <Input
                id="client-industry"
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                placeholder="Torrefação de cafés especiais"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="client-contact">Contato principal</Label>
              <Input
                id="client-contact"
                value={form.contactName}
                onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                placeholder="Marina Okada"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="client-email">E-mail</Label>
              <Input
                id="client-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="marina@empresa.com.br"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="client-phone">Telefone</Label>
              <Input
                id="client-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+55 (11) 99999-0142"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="client-website">Site</Label>
              <Input
                id="client-website"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="empresa.com.br"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="client-package">Pacote / plano</Label>
              <Input
                id="client-package"
                value={form.packageName}
                onChange={(e) => setForm({ ...form, packageName: e.target.value })}
                placeholder="Mensalidade — 12 posts/mês"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="client-fee">Mensalidade</Label>
              <Input
                id="client-fee"
                type="number"
                step="0.01"
                value={form.monthlyFee}
                onChange={(e) => setForm({ ...form, monthlyFee: e.target.value })}
                placeholder="4800"
              />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="client-start">Data de início do serviço</Label>
              <Input
                id="client-start"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Perfis sociais
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {PLATFORMS.map((platform) => (
                <div key={platform} className="grid gap-1.5">
                  <Label htmlFor={`social-${platform}`}>{platform}</Label>
                  <Input
                    id={`social-${platform}`}
                    value={form.socials[platform.toLowerCase()] ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        socials: { ...form.socials, [platform.toLowerCase()]: e.target.value },
                      })
                    }
                    placeholder={`@brand`}
                  />
                </div>
              ))}
              <div className="grid gap-1.5">
                <Label htmlFor="social-other">Outro</Label>
                <Input
                  id="social-other"
                  value={form.socials.other ?? ""}
                  onChange={(e) => setForm({ ...form, socials: { ...form.socials, other: e.target.value } })}
                  placeholder="Threads, newsletter…"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-1.5">
            <Label htmlFor="client-notes">Observações</Label>
            <Textarea
              id="client-notes"
              rows={4}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Preferências, restrições, pessoas-chave, dados de faturamento…"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void submit()} disabled={saving}>
              {saving ? "Salvando…" : editing ? "Salvar alterações" : "Adicionar cliente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
