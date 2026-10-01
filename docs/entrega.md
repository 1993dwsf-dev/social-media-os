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
| `/termos` e `/privacidade` | Abrem sem sessão; reviewe o texto e troque o e-mail de contato antes de publicar (§11.5) |

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

**Prova automatizada:** `tests/turnstile.test.ts` cobre os helpers do `siteverify` (**15 testes**) e
`tests/email-otp.test.ts` exercita o fluxo completo de ponta a ponta — captcha → autorização →
código enviado → login com o código — com o Cloudflare e o envio de e-mail dublados no teste. Ele
verifica que a autorização é de uso único, que o código nunca é gravado em claro, que sem captcha o
código não sai e nenhuma sessão nasce, que código errado ou expirado é recusado sem consumir o
código certo nem criar sessão, que o logout encerra a sessão sem apagar o espaço (e o refresh antigo
morre) e a degradação quando o Cloudflare cai — **8 testes**.

---

## 8.3 Isolamento entre contas (auditoria de 30/09/2026)

**Regra do produto:** cada conta é um espaço de trabalho fechado. Não existe (e não deve existir)
nenhuma tela ou função que leia dados de outra conta. A mesma regra vale para a **sessão anônima**
("Continuar como visitante"): ela cria uma conta própria, com espaço vazio, e não enxerga nem toca o
espaço de ninguém.

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

**Rotas sem sessão (as únicas portas abertas):**

| Rota | Tipo | Devolve |
| --- | --- | --- |
| `turnstile:getTurnstileStatus` | query | `{ enforced: boolean }` — configuração do servidor, nenhum dado de usuário. |
| `turnstile:verifyTurnstile` | action | Valida o captcha antes do login; sem chave secreta não grava nada. |
| `auth:signIn` | action | O próprio login/cadastro (por e-mail ou visitante). |
| `auth:isAuthenticated` | query | `true`/`false` conforme a sessão. |
| `auth:signOut` | action | Encerra a sessão atual (sem sessão, não faz nada). |

As rotas HTTP são só duas, ambas públicas e de leitura: `/.well-known/openid-configuration` e
`/.well-known/jwks.json`. As rotas `/api/auth/*` só existem quando há OAuth configurado — não é o
caso deste produto.

**Prova automatizada:**

- `tests/tenancy.test.ts` roda as funções Convex de verdade em memória (`convex-test`) com duas contas
  e verifica leitura, escrita, troca de dono, reapontamento de `clientId`, faturas, dados de exemplo e
  limpeza — **16 testes**. No fim, o financeiro passa pelo ciclo real: `generateInvoices` grava as
  faturas (com `clientId` correto e idempotente), o patch de receita e o `markFinancePaid` atualizam o
  lançamento, e as seis tabelas por cliente (conteúdo, tarefas, solicitações, reuniões, arquivos e
  financeiro) percorrem criar → atualizar → remover.
- `tests/no-session.test.ts` atualiza o inventário de rotas a cada execução (toda função nova precisa
  ser classificada, senão a suíte falha), chama **todas** as rotas sem sessão com um espaço marcado
  (`SEGREDO-DA-CONTA`) e confere que nenhuma leitura devolve dado de usuário e que nenhuma escrita
  passa — **7 testes**.
- `tests/anonymous.test.ts` exercita o fluxo real de entrada como visitante (`auth:signIn` com o
  provider "anonymous") e prova o isolamento da sessão anônima: espaço próprio começa vazio, o
  visitante não lê nem altera registros de contas com e-mail, a conta com e-mail não alcança o espaço
  do visitante, dois visitantes não se veem, o captcha exigido recusa a entrada sem gravar nada e o
  logout encerra a sessão (sessão e refresh apagados, leituras vazias, escrita recusada) e, no fim,
  com os prazos de sessão encurtados por env, a sessão vencida é removida pela limpeza — **17
  testes**.

---

## 8.4 Sessões: expiração e limpeza

Cada login cria uma sessão (`authSessions`) e um **token de refresh**
(`authRefreshTokens`). O Convex Auth já cuida dos prazos:

| Prazo | Onde | Padrão | O que acontece |
| --- | --- | --- | --- |
| Duração total | `authSessions.expirationTime` | 30 dias | Depois disso a renovação é recusada e a sessão é descartada. |
| Inatividade | `authRefreshTokens.expirationTime` | 30 dias | Cada renovação emite um token novo e empurra o prazo; vencido, a sessão não renova mais. |

Dá para encurtar os dois prazos sem tocar em código: basta definir `AUTH_SESSION_TOTAL_DURATION_MS`
e `AUTH_SESSION_INACTIVE_DURATION_MS` (em milissegundos) na aba Keys. Sem elas valem os padrões
acima.

A biblioteca só descarta essas linhas quando alguém tenta renovar. Para quem nunca volta, quem
varre é a função **interna** `sessions:cleanupInactiveSessions`, agendada no cron diário
(`src/convex/crons.ts`, 6h30 UTC — fora do horário comercial no Brasil):

- apaga tokens de refresh vencidos;
- apaga sessões vencidas e sessões que ficaram sem nenhum refresh vivo;
- apaga tokens órfãos (de sessão que já não existe).

Ela devolve `{ sessions, refreshTokens }` com o que foi limpo (visível no log da implantação), é
**interna** — o cliente não alcança, e o inventário de rotas do `tests/no-session.test.ts` garante
que ninguém a exponha por engano — e não toca em sessão ativa. O produto é single-seat: uma
varredura de punhado de linhas por dia é gratuita na prática.

**Prova automatizada:** `tests/sessions.test.ts` cobre a limpeza (apaga vencidas, inativas e órfãs,
preserva as ativas e é idempotente) e a expiração na prática — sessão vencida e refresh vencido
recusam a renovação e derrubam apenas a própria sessão — **4 testes**.

Em `tests/anonymous.test.ts`, o login é feito de verdade com os prazos encurtados pelas envs
(`AUTH_SESSION_TOTAL_DURATION_MS`/`AUTH_SESSION_INACTIVE_DURATION_MS`) e a limpeza remove a sessão
vencida ou que ficou sem renovação, preserva usuário, conta e registros do visitante, e o refresh
antigo não volta — **3 testes**. Com prazos curtos mas vivos, é a limpeza que não toca em nada e a
renovação continua funcionando.

---

## 8.5 Faturas antigas sem cliente: o reparo

O defeito corrigido em §9 ("as faturas saíam **sem `clientId`**") estava publicado até a versão
anterior, então quem clicou em **Gerar faturas** no financeiro pode ter lançamentos de receita
gravados sem cliente. Como o dado é do próprio gestor e a tabela é pequena, dá para consertar direto
no banco — sem planilha paralela.

**O que essas linhas têm de marcante:** `kind: "invoice"`, `clientId` ausente, descrição no formato
`Mensalidade — <nome do cliente>` e valor igual à mensalidade do cliente. Essas duas pistas bastam
para religar a fatura ao cliente certo.

**Como rodar** (painel do Convex → aba *Functions* → *Run*, ou CLI):

```bash
# 1. Simulação — não escreve nada, devolve o relatório
npx convex run repair:relinkOrphanInvoices '{}'

# 2. Gravação — só depois de ler o relatório
npx convex run repair:relinkOrphanInvoices '{"apply":true}'
```

A função é **interna** (o cliente não alcança) e o inventário de rotas do `tests/no-session.test.ts`
impede que alguém a exponha. Ela varre todos os lançamentos das contas do banco, então o relatório
traz o estrago de todos os gestores, não só de um.

**O que o relatório devolve** (`{ dryRun, scanned, relinked, matched, skipped, skippedCount }`):

| `skipped[].outcome` | Significado | Ação sugerida |
| --- | --- | --- |
| `unmatched` | Descrição fora do padrão (`Mensalidade — …`) ou cliente que não existe mais | Conferir o texto; se o cliente foi apagado, é um lançamento sem vínculo legítimo |
| `ambiguous` | Dois clientes com o mesmo nome **e** a mesma mensalidade | Decidir o cliente pela data/valor e ajustar o lançamento manualmente |
| `fee-mismatch` | Nome bate com um cliente só, mas o valor não é a mensalidade | Provavelmente valor renegociado: ligar o cliente à mão |
| `duplicate` | Religar a fatura criaria a segunda do mesmo cliente no mesmo mês | Conferir qual das duas é a boa e apagar a outra |

Só as linhas `kind: "invoice"` sem `clientId` entram na varredura — **despesas e receitas soltas
(sem cliente) não são tocadas**. O reparo também é idempotente: rodar duas vezes não muda nada, e
não atravessa contas (cada órfã só casa com clientes do mesmo `ownerId`).

**Depois do reparo**, o "Gerar faturas" volta a deduplicar: a fatura religada passa a bloquear o mês
do cliente, e as faturas voltam a aparecer na ficha do cliente em vez da faixa de lançamentos sem
vínculo.

**Prova automatizada:** `tests/repair.test.ts` reconstrói o estrago real (clientes homônimos,
cliente homônimo de outra conta, fatura duplicada, receita e despesa sem vínculo) e confere o
casamento puro, a simulação que não escreve, o reparo que não atravessa contas, a idempotência e a
deduplicação voltando a valer — **9 testes**.

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
- 8 testes do fluxo completo do login por e-mail com captcha (Cloudflare e envio de e-mail
  dublados): autorização de uso único, código só com captcha, login concluído com o código, recusa
  de código errado/expirado sem criar sessão, logout com o espaço preservado para o próximo login e
  degradação quando o Cloudflare está fora do ar.

**Isolamento entre contas**
- Auditoria de todas as consultas e mutations: nenhuma leitura cruza contas; ver §8.3.
- Corrigido: um `update` podia reapontar um registro para o cliente de outra conta.
- Corrigido: `generateInvoices` aceitava um `clientId` de outra conta.
- Corrigido (auditado nesta rodada): o handler de `generateInvoices` passava as linhas cruas do banco
  (`_id`) ao planejador de faturas, que espera `{ id, ... }` — as faturas saíam **sem `clientId`**, a
  deduplicação por mês funcionava por acidente (comparava `undefined`), uma fatura legítima do mesmo
  mês não bloqueava duplicata e o filtro opcional por cliente sempre devolvia zero. O handler agora
  projeta os campos que o planejador espera.
- Inventário de rotas documentado: das 45 funções, 5 são internas e só 5 respondem sem sessão.
- Corrigido no passado: as faturas já gravadas sem `clientId` são religadas ao cliente pela função
  interna `repair:relinkOrphanInvoices` (simulação por padrão, relatório com o que ficou pendente de
  decisão humana) — ver §8.5.
- 16 testes de isolamento com duas contas e 7 testes das portas abertas (`convex-test`).
- 14 testes de isolamento da sessão anônima (visitante), do `signIn` real ao logout — ver §8.3.

**Sessões**
- Expiração e limpeza: a função interna `sessions:cleanupInactiveSessions`, agendada no cron
  diário, remove sessões vencidas/sem refresh vivo e tokens vencidos/órfãos — ver §8.4.
- 4 testes cobrindo a limpeza, a idempotência e a recusa de renovação depois do prazo ou da
  inatividade.
- 3 testes com prazos reais encurtados por env: o login nasce com o prazo total vencendo ou com a
  janela de inatividade vencida, a limpeza do cron remove a sessão e os tokens vencidos sem tocar nos
  dados, e o refresh antigo não ressuscita a sessão.

**Qualidade**
- ESLint: 18 erros → 0 (padrão de estado-durante-render recomendado pelo React nas seções;
  omissões `_id`/`ownerId` padronizadas; falsos positivos de shadcn/ui suprimidos com
  justificativa).
- 88 testes passando (planilha, fórmulas, faturas, anti-robô do login — incluindo o fluxo completo
  de OTP —, isolamento entre contas, isolamento da sessão anônima, logout, expiração com prazos
  reais, limpeza de sessões, financeiro real e rotas sem sessão), `tsc` limpo, funções Convex
  publicadas.
- 97 testes depois do reparo das faturas órfãs (§8.5): 4 novos no matcher puro
  (`matchInvoiceToClient`) e 5 no reparo no banco (`tests/repair.test.ts`).

**Operação e conformidade** (ver §11)
- Exclusões de tarefa, solicitação, reunião, arquivo e lançamento, e o logout, passaram a tratar
  falha: antes, uma recusa do servidor virava promessa rejeitada sem aviso e o botão pareceria não
  funcionar. Agora todos reportam `toast` de erro em pt-BR.
- "Carregar dados de exemplo" e "Sim, excluir tudo" ficam desabilitados durante a operação, com
  rótulo de progresso ("Carregando…", "Excluindo…") — eliminate o clique duplo em ações destrutivas.
- A tela de erro do app virou pt-BR para o usuário final ("Algo deu errado nesta tela", botão
  Recarregar, detalhe técnico escondido); antes mostrava "Erro de execução na pré-visualização" com o
  stack aberto.
- Termos de Uso e Aviso de Privacidade (LGPD) publicados em `/termos` e `/privacidade`, com links no
  rodapé da landing e no `/auth`. Antes de publicar: trocar o e-mail de contato e revisar
  juridicamente.
- Documentado o procedimento de operação: ambientes (não há homologação separada — prévia do Freebuff
  é o dev), limites de taxa existentes (10 tentativas/hora de código, 1 envio por captcha) e o ponto
  aberto da action pública de captcha, estados de loading/erro por superfície e o plano de rollback
  em 5 minutos.

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

---

## 11. Operação: ambientes, limites, estados de tela e recuperação

Auditoria de 01/10/2026 sobre as sete frentes que costumam virar cobrança depois do lançamento.

### 11.1 Ambientes (staging)

**Não existe ambiente de homologação separado.** O projeto tem dois destinos:

| Ambiente | Onde | Banco | Uso |
| --- | --- | --- | --- |
| **dev** | Prévia do Freebuff (`*.vly.sh`) + implantação Convex `dev` | Descartável, recomeça do zero | Developimento, testes manuais, `bun convex dev --once` |
| **prod** | Botão **Publicar** no Freebuff | Definitivo | Usuário final |

Consequências práticas:

- A prévia do Freebuff é o "staging": publique uma mudança, valide na prévia, **só então** publique
  em produção. Não existe um terceiro lugar para testar release candidate.
- Banco de dev e banco de prod são **independentes**: dados de teste nunca vazam para o cliente e
  dado do cliente nunca aparece na prévia.
- Funções internas (limpeza de sessões, reparo de faturas) e o cron diário só valem na implantação
  em que foram publicados — testar em dev não prova o comportamento em prod.
- Antes de publicar em produção, rode o checklist da §1. Se a conta real do cliente já existir,
  peça um **Export JSON** antes: "Carregar dados de exemplo" e "Limpar espaço de trabalho" são
  definitivos.

### 11.2 Limites de taxa (rate limit)

| Caminho | Limite | Quem aplica |
| --- | --- | --- |
| Verificação do código por e-mail | **10 tentativas por hora por e-mail** | Convex Auth (`authRateLimits`); código errado conta, certo não |
| Envio do código por e-mail | **1 por desafio de captcha resolvido** | Tabela `turnstileGrants`: autorização de 10 min, de uso único (§8.2) |
| Sessão | 30 dias de inatividade / 30 dias totais | Convex Auth + limpeza no cron diário (§8.4) |
| Funções do portal | Sem limite próprio — mas todas exigem sessão e são idempotentes (`generateInvoices` deduplica por cliente e mês) | — |
| `turnstile.verifyTurnstile` (action pública) | **Sem limite próprio** | Cada chamada gera uma verificação no Cloudflare, que cobra por verificação e tem limite próprio |

A última linha é o único ponto aberto: um visitante pode chamar a action em laço e gerar custo na
Cloudflare (o token do captcha é que barra o envio de e-mail, não a action). Se o custo aparecer no
painel da Cloudflare, o limite natural cabe em `turnstile.grantEmailAccess`: no máximo 5
autorizações por hora e por e-mail, com base no índice `by_identifier`. Não foi implementado — é
uma decisão de custo, não de segurança.

Limites de plataforma (duração da função, consultas por segundo, tamanho da função) são os do
Convex e valem para tudo; o produto não chega perto deles por ser single-seat.

### 11.3 Estados de loading e de erro

O que o usuário já vê:

| Onde | Estado |
| --- | --- |
| Troca de rota | "Carregando…" (`Suspense` em `main.tsx`) |
| Rota protegida | Spinner enquanto a sessão é conferida (`RequireAuth`) |
| Portal | "Carregando seu espaço de trabalho…" até as consultas do workspace responderem (`ws.ready`) |
| `/auth` | Botões desabilitados durante envio/verificação e mensagem de erro em pt-BR na tela |
| Escritas | `toast` de sucesso **ou** de erro em todas as ações — inclusive exclusões e logout (§9) |
| Falha inesperada | Tela "Algo deu errado nesta tela" com botão **Recarregar** e o detalhe técnico escondido em "Detalhe técnico" |

Limites conhecidos (não são defeitos, mas convém explicá-los ao suporte):

- **Falha de consulta derruba a seção inteira.** Se uma consulta do Convex falhar, o React entrega o
  erro ao *error boundary* e a tela "Algo deu errado" aparece. Os dados do usuário estão intactos;
  recarregar resolve. Não há hoje uma tela de erro por seção com botão "Tentar de novo".
- **Sem estado de "reconectando".** Queda de rede deixa os últimos dados na tela enquanto o Convex
  reconecta em segundo plano; não há aviso visível.
- **Tela vazia ≠ erro.** Sem sessão, as consultas devolvem lista vazia de propósito (§8.3): uma
  seção vazia sem dados normalmente é sessão expirada, não falha.

### 11.4 Rollback e recuperação

| Camada | Como reverter | Observação |
| --- | --- | --- |
| Front | Republicar a versão anterior pelo Freebuff | Rápido; dados não são afetados |
| Funções Convex | Painel do Convex → *Deployments* → rollback para uma versão anterior | Cada `bun convex dev --once` é uma versão; o dev e a prod têm históricos separados |
| Dados | **Não há versionamento** — o backup é o Export JSON do usuário | Por isso o backup é item obrigatório da entrega (§8) |
| Rotinas internas | São idempotentes e conservadoras: `sessions.cleanupInactiveSessions` só apaga o que está vencido; `repair.relinkOrphanInvoices` simula por padrão (§8.5) | Rodar de novo não piora o estado |
| Segredos | Trocar na aba Keys; nenhum código precisa mudar (§8.1) | — |

**Plano de rollback em 5 minutos:**

1. Não publique mais nada e avise que a manutenção está em curso.
2. Se o problema for de código/função: faça o rollback no painel do Convex (funções) e/ou publique a
   versão anterior no Freebuff (front).
3. Se o problema for de dado: peça ao usuário um **Export JSON** e compare com o anterior; para
   restaurar, use **Importar backup** (Configurações → Importar backup).
4. Se o problema for de rotina interna: rode a função interna em modo simulação primeiro e leia o
   relatório — nada é gravado sem `apply: true`.
5. Se o problema for de sessão ou de segredo: troque o valor na aba Keys — a renovação passa a
   valer na navegação seguinte.

### 11.5 Termos de uso e privacidade (LGPD)

As páginas `/termos` e `/privacidade` são públicas (sem sessão) e descrevem o produto real:

- **Termos:** conta e acesso por código, backup como responsabilidade do usuário, dados de
  clientes inseridos por conta do gestor (LGPD), limites do produto (§7), ausência de cobrança e de
  SLA, logout × exclusão de dados, contato.
- **Privacidade:** dados coletados (conta, espaço de trabalho, sessão, captcha), finalidade e base
  legal por item (execução de contrato e legítimo interesse), operadores de infraestrutura (plataforma
  do banco e Cloudflare quando o captcha está ativo), retenção (30 dias de sessão, 10 min de
  autorização de captcha, 1 h de tentativas de código), direitos do art. 18 e como exercê-los no
  produto, segurança e alterações da política.

Links no rodapé da landing e no rodapé do `/auth`.

**Antes de publicar:** troque a constante `CONTATO` em `src/pages/Legal.tsx` pelo e-mail real do
responsável e passe o texto por revisão jurídica — o conteúdo é honesto e específico, mas não
substitui parecer. O texto também não cobre o que é papel do operador da infraestrutura (acordo de
tratamento de dados, retenção e suboperadores da plataforma): isso é contrato com o fornecedor, não
documento do produto.
