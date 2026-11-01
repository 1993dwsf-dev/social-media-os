import { z } from "zod";

/**
 * Validação de entrada para as mutations públicas do Social Media OS.
 * O schema do Convex valida a estrutura persistida. Estas listas acrescentam
 * regras de negócio, limites e validação de valores às escritas públicas.
 */

const MAX_TEXT = 10_000;
const text = (max = MAX_TEXT) => z.string().max(max);
const requiredText = (max = 500) =>
  z.string().trim().min(1, "Campo obrigatório").max(max);

function validISODate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (year < 1 || month < 1 || month > 12) return false;

  const leap =
    year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);

  const days = [
    31,
    leap ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  return day >= 1 && day <= days[month - 1];
}

const dateOrBlank = z.string().refine(
  (value) => value === "" || validISODate(value),
  "Use uma data válida no formato AAAA-MM-DD",
);

const dateRequired = z.string().refine(
  validISODate,
  "Use uma data válida no formato AAAA-MM-DD",
);

const timeOrBlank = z.string().refine(
  (value) =>
    value === "" || /^([01]\d|2[0-3]):[0-5]\d$/.test(value),
  "Use um horário válido no formato HH:mm",
);

const emailOrBlank = text(254).refine(
  (value) =>
    value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  "E-mail inválido",
);

const money = z
  .number()
  .min(0, "O valor não pode ser negativo")
  .max(1_000_000_000);

const nonNegativeTimestamp = z.number().int().min(0);

const socialsSchema = z
  .object({
    instagram: text(300).optional(),
    tiktok: text(300).optional(),
    linkedin: text(300).optional(),
    youtube: text(300).optional(),
    facebook: text(300).optional(),
    pinterest: text(300).optional(),
    other: text(300).optional(),
  })
  .strict();

const onboardingSchema = z
  .object({
    company: text(5_000).optional(),
    contact: text(5_000).optional(),
    brand: text(5_000).optional(),
    socialAccounts: text(5_000).optional(),
    audience: text(5_000).optional(),
    objectives: text(5_000).optional(),
    competitors: text(5_000).optional(),
    contentPreferences: text(5_000).optional(),
    approvalPreferences: text(5_000).optional(),
    importantDates: text(5_000).optional(),
    brandAssets: text(5_000).optional(),
    notes: text(5_000).optional(),
  })
  .strict();

const strategySchema = z
  .array(
    z
      .object({
        key: requiredText(100),
        title: requiredText(200),
        items: z.array(text(2_000)).max(100),
      })
      .strict(),
  )
  .max(50);

const kpisSchema = z
  .array(
    z
      .object({
        name: requiredText(200),
        baseline: text(100),
        target: text(100),
        actual: text(100),
        unit: text(100),
        deadline: dateOrBlank,
      })
      .strict(),
  )
  .max(100);

const clientSchema = z
  .object({
    name: requiredText(160),
    contactName: text(160),
    email: emailOrBlank,
    phone: text(80),
    website: text(500),
    industry: text(300),
    packageName: text(300),
    monthlyFee: money,
    startDate: dateRequired,
    status: z.enum(["Active", "Paused", "Prospect", "Archived"]),
    socials: socialsSchema,
    notes: text(10_000),
    onboarding: onboardingSchema,
    strategy: strategySchema,
    kpis: kpisSchema,
    createdAt: nonNegativeTimestamp.optional(),
  })
  .strict();

const contentSchema = z
  .object({
    clientId: requiredText(128),
    date: dateRequired,
    platform: z.enum([
      "Instagram",
      "TikTok",
      "LinkedIn",
      "YouTube",
      "Facebook",
      "Pinterest",
    ]),
    format: text(100),
    topic: requiredText(500),
    caption: text(10_000),
    assetNote: text(5_000),
    status: z.enum([
      "Idea",
      "Drafting",
      "In Review",
      "Changes Requested",
      "Approved",
      "Scheduled",
      "Published",
    ]),
    managerNotes: text(10_000),
    clientComments: text(10_000),
    pillar: text(200),
    owner: text(200),
  })
  .strict();

const taskSchema = z
  .object({
    clientId: requiredText(128),
    title: requiredText(500),
    project: text(300),
    category: text(150),
    priority: z.enum(["Low", "Medium", "High"]),
    status: z.enum(["Backlog", "In Progress", "Blocked", "Done"]),
    startDate: dateOrBlank,
    dueDate: dateOrBlank,
    completedAt: dateOrBlank,
    dependsOn: text(1_000),
    notes: text(10_000),
  })
  .strict();

const requestSchema = z
  .object({
    clientId: requiredText(128),
    title: requiredText(500),
    category: text(150),
    priority: z.enum(["Low", "Medium", "High"]),
    dateSubmitted: dateOrBlank,
    status: z.enum([
      "New",
      "In Progress",
      "Waiting",
      "Completed",
      "Closed",
    ]),
    assignedTo: text(200),
    dueDate: dateOrBlank,
    comments: text(10_000),
  })
  .strict();

const meetingSchema = z
  .object({
    clientId: requiredText(128),
    title: requiredText(500),
    date: dateOrBlank,
    time: timeOrBlank,
    agenda: text(10_000),
    participants: text(2_000),
    status: z.enum(["Scheduled", "Completed", "Cancelled"]),
    notes: text(10_000),
    actionItems: text(10_000),
  })
  .strict();

const deliverableSchema = z
  .object({
    clientId: requiredText(128),
    name: requiredText(500),
    category: z.enum([
      "Brand assets",
      "Graphics",
      "Videos",
      "Reports",
      "Documents",
      "Final deliverables",
    ]),
    description: text(5_000),
    date: dateOrBlank,
    status: z.enum(["Shared", "In progress", "Archived"]),
    relatedContent: text(500),
    relatedProject: text(500),
  })
  .strict();

const financeSchema = z
  .object({
    clientId: text(128).optional(),
    date: dateOrBlank,
    type: z.enum(["Income", "Expense"]),
    amount: money,
    category: requiredText(150),
    description: requiredText(1_000),
    status: z.enum(["Paid", "Pending", "Overdue"]),
    dueDate: dateOrBlank,
    paidDate: dateOrBlank,
    kind: z.literal("invoice").optional(),
  })
  .strict();

const workspaceProfileSchema = z
  .object({
    managerName: text(160),
    agency: text(200),
    email: emailOrBlank,
    currency: z.string().max(3),
    weekStart: z.enum(["Monday", "Sunday"]),
    approvalTurnaroundDays: z.number().int().min(1).max(90),
    notifyEmail: z.boolean(),
    notifyApprovals: z.boolean(),
    notifyFinance: z.boolean(),
    density: z.enum(["comfortable", "compact"]),
  })
  .strict();

export const WORKSPACE_RECORD_TABLES = [
  "clients",
  "content",
  "tasks",
  "requests",
  "meetings",
  "deliverables",
  "finance",
] as const;

export type WorkspaceRecordTable =
  (typeof WORKSPACE_RECORD_TABLES)[number];

const recordSchemas = {
  clients: clientSchema,
  content: contentSchema,
  tasks: taskSchema,
  requests: requestSchema,
  meetings: meetingSchema,
  deliverables: deliverableSchema,
  finance: financeSchema,
} as const;

const patchSchemas = {
  // createdAt é gerado pelo servidor e nunca deve ser alterado por um patch.
  clients: clientSchema.omit({ createdAt: true }).partial().strict(),
  content: contentSchema.partial().strict(),
  tasks: taskSchema.partial().strict(),
  requests: requestSchema.partial().strict(),
  meetings: meetingSchema.partial().strict(),
  deliverables: deliverableSchema.partial().strict(),
  finance: financeSchema.partial().strict(),
} as const;

function firstIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  const field = issue?.path.length
    ? `${issue.path.join(".")}: `
    : "";

  return `${field}${issue?.message ?? "valor inválido"}`;
}

export function parseWorkspaceRecord(
  table: WorkspaceRecordTable,
  input: unknown,
  partial = false,
): Record<string, unknown> {
  const normalized =
    input &&
    typeof input === "object" &&
    !Array.isArray(input)
      ? { ...(input as Record<string, unknown>) }
      : input;

  // A UI usa string vazia para representar um lançamento
  // financeiro sem cliente.
  if (
    table === "finance" &&
    normalized &&
    typeof normalized === "object" &&
    !Array.isArray(normalized)
  ) {
    const record = normalized as Record<string, unknown>;

    if (record.clientId === "") {
      delete record.clientId;
    }
  }

  const schema = partial
    ? patchSchemas[table]
    : recordSchemas[table];

  const parsed = schema.safeParse(normalized);

  if (!parsed.success) {
    throw new Error(
      `Dados inválidos (${table}): ${firstIssue(parsed.error)}`,
    );
  }

  return parsed.data as unknown as Record<string, unknown>;
}

export function parseWorkspaceProfile(
  input: unknown,
  partial = false,
): Record<string, unknown> {
  const schema = partial
    ? workspaceProfileSchema.partial().strict()
    : workspaceProfileSchema;

  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    throw new Error(`Perfil inválido: ${firstIssue(parsed.error)}`);
  }

  return parsed.data as unknown as Record<string, unknown>;
}

const backupEnvelopeSchema = z
  .object({
    version: z.literal(1).optional(),
    exportedAt: text(100).optional(),
    profile: z.unknown().optional(),
    clients: z.array(z.unknown()).max(1_000).default([]),
    content: z.array(z.unknown()).max(1_000).default([]),
    tasks: z.array(z.unknown()).max(1_000).default([]),
    requests: z.array(z.unknown()).max(1_000).default([]),
    meetings: z.array(z.unknown()).max(1_000).default([]),
    deliverables: z.array(z.unknown()).max(1_000).default([]),
    finance: z.array(z.unknown()).max(1_000).default([]),
  })
  .strict();

export interface WorkspaceBackup {
  version?: 1;
  exportedAt?: string;
  profile?: unknown;
  clients: unknown[];
  content: unknown[];
  tasks: unknown[];
  requests: unknown[];
  meetings: unknown[];
  deliverables: unknown[];
  finance: unknown[];
}

export function parseWorkspaceBackup(
  input: unknown,
): WorkspaceBackup {
  const parsed = backupEnvelopeSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(`Backup inválido: ${firstIssue(parsed.error)}`);
  }

  const totalRows =
    parsed.data.clients.length +
    parsed.data.content.length +
    parsed.data.tasks.length +
    parsed.data.requests.length +
    parsed.data.meetings.length +
    parsed.data.deliverables.length +
    parsed.data.finance.length;

  if (totalRows > 1_000) {
    throw new Error(
      "O backup excede o limite de 1.000 registros por importação.",
    );
  }

  if (
    parsed.data.version !== undefined &&
    parsed.data.version !== 1
  ) {
    throw new Error("Versão do backup não suportada.");
  }

  return parsed.data as WorkspaceBackup;
}
