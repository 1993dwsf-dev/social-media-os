// Hook do workspace do gestor com dados do Convex.
//
// Cada registro é uma consulta reativa do Convex limitada à conta logada, então
// abrir o app em outro dispositivo mostra os mesmos clientes, calendário,
// tarefas e dinheiro. As escritas passam pelas mutations de `src/convex/portal.ts`.

import { useCallback, useMemo } from "react";
import { useConvex, useMutation, useQuery } from "convex/react";

import {
  assertBackupLimits,
  BACKUP_MAX_BYTES,
  DEFAULT_WORKSPACE_PROFILE,
  workspaceLoaded,
} from "./backup";
import { type CsvTable, tableCSV } from "./csv";
import { api } from "@/convex/_generated/api";
import type {
  ClientRecord,
  ContentItem,
  DeliverableItem,
  FinanceEntry,
  MeetingItem,
  RequestItem,
  TaskItem,
  WorkspaceProfile,
} from "./types";

/** Documentos do Convex trazem `_id`/`ownerId`; o modelo da UI usa `id`. */
type Doc = { _id: string } & Record<string, unknown>;

export interface WorkspaceData {
  ready: boolean;
  clients: ClientRecord[];
  content: ContentItem[];
  tasks: TaskItem[];
  requests: RequestItem[];
  meetings: MeetingItem[];
  deliverables: DeliverableItem[];
  finance: FinanceEntry[];
  profile: WorkspaceProfile;
  clientOf: (id?: string) => ClientRecord | undefined;
  clientName: (id?: string) => string;
  money: (amount: number) => string;
}

export interface WorkspaceActions {
  saveClient: (data: Partial<ClientRecord>, id?: string) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  saveContent: (data: Omit<ContentItem, "id">, id?: string) => Promise<void>;
  saveTask: (data: Omit<TaskItem, "id">, id?: string) => Promise<void>;
  saveRequest: (data: Omit<RequestItem, "id">, id?: string) => Promise<void>;
  saveMeeting: (data: Omit<MeetingItem, "id">, id?: string) => Promise<void>;
  saveDeliverable: (
    data: Omit<DeliverableItem, "id">,
    id?: string,
  ) => Promise<void>;
  saveFinance: (data: Omit<FinanceEntry, "id">, id?: string) => Promise<void>;
  remove: (
    kind:
      | "content"
      | "task"
      | "request"
      | "meeting"
      | "deliverable"
      | "finance",
    id: string,
  ) => Promise<void>;
  saveProfile: (patch: Partial<WorkspaceProfile>) => Promise<void>;
  seedDemo: () => Promise<void>;
  clearWorkspace: () => Promise<void>;
  exportJSON: () => Promise<void>;
  exportCSV: (table: CsvTable, clientId?: string) => Promise<void>;
  importJSON: (file: File, allowMerge?: boolean) => Promise<void>;
}

export type Workspace = WorkspaceData & WorkspaceActions;

export const DEFAULT_PROFILE: WorkspaceProfile = DEFAULT_WORKSPACE_PROFILE;

function strip(doc: Doc): Record<string, unknown> & { id: string } {
  const {
    _id: docId,
    _creationTime: _createdAt,
    ownerId: _ownerId,
    ...rest
  } = doc as Doc & {
    _creationTime?: number;
    ownerId?: string;
  };
  return { id: docId, ...rest };
}

function sortBy<T>(
  rows: T[],
  key: (row: T) => string,
  direction: "asc" | "desc" = "asc",
): T[] {
  return [...rows].sort((a, b) => {
    const left = key(a);
    const right = key(b);
    if (left === right) return 0;
    const result = left < right ? -1 : 1;
    return direction === "asc" ? result : -result;
  });
}

function download(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

const EMPTY_DOCS: Doc[] = [];

export function useWorkspace(): Workspace {
  const convex = useConvex();
  const clientsRaw = useQuery(api.portal.listClients);
  const contentRaw = useQuery(api.portal.listContent);
  const tasksRaw = useQuery(api.portal.listTasks);
  const requestsRaw = useQuery(api.portal.listRequests);
  const meetingsRaw = useQuery(api.portal.listMeetings);
  const deliverablesRaw = useQuery(api.portal.listDeliverables);
  const financeRaw = useQuery(api.portal.listFinance);
  const workspaceRaw = useQuery(api.portal.getWorkspace);

  const createClient = useMutation(api.portal.createClient);
  const updateClient = useMutation(api.portal.updateClient);
  const removeClientMutation = useMutation(api.portal.removeClient);
  const saveWorkspace = useMutation(api.portal.saveWorkspace);
  const seedDemoMutation = useMutation(api.demo.seedDemo);
  const clearMutation = useMutation(api.portal.clearWorkspace);
  const importWorkspaceMutation = useMutation(api.portal.importWorkspace);

  const contentCreate = useMutation(api.portal.createContent);
  const contentUpdate = useMutation(api.portal.updateContent);
  const contentRemove = useMutation(api.portal.removeContent);
  const contentApi = useMemo(
    () => ({
      create: contentCreate,
      update: contentUpdate,
      remove: contentRemove,
    }),
    [contentCreate, contentUpdate, contentRemove],
  );
  const tasksCreate = useMutation(api.portal.createTask);
  const tasksUpdate = useMutation(api.portal.updateTask);
  const tasksRemove = useMutation(api.portal.removeTask);
  const tasksApi = useMemo(
    () => ({ create: tasksCreate, update: tasksUpdate, remove: tasksRemove }),
    [tasksCreate, tasksUpdate, tasksRemove],
  );
  const requestsCreate = useMutation(api.portal.createRequest);
  const requestsUpdate = useMutation(api.portal.updateRequest);
  const requestsRemove = useMutation(api.portal.removeRequest);
  const requestsApi = useMemo(
    () => ({
      create: requestsCreate,
      update: requestsUpdate,
      remove: requestsRemove,
    }),
    [requestsCreate, requestsUpdate, requestsRemove],
  );
  const meetingsCreate = useMutation(api.portal.createMeeting);
  const meetingsUpdate = useMutation(api.portal.updateMeeting);
  const meetingsRemove = useMutation(api.portal.removeMeeting);
  const meetingsApi = useMemo(
    () => ({
      create: meetingsCreate,
      update: meetingsUpdate,
      remove: meetingsRemove,
    }),
    [meetingsCreate, meetingsUpdate, meetingsRemove],
  );
  const deliverablesCreate = useMutation(api.portal.createDeliverable);
  const deliverablesUpdate = useMutation(api.portal.updateDeliverable);
  const deliverablesRemove = useMutation(api.portal.removeDeliverable);
  const deliverablesApi = useMemo(
    () => ({
      create: deliverablesCreate,
      update: deliverablesUpdate,
      remove: deliverablesRemove,
    }),
    [deliverablesCreate, deliverablesUpdate, deliverablesRemove],
  );
  const financeCreate = useMutation(api.portal.createFinance);
  const financeUpdate = useMutation(api.portal.updateFinance);
  const financeRemove = useMutation(api.portal.removeFinance);
  const financeApi = useMemo(
    () => ({
      create: financeCreate,
      update: financeUpdate,
      remove: financeRemove,
    }),
    [financeCreate, financeUpdate, financeRemove],
  );

  const clients = useMemo(
    () =>
      sortBy((clientsRaw ?? EMPTY_DOCS) as Doc[], (c) => String(c.name)).map(
        (c) => strip(c) as unknown as ClientRecord,
      ),
    [clientsRaw],
  );

  const content = useMemo(
    () =>
      sortBy((contentRaw ?? EMPTY_DOCS) as Doc[], (c) => String(c.date)).map(
        (c) => strip(c) as unknown as ContentItem,
      ),
    [contentRaw],
  );

  const tasks = useMemo(
    () =>
      sortBy((tasksRaw ?? EMPTY_DOCS) as Doc[], (t) => String(t.dueDate)).map(
        (t) => strip(t) as unknown as TaskItem,
      ),
    [tasksRaw],
  );

  const requests = useMemo(
    () =>
      sortBy(
        (requestsRaw ?? EMPTY_DOCS) as Doc[],
        (r) => String(r.dateSubmitted),
        "desc",
      ).map((r) => strip(r) as unknown as RequestItem),
    [requestsRaw],
  );

  const meetings = useMemo(
    () =>
      sortBy((meetingsRaw ?? EMPTY_DOCS) as Doc[], (m) => String(m.date)).map(
        (m) => strip(m) as unknown as MeetingItem,
      ),
    [meetingsRaw],
  );

  const deliverables = useMemo(
    () =>
      sortBy(
        (deliverablesRaw ?? EMPTY_DOCS) as Doc[],
        (d) => String(d.date),
        "desc",
      ).map((d) => strip(d) as unknown as DeliverableItem),
    [deliverablesRaw],
  );

  const finance = useMemo(
    () =>
      sortBy(
        (financeRaw ?? EMPTY_DOCS) as Doc[],
        (f) => String(f.date),
        "desc",
      ).map((f) => {
        const item = strip(f) as unknown as FinanceEntry;
        return { ...item, clientId: (f.clientId as string | undefined) ?? "" };
      }),
    [financeRaw],
  );

  const profile = useMemo<WorkspaceProfile>(() => {
    if (!workspaceRaw) return DEFAULT_PROFILE;
    const doc = workspaceRaw as unknown as Record<string, unknown>;
    return {
      managerName: String(doc.managerName ?? ""),
      agency: String(doc.agency ?? ""),
      email: String(doc.email ?? ""),
      currency: String(doc.currency ?? "R$"),
      weekStart: doc.weekStart === "Sunday" ? "Sunday" : "Monday",
      approvalTurnaroundDays: Number(doc.approvalTurnaroundDays ?? 3),
      notifyEmail: Boolean(doc.notifyEmail ?? true),
      notifyApprovals: Boolean(doc.notifyApprovals ?? true),
      notifyFinance: Boolean(doc.notifyFinance ?? false),
      density: doc.density === "compact" ? "compact" : "comfortable",
    };
  }, [workspaceRaw]);

  const byId = useMemo(() => {
    const map = new Map<string, ClientRecord>();
    for (const client of clients) map.set(client.id, client);
    return map;
  }, [clients]);

  const clientOf = useCallback(
    (id?: string) => (id ? byId.get(id) : undefined),
    [byId],
  );
  const clientName = useCallback(
    (id?: string) =>
      id ? (byId.get(id)?.name ?? "Cliente não encontrado") : "—",
    [byId],
  );
  const money = useCallback(
    (amount: number) =>
      `${profile.currency}${amount.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}`,
    [profile.currency],
  );

  /** Remove o clientId vazio para que relações opcionais continuem opcionais. */
  const withClient = <T extends { clientId?: string }>(data: T) => ({
    ...data,
    clientId: data.clientId ? data.clientId : undefined,
  });

  const saveClient = useCallback(
    async (data: Partial<ClientRecord>, id?: string) => {
      if (id) await updateClient({ id, patch: data });
      else await createClient({ data });
    },
    [createClient, updateClient],
  );

  const exportJSON = useCallback(async () => {
    const snapshot = await convex.query(api.portal.exportWorkspace, {});
    if (!snapshot) throw new Error("Entre novamente para exportar seus dados.");
    assertBackupLimits(snapshot);
    // Compact JSON uses exactly the same byte budget as backend validation.
    download(
      "social-media-os-backup.json",
      JSON.stringify(snapshot),
      "application/json",
    );
  }, [convex]);

  const exportCSV = useCallback(
    async (table: CsvTable, clientId?: string) => {
      const snapshot = await convex.query(api.portal.exportWorkspace, {});
      if (!snapshot)
        throw new Error("Entre novamente para exportar seus dados.");
      const rows = (
        snapshot as unknown as Record<string, Record<string, unknown>[]>
      )[table];
      const scoped = clientId
        ? rows.filter((row) =>
            table === "clients"
              ? row.id === clientId
              : row.clientId === clientId,
          )
        : rows;
      download(
        `social-media-os-${table}.csv`,
        tableCSV(scoped),
        "text/csv;charset=utf-8",
      );
    },
    [convex],
  );

  const importJSON = useCallback(
    async (file: File, allowMerge = false) => {
      // Limite operacional do arquivo de importação.
      if (file.size > BACKUP_MAX_BYTES) {
        throw new Error(
          "O backup é maior que 500 KB. Exporte uma base menor e tente novamente.",
        );
      }

      let parsed: unknown;

      try {
        parsed = JSON.parse(await file.text());
      } catch {
        throw new Error("O arquivo não contém um JSON válido.");
      }

      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error(
          "Backup do Social Media OS inválido (esperado um objeto JSON).",
        );
      }

      assertBackupLimits(parsed);

      // Uma única mutation valida o arquivo, reconstrói os vínculos
      // e grava tudo numa transação Convex.
      await importWorkspaceMutation({
        snapshot: parsed,
        allowMerge,
      });
    },
    [importWorkspaceMutation],
  );

  const remove = useCallback(
    async (
      kind:
        | "content"
        | "task"
        | "request"
        | "meeting"
        | "deliverable"
        | "finance",
      id: string,
    ) => {
      const apis = {
        content: contentApi,
        task: tasksApi,
        request: requestsApi,
        meeting: meetingsApi,
        deliverable: deliverablesApi,
        finance: financeApi,
      } as const;
      await apis[kind].remove({ id });
    },
    [
      contentApi,
      tasksApi,
      requestsApi,
      meetingsApi,
      deliverablesApi,
      financeApi,
    ],
  );

  const saveContent = useCallback(
    async (data: Omit<ContentItem, "id">, id?: string) => {
      const payload = withClient(
        data as { clientId?: string } & Record<string, unknown>,
      );
      if (id) await contentApi.update({ id, patch: payload });
      else await contentApi.create({ data: payload });
    },
    [contentApi],
  );

  const saveTask = useCallback(
    async (data: Omit<TaskItem, "id">, id?: string) => {
      const payload = withClient(
        data as { clientId?: string } & Record<string, unknown>,
      );
      if (id) await tasksApi.update({ id, patch: payload });
      else await tasksApi.create({ data: payload });
    },
    [tasksApi],
  );

  const saveRequest = useCallback(
    async (data: Omit<RequestItem, "id">, id?: string) => {
      const payload = withClient(
        data as { clientId?: string } & Record<string, unknown>,
      );
      if (id) await requestsApi.update({ id, patch: payload });
      else await requestsApi.create({ data: payload });
    },
    [requestsApi],
  );

  const saveMeeting = useCallback(
    async (data: Omit<MeetingItem, "id">, id?: string) => {
      const payload = withClient(
        data as { clientId?: string } & Record<string, unknown>,
      );
      if (id) await meetingsApi.update({ id, patch: payload });
      else await meetingsApi.create({ data: payload });
    },
    [meetingsApi],
  );

  const saveDeliverable = useCallback(
    async (data: Omit<DeliverableItem, "id">, id?: string) => {
      const payload = withClient(
        data as { clientId?: string } & Record<string, unknown>,
      );
      if (id) await deliverablesApi.update({ id, patch: payload });
      else await deliverablesApi.create({ data: payload });
    },
    [deliverablesApi],
  );

  const saveFinance = useCallback(
    async (data: Omit<FinanceEntry, "id">, id?: string) => {
      const payload = withClient(
        data as { clientId?: string } & Record<string, unknown>,
      );
      if (id) await financeApi.update({ id, patch: payload });
      else await financeApi.create({ data: payload });
    },
    [financeApi],
  );

  return {
    ready: workspaceLoaded([
      clientsRaw,
      contentRaw,
      tasksRaw,
      requestsRaw,
      meetingsRaw,
      deliverablesRaw,
      financeRaw,
      workspaceRaw,
    ]),
    clients,
    content,
    tasks,
    requests,
    meetings,
    deliverables,
    finance,
    profile,
    clientOf,
    clientName,
    money,
    saveClient,
    deleteClient: async (id) => {
      await removeClientMutation({ id });
    },
    saveContent,
    saveTask,
    saveRequest,
    saveMeeting,
    saveDeliverable,
    saveFinance,
    remove,
    saveProfile: async (patch) => {
      await saveWorkspace({ patch });
    },
    seedDemo: async () => {
      await seedDemoMutation({});
    },
    clearWorkspace: async () => {
      await clearMutation({});
    },
    exportJSON,
    exportCSV,
    importJSON,
  };
}
