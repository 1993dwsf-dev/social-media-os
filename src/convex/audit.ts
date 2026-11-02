// Auditoria de leitura para preparar a ativação de schemaValidation.
//
// As validações vivem em `./recordValidation` (nome sem hífen, como exige o
// bundler das funções do Convex). A função varre os documentos atuais, devolve
// IDs e mensagens de validação — nunca o conteúdo pessoal dos registros — e
// deve rodar antes de mudar schemaValidation para true.

import {
  parseWorkspaceProfile,
  parseWorkspaceRecord,
  type WorkspaceRecordTable,
} from "./recordValidation";
import { internalQuery } from "./_generated/server";

/* eslint-disable @typescript-eslint/no-explicit-any */

const DATA_TABLES: WorkspaceRecordTable[] = [
  "clients",
  "content",
  "tasks",
  "requests",
  "meetings",
  "deliverables",
  "finance",
];

export const reportStoredDataIssues = internalQuery({
  args: {},
  handler: async (ctx) => {
    const store = ctx.db as any;
    const findings: {
      table: string;
      id: string;
      reason: string;
    }[] = [];

    let checked = 0;

    for (const table of DATA_TABLES) {
      const rows = (await store.query(table).collect()) as any[];

      for (const row of rows) {
        checked += 1;

        const {
          _id,
          _creationTime: _createdAt,
          ownerId: _ownerId,
          ...record
        } = row;

        try {
          parseWorkspaceRecord(table, record);
        } catch (error) {
          findings.push({
            table,
            id: String(_id),
            reason:
              error instanceof Error ? error.message : "Registro inválido",
          });
        }
      }
    }

    const workspaces = await ctx.db.query("workspaces").collect();

    for (const row of workspaces) {
      checked += 1;

      const {
        _id,
        _creationTime: _createdAt,
        ownerId: _ownerId,
        ...profile
      } = row;

      try {
        parseWorkspaceProfile(profile);
      } catch (error) {
        findings.push({
          table: "workspaces",
          id: String(_id),
          reason: error instanceof Error ? error.message : "Perfil inválido",
        });
      }
    }

    return {
      checked,
      invalidCount: findings.length,

      // Limita a resposta; IDs adicionais continuam refletidos em invalidCount.
      findings: findings.slice(0, 500),
      truncated: findings.length > 500,
    };
  },
});
