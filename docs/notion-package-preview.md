# Notion package — what gets exported

Clicking **Notion package** on the portal Dashboard downloads the markdown pages
and CSV databases below (named after your client, e.g. `northwind-coffee-roasters/`).

```
<client-slug>/
├── README.md                 ← setup + import instructions
├── Dashboard.md              ← snapshot, upcoming content, quick links
├── Strategy.md               ← objectives, audience, pillars, voice, KPIs
├── Content Calendar.md       ← board-view guidance for the Content database
├── Approvals.md              ← how the client acts on In Review items
├── Files & Deliverables.md   ← links the Deliverables database
├── Performance.md            ← KPI summary + Performance database
├── Requests.md               ← request workflow reference
├── Meetings.md               ← meetings + action items reference
├── Client Onboarding.md      ← onboarding checklist with responses
└── databases/
    ├── Content.csv           ← ID, date, platform, format, pillar, topic,
    │                            caption, status, client comments, manager notes
    ├── Deliverables.csv      ← file, category, description, date, status,
    │                            related content, related project
    ├── Meetings.csv          ← date, time, meeting, agenda, participants,
    │                            status, notes, action items
    ├── Onboarding.csv        ← step, response
    ├── Performance.csv       ← month, platform, followers, reach,
    │                            engagement, clicks
    ├── Requests.csv          ← ID, title, category, priority, submitted,
    │                            status, assigned to, due date, comments
    └── Strategy.csv          ← section, item
```

## Importing into Notion

1. **Import the CSVs** — Notion → Workspace → Import → CSV. Each file becomes a
   database; Notion auto-detects dates, numbers, and select-like text.
2. **Create the pages** — paste (or import) each markdown file as a page under a
   top-level page named after your client.
3. **Connect everything** — on `Dashboard.md`, the `[[Page]]` links become Notion
   page mentions; add relations between databases:
   - Content ↔ Performance via `Month`
   - Requests ↔ Deliverables via `Related project`
   - Meetings → action items tracked in `Notes`/`Action items`
4. **Build the approval board** — on the Content database, add a board view
   grouped by **Status**. `In Review` = needs client decision.
5. **Add calendar views** — Content database: calendar by **Date**, board by
   **Platform**.

## Why it mirrors the portal

The export is generated from the exact same data model the portal renders
(`src/data/types.ts`), so statuses, categories, and IDs match 1:1. Content IDs
(`C-101…`) match the portal and the workbook's Content Plan sheet.
