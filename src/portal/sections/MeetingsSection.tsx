// Reuniões com clientes: pauta antes, anotações e itens de ação depois.

import { Video } from "lucide-react";
import { toast } from "sonner";

import { EntityTable, type FieldSpec } from "@/components/portal/EntityTable";
import { SectionHeader } from "@/components/portal/Shared";
import { todayISO } from "@/data/constants";
import type { MeetingItem } from "@/data/types";
import type { Workspace } from "@/data/workspace";
import type { ClientFocus } from "../useClientFocus";

const FIELDS: FieldSpec[] = [
  { key: "title", label: "Reunião", required: true, placeholder: "Chamada de planejamento mensal" },
  { key: "clientId", label: "Cliente", type: "client", required: true },
  { key: "date", label: "Data", type: "date" },
  { key: "time", label: "Horário", type: "time" },
  { key: "status", label: "Status", type: "select", options: ["Scheduled", "Completed", "Cancelled"] },
  { key: "participants", label: "Participantes" },
  { key: "agenda", label: "Pauta", type: "textarea", compact: true },
  { key: "notes", label: "Observações", type: "textarea", compact: true },
  { key: "actionItems", label: "Itens de ação", type: "textarea", compact: true },
];

export function MeetingsSection({ ws, focus }: { ws: Workspace; focus: ClientFocus }) {
  const next = ws.meetings
    .filter((m) => m.status === "Scheduled" && m.date >= todayISO())
    .slice(0, 1)[0];

  return (
    <div>
      <SectionHeader
        title="Reuniões"
        description={
          next
            ? `Próximo compromisso: ${next.title} com ${ws.clientName(next.clientId)} em ${next.date} às ${next.time}.`
            : "Chamadas e revisões com seus clientes, com pauta e acompanhamentos anexados."
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
        addLabel="Nova reunião"
        entityName="Reuniões"
        statusKey="status"
        focusClientId={focus.clientId}
        emptyTitle="Nenhuma reunião ainda"
        emptyHint="Agende uma conversa e mantenha pauta, anotações e acompanhamentos em um só lugar."
        emptyIcon={<Video className="size-4" />}
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
            toast.success(id ? "Reunião atualizada" : "Reunião agendada");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Não foi possível salvar a reunião");
          }
        }}
        onDelete={async (id) => {
          try {
            await ws.remove("meeting", id);
            toast.success("Reunião excluída");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Não foi possível excluir a reunião");
          }
        }}
      />
    </div>
  );
}
