# Notion package — what gets exported

Clicking **Notion package** on the portal Dashboard (or in Settings) downloads the
markdown pages and CSV databases below, generated from the same data model the portal
renders, so statuses, categories and client names match 1:1.

```
README.md                     ← how to import + privacy note
Meetings.md                   ← every client's meetings in one timeline
databases/
├── Clients.csv               ← Client, Contact, Email, Phone, Website, Industry,
│                                Package, Monthly fee, Start date, Status,
│                                Instagram, TikTok, LinkedIn, YouTube, Facebook,
│                                Pinterest, Other, Notes
├── Content.csv               ← Client, Date, Platform, Format, Pillar, Topic, Status
├── Tasks.csv                 ← Client, Task, Project, Category, Priority, Status,
│                                Start date, Due date, Notes
├── Requests.csv              ← Client, Request, Category, Priority, Submitted,
│                                Status, Assigned to, Due date, Comments
├── Meetings.csv              ← Client, Date, Time, Meeting, Agenda, Participants,
│                                Status, Notes, Action items
├── Deliverables.csv          ← Client, File name, Category, Description, Date,
│                                Status, Related project
└── Finance.csv               ← Client, Date, Type, Amount, Category, Description,
                                 Status, Due date, Paid date
clients/<client-slug>/
├── Client.md                 ← contact, social accounts, strategy, KPIs,
│                                internal notes (manager only)
├── Content Calendar.md       ← that client's content rows
├── Requests.md               ← that client's requests
└── Files & Deliverables.md   ← that client's files
```

One page set is generated per client, using the client's slug as the folder name
(e.g. `northwind-coffee-roasters/`).

## Importing into Notion

1. **Import the CSVs** — Notion → Workspace → Import → CSV. Each file becomes a
   database; Notion auto-detects dates, numbers, and select-like text.
2. **Create the pages** — paste (or import) each markdown file as a page under a
   top-level page named after your client.
3. **Connect everything** — `Clients` is the parent database; add relations from
   `Content`, `Tasks`, `Requests`, `Meetings`, `Deliverables` and `Finance` back to
   it via their `Client` column, and a `Content ↔ Deliverables` relation through
   `Related project`.
4. **Build the approval board** — on the `Content` database add a board view grouped
   by **Status**. `In Review` = needs a decision; `Changes Requested` = rework.
5. **Add calendar views** — `Content` database: calendar by **Date**, board by
   **Platform**.

## Privacy note

`Finance.csv` and the KPI tables plus the "internal notes (manager only)" section of
`Client.md` are business-internal. Remove them before sharing a client folder with the
client. The package never contains social-platform metrics — the workspace has no
platform API connections, so it only tracks what the manager controls (delivery,
approvals and money).
