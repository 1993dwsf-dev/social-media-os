import { useCallback, useMemo, useState } from "react";
import type { PortalState } from "./types";
import { ONBOARDING_STEPS } from "./types";
import { buildDemoState } from "./demo";

const STORAGE_KEY = "contentplane.portal.v1";

function safeParse(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

/** Deep-merge stored state onto the demo state so missing keys get sensible
 * defaults and older saved versions still load. */
function mergeState(stored: unknown, fallback: PortalState): PortalState {
  if (!stored || typeof stored !== "object") return fallback;
  const out = { ...fallback } as unknown as Record<string, unknown>;
  const base = fallback as unknown as Record<string, unknown>;
  const rec = stored as Record<string, unknown>;
  for (const key of Object.keys(base)) {
    const incoming = rec[key];
    if (incoming === undefined || incoming === null) continue;
    const b = base[key];
    if (
      b && typeof b === "object" && !Array.isArray(b) &&
      incoming && typeof incoming === "object" && !Array.isArray(incoming)
    ) {
      out[key] = mergeState(incoming, b as PortalState);
    } else {
      out[key] = incoming;
    }
  }
  return out as unknown as PortalState;
}

function makeEmptyState(): PortalState {
  const demo = buildDemoState();
  return {
    ...demo,
    content: [],
    requests: [],
    meetings: [],
    deliverables: [],
    metrics: [],
    onboarding: Object.fromEntries(
      ONBOARDING_STEPS.map((k) => [k, ""]),
    ) as PortalState["onboarding"],
    strategy: [],
    kpis: [],
    onboardedAt: null,
    client: {
      ...demo.client,
      name: "New client",
      tagline: "",
      industry: "",
      website: "",
      email: "",
      phone: "",
      socials: {},
      notes: "",
    },
  };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export interface UsePortalStore {
  state: PortalState;
  usingDemo: boolean;
  loadDemo: () => void;
  resetPortal: () => void;
  update: (fn: (prev: PortalState) => PortalState) => void;
  exportJSON: () => void;
  importJSONFile: (file: File) => Promise<void>;
}

export function usePortalStore(): UsePortalStore {
  const [state, setState] = useState<PortalState>(() => {
    try {
      const stored = safeParse(localStorage.getItem(STORAGE_KEY));
      if (stored) return mergeState(stored, buildDemoState());
    } catch {
      /* ignore */
    }
    return buildDemoState();
  });

  const usingDemo = useMemo(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === null;
    } catch {
      return false;
    }
    // state identity is a good proxy: after any edit we persist, so no stored key => demo
  }, [state]);

  const persist = useCallback((next: PortalState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      console.warn("[Contentplane] localStorage write failed", err);
    }
  }, []);

  const update = useCallback(
    (fn: (prev: PortalState) => PortalState) => {
      setState((prev) => {
        const next = fn(prev);
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const loadDemo = useCallback(() => {
    const demo = buildDemoState();
    persist(demo);
    setState(demo);
  }, [persist]);

  const resetPortal = useCallback(() => {
    const empty = makeEmptyState();
    persist(empty);
    setState(empty);
  }, [persist]);

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    downloadBlob(blob, "contentplane-backup.json");
  }, [state]);

  const importJSONFile = useCallback(
    async (file: File) => {
      const parsed = safeParse(await file.text());
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Not a valid Contentplane backup (JSON object expected).");
      }
      const merged = mergeState(parsed, buildDemoState());
      persist(merged);
      setState(merged);
    },
    [persist],
  );

  return {
    state,
    usingDemo,
    loadDemo,
    resetPortal,
    update,
    exportJSON,
    importJSONFile,
  };
}
