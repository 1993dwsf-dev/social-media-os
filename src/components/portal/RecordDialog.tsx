// Diálogo de formulário guiado por especificação de campos.
//
// Monte-o condicionalmente ({draft ? <RecordDialog …/> : null}) para que os
// valores padrão estejam sempre atualizados para o registro em edição.

import { useState } from "react";

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
import { label } from "@/data/labels";
import type { ClientRecord } from "@/data/types";

import type { FieldSpec } from "./EntityTable";

const SELECT_CLASS =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function RecordDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  clients,
  initial,
  submitLabel = "Salvar",
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: FieldSpec[];
  clients: ClientRecord[];
  initial?: Record<string, string>;
  submitLabel?: string;
  onSubmit: (values: Record<string, string>) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
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
              await onSubmit(values);
            } finally {
              setSaving(false);
            }
          }}
        >
          {fields.map((field) => (
            <div key={field.key} className="grid gap-1.5">
              <Label htmlFor={`rd-${field.key}`}>{field.label}</Label>
              {field.type === "textarea" ? (
                <Textarea
                  id={`rd-${field.key}`}
                  name={field.key}
                  rows={3}
                  defaultValue={initial?.[field.key] ?? ""}
                  placeholder={field.placeholder}
                />
              ) : field.type === "select" || field.type === "client" ? (
                <select
                  id={`rd-${field.key}`}
                  name={field.key}
                  defaultValue={initial?.[field.key] ?? ""}
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
                  id={`rd-${field.key}`}
                  name={field.key}
                  type={
                    field.type === "number"
                      ? "number"
                      : field.type === "date"
                        ? "date"
                        : field.type === "time"
                          ? "time"
                          : "text"
                  }
                  step={field.type === "number" ? "0.01" : undefined}
                  defaultValue={initial?.[field.key] ?? ""}
                  placeholder={field.placeholder}
                  required={field.required}
                />
              )}
            </div>
          ))}
          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando…" : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
