# Contentplane — Social Media Manager OS

A complete operating system for **independent social media managers and boutique agencies**: a
manager workspace for your whole book of business (clients, calendars, tasks, approvals, money),
a 29-sheet manager workbook, and a Notion-compatible export — all sharing one information
architecture.

> Original product. No affiliation with, or copying of, any existing tool, marketplace listing, or brand.

## Who it's for

Contentplane is a **single-seat product**: the social media manager signs in and manages many
clients. Clients are records you create — with company data, social handles, package, monthly fee
and a private notes space — not user accounts. All data lives in **your** Convex account, scoped by
`ownerId`, so it follows you between devices and no client can access the workspace.

## What's inside

| Surface | Where | What it does |
| --- | --- | --- |
| **Manager workspace** | `/app/dashboard` (after sign-in) | Clients, strategy, onboarding, calendar, tasks, approvals, requests, finance, meetings, files, settings. |
| **Manager Workbook** | `/workbook` | 29 worksheets with formulas, dropdowns and status formats — viewable in-app, exportable to CSV. |
| **Notion package** | Settings → "Notion package" | One page set per client + shared databases (Clients, Content, Tasks, Requests, Meetings, Deliverables, Finance). |
| **Data tools** | Settings | JSON export/import, demo workspace (4 fictional clients), reset. |

## The information architecture

```
Manager (you)
 → Clients            (roster: company, contacts, package, fee, status, notes)
    → Strategy        (objectives, audience, pillars, voice, KPIs per client)
    → Content         (idea → draft → review → approval → schedule → publish)
    → Tasks           (everything around the content, per client)
    → Requests        (intake → in progress → waiting → completed)
    → Meetings        (agenda → notes → action items)
    → Deliverables    (files tied to content & projects)
 → Finance            (income & expenses, optionally tagged per client)
```

Every surface (workspace, workbook, Notion) is a view of this same model, so data is entered once
and referenced everywhere.

## The manager workspace

- **Dashboard** — active clients, approvals waiting, open/overdue tasks, income, expenses, net,
  posts planned, next-7-days agenda and a per-client table (planned, published, open tasks, net).
- **Clients** — the roster. Add/edit clients with company data, social handles, package, fee,
  status (Active / Paused / Prospect / Archived) and free-form notes. Deleting a client removes
  their content, tasks, requests, meetings, deliverables and finance rows.
- **Calendar & Approvals** — content pipeline across all clients, filterable per client, with the
  Idea → Published workflow.
- **Tasks** — cross-client task board with priority, due dates and overdue tracking.
- **Finance** — income & expenses with category, payment status, due/paid dates; monthly totals
  and pending amounts roll up to the dashboard.
- **Meetings, Files, Strategy, Onboarding, Settings** — per-client records and workspace tools.

Everything is reactive: each section is a live Convex query scoped to the signed-in manager.

## The 29 worksheets

1. **Setup** — manager profile + live totals (`COUNTIF`/`SUMIF` reading the Clients sheet)
2. **Clients** — the roster: contact, package, monthly fee, status, social handles, notes
3. **Brand** — brand reference (duplicate per client when needed)
4. **Goals** — KPI framework with computed progress
5. **Dashboard** — live business snapshot from Clients, Content Plan, Tasks and Finance
6. **Year** — 12-month campaign overview
7–18. **Jan … Dec** — monthly calendars with a **Client** column and status dropdowns
19. **Weekly** — week-at-a-glance plan with Client column
20. **Brain Dump** — idea capture
21. **Content Plan** — the operational core (18 columns, per-client rows)
22. **Tasks** — task management with Client, dependencies and priorities
23. **30 Day** — account relaunch planner
24. **Feed Preview** — feed planning per client
25. **Hashtags** — research & set management
26. **Collabs** — partnership tracker
27. **Finance** — revenue/expense ledger feeding the Dashboard
28. **Client Reports** — monthly planned vs delivered, on-time rate, flagged pieces, billed
29. **Service Log** — what went out per client (delivery record, no social metrics)

The Dashboard sheet computes from the other sheets (`COUNTIF`/`SUMIF` references to Clients,
Content Plan, Tasks and Finance), and the in-app viewer renders those formulas live, tints status
cells, and marks dropdown-validated columns with ▾.

**Deliberately removed:** the old Platform Analytics and Content Analytics sheets (followers,
reach, impressions, engagement). The app has no social platform API connections, so the workbook
only tracks what the manager actually controls — delivery, approvals and money.

## How the web app works

- **Stack:** React + Vite + Tailwind + shadcn/ui. All workspace data lives in **Convex**, scoped to
  the signed-in manager (`ownerId` on every table); writes go through authenticated mutations.
- **Auth:** Convex auth protects `/app/*` and `/workbook`. After sign-in you land on `/app/dashboard`.
- **Demo data:** Settings → "Load demo data" seeds four fictional clients (Northwind Coffee
  Roasters, Hale & Harbor Interiors, Bloomly Skincare, Vela Fitness Studio) with content, tasks,
  meetings and finances spread around today's date.
- **CRUD:** clients, content, tasks, requests, meetings, deliverables and finance support
  add/edit/delete; statuses change inline; everything persists in your account.
- **Exports:** JSON backup (Settings), per-client Notion package (Settings), CSV per sheet or all
  sheets (Workbook page).

## Notion import (short version)

1. Download the package from **Settings → Notion package**.
2. In Notion: **Workspace → Import → CSV** for each file in `databases/`.
3. Create pages from the markdown files under one parent — `clients/<name>/` folders map to one
   page set per client.
4. Link pages with `@` mentions and group the Content database by Status for an approvals board.

`Finance.csv`, the KPI tables and the "manager only" notes are business-internal — remove them
before sharing a client folder with the client.

## Verification checklist

- [x] Manager workspace with client roster, per-client records and finance
- [x] Workbook: 29 sheets, no ragged rows, dropdown values always valid
- [x] Dashboard formulas reference the correct source columns
- [x] No social metric columns anywhere (followers/reach removed by design)
- [x] Convex tables scoped by `ownerId`; deletes cascade per client
- [x] Portal navigation, forms, filters and search work
- [x] JSON export/import + demo workspace loader
- [x] Responsive layouts (mobile sidebar, fluid grids)
- [x] Notion package mirrors the workspace, per client
- [x] Original branding and copy only

## Development

```bash
bun install
bun convex dev --once   # regenerate Convex types / push functions
bun tsc -b --noEmit     # typecheck
bun test                # data-layer regression tests (workbook + Notion export)
```

The platform runs the dev server and Convex process automatically; push to deploy.
