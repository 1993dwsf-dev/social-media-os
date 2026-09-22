// Client requests: what they asked for, when it is due, and where it stands.

import { toast } from "sonner";

import { EntityTable, type FieldSpec } from "@/components/portal/EntityTable";
import { SectionHeader } from "@/components/portal/Shared";
import { todayISO } from "@/data/constants";
import { REQUEST_CATEGORIES, REQUEST_STATUSES } from "@/data/types";
import type { RequestItem } from "@/data/types";
import type { Workspace } from "@/data/workspace";

const FIELDS: FieldSpec[] = [
  { key: "title", label: "Request", required: true, placeholder: "Add a second Reel this week" },
  { key: "clientId", label: "Client", type: "client", required: true },
  { key: "category", label: "Category", type: "select", options: REQUEST_CATEGORIES },
  { key: "priority", label: "Priority", type: "select", options: ["Low", "Medium", "High"] },
  { key: "status", label: "Status", type: "select", options: REQUEST_STATUSES },
  { key: "dateSubmitted", label: "Requested on", type: "date" },
  { key: "dueDate", label: "Due date", type: "date" },
  { key: "assignedTo", label: "Assigned to" },
  { key: "comments", label: "Comments", type: "textarea", compact: true },
];

export function RequestsSection({ ws }: { ws: Workspace }) {
  const open = ws.requests.filter((r) => r.status !== "Completed" && r.status !== "Closed").length;

  return (
    <div>
      <SectionHeader
        title="Requests"
        description={`Asks coming in from clients. ${open} still open across ${ws.clients.length} client${ws.clients.length === 1 ? "" : "s"}.`}
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
        addLabel="New request"
        entityName="Requests"
        statusKey="status"
        emptyTitle="No requests logged"
        emptyHint="Log what the client asks for so nothing slips between calls."
        defaults={{
          status: "New",
          priority: "Medium",
          dateSubmitted: todayISO(),
          category: "Content",
          clientId: ws.clients[0]?.id ?? "",
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
            toast.success(id ? "Request updated" : "Request logged");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not save the request");
          }
        }}
        onDelete={async (id) => {
          await ws.remove("request", id);
          toast.success("Request deleted");
        }}
      />
    </div>
  );
}
