// Targeted regression tests for the Contentplane manager workspace data layer:
// the 28-sheet workbook engine and the multi-client Notion export package.
//
// Run with: bun test

import { describe, expect, test } from "bun:test";

import { buildNotionFiles } from "../src/data/notion-export";
import { buildWorkbookSheets, toCSV } from "../src/data/workbook";
import type { SheetDef } from "../src/data/workbook";
import type { ClientRecord, ContentItem } from "../src/data/types";

const REQUIRED_SHEET_NAMES = [
  "Setup",
  "Clients",
  "Brand",
  "Goals",
  "Dashboard",
  "Year",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Weekly",
  "Brain Dump",
  "Content Plan",
  "Tasks",
  "30 Day",
  "Feed Preview",
  "Hashtags",
  "Collabs",
  "Finance",
  "Client Reports",
  "Service Log",
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const sheets = buildWorkbookSheets();
const sheetNames = sheets.map((s) => s.name);

function byName(name: string): SheetDef {
  const sheet = sheets.find((s) => s.name === name);
  if (!sheet) throw new Error(`Sheet "${name}" is missing from the workbook`);
  return sheet;
}

/** Minimal CSV parser (handles quotes, escaped quotes, commas). */
function parseCSV(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    if (inQuotes) {
      if (ch === '"') {
        if (csv[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

describe("workbook: 29 sheets for the manager workspace", () => {
  test("contains the manager sheet set, in order", () => {
    expect(sheetNames).toEqual(REQUIRED_SHEET_NAMES);
  });

  test("sheet ids are unique and every sheet is populated and documented", () => {
    const ids = sheets.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const sheet of sheets) {
      expect(sheet.description.length).toBeGreaterThan(20);
      expect(sheet.columns.length).toBeGreaterThanOrEqual(2);
      expect(sheet.rows.length).toBeGreaterThan(0);
    }
  });

  test("no ragged rows (every row matches its column count)", () => {
    const ragged: string[] = [];
    for (const sheet of sheets) {
      sheet.rows.forEach((row, i) => {
        if (row.length !== sheet.columns.length) {
          ragged.push(`${sheet.name} row ${i + 2}: ${row.length} cells vs ${sheet.columns.length} columns`);
        }
      });
    }
    expect(ragged).toEqual([]);
  });

  test("clients sheet holds a roster with fees and statuses", () => {
    const clients = byName("Clients");
    const names = clients.rows.map((r) => String(r[0]));
    expect(names).toContain("Northwind Coffee Roasters");
    expect(names).toContain("Vela Fitness Studio");
    const statusIndex = clients.columns.findIndex((c) => c.name === "Status");
    const statuses = clients.rows.map((r) => String(r[statusIndex]));
    expect(statuses).toContain("Active");
    expect(statuses).toContain("Prospect");
  });

  test("monthly calendars carry a Client column and stay consistent", () => {
    const shapes = MONTHS.map((m) => byName(m).columns.map((c) => c.name));
    for (const shape of shapes) {
      expect(shape).toEqual(shapes[0]);
      expect(shape).toContain("Client");
      expect(shape).toContain("Approval status");
      expect(shape).toContain("Publication status");
    }
    for (const m of MONTHS) {
      expect(byName(m).rows.length).toBeGreaterThan(0);
    }
  });

  test("dropdown (select) values all come from the declared option lists", () => {
    const violations: string[] = [];
    for (const sheet of sheets) {
      sheet.columns.forEach((col, colIndex) => {
        if (col.type !== "select" || !col.options?.length) return;
        sheet.rows.forEach((row, rowIndex) => {
          const value = row[colIndex];
          if (value === undefined || value === "" || value === "—") return;
          if (!col.options!.includes(String(value))) {
            violations.push(`${sheet.name}!${col.name} row ${rowIndex + 2}: "${value}"`);
          }
        });
      });
    }
    expect(violations).toEqual([]);
  });

  test("dashboard formulas compute from Clients, Content Plan, Tasks and Finance", () => {
    const formulas = byName("Dashboard")
      .rows.flat()
      .filter((v): v is string => typeof v === "string" && v.startsWith("="));
    expect(formulas.length).toBeGreaterThanOrEqual(10);
    const joined = formulas.join("\n");
    expect(joined).toContain("Clients!A2:A1000");
    expect(joined).toContain("Clients!H2:H1000");
    expect(joined).toContain("Clients!J2:J1000");
    // Content Plan with the new Client column: C = Client, P = Approval, Q = Publication
    expect(joined).toContain("'Content Plan'!P2:P1000");
    expect(joined).toContain("'Content Plan'!Q2:Q1000");
    expect(joined).not.toContain("'Content Plan'!O2:O1000");
    // Tasks shifted by the Client column: I = Status, K = Due date
    expect(joined).toContain("Tasks!I2:I1000");
    expect(joined).toContain("Tasks!K2:K1000");
    expect(joined).toContain("Finance!C2:C1000");
    expect(joined).toContain("Finance!D2:D1000");
    // No social-metric formulas remain.
    expect(joined).not.toContain("Platform Analytics");
    expect(joined).not.toContain("Content Analytics");
  });

  test("no social metric columns remain in the workbook", () => {
    for (const sheet of sheets) {
      for (const col of sheet.columns) {
        expect(["Followers", "Reach", "Impressions", "Engagement", "Engagement rate"]).not.toContain(col.name);
      }
    }
    expect(sheetNames).not.toContain("Platform Analytics");
    expect(sheetNames).not.toContain("Content Analytics");
  });

  test("finance sheet feeds the dashboard with matching columns", () => {
    const finance = byName("Finance");
    const names = finance.columns.map((c) => c.name);
    expect(names).toEqual(["Date", "Client / payee", "Revenue", "Expense", "Category", "Description", "Payment status", "Due date", "Payment date"]);
    const revenueIdx = names.indexOf("Revenue");
    expect(finance.rows.some((r) => Number(r[revenueIdx]) > 0)).toBe(true);
    const expenseIdx = names.indexOf("Expense");
    expect(finance.rows.some((r) => Number(r[expenseIdx]) > 0)).toBe(true);
  });

  test("toCSV escapes commas and quotes", () => {
    const sheet: SheetDef = {
      id: "t",
      name: "T",
      group: "Setup & Brand",
      description: "test",
      columns: [
        { name: "A", width: 10 },
        { name: "B", width: 10 },
      ],
      rows: [['hello, "world"', 3]],
      freeze: 0,
    };
    expect(toCSV(sheet)).toBe('A,B\n"hello, ""world""",3');
  });
});

function makeClient(partial: Partial<ClientRecord>): ClientRecord {
  return {
    id: "c1",
    name: "Northwind Coffee Roasters",
    contactName: "Maya Okafor",
    email: "maya@northwindcoffee.example",
    phone: "",
    website: "",
    industry: "Specialty coffee",
    packageName: "Retainer — 12 posts/month",
    monthlyFee: 4800,
    startDate: "2026-01-15",
    status: "Active",
    socials: { instagram: "@northwindcoffee" },
    notes: "Prefers batch edits.",
    onboarding: {},
    strategy: [
      { key: "pillars", title: "Content pillars", items: ["Education", "Product"] },
    ],
    kpis: [{ name: "Posts published / month", baseline: "6", target: "12", actual: "9", unit: "posts", deadline: "2026-10-28" }],
    createdAt: 0,
    ...partial,
  };
}

function makeContent(partial: Partial<ContentItem>): ContentItem {
  return {
    id: "x1",
    clientId: "c1",
    date: "2026-09-20",
    platform: "Instagram",
    format: "Reel",
    topic: "Cold brew vs iced latte",
    caption: "",
    assetNote: "",
    status: "Published",
    managerNotes: "",
    clientComments: "",
    pillar: "Education",
    owner: "Priya",
    ...partial,
  };
}

describe("notion export package (multi-client)", () => {
  const clients = [
    makeClient({ id: "c1" }),
    makeClient({ id: "c2", name: "Hale & Harbor Interiors", status: "Prospect", monthlyFee: 3200 }),
  ];
  const pkg = buildNotionFiles({
    profile: {
      managerName: "Alex Moreno",
      agency: "Marrow Social",
      email: "",
      currency: "$",
      weekStart: "Monday",
      approvalTurnaroundDays: 3,
      notifyEmail: true,
      notifyApprovals: true,
      notifyFinance: false,
      density: "comfortable",
    },
    clients,
    content: [
      makeContent({}),
      makeContent({ id: "x2", clientId: "c2", topic: "Rug sizing cheat sheet", date: "2026-09-18" }),
    ],
    tasks: [],
    requests: [],
    meetings: [],
    deliverables: [],
    finance: [],
  });

  const markdown = pkg.filter((f) => f.name.endsWith(".md"));
  const csvs = pkg.filter((f) => f.name.endsWith(".csv"));

  test("ships shared databases, per-client folders and a README", () => {
    const names = pkg.map((f) => f.name);
    expect(names).toContain("README.md");
    expect(names).toContain("databases/Clients.csv");
    expect(names).toContain("databases/Content.csv");
    expect(names).toContain("databases/Tasks.csv");
    expect(names).toContain("databases/Finance.csv");
    expect(names.some((n) => n.startsWith("clients/northwind-coffee-roasters/"))).toBe(true);
    expect(names.some((n) => n.startsWith("clients/hale-harbor-interiors/"))).toBe(true);
    expect(csvs.length).toBe(7);
    expect(markdown.length).toBeGreaterThanOrEqual(7);
  });

  test("content rows are attributed to the right client", () => {
    const rows = parseCSV(pkg.find((f) => f.name === "databases/Content.csv")!.content);
    expect(rows[0]).toContain("Client");
    const clientsColumn = rows[0].indexOf("Client");
    const assigned = rows.slice(1).map((r) => r[clientsColumn]);
    expect(assigned).toContain("Northwind Coffee Roasters");
    expect(assigned).toContain("Hale & Harbor Interiors");
  });

  test("per-client page includes strategy and flags manager-only notes", () => {
    const page = pkg.find((f) => f.name === "clients/northwind-coffee-roasters/Client.md")!.content;
    expect(page).toContain("Northwind Coffee Roasters");
    expect(page).toContain("Content pillars");
    expect(page).toContain("manager only");
  });

  test("every CSV has a consistent column count", () => {
    for (const file of csvs) {
      const rows = parseCSV(file.content);
      const header = rows[0];
      expect(header.length).toBeGreaterThan(1);
      for (const row of rows.slice(1)) {
        expect(row.length).toBe(header.length);
      }
    }
  });
});
