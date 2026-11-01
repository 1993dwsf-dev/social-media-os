// Espaço de exemplo fictício do Social Media OS.
//
// Quatro clientes de uma gestora de social media independente, com conteúdos,
// tarefas, solicitações, reuniões, entregas e finanças distribuídos ao redor de
// "hoje" para que calendário, painel e visão financeira já apareçam populados.

import { activeUser } from "./activeUser";

import { assertWorkspaceCapacity } from "./workspaceData";
import { mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = (ctx: any) => ctx.db as any;

const OWNED_TABLES = [
  "clients",
  "content",
  "tasks",
  "requests",
  "meetings",
  "deliverables",
  "finance",
] as const;

function iso(offsetDays: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function monthDay(monthOffset: number, day: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(1);
  d.setMonth(d.getMonth() + monthOffset, Math.min(day, 28));
  return d.toISOString().slice(0, 10);
}

function statusForOffset(offset: number): string {
  if (offset <= -3) return "Published";
  if (offset <= 1) return "Scheduled";
  if (offset <= 6) return "In Review";
  if (offset <= 12) return "Drafting";
  return "Idea";
}

interface ClientSeed {
  slug: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  industry: string;
  packageName: string;
  monthlyFee: number;
  startDate: string;
  status: string;
  socials: Record<string, string>;
  notes: string;
  audience: string;
  objectives: string;
  pillars: string[];
  topics: string[];
  platforms: string[];
  formats: string[];
  owner: string;
}

const CLIENTS: ClientSeed[] = [
  {
    slug: "northwind",
    name: "Northwind Coffee Roasters",
    contactName: "Maiara Okano",
    email: "maiara@northwindcoffee.exemplo",
    phone: "+55 (11) 95555-0142",
    website: "northwindcoffee.exemplo",
    industry: "Torrefação de cafés especiais",
    packageName: "Mensalidade — 12 posts/mês",
    monthlyFee: 4800,
    startDate: iso(-240),
    status: "Active",
    socials: {
      instagram: "@northwindcoffee",
      tiktok: "@northwindroasts",
      pinterest: "northwindcoffee",
    },
    notes:
      "Prefere ajustes em lote. Nunca publica preços. As fotos devem usar o conjunto de luz natural gravado na semana 12.",
    audience:
      "Quem prepara café em casa, 25–40 anos, e já tem um suporte de coado.",
    objectives:
      "Ampliar o interesse no atacado local e elevar os pedidos do site em 15% no trimestre.",
    pillars: ["Education", "Behind the scenes", "Product", "Community"],
    topics: [
      "Cold brew x café gelado",
      "Como escolhemos uma nova origem",
      "Barista reage a truques virais",
      "Lançamento do Guatemala de origem única",
      "5 erros no preparo que você deve evitar",
      "Tour pela torrefação: a sala do café verde",
      "Prévia do menu de outono",
      "Unboxing da assinatura",
      "O que 'especial' realmente significa",
      "Conheça o mestre de torra: Dani",
    ],
    platforms: ["Instagram", "TikTok", "Pinterest", "YouTube"],
    formats: ["Reel", "Carousel", "Single post", "Story", "Pin"],
    owner: "Priya Raman",
  },
  {
    slug: "hale-harbor",
    name: "Hale & Harbor Interiors",
    contactName: "Débora Whitfield",
    email: "debora@haleharbor.exemplo",
    phone: "+55 (11) 95555-0198",
    website: "haleharbor.exemplo",
    industry: "Estúdio de design de interiores residencial",
    packageName: "Mensalidade — 8 posts/mês",
    monthlyFee: 3200,
    startDate: iso(-120),
    status: "Active",
    socials: {
      instagram: "@haleandharbor",
      pinterest: "haleandharbor",
      linkedin: "hale-harbor",
    },
    notes:
      "Sempre marcar o fotógrafo. As aprovações vêm só da Débora — a gerente do estúdio fica em cópia.",
    audience:
      "Quem está reformando a primeira casa, além de corretores locais.",
    objectives:
      "Preencher a agenda de projetos da primavera e crescer os salvamentos no Pinterest.",
    pillars: ["Education", "Product", "Community", "Promotion"],
    topics: [
      "Sala pequena, muito armário",
      "Minimalismo acolhedor explicado",
      "Antes e depois: Beacon Hill",
      "5 regras de iluminação que sempre seguimos",
      "Guia de tamanhos de tapete",
      "Por trás da visita técnica",
      "O dia da revelação para a cliente",
      "Como fazer um briefing para um designer",
    ],
    platforms: ["Instagram", "Pinterest", "LinkedIn"],
    formats: ["Carousel", "Single post", "Pin", "Reel"],
    owner: "Jonas Feld",
  },
  {
    slug: "bloomly",
    name: "Bloomly Skincare",
    contactName: "Renata Silva",
    email: "renata@bloomly.exemplo",
    phone: "+55 (11) 95555-0177",
    website: "bloomly.exemplo",
    industry: "Skincare de venda direta ao consumidor",
    packageName: "Mensalidade — 16 posts/mês + anúncios",
    monthlyFee: 6500,
    startDate: iso(-75),
    status: "Active",
    socials: {
      instagram: "@bloomlyskin",
      tiktok: "@bloomly",
      youtube: "@bloomlyskin",
    },
    notes:
      "As alegações precisam seguir o texto aprovado. O jurídico acrescenta dois dias úteis nos posts de produto.",
    audience: "Pessoas com pele sensível, de 18 a 34 anos, que compram online.",
    objectives:
      "Lançar o creme reparador e manter o custo por mil impressões sob controle no 4º trimestre.",
    pillars: ["Education", "Product", "Behind the scenes", "Promotion"],
    topics: [
      "Teaser do lançamento do creme reparador",
      "Niacinamida sem ardor",
      "A fundadora responde às mensagens",
      "Embalando pedidos com o time",
      "Ingrediente em foco: esqualano",
      "Rotina de inverno em 3 passos",
      "Resultados das clientes em resumo",
      "Por trás da visita ao laboratório",
    ],
    platforms: ["Instagram", "TikTok", "YouTube"],
    formats: ["Reel", "Short", "Carousel", "Story", "Video"],
    owner: "Ana Moreira",
  },
  {
    slug: "vela",
    name: "Vela Fitness Studio",
    contactName: "Tomás Beck",
    email: "tomas@velafitness.exemplo",
    phone: "+55 (11) 95555-0110",
    website: "velafitness.exemplo",
    industry: "Estúdio de fitness boutique",
    packageName: "Proposta — 8 posts/mês",
    monthlyFee: 2200,
    startDate: iso(0),
    status: "Prospect",
    socials: { instagram: "@velafitness" },
    notes:
      "Aguardando a proposta assinada. Querem começar com um sprint de relançamento de 30 dias.",
    audience: "Novos alunos em um raio de 5 km do estúdio.",
    objectives: "Relançar a conta e lotar as aulas da manhã.",
    pillars: ["Education", "Community", "Promotion"],
    topics: [
      "Plano de relançamento em 30 dias",
      "Conheça os treinadores",
      "Aluno do mês",
      "Passo a passo da grade de aulas",
    ],
    platforms: ["Instagram", "TikTok"],
    formats: ["Reel", "Carousel", "Story"],
    owner: "Ana Moreira",
  },
];

const TASK_SEEDS: [string, string, string, string, string, number, number][] = [
  [
    "Finalizar o briefing de conteúdo do mês",
    "Planejamento mensal",
    "Strategy",
    "High",
    "In Progress",
    -2,
    3,
  ],
  ["Gravar lote: 10 peças", "Produção", "Production", "High", "Backlog", 1, 6],
  [
    "Agendar os posts da próxima semana",
    "Publicação",
    "Publishing",
    "Medium",
    "Backlog",
    0,
    2,
  ],
  [
    "Relatório mensal de desempenho",
    "Relatórios",
    "Reporting",
    "Medium",
    "Backlog",
    2,
    6,
  ],
  [
    "Reunir os materiais pendentes do cliente",
    "Administração do cliente",
    "Admin",
    "Medium",
    "Blocked",
    -3,
    1,
  ],
  [
    "Atualizar a página de links da bio",
    "Sincronia do site",
    "Content",
    "Low",
    "Done",
    -8,
    -4,
  ],
];

const REQUEST_SEEDS: [string, string, string, string, string, number][] = [
  [
    "Adicionar um segundo Reel esta semana",
    "Content",
    "High",
    "In Progress",
    "Priya Raman",
    2,
  ],
  [
    "Precisamos de novas fotos de produto",
    "Design",
    "Medium",
    "Waiting",
    "Jonas Feld",
    5,
  ],
  [
    "Levantar os números de engajamento para o conselho",
    "Report",
    "Medium",
    "New",
    "Ana Moreira",
    4,
  ],
  [
    "Atualizar a pasta compartilhada no drive",
    "Access",
    "Low",
    "Completed",
    "Ana Moreira",
    -3,
  ],
  [
    "Aumento de verba para posts impulsionados",
    "Budget",
    "High",
    "New",
    "Ana Moreira",
    7,
  ],
];

const FINANCE_SEEDS: [string, string, number, number, string, string][] = [
  ["Mensalidade", "Retainer", 4800, 0, "Income", "Northwind Coffee Roasters"],
  ["Mensalidade", "Retainer", 3200, -1, "Income", "Hale & Harbor Interiors"],
  [
    "Taxa de gestão de anúncios",
    "Project fee",
    1200,
    -1,
    "Income",
    "Bloomly Skincare",
  ],
  [
    "Short patrocinado — sinal",
    "Collab",
    450,
    -2,
    "Income",
    "Northwind Coffee Roasters",
  ],
  ["Verba de impulsionamento", "Ads", 600, -1, "Expense", "Bloomly Skincare"],
  ["Assinatura do suíte de edição", "Software", 89, -1, "Expense", ""],
  [
    "Videomaker freelancer",
    "Contractor",
    1200,
    -2,
    "Expense",
    "Northwind Coffee Roasters",
  ],
  ["Ring light + fundo fotográfico", "Equipment", 340, -3, "Expense", ""],
  ["Ferramenta de agendamento (anual)", "Software", 288, -1, "Expense", ""],
];

export const seedDemo = mutation({
  args: {},
  handler: async (ctx) => {
    const ownerId = await activeUser(ctx);
    if (!ownerId) throw new Error("Não autenticado");
    const store = db(ctx);

    for (const table of OWNED_TABLES) {
      const first = await store
        .query(table)
        .withIndex("by_owner", (q: any) => q.eq("ownerId", ownerId))
        .first();
      if (first)
        throw new Error(
          "Os exemplos só podem ser carregados em um espaço vazio. Seus dados foram preservados.",
        );
    }

    const clientIds: Record<string, Id<"clients">> = {};

    for (const c of CLIENTS) {
      const id = await store.insert("clients", {
        ownerId,
        name: c.name,
        contactName: c.contactName,
        email: c.email,
        phone: c.phone,
        website: c.website,
        industry: c.industry,
        packageName: c.packageName,
        monthlyFee: c.monthlyFee,
        startDate: c.startDate,
        status: c.status,
        socials: c.socials,
        notes: c.notes,
        onboarding: {
          company: `${c.industry}. Contato: ${c.contactName}.`,
          contact: `${c.email} · ${c.phone}`,
          brand: `Voz: calorosa, especialista, nunca vendedora. Pilares: ${c.pillars.join(", ")}.`,
          socialAccounts: Object.entries(c.socials)
            .map(([k, val]) => `${k}: ${val}`)
            .join(" · "),
          audience: c.audience,
          objectives: c.objectives,
          competitors: "Acompanhados nas observações da estratégia.",
          contentPreferences: `Prefere ${c.formats.slice(0, 2).join(" e ")}.`,
          approvalPreferences:
            "Aprovações por e-mail, 2 dias úteis antes do agendamento.",
          importantDates:
            "Janelas de lançamento e novidades de produto registradas no calendário de conteúdo.",
          brandAssets: "Drive compartilhado: marca, fontes, fotografias.",
          notes: c.notes,
        },
        strategy: [
          {
            key: "business",
            title: "Objetivo de negócio",
            items: [c.objectives],
          },
          {
            key: "social",
            title: "Objetivos de social media",
            items: [
              "Publicar com consistência na cadência combinada",
              "Responder todos os comentários em até 24 horas",
              "Transformar os posts com melhor desempenho em formatos repetíveis",
            ],
          },
          { key: "audience", title: "Público-alvo", items: [c.audience] },
          { key: "pillars", title: "Pilares de conteúdo", items: c.pillars },
          {
            key: "voice",
            title: "Voz da marca",
            items: ["Confiante, mas próxima", "Frases curtas", "Sem jargão"],
          },
          {
            key: "kpis",
            title: "Indicadores",
            items: [
              "Posts publicados por mês",
              "Prazo de aprovação (dias)",
              "Salvamentos por post",
            ],
          },
        ],
        kpis: [
          {
            name: "Posts publicados / mês",
            baseline: "6",
            target: "12",
            actual: "9",
            unit: "posts",
            deadline: monthDay(1, 28),
          },
          {
            name: "Prazo de aprovação",
            baseline: "5",
            target: "2",
            actual: "3",
            unit: "dias",
            deadline: monthDay(1, 28),
          },
        ],
        createdAt: Date.now(),
      });
      clientIds[c.slug] = id;

      // Conteúdo ao longo do mês corrente: o que passou publicado, o que vem planejado.
      const offsets = [-19, -16, -13, -10, -7, -5, -2, 0, 2, 4, 7, 11, 15, 19];
      for (let i = 0; i < offsets.length; i++) {
        const offset = offsets[i];
        const topic = c.topics[i % c.topics.length];
        const status = statusForOffset(offset);
        const platform = c.platforms[i % c.platforms.length];
        const format = c.formats[i % c.formats.length];
        await store.insert("content", {
          ownerId,
          clientId: id,
          date: iso(offset),
          platform,
          format,
          topic,
          caption:
            status === "Published"
              ? `${topic} — publicado e rendendo como esperado.`
              : `Legenda em rascunho para "${topic}".`,
          assetNote:
            format === "Reel" || format === "Video" || format === "Short"
              ? "Edição de vídeo + legendas"
              : "Arte estática",
          status,
          managerNotes:
            status === "Changes Requested"
              ? "O cliente pediu uma abertura mais suave."
              : status === "In Review"
                ? "Com o cliente para aprovação."
                : "",
          clientComments:
            status === "Published"
              ? ""
              : status === "In Review"
                ? "No geral está ótimo — um ajuste no gancho."
                : "",
          pillar: c.pillars[i % c.pillars.length],
          owner: c.owner,
        });
      }

      // Tarefas escalonadas para o painel sempre ter trabalho atrasado e a vencer.
      const taskOffsets = [0, 1, 3, 4, 6, 7];
      for (let i = 0; i < TASK_SEEDS.length; i++) {
        const [
          title,
          project,
          category,
          priority,
          status,
          startOffset,
          dueOffset,
        ] = TASK_SEEDS[i];
        const shift = taskOffsets[(i + c.slug.length) % taskOffsets.length];
        await store.insert("tasks", {
          ownerId,
          clientId: id,
          title,
          project,
          category,
          priority,
          status,
          startDate: iso(startOffset + shift - 4),
          dueDate: iso(dueOffset + shift - 4),
          completedAt: status === "Done" ? iso(-2) : "",
          dependsOn: "",
          notes:
            c.status === "Prospect"
              ? "Só começar depois da proposta assinada."
              : "",
        });
      }

      // Algumas solicitações de cada cliente.
      for (let i = 0; i < 2; i++) {
        const [title, category, priority, status, assignedTo, dueOffset] =
          REQUEST_SEEDS[(i + c.slug.length) % REQUEST_SEEDS.length];
        await store.insert("requests", {
          ownerId,
          clientId: id,
          title,
          category,
          priority,
          dateSubmitted: iso(-4 + i),
          status,
          assignedTo,
          dueDate: iso(dueOffset),
          comments:
            status === "Waiting" ? "Precisa de informação do cliente." : "",
        });
      }

      // Uma chamada futura e uma passada, com anotações.
      await store.insert("meetings", {
        ownerId,
        clientId: id,
        title: "Chamada de planejamento mensal",
        date: iso(3 + c.slug.length),
        time: "10:00",
        agenda:
          "Revisar o conteúdo do último mês, confirmar a próxima campanha, reunir materiais.",
        participants: `${c.contactName}, Ana Moreira`,
        status: "Scheduled",
        notes: "",
        actionItems: "",
      });
      await store.insert("meetings", {
        ownerId,
        clientId: id,
        title: "Revisão de conteúdo",
        date: iso(-9),
        time: "15:30",
        agenda: "Percorrer o calendário e a fila de aprovações.",
        participants: `${c.contactName}, Ana Moreira`,
        status: "Completed",
        notes: "O cliente quer mais bastidores e menos posts de produto.",
        actionItems:
          "Rascunhar 2 conceitos de bastidores antes da próxima gravação em lote.",
      });

      // Entregas.
      const files: [string, string, string][] = [
        ["Manual de marca v2.pdf", "Brand assets", "Shared"],
        ["Plano de conteúdo mensal.pdf", "Documents", "Shared"],
        ["Gráficos do lote 12.zip", "Graphics", "In progress"],
      ];
      for (let i = 0; i < files.length; i++) {
        const [name, category, status] = files[i];
        await store.insert("deliverables", {
          ownerId,
          clientId: id,
          name,
          category,
          description: `${name.replace(/\.[a-z]+$/, "")} para ${c.name}.`,
          date: iso(-12 + i * 3),
          status,
          relatedContent: "",
          relatedProject: "Mensalidade",
        });
      }

      // Mensalidade dos últimos três meses; a mais recente ainda está pendente.
      for (let m = 2; m >= 0; m--) {
        if (c.status !== "Active") continue;
        await store.insert("finance", {
          ownerId,
          clientId: id,
          date: monthDay(-m, 5),
          type: "Income",
          amount: c.monthlyFee,
          category: "Retainer",
          description: `Mensalidade — ${c.name}`,
          kind: "invoice",
          status: m === 0 ? "Pending" : "Paid",
          dueDate: monthDay(-m, 12),
          paidDate: m === 0 ? "" : monthDay(-m, 10),
        });
      }
    }

    // Receitas avulsas e despesas fixas, sem vínculo com um cliente específico.
    for (const [
      description,
      category,
      amount,
      monthOffset,
      type,
      clientName,
    ] of FINANCE_SEEDS) {
      const slug = CLIENTS.find((c) => c.name === clientName)?.slug;
      await store.insert("finance", {
        ownerId,
        clientId: slug ? clientIds[slug] : undefined,
        date: monthDay(monthOffset, 18),
        type,
        amount,
        category,
        description,
        status: monthOffset <= -2 ? "Paid" : "Pending",
        dueDate: monthDay(monthOffset, 22),
        paidDate: monthOffset <= -2 ? monthDay(monthOffset, 20) : "",
      });
    }

    const existingWorkspace = await ctx.db
      .query("workspaces")
      .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
      .unique();
    const workspace = {
      ownerId,
      managerName: "Ana Moreira",
      agency: "Moreira Social",
      email: "ana@moreirasocial.exemplo",
      currency: "R$",
      weekStart: "Monday",
      approvalTurnaroundDays: 3,
      notifyEmail: true,
      notifyApprovals: true,
      notifyFinance: true,
      density: "comfortable",
    };
    if (!existingWorkspace) await store.insert("workspaces", workspace);
    await assertWorkspaceCapacity(ctx, ownerId);

    return { clients: CLIENTS.length };
  },
});
