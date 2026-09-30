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

## 8.1 Rotação de chaves e segredos

Auditoria feita em 29/09/2026. O produto tem uma superfície de segredos **pequena por decisão de
projeto** — sem integrações com redes sociais, pagamentos ou armazenamento externo, não há chaves
de terceiros em uso.

| Item | Onde | Situação | Ação |
| --- | --- | --- | --- |
| `x-api-key` do envio de e-mail OTP (`auth.freebuff.app`) | `src/convex/auth/emailOtp.ts` | Chave **da plataforma Freebuff**, embrulhada no scaffolding de autenticação do template. Não é credencial do usuário e não pode ser rotacionada por ele. | Nenhuma enquanto o app for hospedado no Freebuff. Se um dia o projeto sair da plataforma (self-host ou código compartilhado), substituir o remetente por um provedor próprio (ex.: Resend) e remover a chave. |
| `VLY_INTEGRATION_KEY` (formato `sk_*`) | Gerida pela plataforma (`.env.keys`, fora do repositório) | Registrada em `integrations.md`, mas **nenhum código do projeto consome** — não há actions Convex em `"use node"`. | Nenhuma. Não versionar nem colar em chat/e-mail. |
| `VITE_CONVEX_URL`, `CONVEX_SITE_URL`, `VLY_CONVEX_AUTH_ISSUER`, `VLY_APP_NAME` | Aba Keys | URLs e identificadores, não são segredos (o `VITE_*` vai no bundle por natureza). | Nenhuma. |
| `.env.local` / `.env.keys` | Raiz do projeto | `.env.local` já estava no `.gitignore`; **`.env.keys` não estava** — corrigido. | Se o projeto for exportado ou publicado em repositório, conferir que os dois arquivos não vão junto. |
| Sessões / tokens | Convex Auth | OTP de 6 dígitos expira em 15 min; nenhum token de longa duração no código. | Nenhuma. |
| `TURNSTILE_SECRET_KEY` (Cloudflare Turnstile) | Aba Keys, lida no servidor (`src/lib/turnstile-server.ts`) | Opcional: sem ela o captcha fica desligado e o login funciona como antes. | Se a chave vazar ou for trocada no painel da Cloudflare, atualizar na aba Keys — não há nada no código a mudar. |

**Regra prática de rotação:** hoje o usuário não possui nenhuma chave própria — não há nada para
rotacionar. A necessidade aparece apenas em dois gatilhos: (1) o projeto passar a consumir um
serviço de terceiro (e-mail em massa, pagamento, IA) — nesse caso a chave nasce na aba Keys,
nunca no código; (2) suspeita de vazamento do repositório — nesse caso rotacionar a chave
comprometida no provedor e atualizar na aba Keys, sem tocar em código.

---

## 8.2 Anti-robô no login (Cloudflare Turnstile)

O `/auth` tem duas portas de entrada — o **código por e-mail** (login e cadastro são o mesmo fluxo) e
**"Continuar como visitante"**. As duas passam pelo Cloudflare Turnstile quando ele está configurado.

**Como ligar (aba Keys, as duas chaves juntas):**

| Variável | Onde vale | Para que serve |
| --- | --- | --- |
| `VITE_TURNSTILE_SITE_KEY` | front (widget no `/auth`) | Chave pública do site, criada no painel da Cloudflare (Turnstile → Add site). Sem ela o widget não aparece. |
| `TURNSTILE_SECRET_KEY` | servidor (funções Convex) | Chave secreta. É ela que **liga** a exigência: sem ela a verificação é pulada e o login continua funcionando. |

Configure **as duas** ou nenhuma. Só a secreta deixa o servidor exigindo um token que o widget não
tem como produzir — a própria tela de login avisa quando esse descompasso acontece.

**Como funciona por dentro** (chaves em `src/lib/turnstile-server.ts`, funções em `src/convex/turnstile.ts`):

1. O widget resolve o desafio e devolve um token de uso único.
2. A action `turnstile.verifyTurnstile` valida o token em `siteverify` e grava uma **autorização**
   de 10 minutos para aquele e-mail (tabela `turnstileGrants`).
3. O envio do código por e-mail (`src/convex/auth/emailOtp.ts`) só acontece se a autorização existir
   — e ela é consumida na hora, então cada código custa um desafio resolvido.
4. O acesso visitante (`src/convex/auth/guest.ts`) valida o token antes de criar a conta anônima.

**Degradação graciosa:** sem as chaves, nada muda no produto. Se o Cloudflare ficar inacessível
(erro de rede ou HTTP inesperado), o login **passa** e o erro é registrado no log — preferimos não
trancar todo mundo fora por causa de indisponibilidade de terceiro. Token ausente ou recusado
continua barrado.

**Chaves de teste oficiais da Cloudflare** (para validar a integração sem domínio próprio):

- site key que **sempre passa**: `1x00000000000000000000AA` (visível) ou `1x00000000000000000000BB` (invisível);
- site key que **sempre bloqueia**: `2x00000000000000000000AB`;
- secret que **sempre passa**: `1x0000000000000000000000000000000AA`.

Referência: `developers.cloudflare.com/turnstile/troubleshooting/testing/`. Com o secret que sempre
passa + o site key que sempre bloqueia dá para ver a recusa acontecer de verdade, com a mensagem em
pt-BR na tela.

---

## 8.3 Isolamento entre contas (auditoria de 30/09/2026)

**Regra do produto:** cada conta é um espaço de trabalho fechado. Não existe (e não deve existir)
nenhuma tela ou função que leia dados de outra conta.

**Como isso é garantido no código** — todo registro gravado tem `ownerId`, e toda função do Convex
começa resolvendo a conta logada com `getAuthUserId`:

| Tipo | O que faz |
| --- | --- |
| Consultas (`list*`, `getWorkspace`, `users.currentUser`) | Sem sessão devolvem lista vazia (ou `null`); com sessão filtram pelo índice `by_owner` da conta logada. |
| Escritas (`create*`, `update*`, `remove*`, `markFinancePaid`, `clearWorkspace`) | Sem sessão lançam "Não autenticado". Antes de tocar no registro, conferem que ele existe **e** pertence à conta (`normalizeId` + comparação de `ownerId`) — id de outra tabela ou de outra conta vira "não encontrado". |
| Campos sensíveis | `ownerId`, `_id` e `_creationTime` são removidos de qualquer payload vindo do cliente, então um patch não consegue trocar o dono nem forjar um id. |
| Tabela `turnstileGrants` | Sem dado de usuário; as funções são **internas** (inacessíveis pelo cliente). `turnstile.getTurnstileStatus` devolve só um booleano de configuração do servidor. |
| Dados de exemplo / limpeza | `demo.seedDemo` e `clearWorkspace` apagam e inserem **apenas** linhas com o `ownerId` de quem chamou. |

**O que a auditoria encontrou e corrigiu** (dois furos de integridade, ambos sem exposição de leitura):

1. Um `update` de conteúdo/tarefa/solicitação/reunião/entrega/finança aceitava trocar o `clientId` do
   registro para o **cliente de outra conta** (a linha continuava aparecendo só para o dono, mas
   ficava apontando para um cliente alheio). Agora o `clientId` do patch também passa pela checagem
   de propriedade.
2. `generateInvoices` aceitava um `clientId` de outra conta (não gerava nada, mas silenciosamente).
   Agora recusa com "Cliente não encontrado neste espaço de trabalho".

**Prova automatizada:** `tests/tenancy.test.ts` roda as funções Convex de verdade em memória
(`convex-test`) com duas contas e verifica leitura, escrita, troca de dono, reapontamento de
`clientId`, faturas, dados de exemplo e limpeza — **14 testes**, todos passando.

---

## 9. Changelog de preparação para lançamento (30/09/2026)

Varredura completa de código e funcionalidades antes do lançamento oficial:

**Defeitos corrigidos**
- Financeiro: o resumo "Sem cliente / custos do negócio" tratava receita avulsa como custo
  negativo (lucro errado na linha); agora receita e despesa são somadas separadamente.
- Financeiro: rótulo do mês trocado de um `slice` frágil para formatação pt-BR consistente.
- Configurações: botão "Load demo data" traduzido ("Carregar dados de exemplo").
- Auth: `console.log` de debug removidos (mantidos apenas erros legítimos).
- Código morto removido: página de dashboard do template (nunca roteada) e lista de seções
  duplicada em `main.tsx`.

**Anti-robô no login**
- Cloudflare Turnstile integrado ao `/auth` (e-mail e "Continuar como visitante"), com verificação
  no servidor antes de enviar o código ou criar conta — ver §8.2.
- Sem as chaves configuradas a verificação fica desligada; o login não depende do Cloudflare.
- 15 testes novos cobrindo normalização do e-mail, validade das autorizações, o `siteverify`
  (sucesso, recusa, HTTP ruim, rede fora) e as chaves de teste oficiais.

**Isolamento entre contas**
- Auditoria de todas as consultas e mutations: nenhuma leitura cruza contas; ver §8.3.
- Corrigido: um `update` podia reapontar um registro para o cliente de outra conta.
- Corrigido: `generateInvoices` aceitava um `clientId` de outra conta.
- 14 testes de isolamento com duas contas (`convex-test`), incluindo tentativas de invasão.

**Qualidade**
- ESLint: 18 erros → 0 (padrão de estado-durante-render recomendado pelo React nas seções;
  omissões `_id`/`ownerId` padronizadas; falsos positivos de shadcn/ui suprimidos com
  justificativa).
- 50 testes passando (planilha, fórmulas, faturas, anti-robô do login e isolamento entre contas),
  `tsc` limpo, funções Convex publicadas.

**Polimento visual**
- Chips de plataforma (IG/TT/LI/YT/FB/PN) viraram ícones coloridos das redes, mais escaneáveis
  no calendário e nas aprovações.
- Estados vazios com ícone contextual por seção (tarefas, solicitações, reuniões, arquivos,
  financeiro).
- Avatares de cliente com iniciais e cor determinística nos cartões e no cabeçalho do portal.
- Página 404 redesenhada no tema do produto (grid-paper, marca, CTAs para painel e home).
- Textura `grid-paper` da landing aplicada também ao `/auth`, unificando as superfícies públicas.

---

## 10. Roteiro de demonstração (5 minutos)

1. Abra a **landing** e mostre a proposta (planejamento → produção → aprovação → resultado).
2. Entre com um e-mail de demonstração e carregue os **dados de exemplo**.
3. **Painel:** os indicadores do negócio em uma tela.
4. **Calendário de conteúdo:** filtrar por cliente e mudar o status de uma peça de Ideia até
   Publicado, direto na lista.
5. **Clientes → Estratégia de um cliente:** mostrar pilares, público e KPIs.
6. **Financeiro:** mensalidades e despesas com o resultado do mês no topo.
7. **Planilha:** abrir as abas e explicar a promessa de "uma planilha de verdade, com fórmulas vivas".
8. Feche em **Configurações → Exportar JSON**, mostrando que os dados são do usuário.
