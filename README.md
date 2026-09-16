# Contentplane — Social Media Manager OS

A complete operating system for social media managers, freelancers, agencies, and content teams: a **28-sheet Manager Workbook**, a **client portal**, and a **Notion-compatible export package**, all sharing one information architecture.

> Original product. No affiliation with, or copying of, any existing tool, marketplace listing, or brand.

---

## What's inside

| Surface | Where | What it does |
| --- | --- | --- |
| **Client Portal** | `/app/dashboard` (after sign-in) | The client-facing workspace: Dashboard, Onboarding, Strategy, Calendar, Approvals, Files, Performance, Requests, Meetings, Settings. |
| **Manager Workbook** | `/workbook` | The 28-worksheet manager system with formulas, dropdowns, and status formatting — viewable in-app, exportable to CSV. |
| **Notion package** | Portal → Dashboard → "Notion package" | Markdown pages + CSV databases that import into Notion and mirror the portal. |
| **Data tools** | Portal → Settings | JSON export/import, demo data, reset. |

## The information architecture

```
Client
 → Strategy        (objectives, audience, pillars, voice, KPIs)
 → Content         (idea → draft → review → approval → schedule → publish)
    → Approval     (client decision + comments, captured per piece)
    → Publication  (platform + date)
    → Performance  (monthly platform metrics, per-content results)
 → Requests        (new → in progress → waiting → completed → closed)
 → Deliverables    (files, tied to content & projects)
 → Meetings        (agenda → notes → action items)

Finance → Client → Revenue / Expenses
```

Every surface (workbook, portal, Notion) is a view of this same model, so data is
entered once and referenced everywhere.

## The 28 worksheets

1. **Setup** — client config, package, service period
2. **Brand** — voice, audience, pillars, visual direction
3. **Goals** — KPI framework with computed progress
4. **Dashboard** — live cross-sheet metric summary
5. **Year** — 12-month campaign overview
6–17. **Jan … Dec** — monthly content calendars (13 columns, status dropdowns, demo rows)
18. **Weekly** — day-by-day execution plan
19. **Brain Dump** — idea capture database
20. **Content Plan** — the operational core (18 columns, idea → published)
21. **Tasks** — project & task management with dependencies
22. **30 Day** — account relaunch planner
23. **Feed Preview** — Instagram-style grid planning
24. **Hashtags** — research & set management
25. **Collabs** — partnership tracker
26. **Finance** — revenue/expense ledger
27. **Platform Analytics** — monthly platform metrics
28. **Content Analytics** — per-content performance

The Dashboard sheet computes from the other sheets (`COUNTIF`/`SUM`/`AVERAGE`
references to Content Plan, Tasks, Platform Analytics, Content Analytics) and the
in-app viewer renders those formulas live, tints status cells, and marks
dropdown-validated columns with ▾.

## How the web portal works

- **Stack:** React + Vite + Tailwind + shadcn/ui, no backend required for the
  portal data — state persists in `localStorage` (`contentplane.portal.v1`).
- **Auth:** Convex auth protects `/app/*` and `/workbook`. The public landing page
  links into the auth flow; after sign-in you land on `/app/dashboard`.
- **Demo data:** loads automatically the first time (fictional client "Northwind
  Coffee Roasters"). Reset or reload it any time from Settings.
- **CRUD:** content, requests, meetings, and files support add/edit/delete via
  modal forms; statuses change inline; everything persists between sessions.
- **Exports:**
  - *Export data (JSON)* — full workspace backup (Settings).
  - *Import backup* — restore from a JSON file (Settings).
  - *Notion package* — markdown + CSV downloads (Dashboard header).
  - *Sheet CSV / All CSVs* — workbook exports (Workbook page).

## Notion import (short version)

1. Download the package from the portal Dashboard ("Notion package").
2. In Notion: **Workspace → Import → CSV** for each file in `databases/`.
3. Create pages from the markdown files, under one parent page.
4. Link pages with `[[mentions]]`, group the Content database by Status for the
   approvals board.

Full instructions ship inside the package's `README.md`.

## Verification checklist

- [x] All 28 worksheets exist and are populated
- [x] Dashboard formulas reference source sheets
- [x] Dropdown/validation columns marked and enforced in portal forms
- [x] Monthly sheets share one consistent structure
- [x] Analytics sheets support realistic multi-month data
- [x] Portal navigation, forms, filters, and search work
- [x] Data persists between browser sessions (localStorage)
- [x] JSON export/import + demo data loader
- [x] Responsive layouts (mobile sidebar, fluid grids)
- [x] Notion package mirrors the portal architecture
- [x] Original branding and copy only

## Development

```bash
bun install
bun tsc -b --noEmit   # typecheck
```

The platform runs the dev server and Convex process automatically; push to
deploy.
