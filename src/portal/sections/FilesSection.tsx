// Files & deliverables per client — what was produced, what was shared, what is archived.

import { toast } from "sonner";

import { EntityTable, type FieldSpec } from "@/components/portal/EntityTable";
import { SectionHeader } from "@/components/portal/Shared";
import { todayISO } from "@/data/constants";
import { FILE_CATEGORIES } from "@/data/constants";
import type { DeliverableItem } from "@/data/types";
import type { Workspace } from "@/data/workspace";
import type { ClientFocus } from "../useClientFocus";

const FIELDS: FieldSpec[] = [
  { key: "name", label: "File name", required: true, placeholder: "Brand guidelines v2.pdf" },
  { key: "clientId", label: "Client", type: "client", required: true },
  { key: "category", label: "Category", type: "select", options: FILE_CATEGORIES },
  { key: "status", label: "Status", type: "select", options: ["Shared", "In progress", "Archived"] },
  { key: "date", label: "Date", type: "date" },
  { key: "relatedProject", label: "Related project" },
  { key: "description", label: "Description", type: "textarea", compact: true },
  { key: "relatedContent", label: "Related content", compact: true },
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
        title="Files & deliverables"
        description={`${shared} shared · ${inProgress} in progress. Brand assets, graphics, reports and final deliverables per client.`}
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
        addLabel="New file"
        entityName="Files"
        statusKey="status"
        focusClientId={focus.clientId}
        emptyTitle="No files logged"
        emptyHint="Track each deliverable so you always know what was sent and when."
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
            toast.success(id ? "File updated" : "File added");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not save the file");
          }
        }}
        onDelete={async (id) => {
          await ws.remove("deliverable", id);
          toast.success("File deleted");
        }}
      />
    </div>
  );
}
