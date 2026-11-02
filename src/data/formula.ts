// Motor de fórmulas de planilha para a Planilha do Gestor.
//
// As abas guardam fórmulas como texto — por exemplo
// `=SUMIF(Financeiro!G2:G1000,"<>Pago",Financeiro!C2:C1000)`. Este módulo
// avalia o subconjunto de funções que a planilha realmente usa, para que o
// visualizador mostre o valor calculado em vez da fórmula crua:
//
//   COUNTA, COUNTIF, COUNTIFS, SUM, SUMIF, SUMIFS, TODAY, EOMONTH, TEXT
//
// além da concatenação com `&` e da aritmética de `+` / `-`. As datas são
// números de série de dias (1 = 1970-01-01) e `TEXT(serial, "YYYY-MM-DD")` as
// devolve em ISO, o que permite que critérios como
// `">="&TEXT(EOMONTH(TODAY(),-1)+1,"YYYY-MM-DD")` sejam comparados com as
// strings de data ISO guardadas nas abas.
//
// Qualquer coisa não suportada vira "#ERROR" em vez de lançar exceção, então
// uma fórmula ruim nunca apaga a pré-visualização inteira.

import type { SheetDef } from "./workbook";

export type CellValue = string | number;

interface RangeValue {
  __range: CellValue[];
}

type Value = CellValue | RangeValue;

const MS_DAY = 86_400_000;

function isRange(value: Value): value is RangeValue {
  return typeof value === "object" && value !== null && "__range" in value;
}

// ---- auxiliares de data ---------------------------------------------------

function todaySerial(now = new Date()): number {
  return serialFromISO(now.toISOString().slice(0, 10));
}

function serialFromISO(iso: string): number {
  return Math.round(Date.parse(`${iso}T00:00:00Z`) / MS_DAY);
}

function isoFromSerial(serial: number): string {
  return new Date(serial * MS_DAY).toISOString().slice(0, 10);
}

/** Excel-style EOMONTH: last day of the month `months` away from `serial`. */
function endOfMonth(serial: number, months: number): number {
  const d = new Date(serial * MS_DAY);
  const last = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months + 1, 0),
  );
  return Math.round(last.getTime() / MS_DAY);
}

// ---- value coercion -------------------------------------------------------

function toNumber(value: Value): number {
  if (isRange(value)) return 0;
  if (typeof value === "number") return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toText(value: Value): string {
  if (isRange(value)) return value.__range.map(String).join(", ");
  return typeof value === "number" ? String(value) : value;
}

function normalize(value: CellValue | undefined): CellValue {
  return value === undefined ? "" : value;
}

/**
 * Spreadsheet criteria test. Supports the comparison prefixes the workbook uses
 * (`=`, `<>`, `<`, `<=`, `>`, `>=`); a bare value means exact match. Numeric
 * comparison kicks in when both sides parse as numbers, otherwise the values are
 * compared as trimmed, case-insensitive text (which is what makes ISO dates and
 * status words comparable).
 */
export function matchesCriteria(value: CellValue, criteria: string): boolean {
  const parsed = /^(<=|>=|<>|=|<|>)([\s\S]*)$/.exec(criteria);
  const op = parsed ? parsed[1] : "=";
  const expected = (parsed ? parsed[2] : criteria).trim();

  const raw = String(value).trim();
  const actualNumber = Number(raw);
  const expectedNumber = Number(expected);
  const numeric =
    raw !== "" &&
    expected !== "" &&
    Number.isFinite(actualNumber) &&
    Number.isFinite(expectedNumber);

  if (numeric) {
    switch (op) {
      case "<":
        return actualNumber < expectedNumber;
      case "<=":
        return actualNumber <= expectedNumber;
      case ">":
        return actualNumber > expectedNumber;
      case ">=":
        return actualNumber >= expectedNumber;
      case "<>":
        return actualNumber !== expectedNumber;
      default:
        return actualNumber === expectedNumber;
    }
  }

  const a = raw.toLowerCase();
  const b = expected.toLowerCase();
  switch (op) {
    case "<":
      return a < b;
    case "<=":
      return a <= b;
    case ">":
      return a > b;
    case ">=":
      return a >= b;
    case "<>":
      return a !== b;
    default:
      return a === b;
  }
}

// ---- reference resolution -------------------------------------------------

function columnIndex(letters: string): number {
  let index = 0;
  for (const ch of letters.toUpperCase())
    index = index * 26 + (ch.charCodeAt(0) - 64);
  return index - 1;
}

function parseRef(ref: string): { col: number; row: number } {
  const match = /^([A-Za-z]+)(\d+)$/.exec(ref);
  if (!match) throw new Error(`Bad cell reference: ${ref}`);
  return { col: columnIndex(match[1]), row: Number(match[2]) };
}

function resolveRange(
  sheets: SheetDef[],
  sheetName: string,
  startRef: string,
  endRef: string,
): CellValue[] {
  const sheet = sheets.find(
    (s) => s.name.toLowerCase() === sheetName.trim().toLowerCase(),
  );
  if (!sheet) throw new Error(`Unknown sheet: ${sheetName}`);
  const start = parseRef(startRef);
  const end = parseRef(endRef);
  const out: CellValue[] = [];
  // Spreadsheet row 1 is the header (rendered from `columns`), so data row `r`
  // lives at `rows[r - 2]` — hence the usual `A2:A1000` ranges.
  for (
    let row = Math.min(start.row, end.row);
    row <= Math.max(start.row, end.row);
    row++
  ) {
    const cells = sheet.rows[row - 2];
    if (!cells) continue;
    // Flat, row-major order so parallel ranges (COUNTIFS / SUMIF) stay aligned.
    for (
      let col = Math.min(start.col, end.col);
      col <= Math.max(start.col, end.col);
      col++
    ) {
      out.push(normalize(cells[col]));
    }
  }
  return out;
}

// ---- functions ------------------------------------------------------------

function firstRange(args: Value[]): CellValue[] {
  return isRange(args[0]) ? args[0].__range : [toText(args[0])];
}

const FUNCTIONS: Record<string, (args: Value[]) => Value> = {
  TODAY: () => todaySerial(),
  NOW: () => todaySerial(),
  EOMONTH: (args) => endOfMonth(toNumber(args[0]), toNumber(args[1])),
  TEXT: (args) => {
    const value = toNumber(args[0]);
    const format = toText(args[1]);
    return /y{2,4}-m{2}-d{2}/i.test(format)
      ? isoFromSerial(value)
      : String(value);
  },
  COUNTA: (args) => {
    let count = 0;
    for (const arg of args) {
      const values = isRange(arg) ? arg.__range : [arg];
      for (const value of values) if (String(value).trim() !== "") count++;
    }
    return count;
  },
  COUNTIF: (args) => {
    const criteria = toText(args[1]);
    return firstRange(args).filter((value) => matchesCriteria(value, criteria))
      .length;
  },
  COUNTIFS: (args) => {
    if (args.length < 2 || args.length % 2 !== 0)
      throw new Error("COUNTIFS needs range/criteria pairs");
    const pairs: { values: CellValue[]; criteria: string }[] = [];
    for (let i = 0; i < args.length; i += 2) {
      pairs.push({
        values: firstRange([args[i]]),
        criteria: toText(args[i + 1]),
      });
    }
    const rows = Math.min(...pairs.map((pair) => pair.values.length));
    let count = 0;
    for (let i = 0; i < rows; i++) {
      if (pairs.every((pair) => matchesCriteria(pair.values[i], pair.criteria)))
        count++;
    }
    return count;
  },
  SUM: (args) => {
    let total = 0;
    for (const arg of args) {
      const values = isRange(arg) ? arg.__range : [arg];
      for (const value of values) total += toNumber(value);
    }
    return total;
  },
  SUMIF: (args) => {
    const criteriaValues = firstRange([args[0]]);
    const criteria = toText(args[1]);
    const sumValues =
      args[2] !== undefined ? firstRange([args[2]]) : criteriaValues;
    const rows = Math.min(criteriaValues.length, sumValues.length);
    let total = 0;
    for (let i = 0; i < rows; i++) {
      if (matchesCriteria(criteriaValues[i], criteria))
        total += toNumber(sumValues[i]);
    }
    return total;
  },
  SUMIFS: (args) => {
    if (args.length < 3 || args.length % 2 === 0) {
      throw new Error("SUMIFS needs a sum range plus range/criteria pairs");
    }
    const sumValues = firstRange([args[0]]);
    const pairs: { values: CellValue[]; criteria: string }[] = [];
    for (let i = 1; i < args.length; i += 2) {
      pairs.push({
        values: firstRange([args[i]]),
        criteria: toText(args[i + 1]),
      });
    }
    const rows = Math.min(
      sumValues.length,
      ...pairs.map((pair) => pair.values.length),
    );
    let total = 0;
    for (let i = 0; i < rows; i++) {
      if (
        pairs.every((pair) => matchesCriteria(pair.values[i], pair.criteria))
      ) {
        total += toNumber(sumValues[i]);
      }
    }
    return total;
  },
};

// ---- parser ---------------------------------------------------------------

type Token =
  | { kind: "num"; value: number }
  | { kind: "str"; value: string }
  | { kind: "ident"; value: string }
  | { kind: "op"; value: string };

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < source.length) {
    const ch = source[i];
    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
      i++;
      continue;
    }
    if (ch === '"') {
      let text = "";
      i++;
      while (i < source.length) {
        if (source[i] === '"') {
          if (source[i + 1] === '"') {
            text += '"';
            i += 2;
            continue;
          }
          i++;
          break;
        }
        text += source[i++];
      }
      tokens.push({ kind: "str", value: text });
      continue;
    }
    if (ch === "'") {
      let text = "";
      i++;
      while (i < source.length && source[i] !== "'") text += source[i++];
      i++;
      tokens.push({ kind: "ident", value: text });
      continue;
    }
    if (/[0-9]/.test(ch) || (ch === "." && /[0-9]/.test(source[i + 1] ?? ""))) {
      let text = "";
      while (i < source.length && /[0-9.]/.test(source[i])) text += source[i++];
      tokens.push({ kind: "num", value: Number(text) });
      continue;
    }
    if (/[A-Za-z_$]/.test(ch)) {
      let text = "";
      while (i < source.length && /[A-Za-z0-9_$]/.test(source[i]))
        text += source[i++];
      tokens.push({ kind: "ident", value: text });
      continue;
    }
    const pair = source.slice(i, i + 2);
    if (pair === ">=" || pair === "<=" || pair === "<>") {
      tokens.push({ kind: "op", value: pair });
      i += 2;
      continue;
    }
    tokens.push({ kind: "op", value: ch });
    i++;
  }
  return tokens;
}

class Parser {
  private pos = 0;
  private readonly tokens: Token[];
  private readonly sheets: SheetDef[];

  constructor(tokens: Token[], sheets: SheetDef[]) {
    this.tokens = tokens;
    this.sheets = sheets;
  }

  parseValue(): Value {
    const value = this.parseConcat();
    if (this.pos !== this.tokens.length)
      throw new Error("Unexpected trailing input");
    return value;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private take(): Token {
    const token = this.tokens[this.pos++];
    if (!token) throw new Error("Unexpected end of formula");
    return token;
  }

  private eatOp(op: string): boolean {
    const token = this.peek();
    if (token && token.kind === "op" && token.value === op) {
      this.pos++;
      return true;
    }
    return false;
  }

  /** `&` concatenation binds loosest, matching spreadsheet behaviour. */
  private parseConcat(): Value {
    let left = this.parseAdditive();
    while (this.eatOp("&")) {
      left = toText(left) + toText(this.parseAdditive());
    }
    return left;
  }

  private parseAdditive(): Value {
    let left = this.parseUnary();
    for (;;) {
      if (this.eatOp("+")) left = toNumber(left) + toNumber(this.parseUnary());
      else if (this.eatOp("-"))
        left = toNumber(left) - toNumber(this.parseUnary());
      else return left;
    }
  }

  private parseUnary(): Value {
    if (this.eatOp("-")) return -toNumber(this.parseUnary());
    if (this.eatOp("+")) return this.parseUnary();
    return this.parsePrimary();
  }

  private parsePrimary(): Value {
    const token = this.take();

    if (token.kind === "num" || token.kind === "str") return token.value;

    if (token.kind === "op" && token.value === "(") {
      const inner = this.parseConcat();
      if (!this.eatOp(")")) throw new Error("Missing closing parenthesis");
      return inner;
    }

    if (token.kind !== "ident")
      throw new Error(`Unexpected token: ${token.value}`);

    if (this.eatOp("(")) {
      const args: Value[] = [];
      if (!this.eatOp(")")) {
        for (;;) {
          args.push(this.parseConcat());
          if (this.eatOp(",")) continue;
          if (this.eatOp(")")) break;
          throw new Error("Malformed argument list");
        }
      }
      const fn = FUNCTIONS[token.value.toUpperCase()];
      if (!fn) throw new Error(`Unsupported function: ${token.value}`);
      return fn(args);
    }

    if (this.eatOp("!")) {
      const start = this.take();
      if (start.kind !== "ident") throw new Error("Bad range start");
      let end = start;
      if (this.eatOp(":")) {
        const candidate = this.take();
        if (candidate.kind !== "ident") throw new Error("Bad range end");
        end = candidate;
      }
      return {
        __range: resolveRange(this.sheets, token.value, start.value, end.value),
      };
    }

    throw new Error(`Unknown name: ${token.value}`);
  }
}

/** Evaluate one formula string (with or without a leading `=`) against `sheets`. */
export function evaluateFormula(
  formula: string,
  sheets: SheetDef[],
): CellValue {
  try {
    const source = formula.trim().replace(/^=/, "");
    const value = new Parser(tokenize(source), sheets).parseValue();
    if (isRange(value)) return "";
    return typeof value === "number" ? round(value) : value;
  } catch {
    return "#ERROR";
  }
}

/** Trim floating-point noise (money and counts should render cleanly). */
function round(value: number): number {
  return Math.abs(value - Math.round(value)) < 1e-9
    ? Math.round(value)
    : Number(value.toFixed(4));
}

/**
 * Return a copy of each sheet where formula cells are replaced by their computed
 * value, exposed as `computed` (raw formulas stay in `rows` for tooltips/tests).
 */
export function computeWorkbook(sheets: SheetDef[]): SheetDef[] {
  return sheets.map((sheet) => ({
    ...sheet,
    computed: sheet.rows.map((row) =>
      row.map((cell) =>
        typeof cell === "string" && cell.startsWith("=")
          ? evaluateFormula(cell, sheets)
          : cell,
      ),
    ),
  }));
}
