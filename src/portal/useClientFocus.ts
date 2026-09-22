// Client focus: a single selection shared by the whole workspace.
//
// The topbar selector sets the "active client" so every section (calendar,
// tasks, strategy, onboarding, finance…) follows the same focus without each
// one maintaining its own dropdown. The selection lives in the URL
// (`/app/dashboard?client=<id>`), so focus survives reloads and back/forward.

import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";

import type { ClientRecord } from "@/data/types";

export interface ClientFocus {
  /** The focused client id, or "" when the focus is "all clients". */
  clientId: string;
  /** The focused client record, or undefined for "all clients". */
  client: ClientRecord | undefined;
  /** True when the workspace is scoped to a single client. */
  isFocused: boolean;
  /** Set the focus to a client id, or "" to clear it (show all clients). */
  setFocus: (id: string) => void;
  /** Default clientId for new records — the focused client, if any. */
  defaultClientId: string;
}

export function useClientFocus(
  clients: ClientRecord[],
  isReady: boolean,
): ClientFocus {
  const [params, setParams] = useSearchParams();
  const raw = params.get("client") ?? "";

  const setFocus = useCallback(
    (id: string) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (id) next.set("client", id);
          else next.delete("client");
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  return useMemo(() => {
    // While clients are still loading, accept the URL value as-is so the
    // selector can render; the focused record resolves once data arrives.
    const valid = isReady && clients.some((c) => c.id === raw);
    const clientId = valid ? raw : "";
    return {
      clientId,
      client: clientId ? clients.find((c) => c.id === clientId) : undefined,
      isFocused: Boolean(clientId),
      setFocus,
      defaultClientId: clientId,
    };
  }, [clients, isReady, raw, setFocus]);
}
