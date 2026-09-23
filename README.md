# Contentplane — Sistema operacional para gestores de social media

Um sistema operacional completo para **gestores de social media independentes e agências
boutique**: um espaço de trabalho para toda a sua carteira (clientes, calendários, tarefas,
aprovações, dinheiro), uma planilha de 29 abas e uma exportação compatível com o Notion — tudo
compartilhando a mesma arquitetura de informação.

> Produto original. Sem vínculo, cópia ou inspiração em marca, anúncio de marketplace ou produto existente.

## Para quem é

Contentplane é um produto de **assento único**: o gestor de social media entra na conta e administra
vários clientes. Clientes são registros que você cria — com dados da empresa, perfis sociais,
pacote, mensalidade e um espaço privado de anotações — e não contas de usuário. Todos os dados
ficam na **sua** conta Convex, limitados por `ownerId`, então acompanham você entre dispositivos e
nenhum cliente acessa o espaço de trabalho.

## O que vem aqui

| Superfície | Onde | O que faz |
| --- | --- | --- |
| **Espaço do gestor** | `/app/dashboard` (após entrar) | Clientes, estratégia, integração, calendário, tarefas, aprovações, solicitações, financeiro, reuniões, arquivos e configurações. |
| **Planilha do gestor** | `/workbook` | 29 abas com fórmulas, listas suspensas e formatação de status — visíveis no app e exportáveis em CSV. |
| **Pacote para o Notion** | Configurações → "Pacote para o Notion" | Um conjunto de páginas por cliente + bases compartilhadas (Clientes, Conteúdo, Tarefas, Solicitações, Reuniões, Entregas e Financeiro). |
| **Ferramentas de dados** | Configurações | Exportar/importar JSON, espaço de exemplo (4 clientes fictícios) e limpeza total. |

## A arquitetura de informação

```
Gestor (você)
 → Clientes           (carteira: empresa, contatos, pacote, mensalidade, status, anotações)
    → Estratégia      (objetivos, público, pilares, voz e indicadores por cliente)
    → Conteúdo        (ideia → rascunho → revisão → aprovação → agendamento → publicação)
    → Tarefas         (tudo em volta do conteúdo, por cliente)
    → Solicitações    (entrada → em andamento → aguardando → concluída)
    → Reuniões        (pauta → anotações → itens de ação)
    → Entregas        (arquivos ligados a conteúdos e projetos)
 → Financeiro         (receitas e despesas, opcionalmente vinculadas a um cliente)
```

Cada superfície (espaço de trabalho, planilha, Notion) é uma visão desse mesmo modelo: o dado é
digitado uma vez e referenciado em todos os lugares.

## O espaço de trabalho do gestor

- **Painel** — clientes ativos, aprovações pendentes, tarefas abertas/atrasadas, receitas,
  despesas, resultado, posts planejados, agenda dos próximos 7 dias e uma tabela por cliente
  (planejados, publicados, tarefas abertas, resultado).
- **Clientes** — a carteira. Cadastre e edite clientes com dados da empresa, perfis sociais,
  pacote, mensalidade, status (Ativo / Pausado / Prospecto / Arquivado) e anotações livres.
  Excluir um cliente remove também seus conteúdos, tarefas, solicitações, reuniões, entregas e
  lançamentos financeiros.
- **Calendário e Aprovações** — o fluxo de conteúdo de todos os clientes, filtrável por cliente,
  com o percurso Ideia → Publicado.
- **Tarefas** — quadro de tarefas entre clientes, com prioridade, prazos e acompanhamento de atrasos.
- **Financeiro** — receitas e despesas com categoria, status de pagamento e datas de vencimento e
  pagamento; totais do mês e valores pendentes sobem para o painel.
- **Reuniões, Arquivos, Estratégia, Integração e Configurações** — registros por cliente e
  ferramentas do espaço.

Tudo é reativo: cada seção é uma consulta ao vivo do Convex limitada ao gestor logado.

## As 29 abas da planilha

1. **Configuração** — perfil do gestor + totais ao vivo (`COUNTIF`/`SUMIF` lendo a aba Clientes)
2. **Clientes** — a carteira: contato, pacote, mensalidade, status, perfis sociais, anotações
3. **Marca** — referência de marca (duplique por cliente quando precisar)
4. **Metas** — estrutura de indicadores com progresso calculado
5. **Painel** — panorama do negócio ao vivo a partir de Clientes, Plano de Conteúdo, Tarefas e Financeiro
6. **Ano** — visão geral de campanhas em 12 meses
7–18. **Jan … Dez** — calendários mensais com coluna **Cliente** e listas suspensas de status
19. **Semanal** — plano da semana com coluna de cliente
20. **Banco de Ideias** — captura de ideias
21. **Plano de Conteúdo** — o núcleo operacional (18 colunas, uma linha por cliente)
22. **Tarefas** — gestão de tarefas com cliente, dependências e prioridades
23. **30 Dias** — planejador de relançamento de conta
24. **Prévia do Feed** — planejamento visual do feed por cliente
25. **Hashtags** — pesquisa e organização de conjuntos de tags
26. **Parcerias** — controle de colaborações
27. **Financeiro** — livro de receitas/despesas que alimenta o Painel
28. **Relatórios de Clientes** — planejado x entregue no mês, pontualidade, peças com ajuste e faturado
29. **Registro de Entregas** — o que saiu por cliente (registro de entrega, sem métricas de redes)

A aba Painel calcula a partir das outras abas (referências `COUNTA`/`COUNTIF`/`COUNTIFS`/`SUMIF`/
`SUMIFS` a Clientes, Plano de Conteúdo, Tarefas e Financeiro). Um motor de fórmulas enxuto
(`src/data/formula.ts`) avalia essas fórmulas para o visualizador no app, então cada célula mostra
o valor calculado — passe o mouse para ver a fórmula — enquanto células de status ganham cor e as
colunas com lista suspensa aparecem marcadas com ▾.

**Removido de propósito:** as antigas abas de Análise de Plataformas e Análise de Conteúdo
(seguidores, alcance, impressões, engajamento). O app não tem conexão com APIs das redes sociais,
então a planilha acompanha apenas o que o gestor realmente controla — entrega, aprovações e dinheiro.

## Como o app funciona

- **Stack:** React + Vite + Tailwind + shadcn/ui. Todos os dados do espaço ficam no **Convex**,
  limitados ao gestor logado (`ownerId` em cada tabela); as escritas passam por mutations
  autenticadas.
- **Autenticação:** a autenticação do Convex protege `/app/*` e `/workbook`. Após entrar, você cai
  em `/app/dashboard`.
- **Dados de exemplo:** Configurações → "Carregar dados de exemplo" cria quatro clientes fictícios
  (Northwind Coffee Roasters, Hale & Harbor Interiors, Bloomly Skincare e Vela Fitness Studio) com
  conteúdos, tarefas, reuniões e finanças distribuídos ao redor de hoje.
- **CRUD:** clientes, conteúdos, tarefas, solicitações, reuniões, entregas e financeiro permitem
  adicionar, editar e excluir; os status mudam na própria tela; tudo persiste na sua conta.
- **Exportações:** backup em JSON (Configurações), pacote do Notion por cliente (Configurações) e
  CSV da aba ou de todas as abas (página da Planilha).

## Idioma

A interface, a planilha e o pacote do Notion estão em **português (pt-BR)**, com moeda em Real e
datas no formato brasileiro. Os valores internos de status, prioridade e categoria continuam em
inglês no banco e nos formulários; a tradução acontece só na exibição, via o dicionário em
`src/data/labels.ts`. Assim, mudar ou revisar textos nunca corrompe dados já salvos nem quebra
filtros e fórmulas.

## Importar no Notion (versão curta)

1. Baixe o pacote em **Configurações → Pacote para o Notion**.
2. No Notion: **Workspace → Import → CSV** para cada arquivo em `databases/`.
3. Crie páginas a partir dos arquivos markdown sob uma página principal — as pastas
   `clients/<nome>/` correspondem a um conjunto de páginas por cliente.
4. Ligue as páginas com menções `@` e agrupe a base **Content** por Status para ter um quadro de
   aprovações.

`Finance.csv`, as tabelas de indicadores e as observações "somente para o gestor" são de uso interno
do negócio — remova-os antes de compartilhar a pasta de um cliente com o próprio cliente.

## Checklist de verificação

- [x] Espaço do gestor com carteira de clientes, registros por cliente e financeiro
- [x] Planilha: 29 abas, nenhuma linha desalinhada, valores de lista sempre válidos
- [x] Fórmulas do Painel referenciam as colunas corretas e calculam ao vivo no visualizador
- [x] Nenhuma coluna de métrica de rede social (seguidores/alcance removidos por decisão de projeto)
- [x] Tabelas do Convex limitadas por `ownerId`; exclusões em cascata por cliente
- [x] Navegação, formulários, filtros e busca do portal funcionando
- [x] Exportar/importar JSON + carregar o espaço de exemplo
- [x] Layouts responsivos (menu lateral no mobile, grades fluidas)
- [x] Pacote do Notion espelhando o espaço de trabalho, por cliente
- [x] Apenas identidade visual e textos originais

## Desenvolvimento

```bash
bun install
bun convex dev --once   # regenera os tipos do Convex / publica as funções
bun tsc -b --noEmit     # checagem de tipos
bun test                # testes de regressão da camada de dados
```

`bun test` cobre a planilha (conjunto de abas, ausência de linhas desalinhadas, valores de lista,
indicadores do Painel conferidos contra as abas de origem), o próprio motor de fórmulas, o
planejador de faturas recorrentes e o pacote de exportação para o Notion.

A plataforma roda o servidor de desenvolvimento e o processo do Convex automaticamente; publique
para fazer o deploy.
