// Targeted regression tests for the Contentplane manager workspace data layer:
// the 29-sheet workbook (including its live formula engine), the recurring
// invoice planner and the multi-client Notion export package.
//
// Run with: bun test

import { describe, expect, test } from "bun:test";

import { computeWorkbook, evaluateFormula, matchesCriteria } from "../src/data/formula";
import { planInvoices } from "../src/data/invoicing";
import { buildNotionFiles } from "../src/data/notion-export";
import { buildWorkbookSheets, toCSV } from "../src/data/workbook";
import type { SheetColumn, SheetDef } from "../src/data/workbook";
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
const computedSheets = computeWorkbook(sheets);

function byName(name: string): SheetDef {
  const sheet = sheets.find((s) => s.name === name);
  if (!sheet) throw new Error(`Sheet "${name}" is missing from the workbook`);
  return sheet;
}

function computedByName(name: string): SheetDef {
  const sheet = computedSheets.find((s) => s.name === name);
  if (!sheet) throw new Error(`Sheet "${name}" is missing from the workbook`);
  return sheet;
}

/** UTC-safe ISO date `days` away from today (the engine works in UTC). */
function isoOffset(days: number): string {
  const d = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function columnIndex(sheet: SheetDef, name: string): number {
  const index = sheet.columns.findIndex((c) => c.name === name);
  if (index < 0) throw new Error(`Column "${name}" is missing from ${sheet.name}`);
  return index;
}

/** Read a computed Dashboard value by its metric label (value is the next cell over). */
function dashboardValue(label: string, labelColumn = 0): string | number {
  const sheet = computedByName("Dashboard");
  const rowIndex = sheet.rows.findIndex((row) => String(row[labelColumn]) === label);
  if (rowIndex < 0) throw new Error(`Dashboard has no metric named "${label}"`);
  return sheet.computed![rowIndex][labelColumn + 1];
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

  test("dashboard formulas point at the columns that actually hold the data", () => {
    const formulas = byName("Dashboard")
      .rows.flat()
      .filter((v): v is string => typeof v === "string" && v.startsWith("="));
    expect(formulas.length).toBeGreaterThanOrEqual(10);
    const joined = formulas.join("\n");

    expect(joined).toContain("Clients!A2:A1000");
    expect(joined).toContain("Clients!H2:H1000");
    expect(joined).toContain("Clients!J2:J1000");

    // Content Plan: C = Client, P = Approval status, Q = Publication status.
    const plan = byName("Content Plan");
    expect(plan.columns[columnIndex(plan, "Client")].name).toBe("Client");
    expect(columnIndex(plan, "Approval status")).toBe(15);
    expect(columnIndex(plan, "Publication status")).toBe(16);
    expect(joined).toContain("'Content Plan'!C2:C1000");
    expect(joined).toContain("'Content Plan'!P2:P1000");
    expect(joined).toContain("'Content Plan'!Q2:Q1000");

    // Tasks: H = Status, J = Due date.
    const tasks = byName("Tasks");
    expect(columnIndex(tasks, "Status")).toBe(7);
    expect(columnIndex(tasks, "Due date")).toBe(9);
    expect(joined).toContain("Tasks!H2:H1000");
    expect(joined).toContain("Tasks!J2:J1000");

    // Finance: C = Revenue, D = Expense, G = Payment status.
    const finance = byName("Finance");
    expect(columnIndex(finance, "Payment status")).toBe(6);
    expect(joined).toContain("Finance!C2:C1000");
    expect(joined).toContain("Finance!D2:D1000");
    expect(joined).toContain("Finance!G2:G1000");

    // No social-metric formulas remain.
    expect(joined).not.toContain("Platform Analytics");
    expect(joined).not.toContain("Content Analytics");
  });

  test("every workbook formula evaluates (no #ERROR cells)", () => {
    const broken: string[] = [];
    for (const sheet of computedSheets) {
      sheet.computed!.forEach((row, rowIndex) => {
        row.forEach((value, colIndex) => {
          if (value === "#ERROR") {
            broken.push(`${sheet.name}!${sheet.columns[colIndex]?.name} row ${rowIndex + 2}`);
          }
        });
      });
    }
    expect(broken).toEqual([]);
  });

  test("dashboard metrics equal independently computed values from the source sheets", () => {
    const clients = byName("Clients");
    const clientStatus = columnIndex(clients, "Status");
    const monthlyFee = columnIndex(clients, "Monthly fee");
    const activeClients = clients.rows.filter((r) => r[clientStatus] === "Active");
    const recurringRevenue = activeClients.reduce((sum, r) => sum + Number(r[monthlyFee] || 0), 0);

    const content = byName("Content Plan");
    const approval = columnIndex(content, "Approval status");
    const publication = columnIndex(content, "Publication status");
    const byPublication = (status: string) =>
      content.rows.filter((r) => r[publication] === status).length;

    const tasks = byName("Tasks");
    const taskStatus = columnIndex(tasks, "Status");
    const taskDue = columnIndex(tasks, "Due date");
    const tasksDueThisWeek = tasks.rows.filter(
      (r) => r[taskStatus] !== "Done" && String(r[taskDue]) <= isoOffset(7),
    ).length;

    const finance = byName("Finance");
    const paymentStatus = columnIndex(finance, "Payment status");
    const revenue = columnIndex(finance, "Revenue");
    const unpaidIncome = finance.rows
      .filter((r) => r[paymentStatus] !== "Paid")
      .reduce((sum, r) => sum + Number(r[revenue] || 0), 0);

    expect(dashboardValue("Total clients")).toBe(clients.rows.length);
    expect(dashboardValue("Active clients", 2)).toBe(activeClients.length);
    expect(dashboardValue("Monthly recurring revenue")).toBe(recurringRevenue);
    expect(dashboardValue("Prospects", 2)).toBe(
      clients.rows.filter((r) => r[clientStatus] === "Prospect").length,
    );

    expect(dashboardValue("Planned posts")).toBe(content.rows.length);
    expect(dashboardValue("Published", 2)).toBe(byPublication("Published"));
    expect(dashboardValue("Scheduled", 2)).toBe(byPublication("Scheduled"));
    expect(dashboardValue("Awaiting approval")).toBe(
      content.rows.filter((r) => r[approval] === "Pending").length,
    );

    expect(dashboardValue("Tasks due this week")).toBe(tasksDueThisWeek);
    expect(dashboardValue("Tasks done", 2)).toBe(
      tasks.rows.filter((r) => r[taskStatus] === "Done").length,
    );

    expect(dashboardValue("Unpaid / pending income")).toBe(unpaidIncome);
    expect(dashboardValue("Overdue payments", 2)).toBe(
      finance.rows.filter((r) => r[paymentStatus] === "Overdue").length,
    );
  });

  test("this-month money metrics stay inside the current calendar month", () => {
    const finance = byName("Finance");
    const dateIdx = columnIndex(finance, "Date");
    const revenueIdx = columnIndex(finance, "Revenue");
    const expenseIdx = columnIndex(finance, "Expense");
    const month = new Date().toISOString().slice(0, 7);
    const inMonth = finance.rows.filter((r) => String(r[dateIdx]).slice(0, 7) === month);

    expect(dashboardValue("Revenue this month")).toBe(
      inMonth.reduce((sum, r) => sum + Number(r[revenueIdx] || 0), 0),
    );
    expect(dashboardValue("Expenses this month", 2)).toBe(
      inMonth.reduce((sum, r) => sum + Number(r[expenseIdx] || 0), 0),
    );
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

  test("package never ships social-metric data", () => {
    for (const file of pkg) {
      const text = file.content.toLowerCase();
      expect(text).not.toContain("followers");
      expect(text).not.toContain("impressions");
      expect(text).not.toContain("engagement rate");
    }
  });
});

function fixtureSheet(
  name: string,
  columns: SheetColumn[],
  rows: (string | number)[][],
): SheetDef {
  return {
    id: name.toLowerCase(),
    name,
    group: "Setup & Brand",
    description: "Test fixture sheet",
    columns,
    rows,
    freeze: 1,
  };
}

function lastDayOfMonthISO(): string {
  const now = new Date();
  const last = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  return last.toISOString().slice(0, 10);
}

describe("workbook formula engine", () => {
  const book = [
    fixtureSheet(
      "Data",
      [
        { name: "Ref", width: 80 },
        { name: "Status", width: 80 },
        { name: "Amount", width: 80, type: "number" },
        { name: "Date", width: 80, type: "date" },
      ],
      [
        ["r1", "Done", 100, isoOffset(-90)],
        ["r2", "Backlog", 200, isoOffset(-10)],
        ["r3", "Done", 300, isoOffset(-200)],
      ],
    ),
  ];

  test("evaluates the aggregate functions the workbook relies on", () => {
    expect(evaluateFormula("=COUNTA(Data!A2:A1000)", book)).toBe(3);
    expect(evaluateFormula('=COUNTIF(Data!B2:B1000,"Done")', book)).toBe(2);
    expect(evaluateFormula('=SUMIF(Data!B2:B1000,"Done",Data!C2:C1000)', book)).toBe(400);
    expect(evaluateFormula('=SUMIF(Data!C2:C1000,">=200")', book)).toBe(500);
    expect(evaluateFormula("=SUM(Data!C2:C1000)", book)).toBe(600);
    expect(
      evaluateFormula('=SUMIFS(Data!C2:C1000,Data!B2:B1000,"Done",Data!C2:C1000,">=200")', book),
    ).toBe(300);
  });

  test("treats row 1 as the header row and missing cells as empty", () => {
    expect(evaluateFormula("=COUNTA(Data!A1:A1)", book)).toBe(0);
    expect(evaluateFormula("=COUNTA(Data!Z2:Z100)", book)).toBe(0);
    expect(evaluateFormula('=COUNTIF(Data!Z2:Z100,"x")', book)).toBe(0);
  });

  test("supports date arithmetic and TEXT for month-bounded criteria", () => {
    expect(evaluateFormula('=TEXT(TODAY()+7,"YYYY-MM-DD")', book)).toBe(isoOffset(7));
    expect(evaluateFormula('=TEXT(EOMONTH(TODAY(),-1)+1,"YYYY-MM-DD")', book)).toBe(
      `${new Date().toISOString().slice(0, 7)}-01`,
    );
    expect(evaluateFormula('=TEXT(EOMONTH(TODAY(),0),"YYYY-MM-DD")', book)).toBe(lastDayOfMonthISO());
    expect(
      evaluateFormula(
        '=COUNTIFS(Data!B2:B1000,"<>Done",Data!D2:D1000,">="&TEXT(TODAY()-90,"YYYY-MM-DD"))',
        book,
      ),
    ).toBe(1);
  });

  test("fails soft — unsupported formulas resolve to #ERROR instead of throwing", () => {
    expect(evaluateFormula("=MADEUP(1)", book)).toBe("#ERROR");
    expect(evaluateFormula("=COUNTA(Nope!A2:A5)", book)).toBe("#ERROR");
  });

  test("criteria matching mirrors spreadsheet semantics", () => {
    expect(matchesCriteria("Done", "Done")).toBe(true);
    expect(matchesCriteria("done", "DONE")).toBe(true);
    expect(matchesCriteria("Done", "<>Done")).toBe(false);
    expect(matchesCriteria("", "<>Paid")).toBe(true);
    expect(matchesCriteria(200, ">=200")).toBe(true);
    expect(matchesCriteria("2026-09-09", ">=2026-09-01")).toBe(true);
    expect(matchesCriteria("2026-08-09", ">=2026-09-01")).toBe(false);
  });
});

describe("recurring invoice planning", () => {
  const now = new Date("2026-09-15T12:00:00Z");
  const clients = [
    { id: "c1", name: "Northwind Coffee Roasters", status: "Active", monthlyFee: 4800 },
    { id: "c2", name: "Paused Client", status: "Paused", monthlyFee: 1000 },
    { id: "c3", name: "Comped Client", status: "Active", monthlyFee: 0 },
  ];

  test("invoices active clients with a fee, one per month, due on the 10th", () => {
    const plan = planInvoices(clients, [], 2, undefined, now);
    expect(plan.map((p) => p.clientId)).toEqual(["c1", "c1"]);
    expect(plan.map((p) => p.month)).toEqual(["2026-09", "2026-10"]);
    expect(plan.every((p) => p.amount === 4800)).toBe(true);
    expect(plan.every((p) => p.dueDate === `${p.month}-10`)).toBe(true);
    expect(plan[0].description).toContain("Northwind Coffee Roasters");
  });

  test("is idempotent — existing invoices are never duplicated", () => {
    const plan = planInvoices(clients, [], 2, undefined, now);
    const finance = plan.map((p) => ({ clientId: p.clientId, kind: "invoice" as const, date: p.month }));
    expect(planInvoices(clients, finance, 2, undefined, now)).toEqual([]);
    // A previous month's invoice does not block the current window.
    expect(
      planInvoices(clients, [{ clientId: "c1", kind: "invoice", date: "2026-08" }], 1, undefined, now),
    ).toHaveLength(1);
  });

  test("clamps the window to 12 months and can target a single client", () => {
    expect(planInvoices(clients, [], 99, undefined, now)).toHaveLength(12);
    expect(planInvoices(clients, [], 0, undefined, now)).toHaveLength(1);
    expect(planInvoices(clients, [], 1, "unknown-client", now)).toEqual([]);
    expect(planInvoices(clients, [], 2, "c1", now)).toHaveLength(2);
  });
});
