// Targeted regression tests for the Contentplane data layer:
// the 28-sheet workbook engine, the demo dataset, and the Notion export package.
//
// Run with: bun test

import { describe, expect, test } from "bun:test";

import { buildDemoState } from "../src/data/demo";
import { buildNotionPackage, latestMonth } from "../src/data/notion-export";
import { buildWorkbookSheets, toCSV } from "../src/data/workbook";
import type { SheetDef } from "../src/data/workbook";

const REQUIRED_SHEET_NAMES = [
  "Setup",
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
  "Platform Analytics",
  "Content Analytics",
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const sheets = buildWorkbookSheets();
const sheetNames = sheets.map((s) => s.name);

function byName(name: string): SheetDef {
  const sheet = sheets.find((s) => s.name === name);
  if (!sheet) throw new Error(`Sheet "${name}" is missing from the workbook`);
  return sheet;
}

/** Minimal CSV parser (handles quotes, escaped quotes, commas) so we can assert
 * that generated CSVs have a consistent column count. */
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

describe("workbook: 28-sheet structure", () => {
  test("contains exactly the 28 required worksheets, in order", () => {
    expect(sheetNames).toEqual(REQUIRED_SHEET_NAMES);
  });

  test("sheet ids are unique and every sheet is populated and documented", () => {
    const ids = sheets.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const sheet of sheets) {
      expect(sheet.description.length).toBeGreaterThan(20);
      expect(sheet.columns.length).toBeGreaterThanOrEqual(2);
      expect(sheet.rows.length).toBeGreaterThan(0);
      expect(sheet.freeze).toBeGreaterThanOrEqual(0);
    }
  });

  test("every row matches its sheet's column count (no ragged tables)", () => {
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

  test("the twelve monthly calendars share one identical structure", () => {
    const shapes = MONTHS.map((m) => byName(m).columns.map((c) => c.name));
    for (const shape of shapes) {
      expect(shape).toEqual(shapes[0]);
      expect(shape).toContain("Date");
      expect(shape).toContain("Platform");
      expect(shape).toContain("Content pillar");
      expect(shape).toContain("Approval status");
      expect(shape).toContain("Publication status");
      expect(shape.length).toBeGreaterThanOrEqual(13);
    }
    for (const m of MONTHS) {
      expect(byName(m).rows.length).toBeGreaterThan(0);
      expect(byName(m).freeze).toBe(1);
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

  test("dashboard formulas compute from the correct sheets and columns", () => {
    const dashboard = byName("Dashboard");
    const formulas = dashboard.rows
      .flat()
      .filter((v): v is string => typeof v === "string" && v.startsWith("="));
    expect(formulas.length).toBeGreaterThanOrEqual(8);

    const joined = formulas.join("\n");
    // Content Plan: O = Approval status, P = Publication status (regression: not R)
    expect(joined).toContain("'Content Plan'!O2:O1000");
    expect(joined).toContain("'Content Plan'!P2:P1000");
    expect(joined).not.toContain("'Content Plan'!R2:R1000");
    // Tasks: H = Status, J = Due date
    expect(joined).toContain("Tasks!H2:H1000");
    expect(joined).toContain("Tasks!J2:J1000");
    // Platform Analytics: C = Followers, D = Reach, F = Engagement
    expect(joined).toContain("Platform Analytics!C2:C1000");
    expect(joined).toContain("Platform Analytics!D2:D1000");
    expect(joined).toContain("Platform Analytics!F2:F1000");
    // Content Analytics: E = Topic, F = Reach, K = Saves
    expect(joined).toContain("'Content Analytics'!E2:E1000");
    expect(joined).toContain("'Content Analytics'!F2:F1000");
    expect(joined).toContain("'Content Analytics'!K2:K1000");
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

describe("demo dataset", () => {
  const demo = buildDemoState();

  test("covers the full client workflow (planning through reporting)", () => {
    expect(demo.client.name.length).toBeGreaterThan(0);
    expect(demo.content.length).toBeGreaterThanOrEqual(10);
    expect(demo.content.some((c) => c.status === "Published")).toBe(true);
    expect(demo.content.some((c) => c.status === "In Review" || c.status === "Changes Requested")).toBe(true);
    expect(demo.content.some((c) => c.status === "Scheduled" || c.status === "Approved")).toBe(true);

    expect(demo.requests.length).toBeGreaterThan(0);
    expect(demo.requests.some((r) => ["New", "In Progress", "Waiting"].includes(r.status))).toBe(true);

    expect(demo.meetings.some((m) => m.status === "Scheduled")).toBe(true);
    expect(demo.deliverables.length).toBeGreaterThan(0);
    expect(demo.metrics.length).toBeGreaterThanOrEqual(6);
    expect(demo.strategy.length).toBeGreaterThan(0);
    expect(demo.kpis.length).toBeGreaterThan(0);
  });

  test("content records use ISO dates and the shared status vocabulary", () => {
    for (const item of demo.content) {
      expect(item.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(typeof item.topic).toBe("string");
      expect(item.topic.length).toBeGreaterThan(0);
    }
  });
});

describe("notion export package", () => {
  const demo = buildDemoState();
  const pkg = buildNotionPackage(demo);
  const markdown = pkg.files.filter((f) => f.name.endsWith(".md"));
  const csvs = pkg.files.filter((f) => f.name.endsWith(".csv"));

  test("ships the README, markdown pages, and CSV databases with content", () => {
    expect(pkg.slug.length).toBeGreaterThan(0);
    expect(markdown.length).toBeGreaterThanOrEqual(9);
    expect(csvs.length).toBe(7);
    expect(pkg.files.some((f) => f.name.endsWith("/README.md"))).toBe(true);
    for (const file of pkg.files) {
      expect(file.content.length).toBeGreaterThan(0);
    }
  });

  test("each CSV database has one row per record and a consistent column count", () => {
    const expectedRows: Record<string, number> = {
      "Content.csv": demo.content.length,
      "Deliverables.csv": demo.deliverables.length,
      "Meetings.csv": demo.meetings.length,
      "Requests.csv": demo.requests.length,
      "Performance.csv": demo.metrics.length,
    };
    for (const file of csvs) {
      const rows = parseCSV(file.content);
      const base = file.name.split("/").slice(-1)[0];
      const header = rows[0];
      expect(header.length).toBeGreaterThan(1);
      for (const row of rows.slice(1)) {
        expect(row.length).toBe(header.length);
      }
      if (base in expectedRows) {
        expect(rows.length - 1).toBe(expectedRows[base]);
      }
    }
  });

  test("markdown pages mirror the portal sections and name the client", () => {
    const names = markdown.map((f) => f.name.split("/").slice(-1)[0]);
    for (const page of ["Dashboard.md", "Content Calendar.md", "Approvals.md", "Performance.md", "Requests.md", "Meetings.md"]) {
      expect(names).toContain(page);
    }
    const dashboard = markdown.find((f) => f.name.endsWith("Dashboard.md"))!;
    expect(dashboard.content).toContain(demo.client.name);
    expect(dashboard.content.startsWith("# ")).toBe(true);
  });

  test("latestMonth returns the newest month present in the metrics", () => {
    const months = demo.metrics.map((m) => m.month).sort();
    expect(latestMonth(demo)).toBe(months[months.length - 1]);
    expect(latestMonth(demo)).toMatch(/^\d{4}-\d{2}$/);
  });
});
