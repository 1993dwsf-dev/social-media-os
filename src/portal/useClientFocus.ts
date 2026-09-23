// Foco de cliente: uma seleção única compartilhada por todo o workspace.
//
// O seletor da barra superior define o "cliente ativo" para que todas as seções
// (calendário, tarefas, estratégia, integração, financeiro…) sigam o mesmo foco
// sem manter cada uma o seu próprio menu. A seleção fica na URL
// (`/app/dashboard?client=<id>`), então o foco sobrevive a recarregamentos e ao
// botão voltar/avançar.

import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";

import type { ClientRecord } from "@/data/types";

export interface ClientFocus {
  /** Id do cliente em foco, ou "" quando o foco é "todos os clientes". */
  clientId: string;
  /** Registro do cliente em foco, ou undefined para "todos os clientes". */
  client: ClientRecord | undefined;
  /** True quando o workspace está limitado a um único cliente. */
  isFocused: boolean;
  /** Define o foco em um cliente, ou "" para limpar (mostrar todos). */
  setFocus: (id: string) => void;
  /** clientId padrão para novos registros — o cliente em foco, se houver. */
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
    // Enquanto os clientes carregam, aceita o valor da URL como está para que
    // o seletor possa ser renderizado; o registro resolve quando os dados chegam.
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
