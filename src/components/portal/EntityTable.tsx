// Tabela CRUD reutilizável para Tarefas, Conteúdo, Solicitações, Reuniões e
// Arquivos. As especificações de campo alimentam tanto as colunas quanto o
// diálogo de criar/editar, então cada seção descreve apenas os próprios dados.

import { useMemo, useState } from "react";
import { Check, Pencil, Plus, Search, Trash2, X } from "lucide-react";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/data/constants";
import { label } from "@/data/labels";
import type { ClientRecord } from "@/data/types";
import { cn } from "@/lib/utils";

import { EmptyState, PlatformChip, StatusChip } from "./Shared";

export interface FieldSpec {
  key: string;
  label: string;
  type?: "text" | "textarea" | "date" | "time" | "select" | "number" | "client";
  options?: readonly string[];
  placeholder?: string;
  required?: boolean;
  /** Campos longos são editados no diálogo e omitidos na tabela. */
  compact?: boolean;
}

interface EntityTableProps<T extends { id: string }> {
  rows: T[];
  fields: FieldSpec[];
  clients: ClientRecord[];
  clientIdOf: (row: T) => string;
  searchText: (row: T) => string;
  rowTitle: (row: T) => string;
  onSave: (values: Record<string, string>, id?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  addLabel: string;
  entityName: string;
  emptyTitle: string;
  emptyHint?: string;
  statusKey?: string;
  defaults?: Record<string, string>;
  /** Foco de cliente do workspace (barra superior); "" significa todos. */
  focusClientId?: string;
}

const SELECT_CLASS =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

function isChipValue(value: string): boolean {
  return [
    "Idea",
    "Drafting",
    "In Review",
    "Changes Requested",
    "Approved",
    "Scheduled",
    "Published",
    "New",
    "In Progress",
    "Waiting",
    "Completed",
    "Closed",
    "Scheduled",
    "Cancelled",
    "Backlog",
    "Blocked",
    "Done",
    "Low",
    "Medium",
    "High",
    "Shared",
    "In progress",
    "Archived",
    "Paid",
    "Pending",
    "Overdue",
    "Active",
    "Paused",
    "Prospect",
  ].includes(value);
}

export function EntityTable<T extends { id: string }>({
  rows,
  fields,
  clients,
  clientIdOf,
  searchText,
  rowTitle,
  onSave,
  onDelete,
  addLabel,
  entityName,
  emptyTitle,
  emptyHint,
  statusKey = "status",
  defaults = {},
  focusClientId = "",
}: EntityTableProps<T>) {
  const [query, setQuery] = useState("");
  const [clientFilter, setClientFilter] = useState(focusClientId || "all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editing, setEditing] = useState<T | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Acompanha o foco de cliente definido na barra superior: se mudou desde o
  // último render, ajusta o estado durante o render (padrão recomendado pelo
  // React para estado derivado de props) e re-renderiza imediatamente.
  const [lastFocus, setLastFocus] = useState(focusClientId);
  if (lastFocus !== focusClientId) {
    setLastFocus(focusClientId);
    setClientFilter(focusClientId || "all");
  }

  const clientSelectField = fields.find((f) => f.type === "client");
  const statusField = fields.find((f) => f.key === statusKey);
  const statusOptions = statusField?.options ?? [];

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (clientFilter !== "all" && clientIdOf(row) !== clientFilter) return false;
      if (statusFilter !== "all") {
        const value = String((row as Record<string, unknown>)[statusKey] ?? "");
        if (value !== statusFilter) return false;
      }
      if (!needle) return true;
      return searchText(row).toLowerCase().includes(needle);
    });
  }, [rows, query, clientFilter, statusFilter, clientIdOf, searchText, statusKey]);

  const nameOf = (id?: string) => clients.find((c) => c.id === id)?.name ?? "—";

  const openCreate = () => {
    setEditing(null);
    setCreating(true);
  };

  const initialValues = (row: T | null) => {
    const source: Record<string, unknown> = row ? (row as unknown as Record<string, unknown>) : defaults;
    return Object.fromEntries(fields.map((f) => [f.key, String(source[f.key] ?? "")]));
  };

  const tableFields = fields.filter((f) => !f.compact);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Buscar em ${entityName.toLowerCase()}…`}
            className="h-9 pl-8"
          />
        </div>
        {clientSelectField ? (
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className={cn(SELECT_CLASS, "h-9 w-auto min-w-40")}
            aria-label="Filtrar por cliente"
          >
            <option value="all">Todos os clientes</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        ) : null}
        {statusOptions.length > 0 ? (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={cn(SELECT_CLASS, "h-9 w-auto min-w-36")}
            aria-label="Filtrar por status"
          >
            <option value="all">Todos os status</option>
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {label(option)}
              </option>
            ))}
          </select>
        ) : null}
        <Button size="sm" className="gap-1.5" onClick={openCreate}>
          <Plus className="size-4" />
          {addLabel}
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={rows.length === 0 ? emptyTitle : "Nada corresponde a estes filtros"}
          hint={rows.length === 0 ? emptyHint : "Tente outro cliente, status ou termo de busca."}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/70 bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                {tableFields.map((field) => (
                  <TableHead key={field.key} className="whitespace-nowrap">
                    {field.label}
                  </TableHead>
                ))}
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => {
                const record = row as unknown as Record<string, unknown>;
                return (
                  <TableRow key={row.id}>
                    {tableFields.map((field) => {
                      const raw = String(record[field.key] ?? "");
                      return (
                        <TableCell key={field.key} className="align-top">
                          {field.type === "client" ? (
                            <span className="text-sm">{nameOf(raw)}</span>
                          ) : field.key === "platform" && raw ? (
                            <PlatformChip platform={raw as never} />
                          ) : field.type === "date" && raw ? (
                            <span className="tabular text-sm text-muted-foreground">
                              {formatDate(raw)}
                            </span>
                          ) : isChipValue(raw) ? (
                            <StatusChip status={raw as never} />
                          ) : field.key === statusKey || field.key === "priority" ? (
                            <span className="text-sm">{raw ? label(raw) : "—"}</span>
                          ) : field.options?.includes(raw) ? (
                            <span className="text-sm">{label(raw)}</span>
                          ) : (
                            <span
                              className={cn(
                                "block max-w-[22rem] truncate text-sm",
                                field === tableFields[0] && "font-medium",
                              )}
                              title={raw}
                            >
                              {raw || "—"}
                            </span>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-right">
                      {confirmId === row.id ? (
                        <span className="inline-flex items-center gap-1">
                          <Button
                            variant="destructive"
                            size="icon"
                            className="size-7"
                            aria-label="Confirmar exclusão"
                            onClick={async () => {
                              await onDelete(row.id);
                              setConfirmId(null);
                            }}
                          >
                            <Check className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            aria-label="Cancelar exclusão"
                            onClick={() => setConfirmId(null)}
                          >
                            <X className="size-3.5" />
                          </Button>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            aria-label={`Editar ${rowTitle(row)}`}
                            onClick={() => {
                              setCreating(false);
                              setEditing(row);
                            }}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-destructive"
                            aria-label={`Excluir ${rowTitle(row)}`}
                            onClick={() => setConfirmId(row.id)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {filtered.length} de {rows.length} {entityName.toLowerCase()}
      </p>

      <Dialog
        open={creating || editing !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false);
            setEditing(null);
          }
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? `Editar ${entityName}` : addLabel}</DialogTitle>
            <DialogDescription>
              {editing ? rowTitle(editing) : `Adicionar em ${entityName.toLowerCase()}.`}
            </DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-3 py-1"
            onSubmit={async (event) => {
              event.preventDefault();
              setSaving(true);
              try {
                const form = new FormData(event.currentTarget);
                const values = Object.fromEntries(
                  fields.map((field) => [field.key, String(form.get(field.key) ?? "")]),
                );
                await onSave(values, editing?.id);
                setCreating(false);
                setEditing(null);
              } finally {
                setSaving(false);
              }
            }}
            key={editing?.id ?? "new"}
          >
            {fields.map((field) => (
              <div key={field.key} className="grid gap-1.5">
                <Label htmlFor={`${field.key}-input`}>{field.label}</Label>
                {field.type === "textarea" ? (
                  <Textarea
                    id={`${field.key}-input`}
                    name={field.key}
                    rows={3}
                    defaultValue={initialValues(editing)[field.key]}
                    placeholder={field.placeholder}
                  />
                ) : field.type === "select" || field.type === "client" ? (
                  <select
                    id={`${field.key}-input`}
                    name={field.key}
                    defaultValue={initialValues(editing)[field.key]}
                    required={field.required}
                    className={SELECT_CLASS}
                  >
                    {field.type === "client" ? (
                      <>
                        <option value="">— Sem cliente —</option>
                        {clients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.name}
                          </option>
                        ))}
                      </>
                    ) : (
                      <>
                        {!field.required ? <option value="">— Nenhum —</option> : null}
                        {(field.options ?? []).map((option) => (
                          <option key={option} value={option}>
                            {label(option)}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                ) : (
                  <Input
                    id={`${field.key}-input`}
                    name={field.key}
                    type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "time" ? "time" : "text"}
                    step={field.type === "number" ? "0.01" : undefined}
                    defaultValue={initialValues(editing)[field.key]}
                    placeholder={field.placeholder}
                    required={field.required}
                  />
                )}
              </div>
            ))}
            <DialogFooter className="pt-2">
              {editing ? (
                <Badge variant="outline" className="mr-auto">
                  ID {editing.id.slice(-6)}
                </Badge>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setCreating(false);
                  setEditing(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando…" : editing ? "Salvar alterações" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
