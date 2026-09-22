// Meetings with clients: agenda before, notes and action items after.

import { toast } from "sonner";

import { EntityTable, type FieldSpec } from "@/components/portal/EntityTable";
import { SectionHeader } from "@/components/portal/Shared";
import { todayISO } from "@/data/constants";
import type { MeetingItem } from "@/data/types";
import type { Workspace } from "@/data/workspace";
import type { ClientFocus } from "../useClientFocus";

const FIELDS: FieldSpec[] = [
  { key: "title", label: "Meeting", required: true, placeholder: "Monthly planning call" },
  { key: "clientId", label: "Client", type: "client", required: true },
  { key: "date", label: "Date", type: "date" },
  { key: "time", label: "Time", type: "time" },
  { key: "status", label: "Status", type: "select", options: ["Scheduled", "Completed", "Cancelled"] },
  { key: "participants", label: "Participants" },
  { key: "agenda", label: "Agenda", type: "textarea", compact: true },
  { key: "notes", label: "Notes", type: "textarea", compact: true },
  { key: "actionItems", label: "Action items", type: "textarea", compact: true },
];

export function MeetingsSection({ ws, focus }: { ws: Workspace; focus: ClientFocus }) {
  const next = ws.meetings
    .filter((m) => m.status === "Scheduled" && m.date >= todayISO())
    .slice(0, 1)[0];

  return (
    <div>
      <SectionHeader
        title="Meetings"
        description={
          next
            ? `Next up: ${next.title} with ${ws.clientName(next.clientId)} on ${next.date} at ${next.time}.`
            : "Calls and reviews with your clients, with agendas and follow-ups attached."
        }
      />

      <EntityTable<MeetingItem>
        rows={ws.meetings}
        fields={FIELDS}
        clients={ws.clients}
        clientIdOf={(row) => row.clientId}
        rowTitle={(row) => row.title}
        searchText={(row) =>
          [row.title, row.agenda, row.notes, row.participants, ws.clientName(row.clientId)].join(" ")
        }
        addLabel="New meeting"
        entityName="Meetings"
        statusKey="status"
        focusClientId={focus.clientId}
        emptyTitle="No meetings yet"
        emptyHint="Schedule a call and keep the agenda, notes and follow-ups in one place."
        defaults={{
          status: "Scheduled",
          date: todayISO(),
          time: "10:00",
          clientId: focus.defaultClientId || ws.clients[0]?.id || "",
        }}
        onSave={async (values, id) => {
          try {
            await ws.saveMeeting(
              {
                clientId: values.clientId,
                title: values.title,
                date: values.date,
                time: values.time,
                agenda: values.agenda,
                participants: values.participants,
                status: (values.status || "Scheduled") as MeetingItem["status"],
                notes: values.notes,
                actionItems: values.actionItems,
              },
              id,
            );
            toast.success(id ? "Meeting updated" : "Meeting scheduled");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not save the meeting");
          }
        }}
        onDelete={async (id) => {
          await ws.remove("meeting", id);
          toast.success("Meeting deleted");
        }}
      />
    </div>
  );
}
