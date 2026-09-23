// Arquivos e entregas por cliente — o que foi produzido, compartilhado e arquivado.

import { toast } from "sonner";

import { EntityTable, type FieldSpec } from "@/components/portal/EntityTable";
import { SectionHeader } from "@/components/portal/Shared";
import { todayISO } from "@/data/constants";
import { FILE_CATEGORIES } from "@/data/constants";
import type { DeliverableItem } from "@/data/types";
import type { Workspace } from "@/data/workspace";
import type { ClientFocus } from "../useClientFocus";

const FIELDS: FieldSpec[] = [
  { key: "name", label: "Nome do arquivo", required: true, placeholder: "Manual de marca v2.pdf" },
  { key: "clientId", label: "Cliente", type: "client", required: true },
  { key: "category", label: "Categoria", type: "select", options: FILE_CATEGORIES },
  { key: "status", label: "Status", type: "select", options: ["Shared", "In progress", "Archived"] },
  { key: "date", label: "Data", type: "date" },
  { key: "relatedProject", label: "Projeto relacionado" },
  { key: "description", label: "Descrição", type: "textarea", compact: true },
  { key: "relatedContent", label: "Conteúdo relacionado", compact: true },
];

export function FilesSection({ ws, focus }: { ws: Workspace; focus: ClientFocus }) {
  const scoped = focus.clientId
    ? ws.deliverables.filter((d) => d.clientId === focus.clientId)
    : ws.deliverables;
  const inProgress = scoped.filter((d) => d.status === "In progress").length;
  const shared = scoped.filter((d) => d.status === "Shared").length;

  return (
    <div>
      <SectionHeader
        title="Arquivos e entregas"
        description={`${shared} compartilhados · ${inProgress} em produção. Materiais da marca, designs, relatórios e entregas finais por cliente.`}
      />

      <EntityTable<DeliverableItem>
        rows={ws.deliverables}
        fields={FIELDS}
        clients={ws.clients}
        clientIdOf={(row) => row.clientId}
        rowTitle={(row) => row.name}
        searchText={(row) =>
          [row.name, row.description, row.category, row.relatedProject, ws.clientName(row.clientId)].join(
            " ",
          )
        }
        addLabel="Novo arquivo"
        entityName="Arquivos"
        statusKey="status"
        focusClientId={focus.clientId}
        emptyTitle="Nenhum arquivo registrado"
        emptyHint="Acompanhe cada entrega para saber sempre o que foi enviado e quando."
        defaults={{
          status: "In progress",
          category: "Graphics",
          date: todayISO(),
          clientId: focus.defaultClientId || ws.clients[0]?.id || "",
        }}
        onSave={async (values, id) => {
          try {
            await ws.saveDeliverable(
              {
                clientId: values.clientId,
                name: values.name,
                category: (values.category || "Graphics") as DeliverableItem["category"],
                description: values.description,
                date: values.date || todayISO(),
                status: (values.status || "In progress") as DeliverableItem["status"],
                relatedContent: values.relatedContent,
                relatedProject: values.relatedProject,
              },
              id,
            );
            toast.success(id ? "Arquivo atualizado" : "Arquivo adicionado");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Não foi possível salvar o arquivo");
          }
        }}
        onDelete={async (id) => {
          await ws.remove("deliverable", id);
          toast.success("Arquivo excluído");
        }}
      />
    </div>
  );
}
