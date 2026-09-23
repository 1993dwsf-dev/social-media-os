import { useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, Download, Files, Search } from "lucide-react";

import logo from "@/assets/logo.svg";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { computeWorkbook } from "@/data/formula";
import {
  buildWorkbookSheets,
  downloadCSV,
  downloadAllSheetsCSV,
  SHEET_GROUPS,
} from "@/data/workbook";
import type { SheetDef } from "@/data/workbook";

// Status → fundo colorido da célula (espelha a formatação condicional da planilha).
const STATUS_TINT: Record<string, string> = {
  Ideia: "bg-muted text-muted-foreground",
  Rascunhando: "bg-sky-50 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200",
  "Em revisão": "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
  "Alterações solicitadas": "bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200",
  Aprovado: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
  Agendado: "bg-indigo-50 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200",
  Publicado: "bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-200",
  Concluído: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
  "Em andamento": "bg-sky-50 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200",
  Bloqueado: "bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200",
  "A fazer": "bg-muted text-muted-foreground",
  Pendente: "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
  Pago: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
  Atrasado: "bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200",
  Rascunho: "bg-muted text-muted-foreground",
  "Em espera": "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
  "Não necessário": "bg-muted text-muted-foreground",
  "Em produção": "bg-sky-50 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200",
  Arquivada: "bg-muted text-muted-foreground",
  "Pronto para planejar": "bg-indigo-50 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200",
  "Não iniciado": "bg-muted text-muted-foreground",
  Compartilhado: "bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-200",
  "No caminho": "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
  Atenção: "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
  "Em risco": "bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200",
  Ativa: "bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-200",
  Planejada: "bg-sky-50 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200",
  Aposentada: "bg-muted text-muted-foreground",
};

const STATUS_WORDS = new Set(Object.keys(STATUS_TINT));

function Cell({
  value,
  type,
  formula,
}: {
  value: string | number;
  type?: string;
  formula?: string;
}) {
  const s = String(value);
  if (s === "") return <TableCell className="text-muted-foreground/40">·</TableCell>;

  const isStatus = STATUS_WORDS.has(s);
  const isFormula = s.startsWith("=");
  const isDate = type === "date" && /^\d{4}-\d{2}-\d{2}$/.test(s);
  const title = formula ?? undefined;

  // Célula de fórmula mostra o valor calculado; ao passar o mouse, a fórmula.
  if (title) {
    return (
      <TableCell className="tabular text-xs font-medium text-primary" title={title}>
        {typeof value === "number" ? value.toLocaleString("pt-BR") : s}
      </TableCell>
    );
  }
  if (isFormula) {
    return (
      <TableCell className="tabular max-w-[280px] truncate font-mono text-[11px] text-primary">
        {s}
      </TableCell>
    );
  }
  if (isStatus) {
    return (
      <TableCell>
        <span
          className={cn(
            "inline-block rounded-full px-2 py-0.5 text-[11px] font-medium",
            STATUS_TINT[s],
          )}
        >
          {s}
        </span>
      </TableCell>
    );
  }
  if (isDate) {
    return (
      <TableCell className="tabular text-xs">
        {new Date(`${s}T00:00:00`).toLocaleDateString("pt-BR", {
          month: "short",
          day: "numeric",
          year: "2-digit",
        })}
      </TableCell>
    );
  }
  if (type === "currency" || type === "number") {
    return <TableCell className="tabular text-xs">{Number(value).toLocaleString("pt-BR")}</TableCell>;
  }
  if (type === "percent") {
    return (
      <TableCell className="tabular text-xs">
        {typeof value === "number" ? `${Math.round(value * 100)}%` : s}
      </TableCell>
    );
  }
  return <TableCell className="max-w-[260px] truncate text-xs">{s}</TableCell>;
}

export default function Workbook() {
  const sheets = useMemo(() => computeWorkbook(buildWorkbookSheets()), []);
  const [activeId, setActiveId] = useState(sheets[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");

  const sheet: SheetDef = sheets.find((s) => s.id === activeId) ?? sheets[0];

  const filteredSheets = sheets.filter(
    (s) => groupFilter === "all" || s.group === groupFilter,
  );

  // Filtra as linhas pelo termo buscado (todas as colunas), mantendo o índice
  // original para que valores calculados e números de linha fiquem alinhados.
  const rows = useMemo(() => {
    const all = sheet.rows.map((row, index) => ({ row, index }));
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter(({ row }) => row.some((c) => String(c).toLowerCase().includes(q)));
  }, [sheet, search]);

  const groups = [...new Set(sheets.map((s) => s.group))];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Barra superior */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center gap-3 px-4 sm:px-6">
          <Button asChild variant="ghost" size="icon" className="size-8">
            <Link to="/app/dashboard" aria-label="Voltar ao painel">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <img src={logo} alt="" className="size-7 rounded-md" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">
              Planilha do Gestor — Contentplane
            </p>
            <p className="text-[11px] leading-tight text-muted-foreground">
              {sheets.length} abas · fórmulas, listas suspensas e formatação de status
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrar linhas…"
                className="h-9 w-48 pl-8"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadAllSheetsCSV(sheets)}
              title="Baixar todas as abas em CSV"
            >
              <Files className="mr-1.5 size-3.5" /> Todos os CSVs
            </Button>
            <Button size="sm" onClick={() => downloadCSV(sheet)}>
              <Download className="mr-1.5 size-3.5" /> CSV da aba
            </Button>
          </div>
        </div>
      </header>

      {/* Abas das planilhas */}
      <div className="sticky top-14 z-20 border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6">
          <div className="flex items-center gap-2 py-2">
            <Select value={groupFilter} onValueChange={setGroupFilter}>
              <SelectTrigger className="h-8 w-40 shrink-0 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os grupos</SelectItem>
                {groups.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="scrollbar-thin flex flex-1 gap-1 overflow-x-auto pb-1">
              {filteredSheets.map((s, i) => {
                const isActive = s.id === sheet.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveId(s.id)}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
                      isActive
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border/60 bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                    title={s.description}
                  >
                    <span
                      className="size-1.5 rounded-full"
                      style={{ backgroundColor: SHEET_GROUPS[s.group] }}
                    />
                    <span className="tabular text-[10px] text-muted-foreground/70">
                      {sheets.indexOf(s) + 1}
                    </span>
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo da aba */}
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-5 sm:px-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              <span className="tabular mr-2 text-sm text-muted-foreground">
                {sheets.indexOf(sheet) + 1}/{sheets.length}
              </span>
              {sheet.name}
            </h1>
            <p className="mt-0.5 max-w-3xl text-xs text-muted-foreground">{sheet.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{sheet.group}</Badge>
            <Badge variant="outline">{sheet.columns.length} colunas</Badge>
            <Badge variant="outline">{sheet.rows.length} linhas</Badge>
          </div>
        </div>

        <div className="card-lift overflow-hidden rounded-xl border border-border/70 bg-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/60 hover:bg-muted/60">
                  <TableHead className="w-10 text-[10px] text-muted-foreground/70">#</TableHead>
                  {sheet.columns.map((c) => (
                    <TableHead key={c.name} style={{ minWidth: c.width }} className="text-xs">
                      {c.name}
                      {c.type === "select" ? (
                        <span className="ml-1 text-[9px] text-muted-foreground/60">▾</span>
                      ) : null}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ row, index: ri }) => (
                  <TableRow key={ri} className={ri % 2 ? "bg-muted/20" : ""}>
                    <TableCell className="tabular text-[10px] text-muted-foreground/60">
                      {ri + 1}
                    </TableCell>
                    {row.map((cell, ci) => {
                      const isFormula = typeof cell === "string" && cell.startsWith("=");
                      return (
                        <Cell
                          key={ci}
                          value={isFormula ? sheet.computed?.[ri]?.[ci] ?? "" : cell}
                          type={sheet.columns[ci]?.type}
                          formula={isFormula ? cell : undefined}
                        />
                      );
                    })}
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={sheet.columns.length + 1} className="h-24 text-center">
                      <p className="text-sm text-muted-foreground">
                        Nenhuma linha corresponde a “{search}”.
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <p className="mt-3 text-[11px] text-muted-foreground">
          Cabeçalhos fixos, validação por lista suspensa (▾), formatação condicional de status e
          fórmulas entre abas reproduzem a especificação da planilha — células de fórmula mostram o
          valor calculado; passe o mouse para ver a fórmula. As células de entrada estão em branco
          nos calendários mensais — prontas para o planejamento real.
        </p>
      </main>
    </div>
  );
}
