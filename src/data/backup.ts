// Shared limits keep exported pilot backups compatible with restoration.
export const BACKUP_MAX_RECORDS = 1_000;
export const BACKUP_MAX_BYTES = 500_000;
export const BACKUP_TABLES = [
  "clients",
  "content",
  "tasks",
  "requests",
  "meetings",
  "deliverables",
  "finance",
] as const;

export const DEFAULT_WORKSPACE_PROFILE = {
  managerName: "",
  agency: "",
  email: "",
  currency: "R$",
  weekStart: "Monday" as const,
  approvalTurnaroundDays: 3,
  notifyEmail: true,
  notifyApprovals: true,
  notifyFinance: false,
  density: "comfortable" as const,
};

export function assertBackupLimits(snapshot: unknown): void {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    throw new Error("Backup inválido.");
  }
  const record = snapshot as Record<string, unknown>;
  const count = BACKUP_TABLES.reduce((sum, table) => {
    const rows = record[table];
    return sum + (Array.isArray(rows) ? rows.length : 0);
  }, 0);
  if (count > BACKUP_MAX_RECORDS) {
    throw new Error(
      "Limite do piloto: 1.000 registros no espaço de trabalho. Nenhum dado foi alterado.",
    );
  }
  if (
    new TextEncoder().encode(JSON.stringify(snapshot)).byteLength >
    BACKUP_MAX_BYTES
  ) {
    throw new Error(
      "Limite do piloto: 500 KB de dados para backup e restauração. Reduza os textos ou procure o suporte. Nenhum dado foi alterado.",
    );
  }
}

export function workspaceLoaded(values: readonly unknown[]): boolean {
  return values.every((value) => value !== undefined);
}
