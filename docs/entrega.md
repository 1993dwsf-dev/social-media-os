# Guia de entrega — Contentplane

Como colocar o produto no ar e entregá-lo ao usuário final (o gestor de social media que vai
operar o sistema).

O Contentplane é **single-seat**: existe um único login, o do gestor. Clientes são *registros*
dentro da conta dele (empresa, contatos, pacote, mensalidade, anotações) — não são usuários e não
fazem login. Isso precisa estar claro no momento da entrega.

---

## 1. Antes de publicar — checklist técnico

Rode na raiz do projeto:

```bash
bun convex dev --once   # publica as funções do Convex e regenera os tipos
bun tsc -b --noEmit     # checagem de tipos (deve sair limpo)
bun test                # testes da camada de dados (planilha, fórmulas, faturas)
```

Depois valide visualmente as quatro superfícies:

| Rota | O que conferir |
| --- | --- |
| `/` | Landing page carrega, tema aplicado, CTAs levam para `/auth` |
| `/auth` | Envio do código por e-mail e opção "Continuar como visitante" |
| `/app/dashboard` | Portal abre após entrar, menu lateral completo, dados reativos |
| `/workbook` | 29 abas, fórmulas calculadas (passe o mouse na célula vê a fórmula), sem `#ERROR` |

Se a pré-visualização estiver em branco, quase sempre são erros de tipo/tema bloqueando o build —
rode `bun convex dev --once && bun tsc -b --noEmit` e corrija o que aparecer.

---

## 2. Publicar o app

1. No Freebuff, abra o projeto e use **Publicar** (a rota é
   `https://freebuff.com/project/<nome-do-projeto>?publish=true`). Isso gera a URL de produção.
2. A publicação provisiona a implantação de produção do **Convex** junto com o front. O banco e as
   funções vivem nessa implantação, na conta do projeto.
3. Confirme, na aba **Keys / API keys**, que as variáveis que o código lê estão presentes:

| Variável | Onde é lida | Papel |
| --- | --- | --- |
| `VITE_CONVEX_URL` | `src/main.tsx` (cliente Vite) | URL da implantação Convex que o front consome |
| `CONVEX_SITE_URL` | `src/convex/auth.config.ts` | Domínio que emite/valida os JWT de sessão |
| `VLY_CONVEX_AUTH_ISSUER` | `src/convex/auth.config.ts` | Emissor do login federado (padrão `https://freebuff.com`) |
| `VLY_APP_NAME` | `src/convex/auth/emailOtp.ts` | Nome do app no e-mail com o código de acesso |

Em um projeto Freebuff essas chaves já vêm configuradas; só mexa se estiver migrando de conta ou
self-hospedando o Convex. **Nunca** edite arquivos `.env` à mão — use a aba Keys.

4. Domínio próprio (opcional): configure em Settings do projeto no Freebuff e aponte o DNS. Nada no
código precisa mudar.

---

## 3. Primeiro acesso do usuário final

Em `/auth` existem dois caminhos:

- **Código por e-mail (recomendado, use este na entrega).** A pessoa digita o e-mail, recebe um
  código de 6 dígitos válido por 15 minutos (enviado pelo serviço de autenticação do Freebuff) e cai
  direto em `/app/dashboard`. O espaço de trabalho fica **vinculado ao e-mail** — funciona em
  qualquer navegador ou dispositivo depois.
- **"Continuar como visitante".** Sessão anônima, útil só para demonstração rápida. Não use para o
  cliente real: sem e-mail não há como recuperar o acesso se a sessão do navegador for limpa.

Rotas protegidas: `/app/*` e `/workbook` passam por `RequireAuth`. Quem não está logado é levado para
`/auth` e, após entrar, volta para o destino pretendido. O fallback pós-login é `/app/dashboard`.

**Resumo para enviar ao usuário:** "Abra a URL, clique em *Entrar*, informe seu e-mail, cole o código
de 6 dígitos que chegar e você já está no painel. Ninguém mais vê seus dados: a conta é sua."

---

## 4. Dados: espaço de exemplo x espaço limpo

A conta nova começa **vazia**. Em **Configurações** há:

- **Carregar dados de exemplo** — cria 4 clientes fictícios (Northwind Coffee Roasters, Hale & Harbor
  Interiors, Bloomly Skincare, Vela Fitness Studio) com conteúdos, tarefas, reuniões e lançamentos
  financeiros distribuídos ao redor de hoje. Ótimo para demonstração.
- **Exportar JSON / Importar backup** — leva tudo para outra conta ou guarda uma cópia de segurança.
- **Limpar espaço de trabalho** — apaga tudo o que está na conta.

**Ordem certa na entrega:** carregue o exemplo para a pessoa *ver* o produto funcionando → use
"Limpar espaço de trabalho" → comece a cadastrar os clientes reais. Carregar o exemplo **apaga e
substitui** o que já existe, então nunca faça isso depois que o usuário começou a trabalhar de
verdade.

**Isolamento:** cada tabela tem `ownerId` e toda consulta é limitada ao gestor logado. O que ele
cadastra não aparece para mais ninguém, e excluir um cliente remove em cascata conteúdos, tarefas,
solicitações, reuniões, entregas e lançamentos daquele cliente.

---

## 5. Onboarding do usuário (primeira sessão, ~40 min)

Sugira esta ordem — ela preenche as dependências na sequência certa:

| # | Seção | O que fazer |
| --- | --- | --- |
| 1 | **Configurações** | Nome, agência, moeda, fuso, prazo de aprovação, notificações |
| 2 | **Clientes** | Cadastrar 1 cliente: empresa, contato, e-mail, telefone, site, segmento, pacote, mensalidade, status, perfis sociais, anotações |
| 3 | **Estratégia** | Objetivos, público, pilares de conteúdo, tom de voz e indicadores (KPI) do cliente |
| 4 | **Integração** | Checklist de entrada do cliente: acessos, arquivos de marca, briefings |
| 5 | **Calendário de conteúdo** | Planejar o mês: data, plataforma, formato, tema, status (Ideia → Publicado) |
| 6 | **Tarefas** | Tarefas de produção com prioridade e prazo, por cliente |
| 7 | **Aprovações / Solicitações** | Marcar o que aguarda o cliente; registrar pedidos recebidos |
| 8 | **Financeiro** | Lançar mensalidades e despesas, com status de pagamento e vencimento |
| 9 | **Planilha** (`/workbook`) | Mesma informação em 29 abas, para quem prefere operar em grade |

Os totais do **Painel** (clientes ativos, aprovações pendentes, tarefas abertas/atrasadas, receitas,
despesas, resultado, posts planejados, agenda de 7 dias) são calculados a partir dessas seções — vale
mostrar que eles se atualizam sozinhos conforme os dados entram.

---

## 6. Entrega dos arquivos complementares

- **Planilha em CSV:** em `/workbook`, os botões **CSV da aba** e **Todos os CSVs** baixam as 29 abas
  separadamente. Como são muitos arquivos, o navegador pode pedir permissão para "baixar vários
  arquivos" — oriente a permitir. O caminho natural é abrir no Excel ou no Google Sheets.
- **Backup JSON:** Configurações → Exportar JSON. É o backup completo e o formato de migração entre
  contas.
- **Não há pacote para Notion.** A exportação foi removida do produto; a planilha em CSV é o único
  artefato externo.

---

## 7. O que **não** prometer ao usuário

Deixe esses limites explícitos na entrega — eles evitam cobrança de suporte indevida:

- **Sem integração com as redes sociais.** Nada de seguidores, alcance, impressões ou engajamento
  puxados automaticamente. Os números são os que o gestor controla: entrega, aprovações e dinheiro.
- **Sem login para o cliente.** O sistema é do gestor; o cliente não acessa nada.
- **Um assento.** Uma conta = um gestor. Agências com várias pessoas precisariam de uma conta por
  pessoa (e os dados não são compartilhados entre contas).
- **Sem envio de posts.** O sistema organiza e aprova; publicar continua sendo manual na plataforma.

---

## 8. Suporte e manutenção depois da entrega

- **Atualizações:** publique novamente pelo Freebuff. O front e as funções do Convex sobem juntos; os
  dados não são afetados.
- **Backup:** combine uma periodicidade com o usuário (Configurações → Exportar JSON, guardado fora
  do navegador).
- **Sessão:** o código de acesso por e-mail expira em 15 minutos. Se o usuário perder acesso, basta
  repetir o login com o mesmo e-mail — é o mesmo espaço de trabalho.
- **Chaves e segredos:** sempre pela aba Keys. Nunca em arquivos `.env` versionados.

---

## 9. Roteiro de demonstração (5 minutos)

1. Abra a **landing** e mostre a proposta (planejamento → produção → aprovação → resultado).
2. Entre com um e-mail de demonstração e carregue os **dados de exemplo**.
3. **Painel:** os indicadores do negócio em uma tela.
4. **Calendário de conteúdo:** filtrar por cliente e mudar o status de uma peça de Ideia até
   Publicado, direto na lista.
5. **Clientes → Estratégia de um cliente:** mostrar pilares, público e KPIs.
6. **Financeiro:** mensalidades e despesas com o resultado do mês no topo.
7. **Planilha:** abrir as abas e explicar a promessa de "uma planilha de verdade, com fórmulas vivas".
8. Feche em **Configurações → Exportar JSON**, mostrando que os dados são do usuário.
