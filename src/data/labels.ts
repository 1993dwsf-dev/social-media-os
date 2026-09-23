// Rótulos em português (pt-BR) para os valores internos do sistema.
//
// O produto guarda valores estáveis em inglês (no Convex, nos formulários e nas
// comparações do código) e traduz apenas na hora de exibir. Assim, trocar o
// idioma nunca corrompe dados já salvos nem quebra filtros e fórmulas.

const PT_BR: Record<string, string> = {
  // Status de conteúdo
  Idea: "Ideia",
  Drafting: "Rascunhando",
  "In Review": "Em revisão",
  "Changes Requested": "Alterações solicitadas",
  Approved: "Aprovado",
  Scheduled: "Agendado",
  Published: "Publicado",

  // Status de solicitação
  New: "Nova",
  "In Progress": "Em andamento",
  Waiting: "Aguardando",
  Completed: "Concluída",
  Closed: "Fechada",

  // Status de reunião
  Cancelled: "Cancelada",

  // Prioridade
  Low: "Baixa",
  Medium: "Média",
  High: "Alta",

  // Status de tarefa
  Backlog: "A fazer",
  Blocked: "Bloqueado",
  Done: "Concluído",

  // Status de arquivo / entrega
  Shared: "Compartilhado",
  "In progress": "Em produção",
  Archived: "Arquivado",

  // Financeiro
  Paid: "Pago",
  Pending: "Pendente",
  Overdue: "Atrasado",
  Income: "Receita",
  Expense: "Despesa",

  // Status de cliente
  Active: "Ativo",
  Paused: "Pausado",
  Prospect: "Prospecto",

  // Etapas de onboarding
  Company: "Empresa",
  Contact: "Contato",
  Brand: "Marca",
  "Social accounts": "Redes sociais",
  Audience: "Público",
  Objectives: "Objetivos",
  Competitors: "Concorrentes",
  "Content preferences": "Preferências de conteúdo",
  "Approval preferences": "Preferências de aprovação",
  "Important dates": "Datas importantes",
  "Brand assets": "Materiais da marca",
  Notes: "Observações",

  // Formatos de conteúdo
  Reel: "Reel",
  Carousel: "Carrossel",
  "Single post": "Post único",
  Story: "Story",
  Short: "Short",
  Video: "Vídeo",
  Pin: "Pin",
  Article: "Artigo",
  Live: "Ao vivo",

  // Pilares de conteúdo
  Education: "Educação",
  "Behind the scenes": "Bastidores",
  Product: "Produto",
  Community: "Comunidade",
  Promotion: "Promoção",

  // Categorias de solicitação
  Content: "Conteúdo",
  Design: "Design",
  Strategy: "Estratégia",
  Report: "Relatório",
  Access: "Acesso",
  Budget: "Orçamento",
  Other: "Outro",

  // Categorias de tarefa
  Production: "Produção",
  Publishing: "Publicação",
  Reporting: "Relatórios",
  Admin: "Administrativo",
  Logistics: "Logística",

  // Categorias de arquivo
  Graphics: "Design",
  Videos: "Vídeos",
  Reports: "Relatórios",
  Documents: "Documentos",
  "Final deliverables": "Entregas finais",

  // Categorias financeiras
  Retainer: "Mensalidade",
  "Project fee": "Projeto",
  Collab: "Parceria",
  Software: "Software",
  Equipment: "Equipamento",
  Contractor: "Freelancer",
  Ads: "Anúncios",

  // Preferências do espaço de trabalho
  Monday: "Segunda-feira",
  Sunday: "Domingo",
  comfortable: "Confortável",
  compact: "Compacta",

  // Objetivos de conteúdo
  Awareness: "Reconhecimento",
  Interest: "Interesse",
  Consideration: "Consideração",
  Conversion: "Conversão",

  // Grupos de navegação
  Overview: "Visão geral",
};

/** Traduz um valor interno para pt-BR; devolve o próprio valor se não houver tradução. */
export function label(value: string): string {
  return PT_BR[value] ?? value;
}

/** Traduz uma lista de valores internos. */
export function labels(values: readonly string[]): string[] {
  return values.map(label);
}

/**
 * True quando o valor é um enum conhecido — usado antes de traduzir textos
 * livres, para nunca trocar o conteúdo digitado pelo gestor.
 */
export function isKnownLabel(value: string): boolean {
  return Object.prototype.hasOwnProperty.call(PT_BR, value);
}
