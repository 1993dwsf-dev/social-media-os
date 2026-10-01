// Solicitações dos clientes: o que pediram, qual o prazo e em que ponto está.

import { Inbox } from "lucide-react";
import { toast } from "sonner";

import { EntityTable, type FieldSpec } from "@/components/portal/EntityTable";
import { SectionHeader } from "@/components/portal/Shared";
import { todayISO } from "@/data/constants";
import { REQUEST_CATEGORIES } from "@/data/constants";
import { REQUEST_STATUSES } from "@/data/types";
import type { RequestItem } from "@/data/types";
import type { Workspace } from "@/data/workspace";
import type { ClientFocus } from "../useClientFocus";

const FIELDS: FieldSpec[] = [
  { key: "title", label: "Solicitação", required: true, placeholder: "Adicionar um segundo Reel esta semana" },
  { key: "clientId", label: "Cliente", type: "client", required: true },
  { key: "category", label: "Categoria", type: "select", options: REQUEST_CATEGORIES },
  { key: "priority", label: "Prioridade", type: "select", options: ["Low", "Medium", "High"] },
  { key: "status", label: "Status", type: "select", options: REQUEST_STATUSES },
  { key: "dateSubmitted", label: "Solicitado em", type: "date" },
  { key: "dueDate", label: "Prazo", type: "date" },
  { key: "assignedTo", label: "Responsável" },
  { key: "comments", label: "Comentários", type: "textarea", compact: true },
];

export function RequestsSection({ ws, focus }: { ws: Workspace; focus: ClientFocus }) {
  const open = ws.requests.filter((r) => r.status !== "Completed" && r.status !== "Closed").length;

  return (
    <div>
      <SectionHeader
        title="Solicitações"
        description={`Pedidos vindos dos clientes. ${open} em aberto entre ${ws.clients.length} cliente${ws.clients.length === 1 ? "" : "s"}.`}
      />

      <EntityTable<RequestItem>
        rows={ws.requests}
        fields={FIELDS}
        clients={ws.clients}
        clientIdOf={(row) => row.clientId}
        rowTitle={(row) => row.title}
        searchText={(row) =>
          [row.title, row.category, row.comments, row.assignedTo, ws.clientName(row.clientId)].join(" ")
        }
        addLabel="Nova solicitação"
        entityName="Solicitações"
        statusKey="status"
        focusClientId={focus.clientId}
        emptyTitle="Nenhuma solicitação registrada"
        emptyHint="Registre o que o cliente pede para nada se perder entre as conversas."
        emptyIcon={<Inbox className="size-4" />}
        defaults={{
          status: "New",
          priority: "Medium",
          dateSubmitted: todayISO(),
          category: "Content",
          clientId: focus.defaultClientId || ws.clients[0]?.id || "",
        }}
        onSave={async (values, id) => {
          try {
            await ws.saveRequest(
              {
                clientId: values.clientId,
                title: values.title,
                category: values.category,
                priority: (values.priority || "Medium") as RequestItem["priority"],
                dateSubmitted: values.dateSubmitted || todayISO(),
                status: (values.status || "New") as RequestItem["status"],
                assignedTo: values.assignedTo,
                dueDate: values.dueDate,
                comments: values.comments,
              },
              id,
            );
            toast.success(id ? "Solicitação atualizada" : "Solicitação registrada");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Não foi possível salvar a solicitação");
          }
        }}
        onDelete={async (id) => {
          try {
            await ws.remove("request", id);
            toast.success("Solicitação excluída");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Não foi possível excluir a solicitação");
          }
        }}
      />
    </div>
  );
}
