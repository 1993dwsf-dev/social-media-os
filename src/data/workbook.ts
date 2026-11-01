// Planilha do Gestor Social Media OS — sistema operacional de 29 abas para
// gestores de social media. As abas são definidas como dados para que o
// visualizador web possa renderizá-las, calcular fórmulas, validar listas
// suspensas e exportar CSV.

import type { Platform } from "./types";
import { PLATFORMS } from "./types";

export interface SheetColumn {
  name: string;
  width: number;
  type?: "text" | "number" | "date" | "select" | "currency" | "percent";
  options?: string[];
}

export interface SheetDef {
  id: string;
  name: string;
  group: string;
  description: string;
  columns: SheetColumn[];
  rows: (string | number)[][];
  freeze: number;
  /**
   * Preenchido por `computeWorkbook` (src/data/formula.ts): a mesma grade com
   * cada célula de fórmula substituída pelo valor calculado. `rows` mantém as
   * fórmulas originais para exibí-las em tooltip e verificá-las nos testes.
   */
  computed?: (string | number)[][];
}

export const STATUS_OPTIONS = [
  "Ideia",
  "Rascunhando",
  "Em revisão",
  "Alterações solicitadas",
  "Aprovado",
  "Agendado",
  "Publicado",
];

export const TASK_STATUS_OPTIONS = ["A fazer", "Em andamento", "Bloqueado", "Concluído"];
export const PRIORITY_OPTIONS = ["Baixa", "Média", "Alta"];
export const CONTENT_TYPES = ["Reel", "Carrossel", "Post", "Story", "Short", "Vídeo", "Pin", "Artigo", "Ao vivo"];
export const APPROVAL_OPTIONS = ["Não necessário", "Pendente", "Aprovado", "Alterações solicitadas"];
export const PUB_OPTIONS = ["Rascunho", "Agendado", "Publicado", "Em espera"];
export const PILLAR_OPTIONS = ["Educação", "Bastidores", "Produto", "Comunidade", "Promoção"];

export const GROUPS = ["Configuração e Marca", "Planejamento", "Produção", "Crescimento", "Negócios"] as const;

export const SHEET_GROUPS: Record<string, string> = {
  "Configuração e Marca": "#136A87",
  Planejamento: "#0369A1",
  Produção: "#047857",
  Crescimento: "#B45309",
  Negócios: "#6D28D9",
};

// ---- auxiliares ----------------------------------------------------------

function iso(offsetDays: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function monthISO(monthOffset: number, day: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(1);
  d.setMonth(d.getMonth() + monthOffset, Math.min(day, 28));
  return d.toISOString().slice(0, 10);
}

function weekday(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("pt-BR", {
    weekday: "short",
  });
}

function demoCaption(topic: string): string {
  return `Legenda de exemplo para: ${topic}`;
}

function demoCTA(pillar: string): string {
  const ctas: Record<string, string> = {
    Educação: "Salve este guia",
    Bastidores: "Acompanhe a série",
    Produto: "Garanta o seu",
    Comunidade: "Comente sua opinião",
    Promoção: "Toque no link da bio",
  };
  return ctas[pillar] || "Saiba mais";
}

function mediaFor(type: string): string {
  if (type === "Reel" || type === "Short" || type === "Vídeo" || type === "Ao vivo")
    return "Vídeo";
  if (type === "Carrossel") return "Imagens de carrossel";
  if (type === "Story") return "Quadros de story";
  if (type === "Pin") return "Arte de pin";
  return "Arte única";
}

function calendarColumns(): SheetColumn[] {
  return [
    { name: "Data", width: 92, type: "date" },
    { name: "Dia", width: 52 },
    { name: "Cliente", width: 150 },
    { name: "Plataforma", width: 100, type: "select", options: PLATFORMS },
    { name: "Tipo de conteúdo", width: 104, type: "select", options: CONTENT_TYPES },
    { name: "Pilar de conteúdo", width: 130, type: "select", options: PILLAR_OPTIONS },
    { name: "Tema / gancho", width: 220 },
    { name: "Legenda / status", width: 260 },
    { name: "CTA", width: 130 },
    { name: "Tipo de mídia", width: 110 },
    { name: "Responsável", width: 110 },
    { name: "Status de aprovação", width: 130, type: "select", options: APPROVAL_OPTIONS },
    { name: "Status de publicação", width: 130, type: "select", options: PUB_OPTIONS },
    { name: "Observações", width: 200 },
  ];
}

function monthSheet(idx: number, name: string, monthOffset: number): SheetDef {
  const base = new Date();
  base.setDate(1);
  base.setMonth(base.getMonth() + monthOffset);
  const month = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}`;
  const days = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  const demoTopics: [number, Platform, string, string, string][] = [
    [3, "Instagram", "Reel", "Educação", "Escola do café #1 — coado em 60s"],
    [7, "TikTok", "Short", "Bastidores", "Tour pela torrefação: da cereja à xícara"],
    [12, "Instagram", "Carrossel", "Educação", "5 erros no preparo (e como corrigir)"],
    [15, "LinkedIn", "Artigo", "Comunidade", "Por que publicamos o custo do nosso café verde"],
    [19, "Instagram", "Post", "Produto", "Chamada para o lote de origem única"],
    [24, "YouTube", "Vídeo", "Educação", "Sessão de prova com nosso mestre de torra"],
  ];
  const rows: (string | number)[][] = [];
  for (let day = 1; day <= days; day++) {
    const dateStr = `${month}-${String(day).padStart(2, "0")}`;
    const demo = demoTopics.find(([dd]) => dd === day);
    if (demo) {
      const [, platform, type, pillar, topic] = demo;
      rows.push([
        dateStr,
        weekday(dateStr),
        "Northwind Coffee Roasters",
        platform,
        type,
        pillar,
        topic,
        demoCaption(topic),
        demoCTA(pillar),
        mediaFor(type),
        "Maiara Okano",
        day < 10 ? "Aprovado" : "Pendente",
        day < 10 ? "Agendado" : "Rascunho",
        "",
      ]);
    } else {
      rows.push([dateStr, weekday(dateStr), "", "", "", "", "", "", "", "", "", "", "", ""]);
    }
  }
  return {
    id: `month-${idx}`,
    name,
    group: "Planejamento",
    description: `${name} — calendário de conteúdo: agende posts, defina responsáveis e acompanhe aprovações. As listas suspensas padronizam os status.`,
    columns: calendarColumns(),
    rows,
    freeze: 1,
  };
}

const SETUP_ROWS: (string | number)[][] = [
  ["Nome do gestor", "Ana Moreira"],
  ["Negócio / agência", "Moreira Social"],
  ["E-mail de contato", "ana@moreirasocial.exemplo"],
  ["Fuso horário", "America/Sao_Paulo (BRT)"],
  ["Equipe / colaboradores", "Priya Raman · Jonas Feld"],
  ["Serviços oferecidos", "Estratégia, produção de conteúdo, publicação, relatórios"],
  ["Moeda", "Real (R$)"],
  ["Prazo padrão de aprovação", "3 dias úteis"],
  ["Clientes ativos", "=COUNTIF(Clientes!J2:J1000,\"Ativo\")"],
  ["Total de clientes", "=COUNTA(Clientes!A2:A1000)"],
  ["Receita recorrente mensal", "=SUMIF(Clientes!J2:J1000,\"Ativo\",Clientes!H2:H1000)"],
  ["Observações", "Cada cliente ocupa uma linha na aba Clientes. Duplique as abas Marca e Metas por cliente quando precisar de uma referência privada para cada conta."],
];

// Carteira de clientes — a base do negócio do gestor. As colunas de status e
// mensalidade alimentam as fórmulas do Painel e da Configuração
// (J = Status, H = Mensalidade).
const CLIENTS_ROWS: (string | number)[][] = [
  ["Northwind Coffee Roasters", "Maiara Okano", "maiara@northwindcoffee.exemplo", "+55 (11) 95555-0142", "northwindcoffee.exemplo", "Torrefação de cafés especiais", "Mensalidade — 12 posts/mês", 4800, iso(-240), "Ativo", "@northwindcoffee", "@northwindroasts", "", "Prefere ajustes em lote. Nunca publica preços."],
  ["Hale & Harbor Interiors", "Débora Whitfield", "debora@haleharbor.exemplo", "+55 (11) 95555-0198", "haleharbor.exemplo", "Design de interiores residencial", "Mensalidade — 8 posts/mês", 3200, iso(-120), "Ativo", "@haleandharbor", "", "hale-harbor", "As aprovações vêm só da Débora; o fotógrafo deve ser marcado."],
  ["Bloomly Skincare", "Renata Silva", "renata@bloomly.exemplo", "+55 (11) 95555-0177", "bloomly.exemplo", "Skincare de venda direta", "Mensalidade — 16 posts/mês + anúncios", 6500, iso(-75), "Ativo", "@bloomlyskin", "@bloomly", "", "As alegações precisam seguir o texto aprovado; o jurídico acrescenta 2 dias."],
  ["Vela Fitness Studio", "Tomás Beck", "tomas@velafitness.exemplo", "+55 (11) 95555-0110", "velafitness.exemplo", "Estúdio de fitness boutique", "Proposta — 8 posts/mês", 2200, iso(0), "Prospecto", "@velafitness", "", "", "Aguardando a proposta assinada; começa com um sprint de relançamento de 30 dias."],
];

const BRAND_ROWS: (string | number)[][] = [
  ["Nome da marca", "Northwind Coffee Roasters — duplique esta aba por cliente"],
  ["Assinatura", "Conheça o produtor, conheça a torra, conheça a proporção."],
  ["Missão", "Tornar o café especial acessível sem simplificar demais."],
  ["Visão", "Uma cultura de café em que cada pacote mostra suas contas — custo, origem, nota."],
  ["Valores", "Transparência, ofício, paciência, comunidade"],
  ["Personalidade da marca", "Calorosa, direta, especialista com bom humor discreto"],
  ["Tom de voz", "Especialista amigável — ensina, não dá aula"],
  ["Público-alvo", "Quem prepara café em casa, 25–40 anos; donos de cafeterias de atacado"],
  ["Dores do público", "Guias cheios de jargão; desconfiança de preços; excesso de equipamentos"],
  ["Desejos do público", "Receitas repetíveis, origem honesta, confiança tranquila"],
  ["Diferenciais", "Custo do café verde publicado; data de torra em cada pacote"],
  ["Pilares de conteúdo", PILLAR_OPTIONS.join(" · ")],
  ["Mensagens-chave", "Café bom é receita repetível, não mistério."],
  ["Palavras para usar", "preparo, origem, ofício, honesto, calmo"],
  ["Palavras a evitar", "ninja, hack, guru, hackear sua manhã"],
  ["Direção visual", "Luz da manhã, madeira clara, vapor; ritmo sem pressa"],
  ["Cores da marca", "Verde-pinho #1E4D3B · Creme #F4EFE6 · Terracota #C96F4A"],
  ["Tipografia", "Fraunces (títulos) · Inter (interface/texto)"],
  ["Preferências de CTA", "Salve este guia · Garanta o seu · Entre na lista de espera"],
];

const GOALS_ROWS: (string | number)[][] = [
  ["Negócio", "Crescer a receita da assinatura", "30% da receita", "45% da receita", "34%", 0.113, "No caminho", "Ana Moreira", iso(90), "Campanha do 4º trimestre planejada"],
  ["Social", "Taxa de engajamento no Instagram", "3,1%", "4,5%", "4,2%", 0.736, "No caminho", "Maiara Okano", iso(45), "Mix de Reels melhorando"],
  ["Social", "Seguidores no TikTok", "18.000", "30.000", "24.800", 0.567, "No caminho", "Maiara Okano", iso(75), "Série semanal em ritmo"],
  ["Social", "Cadastros na lista de espera / mês", "90", "250", "184", 0.594, "Atenção", "Jonas Feld", iso(60), "Precisa de um caminho melhor do pin para a lista"],
  ["Trimestral", "Tempo de exibição no YouTube (h/mês)", "310", "600", "452", 0.493, "No caminho", "Jonas Feld", iso(90), "2 vídeos longos/mês"],
  ["Mensal", "Consistência de publicação", "16", "20", "17", 0.125, "Atenção", "Priya Raman", iso(30), "2 vagas perdidas na semana 2"],
];

function makeGoalsSheet(): SheetDef {
  return {
    id: "goals",
    name: "Metas",
    group: "Configuração e Marca",
    description: "Estrutura de metas e indicadores — o % de progresso é calculado de linha de base → real → meta, e as cores do status refletem o progresso.",
    columns: [
      { name: "Escopo", width: 90, type: "select", options: ["Negócio", "Social", "Trimestral", "Mensal"] },
      { name: "Indicador", width: 220 },
      { name: "Linha de base", width: 90 },
      { name: "Meta", width: 90 },
      { name: "Real", width: 90 },
      { name: "Progresso", width: 90, type: "percent" },
      { name: "Status", width: 100, type: "select", options: ["No caminho", "Atenção", "Em risco"] },
      { name: "Responsável", width: 120 },
      { name: "Prazo", width: 100, type: "date" },
      { name: "Observações", width: 220 },
    ],
    rows: GOALS_ROWS,
    freeze: 1,
  };
}

function makeDashboardSheet(): SheetDef {
  const monthName = new Date().toLocaleString("pt-BR", { month: "long" });
  const rows: (string | number)[][] = [
    ["Panorama do negócio (de Clientes)", "", "", ""],
    ["Total de clientes", "=COUNTA(Clientes!A2:A1000)", "Clientes ativos", "=COUNTIF(Clientes!J2:J1000,\"Ativo\")"],
    ["Receita recorrente mensal", "=SUMIF(Clientes!J2:J1000,\"Ativo\",Clientes!H2:H1000)", "Prospectos", "=COUNTIF(Clientes!J2:J1000,\"Prospecto\")"],
    ["", "", "", ""],
    ["Pipeline de conteúdo (de Plano de Conteúdo)", "", "", ""],
    ["Posts planejados", "=COUNTA('Plano de Conteúdo'!C2:C1000)", "Publicados", "=COUNTIF('Plano de Conteúdo'!Q2:Q1000,\"Publicado\")"],
    ["Aguardando aprovação", "=COUNTIF('Plano de Conteúdo'!P2:P1000,\"Pendente\")", "Agendados", "=COUNTIF('Plano de Conteúdo'!Q2:Q1000,\"Agendado\")"],
    // Colunas de Tarefas: H = Status, J = Prazo.
    ["Tarefas para esta semana", "=COUNTIFS(Tarefas!J2:J1000,\"<=\"&TEXT(TODAY()+7,\"YYYY-MM-DD\"),Tarefas!H2:H1000,\"<>Concluído\")", "Tarefas concluídas", "=COUNTIF(Tarefas!H2:H1000,\"Concluído\")"],
    ["", "", "", ""],
    ["Dinheiro (de Financeiro)", "", "", ""],
    // Somas limitadas ao mês: do primeiro ao último dia do mês corrente.
    ["Receita do mês", "=SUMIFS(Financeiro!C2:C1000,Financeiro!A2:A1000,\">=\"&TEXT(EOMONTH(TODAY(),-1)+1,\"YYYY-MM-DD\"),Financeiro!A2:A1000,\"<=\"&TEXT(EOMONTH(TODAY(),0),\"YYYY-MM-DD\"))", "Despesas do mês", "=SUMIFS(Financeiro!D2:D1000,Financeiro!A2:A1000,\">=\"&TEXT(EOMONTH(TODAY(),-1)+1,\"YYYY-MM-DD\"),Financeiro!A2:A1000,\"<=\"&TEXT(EOMONTH(TODAY(),0),\"YYYY-MM-DD\"))"],
    // Colunas do Financeiro: G = Status de pagamento, C = Receita.
    ["Receita pendente", "=SUMIF(Financeiro!G2:G1000,\"<>Pago\",Financeiro!C2:C1000)", "Pagamentos atrasados", "=COUNTIF(Financeiro!G2:G1000,\"Atrasado\")"],
  ];
  return {
    id: "dashboard",
    name: "Painel",
    group: "Configuração e Marca",
    description: `Painel de gestão de ${monthName} — cada métrica é calculada ao vivo a partir das abas Clientes, Plano de Conteúdo, Tarefas e Financeiro.`,
    columns: [
      { name: "Indicador", width: 260 },
      { name: "Valor", width: 240 },
      { name: "Indicador 2", width: 180 },
      { name: "Valor 2", width: 240 },
    ],
    rows,
    freeze: 0,
  };
}

function makeYearSheet(): SheetDef {
  const rows: (string | number)[][] = [];
  const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const demo: Record<number, [string, string, string, string, string, string, string]> = {
    8: ["Escola do Café", "Ensinar uma técnica por semana", "1 de set — menu especial de feriado", "Educação", "Lançamento do menu de outono", "Feriadão (7 de set)", "Maior alcance sustentado nos testes"],
    9: ["Origem do mês: Guatemala", "Lançar o Guatemala Huixpac", "12 de out — dia do lançamento", "Produto", "Edição limitada de 200 pacotes", "Eventos de prova (out)", "Coordenar com a lista de e-mail"],
    10: ["Guias de presente", "Presentear com calma", "20 de nov — início da campanha", "Promoção", "Vales-presente + kits", "Black Friday (27 de nov)", "Começar o teaser em 10 de nov"],
    11: ["Retrospectiva do ano", "Narrativa da comunidade", "26 de dez — reel de retrospectiva", "Comunidade", "Clientes em destaque", "Ano-novo (31 de dez)", "Reaproveitar os melhores posts do ano"],
  };
  months.forEach((name, i) => {
    const d = demo[i];
    rows.push(d ? [name, ...d] : [name, "", "", "", "", "", "", ""]);
  });
  return {
    id: "year",
    name: "Ano",
    group: "Planejamento",
    description: "Visão geral de planejamento em 12 meses — temas de campanha, objetivos, datas-chave e lançamentos em um só olhar.",
    columns: [
      { name: "Mês", width: 110 },
      { name: "Campanha / tema", width: 170 },
      { name: "Objetivo principal", width: 230 },
      { name: "Datas-chave", width: 210 },
      { name: "Foco de conteúdo", width: 120, type: "select", options: PILLAR_OPTIONS },
      { name: "Lançamentos importantes", width: 200 },
      { name: "Eventos principais", width: 180 },
      { name: "Observações", width: 220 },
    ],
    rows,
    freeze: 1,
  };
}

function makeWeeklySheet(): SheetDef {
  const days = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
  const plan: Record<string, [string, string, string, string][]> = {
    Segunda: [
      ["Agendar os posts aprovados para ter–qua", "Lote 1", "Maiara", "Concluído"],
      ["Preparo da gravação — cenário e objetos", "Série da torrefação", "Priya", "Em andamento"],
    ],
    Terça: [
      ["Publicar Reel: coado em 60s", "Instagram", "Maiara", "Concluído"],
      ["Editar o tour da torrefação", "TikTok", "Priya", "Em andamento"],
    ],
    Quarta: [
      ["Rascunho do carrossel: erros no preparo", "Instagram", "Maiara", "Em andamento"],
      ["Responder a comunidade (30 min)", "Todas as plataformas", "Jonas", "A fazer"],
    ],
    Quinta: [
      ["Enviar aprovações da próxima semana", "Cliente", "Ana", "Em andamento"],
      ["Gravar a sessão de prova", "YouTube", "Jonas", "Bloqueado"],
    ],
    Sexta: [
      ["Levantamento semanal de métricas", "Relatórios", "Jonas", "A fazer"],
      ["Planejar o calendário da próxima semana", "Planejamento", "Maiara", "A fazer"],
    ],
    Sábado: [["Hora de engajamento (manhã)", "Todas as plataformas", "Priya", "A fazer"]],
    Domingo: [["Descanso / sem publicar", "—", "Equipe", "A fazer"]],
  };
  const rows: (string | number)[][] = [];
  days.forEach((day, di) => {
    (plan[day] || []).forEach((it, i) => {
      rows.push([i === 0 ? day : "", "Northwind Coffee Roasters", it[0], it[1], it[2], it[3], "", iso(di + 1)]);
    });
  });
  return {
    id: "weekly",
    name: "Semanal",
    group: "Produção",
    description: "Plano operacional da semana — conteúdo e tarefas por dia da semana, com prazos e responsáveis.",
    columns: [
      { name: "Dia", width: 100 },
      { name: "Cliente", width: 160 },
      { name: "Conteúdo / tarefa", width: 240 },
      { name: "Plataforma / projeto", width: 150 },
      { name: "Responsável", width: 110 },
      { name: "Status", width: 110, type: "select", options: TASK_STATUS_OPTIONS },
      { name: "Observações", width: 180 },
      { name: "Prazo", width: 100, type: "date" },
    ],
    rows,
    freeze: 1,
  };
}

function makeBrainDumpSheet(): SheetDef {
  const rows: (string | number)[][] = [
    ["I-01", "Série de perguntas e respostas com o mestre de torra", "Educação", "Reel", "Instagram", "Alta", "Reunião da equipe", "O que 'processo lavado' realmente significa?", "Assista à parte 2", "Pronto para planejar", iso(-4), "3 partes planejadas"],
    ["I-02", "História de cliente: cafeteria parceira", "Comunidade", "Carrossel", "Instagram", "Média", "E-mail do cliente", "Como a Brewed Awake cresceu com nossos grãos", "Leia a história", "Pronto para planejar", iso(-9), "Precisa de autorização de imagem"],
    ["I-03", "Calculadora de proporção para cold brew", "Educação", "Post", "Pinterest", "Alta", "Tendências de busca", "Salve o cartão de proporções", "Salve este pin", "Em produção", iso(-2), "Arte do pin no Figma"],
    ["I-04", "O gato da torrefação em cena", "Comunidade", "Short", "TikTok", "Baixa", "Reunião da equipe", "Nosso controle de qualidade tem bigodes", "Siga para ver mais do Miso", "Ideia", iso(-1), "Miso é o gato da torrefação"],
    ["I-05", "Por trás do rótulo: como nomeamos as origens", "Bastidores", "Vídeo", "YouTube", "Média", "E-mail do cliente", "Por que nomeamos os cafés com nomes de rios", "Assista à série", "Pronto para planejar", iso(-6), ""],
    ["I-06", "Pacote de texturas de vapor para stories", "Bastidores", "Story", "Instagram", "Baixa", "Reunião da equipe", "Pacote de texturas grátis na bio", "Baixe agora", "Arquivada", iso(-15), "Baixa prioridade"],
  ];
  return {
    id: "brain-dump",
    name: "Banco de Ideias",
    group: "Produção",
    description: "Captura de ideias — guarde cada ideia aqui com uma prioridade e depois leve as vencedoras para a aba Plano de Conteúdo.",
    columns: [
      { name: "ID", width: 70 },
      { name: "Ideia", width: 240 },
      { name: "Categoria", width: 140, type: "select", options: PILLAR_OPTIONS },
      { name: "Formato", width: 110, type: "select", options: CONTENT_TYPES },
      { name: "Plataforma", width: 100, type: "select", options: PLATFORMS },
      { name: "Prioridade", width: 90, type: "select", options: PRIORITY_OPTIONS },
      { name: "Origem", width: 120 },
      { name: "Gancho potencial", width: 240 },
      { name: "CTA", width: 140 },
      { name: "Status", width: 120, type: "select", options: ["Ideia", "Em produção", "Pronto para planejar", "Arquivada"] },
      { name: "Data de inclusão", width: 100, type: "date" },
      { name: "Observações", width: 180 },
    ],
    rows,
    freeze: 1,
  };
}

function makeContentPlanSheet(): SheetDef {
  const rows: (string | number)[][] = [
    ["CP-001", iso(2), "Northwind Coffee Roasters", "Instagram", "Reel", "Educação", "Cold brew x café gelado", "Reconhecimento", "Mesmos grãos, duas bebidas bem diferentes.", "De qual time você é? ☕", "Salve este guia", "Vídeo vertical 20s, b-roll de cozinha + sobreposições", "Edição do vídeo", "Maiara Okano", "Em revisão", "Pendente", "Rascunho", "", "Segunda versão prevista"],
    ["CP-002", iso(4), "Northwind Coffee Roasters", "TikTok", "Short", "Bastidores", "Tour pela torrefação: da cereja à xícara", "Reconhecimento", "Já pensou no que acontece entre a cereja e a xícara?", "Passo a passo completo na legenda", "Acompanhe a série", "Caminhada com gimbal, 45s", "Edição bruta", "Maiara Okano", "Aprovado", "Aprovado", "Agendado", "", "Lote agendado"],
    ["CP-003", iso(6), "Northwind Coffee Roasters", "Instagram", "Story", "Promoção", "Teaser do menu de outono", "Interesse", "Quadros de contagem regressiva + enquete", "Doce de abóbora: sim ou não?", "Vote na enquete", "3 quadros + enquete", "Design", "Priya Raman", "Em revisão", "Pendente", "Rascunho", "", "Aguardando fotos do produto"],
    ["CP-004", iso(9), "Northwind Coffee Roasters", "Instagram", "Post", "Produto", "Revelação do Guatemala Huixpac", "Interesse", "Cacau, maçã-vermelha, açúcar mascavo.", "Chega na semana que vem — só 200 pacotes", "Entre na lista de espera", "Foto de estúdio 1080×1350", "Retoque", "Maiara Okano", "Aprovado", "Aprovado", "Agendado", "", "Segurar até a landing page entrar no ar"],
    ["CP-005", iso(12), "Northwind Coffee Roasters", "YouTube", "Vídeo", "Educação", "Sessão de prova com o mestre de torra", "Interesse", "Acompanhe uma prova de xícara ao vivo.", "O que buscamos no sabor e como pontuamos", "Inscreva-se", "16:9, 8 min + legendas", "Cor e áudio", "Jonas Feld", "Rascunhando", "—", "Rascunho", "", "Corte preliminar em edição"],
    ["CP-006", iso(-6), "Northwind Coffee Roasters", "LinkedIn", "Artigo", "Comunidade", "Por que publicamos o custo do café verde", "Consideração", "Relatório de transparência: quanto custa o seu pacote.", "Mostre as contas, ganhe a confiança", "Leia e compartilhe", "Artigo + imagem de capa", "Revisão de texto", "Jonas Feld", "Publicado", "—", "Publicado", "linkedin.com/…/custos", "Boa repercussão nos comentários"],
    ["CP-007", iso(-6), "Northwind Coffee Roasters", "Instagram", "Carrossel", "Educação", "5 erros no preparo", "Reconhecimento", "Salve para a manhã de domingo.", "Cinco erros, correções de dez segundos", "Salve este guia", "Carrossel de 6 telas 1080×1350", "Design", "Maiara Okano", "Publicado", "—", "Publicado", "instagram.com/…/p/xyz", "Melhor taxa de salvamentos do mês"],
    ["CP-008", iso(18), "Northwind Coffee Roasters", "Pinterest", "Pin", "Educação", "Tabela de proporções para cold brew", "Reconhecimento", "Prepare mais forte e dilua depois.", "Salve o cartão de proporções", "Salve este pin", "Infográfico 1000×1500", "Design", "Priya Raman", "Aprovado", "Aprovado", "Agendado", "", "Lote de 5 pins"],
    ["CP-009", iso(21), "Northwind Coffee Roasters", "Instagram", "Carrossel", "Bastidores", "Conheça o time: edição da torrefação", "Interesse", "As pessoas por trás do seu café.", "Abertura da série", "Acompanhe a série", "5 retratos", "Fotografia", "Priya Raman", "Ideia", "—", "Rascunho", "", "Depende da agenda do fotógrafo"],
    ["CP-010", iso(-9), "Northwind Coffee Roasters", "Instagram", "Reel", "Produto", "Como escolhemos as origens", "Reconhecimento", "Três perguntas antes de comprar uma safra.", "Relações antes de intermediários", "Salve este guia", "Vídeo vertical 35s", "Edição", "Maiara Okano", "Publicado", "—", "Publicado", "instagram.com/…/p/abc", "Melhor taxa de cliques para a lista"],
  ];
  return {
    id: "content-plan",
    name: "Plano de Conteúdo",
    group: "Produção",
    description: "O núcleo operacional — uma linha por conteúdo, da ideia à publicação. O Painel e os relatórios leem esta aba.",
    columns: [
      { name: "ID do conteúdo", width: 90 },
      { name: "Data", width: 92, type: "date" },
      { name: "Cliente", width: 150 },
      { name: "Plataforma", width: 100, type: "select", options: PLATFORMS },
      { name: "Formato", width: 110, type: "select", options: CONTENT_TYPES },
      { name: "Pilar", width: 140, type: "select", options: PILLAR_OPTIONS },
      { name: "Tema", width: 220 },
      { name: "Objetivo", width: 120, type: "select", options: ["Reconhecimento", "Interesse", "Consideração", "Conversão"] },
      { name: "Gancho", width: 230 },
      { name: "Legenda", width: 280 },
      { name: "CTA", width: 140 },
      { name: "Direção criativa", width: 260 },
      { name: "Material necessário", width: 120 },
      { name: "Responsável", width: 120 },
      { name: "Status do rascunho", width: 110, type: "select", options: STATUS_OPTIONS },
      { name: "Status de aprovação", width: 120, type: "select", options: APPROVAL_OPTIONS.concat(["Em revisão", "—"]) },
      { name: "Status de publicação", width: 130, type: "select", options: PUB_OPTIONS },
      { name: "URL", width: 170 },
      { name: "Observações de desempenho", width: 220 },
    ],
    rows,
    freeze: 1,
  };
}

function makeTasksSheet(): SheetDef {
  const rows: (string | number)[][] = [
    ["T-01", "Finalizar o briefing da campanha de outono", "Northwind Coffee Roasters", "Menu de outono", "Conteúdo", "Maiara Okano", "Alta", "Em andamento", iso(-2), iso(3), "", "—", "Aguardando aprovação das fotos do cliente"],
    ["T-02", "Editar o short do tour da torrefação", "Northwind Coffee Roasters", "Série da torrefação", "Produção", "Priya Raman", "Alta", "Em andamento", iso(-4), iso(2), "", "T-05", "Gravação com gimbal do dia 2 pendente"],
    ["T-03", "Criar o carrossel do lançamento da Guatemala", "Northwind Coffee Roasters", "Lançamento de origem", "Design", "Priya Raman", "Alta", "Bloqueado", iso(-6), iso(5), "", "T-04", "Falta a arte final do rótulo"],
    ["T-04", "Entregar a arte do rótulo v3", "Northwind Coffee Roasters", "Lançamento de origem", "Design", "Equipe do cliente", "Média", "Em andamento", iso(-3), iso(4), "", "—", "Com o designer do cliente"],
    ["T-05", "Reservar o segundo dia de gravação", "Northwind Coffee Roasters", "Série da torrefação", "Logística", "Maiara Okano", "Média", "Concluído", iso(-8), iso(-3), iso(-4), "—", ""],
    ["T-06", "Relatório mensal", "Hale & Harbor Interiors", "Relatórios", "Relatórios", "Jonas Feld", "Média", "A fazer", iso(1), iso(6), "", "—", "Modelo pronto em Relatórios"],
    ["T-07", "Agendar o lote de pins (5 pins)", "Northwind Coffee Roasters", "Pins perenes", "Publicação", "Priya Raman", "Baixa", "Concluído", iso(-5), iso(-1), iso(-1), "—", ""],
    ["T-08", "Atualizar a página de links da bio", "Bloomly Skincare", "Sincronia do site", "Conteúdo", "Jonas Feld", "Baixa", "A fazer", iso(2), iso(9), "", "—", "Texto em revisão com o cliente"],
  ];
  return {
    id: "tasks",
    name: "Tarefas",
    group: "Produção",
    description: "Gestão de tarefas e projetos — uma coluna de cliente por linha, com dependências, prioridades e prazos.",
    columns: [
      { name: "ID da tarefa", width: 80 },
      { name: "Tarefa", width: 240 },
      { name: "Cliente", width: 160 },
      { name: "Projeto", width: 130 },
      { name: "Categoria", width: 110 },
      { name: "Responsável", width: 120 },
      { name: "Prioridade", width: 90, type: "select", options: PRIORITY_OPTIONS },
      { name: "Status", width: 110, type: "select", options: TASK_STATUS_OPTIONS },
      { name: "Data de início", width: 92, type: "date" },
      { name: "Prazo", width: 92, type: "date" },
      { name: "Concluído em", width: 92, type: "date" },
      { name: "Depende de", width: 100 },
      { name: "Observações", width: 220 },
    ],
    rows,
    freeze: 1,
  };
}

function makeThirtyDaySheet(): SheetDef {
  const objectives: [string, string][] = [
    ["Auditar o perfil", "Bio, links, destaques"],
    ["Definir os pilares de conteúdo", "Escolha de 3 a 5"],
    ["Fazer um banco de ideias", "Aba Banco de Ideias"],
    ["Primeira gravação em lote", "10 peças em 2 horas"],
    ["Escrever legendas em lote", "Ganchos primeiro"],
    ["Agendar a semana 1", "Agendamento em lote"],
    ["Hora de engajamento", "Responder todos os comentários"],
    ["Analisar o melhor post", "Apostar mais nele"],
    ["Prospecção de parcerias", "3 mensagens diretas"],
    ["Revisar e ajustar", "Ritual de revisão semanal"],
  ];
  const rows: (string | number)[][] = [];
  for (let day = 1; day <= 30; rows.push([day, objectives[(day - 1) % 10][0], objectives[(day - 1) % 10][1], "Não iniciado", PLATFORMS[(day - 1) % PLATFORMS.length], "", ""]), day++);
  return {
    id: "thirty-day",
    name: "30 Dias",
    group: "Crescimento",
    description: "Planejador de relançamento de conta em 30 dias — um objetivo e uma ação por dia, com foco de plataforma e acompanhamento de status.",
    columns: [
      { name: "Dia", width: 60, type: "number" },
      { name: "Objetivo", width: 180 },
      { name: "Ação", width: 220 },
      { name: "Status", width: 110, type: "select", options: ["Não iniciado", "Em andamento", "Concluído"] },
      { name: "Foco de plataforma", width: 110, type: "select", options: PLATFORMS },
      { name: "Tarefa de conteúdo", width: 200 },
      { name: "Observações", width: 200 },
    ],
    rows,
    freeze: 1,
  };
}

function makeFeedPreviewSheet(): SheetDef {
  const rows: (string | number)[][] = [
    [1, iso(2), "Northwind Coffee Roasters", "Cold brew x café gelado", "Reel", "Capa do Reel: dois preparos lado a lado", "Educação"],
    [2, iso(4), "Northwind Coffee Roasters", "Teaser do tour da torrefação", "Reel", "Plano aberto da torrefação + assinatura da marca", "Bastidores"],
    [3, iso(7), "Northwind Coffee Roasters", "5 erros no preparo", "Carrossel", "Capa: erros numerados de 1 a 5", "Educação"],
    [4, iso(9), "Northwind Coffee Roasters", "Revelação da Guatemala", "Post", "Foto de estúdio em fundo creme", "Produto"],
    [5, iso(12), "Hale & Harbor Interiors", "Minimalismo acolhedor explicado", "Carrossel", "Composição em paleta neutra", "Educação"],
    [6, iso(15), "Northwind Coffee Roasters", "Cartão de proporções", "Post", "Cartão infográfico em verde-pinho", "Educação"],
    [7, iso(18), "Bloomly Skincare", "Rotina de inverno em 3 passos", "Reel", "Close na prateleira do banheiro, luz suave", "Educação"],
    [8, iso(21), "Northwind Coffee Roasters", "Destaque do menu de outono", "Post", "Composição em terracota", "Promoção"],
    [9, iso(24), "Bloomly Skincare", "Ingrediente em foco: esqualano", "Carrossel", "Macrofotos de textura no mármore", "Educação"],
  ];
  return {
    id: "feed-preview",
    name: "Prévia do Feed",
    group: "Planejamento",
    description: "Planejamento visual do feed por cliente — organize os próximos posts na ordem de publicação para conferir ritmo e equilíbrio de cores antes de qualquer coisa ir ao ar.",
    columns: [
      { name: "Nº do post", width: 70, type: "number" },
      { name: "Data", width: 92, type: "date" },
      { name: "Cliente", width: 160 },
      { name: "Conteúdo", width: 200 },
      { name: "Tipo de conteúdo", width: 100, type: "select", options: CONTENT_TYPES },
      { name: "Conceito visual", width: 240 },
      { name: "Pilar", width: 140, type: "select", options: PILLAR_OPTIONS },
    ],
    rows,
    freeze: 1,
  };
}

function makeHashtagsSheet(): SheetDef {
  const rows: (string | number)[][] = [
    ["#cafeespecial", "Segmento", "Educação", "Ampla", "Alta", "Instagram", "café, barista", "Qualquer post educativo", "Ativa", "Também usada no TikTok"],
    ["#cafeemcasa", "Comunidade", "Educação", "Nicho", "Média", "Instagram", "café em casa, v60", "Guias em carrossel", "Ativa", "Melhor taxa de salvamentos; também no TikTok"],
    ["#torrefacao", "Segmento", "Produto", "Nicho", "Média", "Instagram", "torra, origens", "Revelações de produto", "Ativa", "Reaproveitar em posts de origem no LinkedIn"],
    ["#coadov60", "Técnica", "Educação", "Nicho", "Média", "Instagram", "v60, chemex", "Guias de preparo", "Ativa", "Fixar o guia gráfico no Pinterest"],
    ["#coldbrew", "Produto", "Educação", "Ampla", "Alta", "TikTok", "café gelado", "Sazonalidades", "Ativa", "Também no Instagram; alternar com #cafegelado"],
    ["#cafebrasil", "Local", "Comunidade", "Local", "Baixa", "Instagram", "café nacional, produtor", "Posts de comunidade", "Ativa", "Forte alcance local"],
    ["#presentesdecafe", "Sazonal", "Promoção", "Ampla", "Alta", "Pinterest", "guia de presentes", "Campanha de presentes", "Planejada", "A partir de 20 de nov; também nos stories"],
    ["#bastidores", "Estilo", "Bastidores", "Ampla", "Média", "TikTok", "vida na torrefação", "Conteúdos de bastidores", "Ativa", "Reaproveitar os clipes nos Reels"],
  ];
  return {
    id: "hashtags",
    name: "Hashtags",
    group: "Crescimento",
    description: "Base de pesquisa de hashtags — agrupe as tags em conjuntos, acompanhe amplitude e concorrência e anote onde cada uma rende mais.",
    columns: [
      { name: "Hashtag", width: 140 },
      { name: "Categoria", width: 110 },
      { name: "Pilar de conteúdo", width: 150, type: "select", options: PILLAR_OPTIONS },
      { name: "Amplitude", width: 100, type: "select", options: ["Ampla", "Nicho", "Local", "De marca"] },
      { name: "Concorrência", width: 110, type: "select", options: ["Baixa", "Média", "Alta"] },
      { name: "Plataforma", width: 150, type: "select", options: PLATFORMS },
      { name: "Palavras-chave relacionadas", width: 180 },
      { name: "Melhor uso", width: 180 },
      { name: "Status", width: 90, type: "select", options: ["Ativa", "Em teste", "Planejada", "Aposentada"] },
      { name: "Observações", width: 200 },
    ],
    rows,
    freeze: 1,
  };
}

function makeCollabsSheet(): SheetDef {
  const rows: (string | number)[][] = [
    ["Brewed Awake Café", "Cafeteria local", "Instagram", "contato@brewedawake.exemplo", "Troca de conteúdo", iso(-14), "Ativa", "1 carrossel + 3 stories", iso(8), "R$ 0 — permuta", "—", "Segunda parceria do ano"],
    ["Kitchen&Co", "Marca de utensílios", "TikTok", "parcerias@kitchenco.exemplo", "Brinde + destaque", iso(-9), "Proposta enviada", "1 Short com a chaleira deles", iso(15), "R$ 450", "Pendente", "Contrato aguardando assinatura"],
    ["Maya Chen", "Criadora de café em casa, 88 mil", "YouTube", "maya.chen@criador.exemplo", "Participação paga", iso(-21), "Em negociação", "Participação no vídeo de prova", iso(22), "R$ 900", "Sinal recebido", "Pede direitos de uso por 60 dias"],
    ["Brew Bar Supply", "Varejo de equipamentos", "Instagram", "vendas@brewbarsupply.exemplo", "Afiliados", iso(-30), "Ativa", "Posição no link da bio", "—", "12% de comissão", "R$ 118 no mês passado", "Acompanhar o repasse mensal"],
    ["Riverbend Market", "Rede de supermercados", "LinkedIn", "compras@riverbend.exemplo", "Parceria de atacado", iso(-2), "Primeiro contato", "Post de anúncio do lançamento", iso(30), "R$ 0 — parceria", "—", "Reunião com o comprador agendada"],
  ];
  return {
    id: "collabs",
    name: "Parcerias",
    group: "Crescimento",
    description: "Controle de parcerias — prospecção, entregáveis, condições de pagamento e resultados de cada parceiro e criador.",
    columns: [
      { name: "Parceiro", width: 150 },
      { name: "Empresa / perfil", width: 190 },
      { name: "Plataforma", width: 100, type: "select", options: PLATFORMS },
      { name: "Contato", width: 190 },
      { name: "Tipo de parceria", width: 150 },
      { name: "Data da proposta", width: 100, type: "date" },
      { name: "Status", width: 130, type: "select", options: ["Primeiro contato", "Proposta enviada", "Em negociação", "Ativa", "Concluída", "Recusada"] },
      { name: "Entregáveis", width: 220 },
      { name: "Data de publicação", width: 110, type: "date" },
      { name: "Pagamento", width: 110 },
      { name: "Resultados", width: 140 },
      { name: "Observações", width: 200 },
    ],
    rows,
    freeze: 1,
  };
}

function makeFinanceSheet(): SheetDef {
  const rows: (string | number)[][] = [
    [iso(-28), "Northwind Coffee Roasters", 4800, "", "Mensalidade", "Gestão mensal — outubro", "Pago", iso(-25), iso(-24)],
    [iso(-14), "Northwind Coffee Roasters", "", 850, "Produção", "Locação de cenário + objetos", "Pago", "", iso(-12)],
    [iso(-7), "Parceria Kitchen&Co", 450, "", "Parceria", "Short patrocinado — sinal", "Pago", iso(-7), iso(-5)],
    [iso(3), "Northwind Coffee Roasters", 4800, "", "Mensalidade", "Mensalidade — novembro", "Pendente", iso(10), ""],
    [iso(6), "Fieldnote Studio", "", 320, "Software", "Ferramentas de agendamento e edição", "Pendente", iso(13), ""],
    [iso(10), "Parceria Maya Chen", 900, "", "Parceria", "Participação paga — saldo restante", "Pendente", iso(17), ""],
    [iso(-40), "Northwind Coffee Roasters", 4800, "", "Mensalidade", "Mensalidade — setembro", "Pago", iso(-35), iso(-33)],
    [iso(-38), "Videomaker freelancer", "", 1200, "Freelancer", "Série da torrefação — dia 1 de edição", "Pago", iso(-33), iso(-31)],
  ];
  return {
    id: "finance",
    name: "Financeiro",
    group: "Negócios",
    description: "Controle financeiro enxuto — receitas, despesas, status de pagamento e resultado líquido. A linha de resumo é calculada automaticamente.",
    columns: [
      { name: "Data", width: 92, type: "date" },
      { name: "Cliente / favorecido", width: 190 },
      { name: "Receita", width: 100, type: "currency" },
      { name: "Despesa", width: 100, type: "currency" },
      { name: "Categoria", width: 140, type: "select", options: ["Mensalidade", "Parceria", "Produção", "Software", "Freelancer", "Outros"] },
      { name: "Descrição", width: 260 },
      { name: "Status de pagamento", width: 120, type: "select", options: ["Pago", "Pendente", "Atrasado"] },
      { name: "Vencimento", width: 92, type: "date" },
      { name: "Data de pagamento", width: 92, type: "date" },
    ],
    rows,
    freeze: 1,
  };
}

// Relatórios de Clientes substitui as antigas abas de analytics por plataforma:
// sem conexão com APIs das redes não há números de seguidores/alcance para
// acompanhar, então o gestor relata o que de fato controla — entrega,
// aprovações e dinheiro.
function makeClientReportsSheet(): SheetDef {
  const rows: (string | number)[][] = [];
  const clientPlan: [string, number, number, number, number, number, string][] = [
    ["Northwind Coffee Roasters", 12, 12, 11, 1, 4800, "Lançamento do menu de outono entregue; o plano de dezembro começa em 20 de nov"],
    ["Hale & Harbor Interiors", 8, 8, 8, 0, 3200, "Calendário de primavera 60% reservado a partir de leads de conteúdo"],
    ["Bloomly Skincare", 16, 16, 14, 2, 6500, "Fila do jurídico liberada; lançamento do creme reparador no prazo"],
    ["Vela Fitness Studio", 0, 0, 0, 0, 0, "Em fase de proposta — os relatórios começam após a assinatura"],
  ];
  for (let m = 1; m >= -1; m--) {
    clientPlan.forEach(([client, planned, delivered, onTime, flagged, fee, notes], ci) => {
      const j = 0.9 + ((ci * 7 + m + 20) % 5) * 0.02;
      rows.push([
        monthISO(m, 15),
        client,
        ci === 3 && m !== -1 ? 0 : Math.round(planned * j),
        ci === 3 && m !== -1 ? 0 : Math.round(delivered * j),
        ci === 3 && m !== -1 ? 0 : Math.round(onTime * j),
        ci === 3 && m !== -1 ? 0 : flagged,
        ci === 3 && m !== -1 ? "—" : Math.round(fee * j),
        ci === 3 && m !== -1 ? "Aguardando proposta assinada" : ci === 0 && m === -1 ? notes : "",
      ]);
    });
  }
  return {
    id: "client-reports",
    name: "Relatórios de Clientes",
    group: "Crescimento",
    description: "Resumo mensal do serviço por cliente — planejado x entregue, taxa de pontualidade, peças com ajuste e mensalidade. Sem métricas de redes sociais: o relatório cobre o que o gestor controla.",
    columns: [
      { name: "Mês", width: 92, type: "date" },
      { name: "Cliente", width: 170 },
      { name: "Posts planejados", width: 100, type: "number" },
      { name: "Entregues", width: 90, type: "number" },
      { name: "No prazo", width: 80, type: "number" },
      { name: "Ajustes / revisões", width: 110, type: "number" },
      { name: "Faturado", width: 100, type: "currency" },
      { name: "Resumo", width: 280 },
    ],
    rows,
    freeze: 1,
  };
}

function makeServiceLogSheet(): SheetDef {
  const rows: (string | number)[][] = [
    [iso(-1), "Northwind Coffee Roasters", "Publicado", "Reel", "Cold brew x café gelado", "Instagram", "Publicado no horário; janela da manhã"],
    [iso(-3), "Northwind Coffee Roasters", "Agendado", "Carrossel", "5 erros no preparo", "Instagram", "Lote agendado com as proporções fixadas"],
    [iso(-4), "Bloomly Skincare", "Alterações solicitadas", "Reel", "Teaser do creme reparador", "Instagram", "Gancho mais suave — reeditando hoje"],
    [iso(-6), "Hale & Harbor Interiors", "Publicado", "Carrossel", "Guia de tamanhos de tapete", "Pinterest", "Melhor taxa de salvamentos do mês"],
    [iso(-7), "Northwind Coffee Roasters", "Publicado", "Artigo", "Por que publicamos o custo do café verde", "LinkedIn", "Boa repercussão entre clientes de atacado"],
    [iso(-8), "Bloomly Skincare", "Agendado", "Short", "A fundadora responde às mensagens #2", "TikTok", "Segundo da série; ganchos funcionando"],
  ];
  return {
    id: "service-log",
    name: "Registro de Entregas",
    group: "Crescimento",
    description: "Registro do que foi entregue por cliente — um histórico simples do trabalho publicado/agendado, sem métricas das plataformas sociais.",
    columns: [
      { name: "Data", width: 92, type: "date" },
      { name: "Cliente", width: 170 },
      { name: "Status", width: 130, type: "select", options: STATUS_OPTIONS.concat(["Alterações solicitadas"]) },
      { name: "Formato", width: 100, type: "select", options: CONTENT_TYPES },
      { name: "Tema", width: 230 },
      { name: "Plataforma", width: 100, type: "select", options: PLATFORMS },
      { name: "Observações", width: 260 },
    ],
    rows,
    freeze: 1,
  };
}

// ---- montagem final ------------------------------------------------------

export function buildWorkbookSheets(): SheetDef[] {
  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const sheets: SheetDef[] = [];

  sheets.push({
    id: "setup",
    name: "Configuração",
    group: "Configuração e Marca",
    description: "Configuração central — dados do negócio, pacote e período de serviço. Referencie estes valores nas outras abas em vez de digitá-los de novo.",
    columns: [
      { name: "Campo", width: 220 },
      { name: "Valor", width: 460 },
    ],
    rows: SETUP_ROWS,
    freeze: 1,
  });

  sheets.push({
    id: "clients",
    name: "Clientes",
    group: "Configuração e Marca",
    description: "Carteira de clientes — uma linha por cliente com contato, pacote, mensalidade, status e perfis sociais. As fórmulas da Configuração e do Painel leem daqui.",
    columns: [
      { name: "Cliente", width: 180 },
      { name: "Contato", width: 130 },
      { name: "E-mail", width: 180 },
      { name: "Telefone", width: 130 },
      { name: "Site", width: 150 },
      { name: "Segmento", width: 150 },
      { name: "Pacote", width: 170 },
      { name: "Mensalidade", width: 100, type: "currency" },
      { name: "Data de início", width: 92, type: "date" },
      { name: "Status", width: 100, type: "select", options: ["Ativo", "Pausado", "Prospecto", "Arquivado"] },
      { name: "Instagram", width: 120 },
      { name: "TikTok", width: 120 },
      { name: "LinkedIn", width: 120 },
      { name: "Observações", width: 260 },
    ],
    rows: CLIENTS_ROWS,
    freeze: 1,
  });

  sheets.push({
    id: "brand",
    name: "Marca",
    group: "Configuração e Marca",
    description: "Referência de marca — voz, público, pilares e direção visual para decidir conteúdo no dia a dia.",
    columns: [
      { name: "Campo", width: 200 },
      { name: "Valor", width: 500 },
    ],
    rows: BRAND_ROWS,
    freeze: 1,
  });

  sheets.push(makeGoalsSheet());
  sheets.push(makeDashboardSheet());
  sheets.push(makeYearSheet());

  monthNames.forEach((name, i) => {
    sheets.push(monthSheet(i + 6, name, i - 8));
  });

  sheets.push(makeWeeklySheet());
  sheets.push(makeBrainDumpSheet());
  sheets.push(makeContentPlanSheet());
  sheets.push(makeTasksSheet());
  sheets.push(makeThirtyDaySheet());
  sheets.push(makeFeedPreviewSheet());
  sheets.push(makeHashtagsSheet());
  sheets.push(makeCollabsSheet());
  sheets.push(makeFinanceSheet());
  sheets.push(makeClientReportsSheet());
  sheets.push(makeServiceLogSheet());

  return sheets;
}

export function toCSV(sheet: SheetDef): string {
  const esc = (v: string | number) => {
    const s = String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  return [
    sheet.columns.map((c) => esc(c.name)).join(","),
    ...sheet.rows.map((r) => r.map((v) => esc(v)).join(",")),
  ].join("\n");
}

export function downloadCSV(sheet: SheetDef) {
  const blob = new Blob([toCSV(sheet)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${sheet.name.replace(/\s+/g, "-")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadAllSheetsCSV(sheets: SheetDef[]) {
  sheets.forEach((sheet, i) => {
    setTimeout(() => downloadCSV(sheet), i * 250);
  });
}
