// Testes da validação estrita dos registros recebidos pelo backend.
// Execute com: bun test

import { describe, expect, test } from "bun:test";

import {
  parseWorkspaceBackup,
  parseWorkspaceProfile,
  parseWorkspaceRecord,
} from "../src/convex/recordValidation";

const client = {
  name: "Cliente de teste",
  contactName: "Contato",
  email: "contato@example.com",
  phone: "11999999999",
  website: "https://example.com",
  industry: "Serviços",
  packageName: "Mensal",
  monthlyFee: 1200,
  startDate: "2026-10-12",
  status: "Active",
  socials: {
    instagram: "@cliente",
  },
  notes: "",
  onboarding: {},
  strategy: [],
  kpis: [],
  createdAt: 1_760_000_000_000,
};

describe("validação estrita dos registros", () => {
  test("aceita um cliente válido", () => {
    expect(parseWorkspaceRecord("clients", client).name).toBe(
      "Cliente de teste",
    );
  });

  test("rejeita status desconhecido", () => {
    expect(() =>
      parseWorkspaceRecord("clients", {
        ...client,
        status: "Owner",
      }),
    ).toThrow("Dados inválidos (clients)");
  });

  test("rejeita campos extras enviados pelo cliente", () => {
    expect(() =>
      parseWorkspaceRecord("clients", {
        ...client,
        ownerId: "outro-dono",
      }),
    ).toThrow("ownerId");
  });

  test("rejeita data inexistente", () => {
    expect(() =>
      parseWorkspaceRecord("clients", {
        ...client,
        startDate: "2026-02-31",
      }),
    ).toThrow("data válida");
  });

  test("rejeita valor financeiro negativo", () => {
    expect(() =>
      parseWorkspaceRecord("finance", {
        date: "2026-10-12",
        type: "Expense",
        amount: -1,
        category: "Software",
        description: "Licença",
        status: "Paid",
        dueDate: "2026-10-12",
        paidDate: "2026-10-12",
      }),
    ).toThrow("não pode ser negativo");
  });

  test("permite limpar o cliente opcional de um lançamento financeiro", () => {
    expect(
      parseWorkspaceRecord("finance", {
        clientId: "",
        date: "2026-10-12",
        type: "Income",
        amount: 100,
        category: "Other",
        description: "Receita avulsa",
        status: "Pending",
        dueDate: "2026-10-12",
        paidDate: "",
      }),
    ).not.toHaveProperty("clientId");
  });
});

describe("validação de backup e perfil", () => {
  test("aceita um backup v1 e completa coleções ausentes com listas vazias", () => {
    const result = parseWorkspaceBackup({
      version: 1,
      clients: [],
    });

    expect(result.clients).toEqual([]);
    expect(result.finance).toEqual([]);
  });

  test("rejeita versões de backup desconhecidas", () => {
    expect(() =>
      parseWorkspaceBackup({
        version: 2,
      }),
    ).toThrow("Backup inválido");
  });

  test("rejeita parâmetros desconhecidos no perfil", () => {
    expect(() =>
      parseWorkspaceProfile(
        {
          unexpected: true,
        },
        true,
      ),
    ).toThrow("unexpected");
  });
});
