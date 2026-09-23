// Pacote de exportação compatível com o Notion para o workspace do gestor.
//
// Um conjunto de páginas em markdown por cliente, além das bases
// compartilhadas (Tarefas, Reuniões, Financeiro), para que o gestor entregue a
// cada cliente suas próprias páginas do Notion com estratégia, conteúdo,
// solicitações e entregas — mantendo a visão do negócio (financeiro e quadro
// completo de tarefas) claramente marcada como exclusiva do gestor.

import type {
  ClientRecord,
  DeliverableItem,
  FinanceEntry,
  MeetingItem,
  RequestItem,
  TaskItem,
  WorkspaceProfile,
} from "./types";

export interface NotionExportInput {
  profile: WorkspaceProfile;
  clients: ClientRecord[];
  content: { clientId: string; date: string; platform: string; format: string; topic: string; status: string; pillar?: string }[];
  tasks: TaskItem[];
  requests: RequestItem[];
  meetings: MeetingItem[];
  deliverables: DeliverableItem[];
  finance: FinanceEntry[];
}

function csvEscape(v: unknown): string {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCSV(headers: string[], rows: unknown[][]): string {
  return [
    headers.map(csvEscape).join(","),
    ...rows.map((r) => r.map(csvEscape).join(",")),
  ].join("\n");
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "cliente"
  );
}

function bulletList(items: string[]): string {
  return items.length > 0 ? items.map((i) => `- ${i}`).join("\n") : "- —";
}

/** Exporta o pacote completo do Notion como downloads sequenciais (sem ZIP). */
export function exportNotionPackage(input: NotionExportInput) {
  const files = buildNotionFiles(input);
  files.forEach((f, i) => {
    setTimeout(() => {
      const isCSV = f.name.endsWith(".csv");
      download(f.name.split("/").slice(-1)[0], f.content, isCSV ? "text/csv;charset=utf-8" : "text/markdown;charset=utf-8");
    }, i * 250);
  });
}

export function buildNotionFiles(input: NotionExportInput): { name: string; content: string }[] {
  const { profile, clients, content, tasks, requests, meetings, deliverables, finance } = input;
  const files: { name: string; content: string }[] = [];

  // ---- Bases compartilhadas -------------------------------------------------
  files.push({
    name: "databases/Clients.csv",
    content: toCSV(
      ["Cliente", "Contato", "E-mail", "Telefone", "Site", "Segmento", "Pacote", "Mensalidade", "Data de início", "Status", "Instagram", "TikTok", "LinkedIn", "YouTube", "Facebook", "Pinterest", "Outro", "Observações"],
      clients.map((c) => [
        c.name, c.contactName, c.email, c.phone, c.website, c.industry, c.packageName, c.monthlyFee,
        c.startDate, c.status, c.socials.instagram ?? "", c.socials.tiktok ?? "", c.socials.linkedin ?? "",
        c.socials.youtube ?? "", c.socials.facebook ?? "", c.socials.pinterest ?? "", c.socials.other ?? "", c.notes,
      ]),
    ),
  });

  files.push({
    name: "databases/Content.csv",
    content: toCSV(
      ["Cliente", "Data", "Plataforma", "Formato", "Pilar", "Tema", "Status"],
      content.map((c) => [clientName(clients, c.clientId), c.date, c.platform, c.format, c.pillar ?? "", c.topic, c.status]),
    ),
  });

  files.push({
    name: "databases/Tasks.csv",
    content: toCSV(
      ["Cliente", "Tarefa", "Projeto", "Categoria", "Prioridade", "Status", "Data de início", "Prazo", "Observações"],
      tasks.map((t) => [clientName(clients, t.clientId), t.title, t.project, t.category, t.priority, t.status, t.startDate, t.dueDate, t.notes]),
    ),
  });

  files.push({
    name: "databases/Requests.csv",
    content: toCSV(
      ["Cliente", "Solicitação", "Categoria", "Prioridade", "Solicitado em", "Status", "Responsável", "Prazo", "Comentários"],
      requests.map((r) => [clientName(clients, r.clientId), r.title, r.category, r.priority, r.dateSubmitted, r.status, r.assignedTo, r.dueDate, r.comments]),
    ),
  });

  files.push({
    name: "databases/Meetings.csv",
    content: toCSV(
      ["Cliente", "Data", "Horário", "Reunião", "Pauta", "Participantes", "Status", "Observações", "Itens de ação"],
      meetings.map((m) => [clientName(clients, m.clientId), m.date, m.time, m.title, m.agenda, m.participants, m.status, m.notes, m.actionItems]),
    ),
  });

  files.push({
    name: "databases/Deliverables.csv",
    content: toCSV(
      ["Cliente", "Nome do arquivo", "Categoria", "Descrição", "Data", "Status", "Projeto relacionado"],
      deliverables.map((d) => [clientName(clients, d.clientId), d.name, d.category, d.description, d.date, d.status, d.relatedProject]),
    ),
  });

  files.push({
    name: "databases/Finance.csv",
    content: toCSV(
      ["Cliente", "Data", "Tipo", "Valor", "Categoria", "Descrição", "Status", "Vencimento", "Data de pagamento"],
      finance.map((f) => [clientName(clients, f.clientId), f.date, f.type, f.amount, f.category, f.description, f.status, f.dueDate, f.paidDate]),
    ),
  });

  // ---- Páginas por cliente --------------------------------------------------
  for (const client of clients) {
    const folder = `clients/${slugify(client.name)}`;
    const clientContent = content.filter((c) => c.clientId === client.id);

    files.push({
      name: `${folder}/Cliente.md`,
      content: `# ${client.name}

> ${client.packageName || "Espaço do cliente"} · Status: **${client.status}**

## Contato
- **Contato:** ${client.contactName || "—"}
- **E-mail:** ${client.email || "—"}
- **Telefone:** ${client.phone || "—"}
- **Site:** ${client.website || "—"}
- **Segmento:** ${client.industry || "—"}
- **Cliente desde:** ${client.startDate || "—"}

## Perfis sociais
${bulletList(Object.entries(client.socials).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`))}

## Estratégia
${client.strategy.map((s) => `### ${s.title}\n${bulletList(s.items)}`).join("\n\n") || "—"}

## Indicadores
| Indicador | Linha de base | Meta | Real | Prazo |
| --- | --- | --- | --- | --- |
${client.kpis.map((k) => `| ${k.name} | ${k.baseline} | ${k.target} | ${k.actual} | ${k.deadline} |`).join("\n") || "| — | — | — | — | — |"}

## Observações internas (somente para o gestor)
${client.notes || "—"}
`,
    });

    files.push({
      name: `${folder}/Calendário de Conteúdo.md`,
      content: `# ${client.name} — Calendário de conteúdo

| Data | Plataforma | Formato | Tema | Status |
| --- | --- | --- | --- | --- |
${clientContent.map((c) => `| ${c.date} | ${c.platform} | ${c.format} | ${c.topic} | ${c.status} |`).join("\n") || "| — | — | — | — | — |"}
`,
    });

    const clientRequests = requests.filter((r) => r.clientId === client.id);
    files.push({
      name: `${folder}/Solicitações.md`,
      content: `# ${client.name} — Solicitações

${clientRequests.map((r) => `- **${r.title}** (${r.category}, ${r.priority}) — ${r.status}, prazo ${r.dueDate}${r.comments ? ` — ${r.comments}` : ""}`).join("\n") || "- Nenhuma solicitação em aberto."}
`,
    });

    const clientFiles = deliverables.filter((d) => d.clientId === client.id);
    files.push({
      name: `${folder}/Arquivos e Entregas.md`,
      content: `# ${client.name} — Arquivos e entregas

${clientFiles.map((d) => `- **${d.name}** (${d.category}) — ${d.status}, ${d.date}${d.description ? ` — ${d.description}` : ""}`).join("\n") || "- Nada compartilhado ainda."}
`,
    });
  }

  // ---- Páginas compartilhadas -----------------------------------------------
  files.push({
    name: "Reuniões.md",
    content: `# Reuniões — todos os clientes

${meetings
  .slice()
  .sort((a, b) => a.date.localeCompare(b.date))
  .map((m) => `- **${m.date} ${m.time}** — ${m.title} (${clientName(clients, m.clientId)}) — ${m.status}${m.actionItems ? ` · Ações: ${m.actionItems}` : ""}`)
  .join("\n") || "- Nenhuma reunião registrada."}
`,
  });

  files.push({
    name: "README.md",
    content: `# ${profile.agency || "Espaço do gestor"} — pacote para importar no Notion

Gerado em ${new Date().toISOString().slice(0, 10)} pelo Contentplane.

## Como importar
1. No Notion: **Workspace → Import → CSV** para cada arquivo em \`databases/\` — cada um vira uma base.
2. Crie uma página para cada arquivo markdown; as pastas \`clients/<nome>/\` correspondem a um conjunto de páginas por cliente.
3. Ligue as páginas com menções \`@\` e agrupe a base **Content** por Status para ter um quadro de aprovações.

## O que vem aqui
- \`databases/\` — Clientes, Conteúdo, Tarefas, Solicitações, Reuniões, Entregas e Financeiro (CSV).
- \`clients/<nome>/\` — um conjunto de páginas por cliente: Cliente (estratégia + indicadores), Calendário de Conteúdo, Solicitações, Arquivos e Entregas.
- \`Reuniões.md\` — todas as reuniões de clientes em uma linha do tempo.

## Aviso de privacidade
**Finance.csv**, as tabelas de indicadores e as observações "somente para o gestor" são de uso
interno do negócio. Remova-os antes de compartilhar a pasta de um cliente com o próprio cliente.
`,
  });

  return files;
}

function clientName(clients: ClientRecord[], id: string): string {
  return clients.find((c) => c.id === id)?.name ?? "";
}
