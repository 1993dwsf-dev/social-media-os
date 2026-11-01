import { BACKUP_TABLES } from "./backup";
import { label } from "./labels";

// Quoting alone doesn't neutralize spreadsheet formulas.
export function csvCell(value: unknown): string {
  let text =
    value == null
      ? ""
      : typeof value === "object"
        ? JSON.stringify(value)
        : String(value);
  if (typeof value !== "number" && /^[\s\uFEFF]*[=+@-]/u.test(text))
    text = "'" + text;
  return `"${text.replace(/"/g, '""')}"`;
}

export function tableCSV(rows: Record<string, unknown>[]): string {
  const keys = [...new Set(rows.flatMap((row) => Object.keys(row)))].filter(
    (key) => key !== "ownerId",
  );
  const headers: Record<string, string> = {
    id: "ID",
    clientId: "ID do cliente",
    name: "Nome",
    email: "E-mail",
    phone: "Telefone",
    topic: "Tema",
    caption: "Legenda",
    title: "Título",
    amount: "Valor",
    date: "Data",
    status: "Status",
    description: "Descrição",
    monthlyFee: "Mensalidade",
    contactName: "Contato",
    website: "Site",
    industry: "Segmento",
    packageName: "Pacote",
    startDate: "Data inicial",
    socials: "Redes sociais",
    notes: "Observações",
    onboarding: "Briefing",
    strategy: "Estratégia",
    kpis: "Indicadores",
    createdAt: "Criado em",
    platform: "Plataforma",
    format: "Formato",
    assetNote: "Material",
    managerNotes: "Notas do gestor",
    clientComments: "Comentários do cliente",
    pillar: "Pilar",
    owner: "Responsável",
    project: "Projeto",
    category: "Categoria",
    priority: "Prioridade",
    dueDate: "Vencimento",
    completedAt: "Concluído em",
    dependsOn: "Dependências",
    dateSubmitted: "Recebido em",
    assignedTo: "Responsável",
    comments: "Comentários",
    time: "Horário",
    agenda: "Pauta",
    participants: "Participantes",
    actionItems: "Encaminhamentos",
    relatedContent: "Conteúdo relacionado",
    relatedProject: "Projeto relacionado",
    type: "Tipo",
    paidDate: "Pago em",
    kind: "Origem",
  };
  const lines = [keys.map((key) => csvCell(headers[key] ?? key)).join(";")];
  for (const row of rows) {
    lines.push(
      keys
        .map((key) => {
          const value = row[key];
          if (typeof value === "number")
            return csvCell(String(value).replace(".", ","));
          const enumerated = [
            "status",
            "type",
            "category",
            "priority",
          ].includes(key);
          return csvCell(
            enumerated && typeof value === "string" ? label(value) : value,
          );
        })
        .join(";"),
    );
  }
  return "\uFEFF" + lines.join("\r\n");
}

export const CSV_TABLES = BACKUP_TABLES;
export type CsvTable = (typeof CSV_TABLES)[number];
export const CSV_NAMES: Record<CsvTable, string> = {
  clients: "Clientes",
  content: "Conteúdos",
  tasks: "Tarefas",
  requests: "Solicitações",
  meetings: "Reuniões",
  deliverables: "Entregas",
  finance: "Financeiro",
};
