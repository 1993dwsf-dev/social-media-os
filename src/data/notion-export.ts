// Notion-compatible export package.
// Generates markdown pages + CSV databases that mirror the portal's
// information architecture, ready for Notion's "Import" flow.

import type { PortalState } from "./types";

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

function monthLabel(iso: string): string {
  const date = new Date(`${iso}-01T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function buildNotionPackage(state: PortalState) {
  const slug = state.client.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "client";

  // ---- Databases (CSV) -----------------------------------------------------
  const contentCSV = toCSV(
    ["Content ID", "Date", "Platform", "Format", "Pillar", "Topic", "Caption", "Status", "Client comments", "Manager notes"],
    state.content.map((c) => [
      c.id, c.date, c.platform, c.format, c.pillar, c.topic, c.caption, c.status, c.clientComments, c.managerNotes,
    ]),
  );

  const deliverablesCSV = toCSV(
    ["File name", "Category", "Description", "Date", "Status", "Related content", "Related project"],
    state.deliverables.map((d) => [
      d.name, d.category, d.description, d.date, d.status, d.relatedContent, d.relatedProject,
    ]),
  );

  const meetingsCSV = toCSV(
    ["Date", "Time", "Meeting", "Agenda", "Participants", "Status", "Notes", "Action items"],
    state.meetings.map((m) => [
      m.date, m.time, m.title, m.agenda, m.participants, m.status, m.notes, m.actionItems,
    ]),
  );

  const requestsCSV = toCSV(
    ["Request ID", "Title", "Category", "Priority", "Submitted", "Status", "Assigned to", "Due date", "Comments"],
    state.requests.map((r) => [
      r.id, r.title, r.category, r.priority, r.dateSubmitted, r.status, r.assignedTo, r.dueDate, r.comments,
    ]),
  );

  const performanceCSV = toCSV(
    ["Month", "Platform", "Followers", "Reach", "Engagement", "Clicks"],
    state.metrics.map((m) => [m.month, m.platform, m.followers, m.reach, m.engagement, m.clicks]),
  );

  const onboardingCSV = toCSV(
    ["Step", "Response"],
    Object.entries(state.onboarding).map(([step, response]) => [step, response]),
  );

  const strategyCSV = toCSV(
    ["Section", "Item"],
    state.strategy.flatMap((s) => s.items.map((item) => [s.title, item])),
  );

  // ---- Pages (Markdown) ----------------------------------------------------
  const dashboardMD = `# ${state.client.name} — Client Dashboard

> ${state.client.tagline || "Client portal dashboard"}

## Snapshot
- **Pending approvals:** ${state.content.filter((c) => c.status === "In Review" || c.status === "Changes Requested").length}
- **Open requests:** ${state.requests.filter((r) => r.status !== "Completed" && r.status !== "Closed").length}
- **Upcoming meetings:** ${state.meetings.filter((m) => m.status === "Scheduled").length}
- **Content in pipeline:** ${state.content.filter((c) => c.status !== "Published").length}

## Upcoming content
${state.content
  .filter((c) => c.status !== "Published")
  .slice(0, 8)
  .map((c) => `- ${c.date} — **${c.topic}** (${c.platform}, ${c.format}) — ${c.status}`)
  .join("\n") || "- Nothing scheduled yet."}

## Quick links
- [[Strategy]]
- [[Content Calendar]]
- [[Approvals]]
- [[Performance]]
`;

  const strategyMD = `# Strategy
${state.strategy
  .map((s) => `\n## ${s.title}\n${s.items.map((i) => `- ${i}`).join("\n")}`)
  .join("\n")}
`;

  const calendarMD = `# Content Calendar
See the **Content** database below for the full calendar. Views:
- **By month** — group by Date
- **By platform** — board grouped by Platform
- **By status** — board grouped by Status (Idea → Published)
`;

  const approvalsMD = `# Approvals
Board view of the **Content** database grouped by Status.
- Items in **In Review** need your decision.
- Comment directly on the item, then move it to **Approved** or **Changes Requested**.
`;

  const filesMD = `# Files & Deliverables
See the **Deliverables** database. Categories: Brand assets · Graphics · Videos · Reports · Documents · Final deliverables.
`;

  const performanceMD = `# Performance
See the **Performance** database (monthly metrics per platform).
${state.kpis.map((k) => `- **${k.name}:** ${k.actual} / target ${k.target}`).join("\n")}
`;

  const requestsMD = `# Requests
See the **Requests** database. Statuses: New → In Progress → Waiting → Completed → Closed.
`;

  const meetingsMD = `# Meetings
See the **Meetings** database. Each meeting keeps agenda, notes, and action items.
`;

  const onboardingMD = `# Client Onboarding
Import the **Onboarding** database and tick steps off as they're completed.

| Step | Response |
| --- | --- |
${Object.entries(state.onboarding)
  .map(([step, response]) => `| ${step} | ${response.replace(/\n/g, " ")} |`)
  .join("\n")}
`;

  // ---- README --------------------------------------------------------------
  const readme = `# ${state.client.name} — Notion portal package

This package was exported from **Contentplane**. It contains markdown pages and
CSV databases that mirror the web portal 1:1.

## Import instructions
1. In Notion, go to **Workspace → Import** and choose the CSV files. Each becomes
   a Notion database with typed properties (dates, selects, numbers).
2. Create the pages from the included markdown files (paste or import as Markdown)
   and arrange them under one top-level page: **"${state.client.name} Portal"**.
3. On the Dashboard page, use \`[[Page]]\` mentions to link to the imported pages.
4. In the Content database, group by **Status** for the approvals board and by
   **Platform** for the calendar board.
5. Use Notion relations to connect: Content → Performance (via Month),
   Requests → Deliverables (via Related project), Meetings → Action items (Notes).

## Databases included
- Content — the shared content + approval pipeline
- Deliverables — files shared with the client
- Meetings — agenda, notes, action items
- Onboarding — onboarding checklist with responses
- Performance — monthly platform metrics
- Requests — client request center
- Strategy — strategy items by section

## Pages included
Dashboard · Strategy · Content Calendar · Approvals · Files & Deliverables ·
Performance · Requests · Meetings · Client Onboarding

---
Generated ${new Date().toISOString().slice(0, 10)} by Contentplane.
`;

  const files: { name: string; content: string }[] = [
    { name: `${slug}/README.md`, content: readme },
    { name: `${slug}/Dashboard.md`, content: dashboardMD },
    { name: `${slug}/Strategy.md`, content: strategyMD },
    { name: `${slug}/Content Calendar.md`, content: calendarMD },
    { name: `${slug}/Approvals.md`, content: approvalsMD },
    { name: `${slug}/Files & Deliverables.md`, content: filesMD },
    { name: `${slug}/Performance.md`, content: performanceMD },
    { name: `${slug}/Requests.md`, content: requestsMD },
    { name: `${slug}/Meetings.md`, content: meetingsMD },
    { name: `${slug}/Client Onboarding.md`, content: onboardingMD },
    { name: `${slug}/databases/Content.csv`, content: contentCSV },
    { name: `${slug}/databases/Deliverables.csv`, content: deliverablesCSV },
    { name: `${slug}/databases/Meetings.csv`, content: meetingsCSV },
    { name: `${slug}/databases/Onboarding.csv`, content: onboardingCSV },
    { name: `${slug}/databases/Performance.csv`, content: performanceCSV },
    { name: `${slug}/databases/Requests.csv`, content: requestsCSV },
    { name: `${slug}/databases/Strategy.csv`, content: strategyCSV },
  ];

  return { files, slug };
}

/** Export the whole Notion package as sequential file downloads (no ZIP dep). */
export function exportNotionPackage(state: PortalState) {
  const { files } = buildNotionPackage(state);
  files.forEach((f, i) => {
    setTimeout(() => {
      const isCSV = f.name.endsWith(".csv");
      download(
        f.name.split("/").slice(-1)[0],
        f.content,
        isCSV ? "text/csv;charset=utf-8" : "text/markdown;charset=utf-8",
      );
    }, i * 250);
  });
}

/** Expose latest-month helper for dashboards. */
export function latestMonth(state: PortalState): string {
  return [...new Set(state.metrics.map((m) => m.month))].sort().slice(-1)[0] ?? "";
}

export { monthLabel };
