// Notion-compatible export package for the manager workspace.
//
// One markdown page set per client plus shared databases (Tasks, Meetings,
// Finance), so a manager can hand each client their own Notion pages with
// strategy, content, requests and deliverables — while the business view
// (finance, full task board) stays clearly marked as manager-only.

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
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "client";
}

function bulletList(items: string[]): string {
  return items.length > 0 ? items.map((i) => `- ${i}`).join("\n") : "- —";
}

/** Export the whole Notion package as sequential file downloads (no ZIP dep). */
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

  // ---- Shared databases -----------------------------------------------------
  files.push({
    name: "databases/Clients.csv",
    content: toCSV(
      ["Client", "Contact", "Email", "Phone", "Website", "Industry", "Package", "Monthly fee", "Start date", "Status", "Instagram", "TikTok", "LinkedIn", "YouTube", "Facebook", "Pinterest", "Other", "Notes"],
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
      ["Client", "Date", "Platform", "Format", "Pillar", "Topic", "Status"],
      content.map((c) => [clientName(clients, c.clientId), c.date, c.platform, c.format, c.pillar ?? "", c.topic, c.status]),
    ),
  });

  files.push({
    name: "databases/Tasks.csv",
    content: toCSV(
      ["Client", "Task", "Project", "Category", "Priority", "Status", "Start date", "Due date", "Notes"],
      tasks.map((t) => [clientName(clients, t.clientId), t.title, t.project, t.category, t.priority, t.status, t.startDate, t.dueDate, t.notes]),
    ),
  });

  files.push({
    name: "databases/Requests.csv",
    content: toCSV(
      ["Client", "Request", "Category", "Priority", "Submitted", "Status", "Assigned to", "Due date", "Comments"],
      requests.map((r) => [clientName(clients, r.clientId), r.title, r.category, r.priority, r.dateSubmitted, r.status, r.assignedTo, r.dueDate, r.comments]),
    ),
  });

  files.push({
    name: "databases/Meetings.csv",
    content: toCSV(
      ["Client", "Date", "Time", "Meeting", "Agenda", "Participants", "Status", "Notes", "Action items"],
      meetings.map((m) => [clientName(clients, m.clientId), m.date, m.time, m.title, m.agenda, m.participants, m.status, m.notes, m.actionItems]),
    ),
  });

  files.push({
    name: "databases/Deliverables.csv",
    content: toCSV(
      ["Client", "File name", "Category", "Description", "Date", "Status", "Related project"],
      deliverables.map((d) => [clientName(clients, d.clientId), d.name, d.category, d.description, d.date, d.status, d.relatedProject]),
    ),
  });

  files.push({
    name: "databases/Finance.csv",
    content: toCSV(
      ["Client", "Date", "Type", "Amount", "Category", "Description", "Status", "Due date", "Paid date"],
      finance.map((f) => [clientName(clients, f.clientId), f.date, f.type, f.amount, f.category, f.description, f.status, f.dueDate, f.paidDate]),
    ),
  });

  // ---- Per-client pages -----------------------------------------------------
  for (const client of clients) {
    const folder = `clients/${slugify(client.name)}`;
    const clientContent = content.filter((c) => c.clientId === client.id);

    files.push({
      name: `${folder}/Client.md`,
      content: `# ${client.name}

> ${client.packageName || "Client workspace"} · Status: **${client.status}**

## Contact
- **Contact:** ${client.contactName || "—"}
- **Email:** ${client.email || "—"}
- **Phone:** ${client.phone || "—"}
- **Website:** ${client.website || "—"}
- **Industry:** ${client.industry || "—"}
- **Client since:** ${client.startDate || "—"}

## Social accounts
${bulletList(Object.entries(client.socials).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`))}

## Strategy
${client.strategy.map((s) => `### ${s.title}\n${bulletList(s.items)}`).join("\n\n") || "—"}

## KPIs
| KPI | Baseline | Target | Actual | Deadline |
| --- | --- | --- | --- | --- |
${client.kpis.map((k) => `| ${k.name} | ${k.baseline} | ${k.target} | ${k.actual} | ${k.deadline} |`).join("\n") || "| — | — | — | — | — |"}

## Internal notes (manager only)
${client.notes || "—"}
`,
    });

    files.push({
      name: `${folder}/Content Calendar.md`,
      content: `# ${client.name} — Content calendar

| Date | Platform | Format | Topic | Status |
| --- | --- | --- | --- | --- |
${clientContent.map((c) => `| ${c.date} | ${c.platform} | ${c.format} | ${c.topic} | ${c.status} |`).join("\n") || "| — | — | — | — | — |"}
`,
    });

    const clientRequests = requests.filter((r) => r.clientId === client.id);
    files.push({
      name: `${folder}/Requests.md`,
      content: `# ${client.name} — Requests

${clientRequests.map((r) => `- **${r.title}** (${r.category}, ${r.priority}) — ${r.status}, due ${r.dueDate}${r.comments ? ` — ${r.comments}` : ""}`).join("\n") || "- No open requests."}
`,
    });

    const clientFiles = deliverables.filter((d) => d.clientId === client.id);
    files.push({
      name: `${folder}/Files & Deliverables.md`,
      content: `# ${client.name} — Files & deliverables

${clientFiles.map((d) => `- **${d.name}** (${d.category}) — ${d.status}, ${d.date}${d.description ? ` — ${d.description}` : ""}`).join("\n") || "- Nothing shared yet."}
`,
    });
  }

  // ---- Shared pages ---------------------------------------------------------
  files.push({
    name: "Meetings.md",
    content: `# Meetings — all clients

${meetings
  .slice()
  .sort((a, b) => a.date.localeCompare(b.date))
  .map((m) => `- **${m.date} ${m.time}** — ${m.title} (${clientName(clients, m.clientId)}) — ${m.status}${m.actionItems ? ` · Actions: ${m.actionItems}` : ""}`)
  .join("\n") || "- No meetings logged."}
`,
  });

  files.push({
    name: "README.md",
    content: `# ${profile.agency || "Manager workspace"} — Notion import package

Generated ${new Date().toISOString().slice(0, 10)} from Contentplane.

## How to import
1. In Notion: **Workspace → Import → CSV** for each file in \`databases/\` — each becomes a database.
2. Create a page per markdown file; the \`clients/<name>/\` folders map to one page set per client.
3. Link pages with \`@\` mentions, and group the **Content** database by Status for an approvals board.

## What's inside
- \`databases/\` — Clients, Content, Tasks, Requests, Meetings, Deliverables, Finance (CSV).
- \`clients/<name>/\` — one page set per client: Client (strategy + KPIs), Content Calendar, Requests, Files & Deliverables.
- \`Meetings.md\` — all client meetings in one timeline.

## Privacy note
**Finance.csv**, the KPI tables and the "manager only" notes are business-internal. Remove them
before sharing a client folder with the client.
`,
  });

  return files;
}

function clientName(clients: ClientRecord[], id: string): string {
  return clients.find((c) => c.id === id)?.name ?? "";
}
