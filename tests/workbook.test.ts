// Testes de regressão da camada de dados do Social Media OS:
// a planilha de 29 abas (com seu motor de fórmulas) e o planejador de faturas
// recorrentes.
//
// Rode com: bun test

import { describe, expect, test } from "bun:test";

import { computeWorkbook, evaluateFormula, matchesCriteria } from "../src/data/formula";
import { planInvoices } from "../src/data/invoicing";
import { buildWorkbookSheets, toCSV } from "../src/data/workbook";
import type { SheetColumn, SheetDef } from "../src/data/workbook";

const REQUIRED_SHEET_NAMES = [
  "Configuração",
  "Clientes",
  "Marca",
  "Metas",
  "Painel",
  "Ano",
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
  "Semanal",
  "Banco de Ideias",
  "Plano de Conteúdo",
  "Tarefas",
  "30 Dias",
  "Prévia do Feed",
  "Hashtags",
  "Parcerias",
  "Financeiro",
  "Relatórios de Clientes",
  "Registro de Entregas",
];

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const sheets = buildWorkbookSheets();
const sheetNames = sheets.map((s) => s.name);
const computedSheets = computeWorkbook(sheets);

function byName(name: string): SheetDef {
  const sheet = sheets.find((s) => s.name === name);
  if (!sheet) throw new Error(`A aba "${name}" está faltando na planilha`);
  return sheet;
}

function computedByName(name: string): SheetDef {
  const sheet = computedSheets.find((s) => s.name === name);
  if (!sheet) throw new Error(`A aba "${name}" está faltando na planilha`);
  return sheet;
}

/** Data ISO segura em UTC `days` dias a partir de hoje (o motor trabalha em UTC). */
function isoOffset(days: number): string {
  const d = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function columnIndex(sheet: SheetDef, name: string): number {
  const index = sheet.columns.findIndex((c) => c.name === name);
  if (index < 0) throw new Error(`A coluna "${name}" está faltando em ${sheet.name}`);
  return index;
}

/** Lê um valor calculado do Painel pelo rótulo do indicador (o valor é a célula seguinte). */
function dashboardValue(label: string, labelColumn = 0): string | number {
  const sheet = computedByName("Painel");
  const rowIndex = sheet.rows.findIndex((row) => String(row[labelColumn]) === label);
  if (rowIndex < 0) throw new Error(`O Painel não tem o indicador "${label}"`);
  return sheet.computed![rowIndex][labelColumn + 1];
}

describe("planilha: 29 abas do espaço do gestor", () => {
  test("contém o conjunto de abas do gestor, na ordem", () => {
    expect(sheetNames).toEqual(REQUIRED_SHEET_NAMES);
  });

  test("os ids das abas são únicos e toda aba tem conteúdo e descrição", () => {
    const ids = sheets.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const sheet of sheets) {
      expect(sheet.description.length).toBeGreaterThan(20);
      expect(sheet.columns.length).toBeGreaterThanOrEqual(2);
      expect(sheet.rows.length).toBeGreaterThan(0);
    }
  });

  test("nenhuma linha desalinhada (toda linha bate com o número de colunas)", () => {
    const ragged: string[] = [];
    for (const sheet of sheets) {
      sheet.rows.forEach((row, i) => {
        if (row.length !== sheet.columns.length) {
          ragged.push(`${sheet.name} linha ${i + 2}: ${row.length} células para ${sheet.columns.length} colunas`);
        }
      });
    }
    expect(ragged).toEqual([]);
  });

  test("a aba Clientes guarda a carteira com mensalidades e status", () => {
    const clients = byName("Clientes");
    const names = clients.rows.map((r) => String(r[0]));
    expect(names).toContain("Northwind Coffee Roasters");
    expect(names).toContain("Vela Fitness Studio");
    const statusIndex = clients.columns.findIndex((c) => c.name === "Status");
    const statuses = clients.rows.map((r) => String(r[statusIndex]));
    expect(statuses).toContain("Ativo");
    expect(statuses).toContain("Prospecto");
  });

  test("os calendários mensais têm coluna de cliente e estrutura consistente", () => {
    const shapes = MONTHS.map((m) => byName(m).columns.map((c) => c.name));
    for (const shape of shapes) {
      expect(shape).toEqual(shapes[0]);
      expect(shape).toContain("Cliente");
      expect(shape).toContain("Status de aprovação");
      expect(shape).toContain("Status de publicação");
    }
    for (const m of MONTHS) {
      expect(byName(m).rows.length).toBeGreaterThan(0);
    }
  });

  test("os valores das listas suspensas vêm todos das opções declaradas", () => {
    const violations: string[] = [];
    for (const sheet of sheets) {
      sheet.columns.forEach((col, colIndex) => {
        if (col.type !== "select" || !col.options?.length) return;
        sheet.rows.forEach((row, rowIndex) => {
          const value = row[colIndex];
          if (value === undefined || value === "" || value === "—") return;
          if (!col.options!.includes(String(value))) {
            violations.push(`${sheet.name}!${col.name} linha ${rowIndex + 2}: "${value}"`);
          }
        });
      });
    }
    expect(violations).toEqual([]);
  });

  test("as fórmulas do Painel apontam para as colunas que realmente têm os dados", () => {
    const formulas = byName("Painel")
      .rows.flat()
      .filter((v): v is string => typeof v === "string" && v.startsWith("="));
    expect(formulas.length).toBeGreaterThanOrEqual(10);
    const joined = formulas.join("\n");

    expect(joined).toContain("Clientes!A2:A1000");
    expect(joined).toContain("Clientes!H2:H1000");
    expect(joined).toContain("Clientes!J2:J1000");

    // Plano de Conteúdo: C = Cliente, P = Status de aprovação, Q = Status de publicação.
    const plan = byName("Plano de Conteúdo");
    expect(plan.columns[columnIndex(plan, "Cliente")].name).toBe("Cliente");
    expect(columnIndex(plan, "Status de aprovação")).toBe(15);
    expect(columnIndex(plan, "Status de publicação")).toBe(16);
    expect(joined).toContain("'Plano de Conteúdo'!C2:C1000");
    expect(joined).toContain("'Plano de Conteúdo'!P2:P1000");
    expect(joined).toContain("'Plano de Conteúdo'!Q2:Q1000");

    // Tarefas: H = Status, J = Prazo.
    const tasks = byName("Tarefas");
    expect(columnIndex(tasks, "Status")).toBe(7);
    expect(columnIndex(tasks, "Prazo")).toBe(9);
    expect(joined).toContain("Tarefas!H2:H1000");
    expect(joined).toContain("Tarefas!J2:J1000");

    // Financeiro: C = Receita, D = Despesa, G = Status de pagamento.
    const finance = byName("Financeiro");
    expect(columnIndex(finance, "Status de pagamento")).toBe(6);
    expect(joined).toContain("Financeiro!C2:C1000");
    expect(joined).toContain("Financeiro!D2:D1000");
    expect(joined).toContain("Financeiro!G2:G1000");

    // Nenhuma fórmula de métrica de rede social sobrou.
    expect(joined).not.toContain("Plataformas");
    expect(joined).not.toContain("Análise");
  });

  test("toda fórmula da planilha é avaliada (nenhuma célula #ERROR)", () => {
    const broken: string[] = [];
    for (const sheet of computedSheets) {
      sheet.computed!.forEach((row, rowIndex) => {
        row.forEach((value, colIndex) => {
          if (value === "#ERROR") {
            broken.push(`${sheet.name}!${sheet.columns[colIndex]?.name} linha ${rowIndex + 2}`);
          }
        });
      });
    }
    expect(broken).toEqual([]);
  });

  test("os indicadores do Painel batem com valores calculados de forma independente", () => {
    const clients = byName("Clientes");
    const clientStatus = columnIndex(clients, "Status");
    const monthlyFee = columnIndex(clients, "Mensalidade");
    const activeClients = clients.rows.filter((r) => r[clientStatus] === "Ativo");
    const recurringRevenue = activeClients.reduce((sum, r) => sum + Number(r[monthlyFee] || 0), 0);

    const content = byName("Plano de Conteúdo");
    const approval = columnIndex(content, "Status de aprovação");
    const publication = columnIndex(content, "Status de publicação");
    const byPublication = (status: string) =>
      content.rows.filter((r) => r[publication] === status).length;

    const tasks = byName("Tarefas");
    const taskStatus = columnIndex(tasks, "Status");
    const taskDue = columnIndex(tasks, "Prazo");
    const tasksDueThisWeek = tasks.rows.filter(
      (r) => r[taskStatus] !== "Concluído" && String(r[taskDue]) <= isoOffset(7),
    ).length;

    const finance = byName("Financeiro");
    const paymentStatus = columnIndex(finance, "Status de pagamento");
    const revenue = columnIndex(finance, "Receita");
    const unpaidIncome = finance.rows
      .filter((r) => r[paymentStatus] !== "Pago")
      .reduce((sum, r) => sum + Number(r[revenue] || 0), 0);

    expect(dashboardValue("Total de clientes")).toBe(clients.rows.length);
    expect(dashboardValue("Clientes ativos", 2)).toBe(activeClients.length);
    expect(dashboardValue("Receita recorrente mensal")).toBe(recurringRevenue);
    expect(dashboardValue("Prospectos", 2)).toBe(
      clients.rows.filter((r) => r[clientStatus] === "Prospecto").length,
    );

    expect(dashboardValue("Posts planejados")).toBe(content.rows.length);
    expect(dashboardValue("Publicados", 2)).toBe(byPublication("Publicado"));
    expect(dashboardValue("Agendados", 2)).toBe(byPublication("Agendado"));
    expect(dashboardValue("Aguardando aprovação")).toBe(
      content.rows.filter((r) => r[approval] === "Pendente").length,
    );

    expect(dashboardValue("Tarefas para esta semana")).toBe(tasksDueThisWeek);
    expect(dashboardValue("Tarefas concluídas", 2)).toBe(
      tasks.rows.filter((r) => r[taskStatus] === "Concluído").length,
    );

    expect(dashboardValue("Receita pendente")).toBe(unpaidIncome);
    expect(dashboardValue("Pagamentos atrasados", 2)).toBe(
      finance.rows.filter((r) => r[paymentStatus] === "Atrasado").length,
    );
  });

  test("as métricas de dinheiro do mês ficam dentro do mês corrente", () => {
    const finance = byName("Financeiro");
    const dateIdx = columnIndex(finance, "Data");
    const revenueIdx = columnIndex(finance, "Receita");
    const expenseIdx = columnIndex(finance, "Despesa");
    const month = new Date().toISOString().slice(0, 7);
    const inMonth = finance.rows.filter((r) => String(r[dateIdx]).slice(0, 7) === month);

    expect(dashboardValue("Receita do mês")).toBe(
      inMonth.reduce((sum, r) => sum + Number(r[revenueIdx] || 0), 0),
    );
    expect(dashboardValue("Despesas do mês", 2)).toBe(
      inMonth.reduce((sum, r) => sum + Number(r[expenseIdx] || 0), 0),
    );
  });

  test("nenhuma coluna de métrica de rede social sobrou na planilha", () => {
    for (const sheet of sheets) {
      for (const col of sheet.columns) {
        expect(["Seguidores", "Alcance", "Impressões", "Engajamento", "Taxa de engajamento"]).not.toContain(col.name);
      }
    }
    expect(sheetNames).not.toContain("Análise de Plataformas");
    expect(sheetNames).not.toContain("Análise de Conteúdo");
  });

  test("a aba Financeiro alimenta o Painel com colunas compatíveis", () => {
    const finance = byName("Financeiro");
    const names = finance.columns.map((c) => c.name);
    expect(names).toEqual(["Data", "Cliente / favorecido", "Receita", "Despesa", "Categoria", "Descrição", "Status de pagamento", "Vencimento", "Data de pagamento"]);
    const revenueIdx = names.indexOf("Receita");
    expect(finance.rows.some((r) => Number(r[revenueIdx]) > 0)).toBe(true);
    const expenseIdx = names.indexOf("Despesa");
    expect(finance.rows.some((r) => Number(r[expenseIdx]) > 0)).toBe(true);
  });

  test("toCSV escapa vírgulas e aspas", () => {
    const sheet: SheetDef = {
      id: "t",
      name: "T",
      group: "Configuração e Marca",
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

function fixtureSheet(
  name: string,
  columns: SheetColumn[],
  rows: (string | number)[][],
): SheetDef {
  return {
    id: name.toLowerCase(),
    name,
    group: "Configuração e Marca",
    description: "Aba de teste",
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

describe("motor de fórmulas da planilha", () => {
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

  test("avalia as funções agregadas usadas pela planilha", () => {
    expect(evaluateFormula("=COUNTA(Data!A2:A1000)", book)).toBe(3);
    expect(evaluateFormula('=COUNTIF(Data!B2:B1000,"Done")', book)).toBe(2);
    expect(evaluateFormula('=SUMIF(Data!B2:B1000,"Done",Data!C2:C1000)', book)).toBe(400);
    expect(evaluateFormula('=SUMIF(Data!C2:C1000,">=200")', book)).toBe(500);
    expect(evaluateFormula("=SUM(Data!C2:C1000)", book)).toBe(600);
    expect(
      evaluateFormula('=SUMIFS(Data!C2:C1000,Data!B2:B1000,"Done",Data!C2:C1000,">=200")', book),
    ).toBe(300);
  });

  test("trata a linha 1 como cabeçalho e células ausentes como vazias", () => {
    expect(evaluateFormula("=COUNTA(Data!A1:A1)", book)).toBe(0);
    expect(evaluateFormula("=COUNTA(Data!Z2:Z100)", book)).toBe(0);
    expect(evaluateFormula('=COUNTIF(Data!Z2:Z100,"x")', book)).toBe(0);
  });

  test("suporta aritmética de datas e TEXT para critérios por mês", () => {
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

  test("falha sem quebrar — fórmulas não suportadas viram #ERROR em vez de lançar erro", () => {
    expect(evaluateFormula("=MADEUP(1)", book)).toBe("#ERROR");
    expect(evaluateFormula("=COUNTA(Nope!A2:A5)", book)).toBe("#ERROR");
  });

  test("a comparação de critérios segue a semântica de planilha", () => {
    expect(matchesCriteria("Done", "Done")).toBe(true);
    expect(matchesCriteria("done", "DONE")).toBe(true);
    expect(matchesCriteria("Done", "<>Done")).toBe(false);
    expect(matchesCriteria("", "<>Paid")).toBe(true);
    expect(matchesCriteria(200, ">=200")).toBe(true);
    expect(matchesCriteria("2026-09-09", ">=2026-09-01")).toBe(true);
    expect(matchesCriteria("2026-08-09", ">=2026-09-01")).toBe(false);
  });
});

describe("planejamento de faturas recorrentes", () => {
  const now = new Date("2026-09-15T12:00:00Z");
  const clients = [
    { id: "c1", name: "Northwind Coffee Roasters", status: "Active", monthlyFee: 4800 },
    { id: "c2", name: "Cliente pausado", status: "Paused", monthlyFee: 1000 },
    { id: "c3", name: "Cliente cortesia", status: "Active", monthlyFee: 0 },
  ];

  test("fatura clientes ativos com mensalidade, uma por mês, vencendo no dia 10", () => {
    const plan = planInvoices(clients, [], 2, undefined, now);
    expect(plan.map((p) => p.clientId)).toEqual(["c1", "c1"]);
    expect(plan.map((p) => p.month)).toEqual(["2026-09", "2026-10"]);
    expect(plan.every((p) => p.amount === 4800)).toBe(true);
    expect(plan.every((p) => p.dueDate === `${p.month}-10`)).toBe(true);
    expect(plan[0].description).toContain("Northwind Coffee Roasters");
    expect(plan[0].description).toContain("Mensalidade");
  });

  test("é idempotente — faturas existentes nunca são duplicadas", () => {
    const plan = planInvoices(clients, [], 2, undefined, now);
    const finance = plan.map((p) => ({ clientId: p.clientId, kind: "invoice" as const, date: p.month }));
    expect(planInvoices(clients, finance, 2, undefined, now)).toEqual([]);
    // Uma fatura de um mês anterior não bloqueia a janela atual.
    expect(
      planInvoices(clients, [{ clientId: "c1", kind: "invoice", date: "2026-08" }], 1, undefined, now),
    ).toHaveLength(1);
  });

  test("limita a janela a 12 meses e permite mirar um único cliente", () => {
    expect(planInvoices(clients, [], 99, undefined, now)).toHaveLength(12);
    expect(planInvoices(clients, [], 0, undefined, now)).toHaveLength(1);
    expect(planInvoices(clients, [], 1, "unknown-client", now)).toEqual([]);
    expect(planInvoices(clients, [], 2, "c1", now)).toHaveLength(2);
  });
});
