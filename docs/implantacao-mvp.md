# Implantação final — Social Media OS

Documento operacional para **uma única versão final**. Não crie ambientes extras nem branches paralelas.

## Destinos desta instalação
- Projeto Convex: `david-william/social-media-os`.
- Único deployment de produção: `charming-leopard-770` (`https://charming-leopard-770.convex.cloud`).
- Projeto Cloudflare Pages: `social-media-os`; URL atribuída: `https://social-media-os-b0c.pages.dev`.
- Origem GitHub: `1993dwsf-dev/social-media-os`, produção somente da `main`, previews desativados.
- Estes destinos registram a configuração; a liberação depende dos testes reais descritos abaixo.

## 1. Convex (backend e banco)
1. Escolha **um deployment** Convex sob sua conta. Não utilize o deployment do Barber OS: os bancos devem ser independentes.
2. Em Settings > Environment Variables do deployment escolhido, configure:
   - `CONVEX_SITE_URL` é fornecida automaticamente pelo próprio Convex: o emissor deve ser `https://charming-leopard-770.convex.site` (não use `pages.dev` nem o backend de outro produto).
   - Cadastros: emitir convite individual pela função interna `access:createInvite`, com e-mail do destinatário. O código compartilhado antigo não é mais usado.
   - `JWT_PRIVATE_KEY` e `JWKS`: chaves de autenticação geradas de acordo com o guia oficial Convex Auth.
3. Gere uma **deploy key** para ESSE deployment, com permissão restrita a deploy. Armazene-a em Cloudflare Pages como segredo `CONVEX_DEPLOY_KEY` e em GitHub Actions sob o mesmo nome, se desejar CI.
4. Publique as funções e esquema. `bunx convex deploy` deve concluir sem falhas.

**Histórico auditado:** `.env.keys` expôs uma chave `DOTENV_PRIVATE_KEY_LOCAL` de descriptografia dotenvx. Nos 44 commits e 383 blobs examinados antes desta manutenção, não foi encontrado o payload cifrado correspondente. A instalação atual não usa essa chave nem dotenvx. A exposição histórica permanece; se houver arquivos cifrados fora do repositório, recriptografe-os e substitua nos provedores as credenciais neles contidas. Consulte o escopo em [auditoria-mvp.md](auditoria-mvp.md).

## 2. Cloudflare Pages (frontend)
1. Crie UM projeto Pages por integração com o repositório `1993dwsf-dev/social-media-os` e branch `main`.
2. Nome do projeto: `social-media-os`; endereço atribuído: `https://social-media-os-b0c.pages.dev`.
3. Framework Vite; diretório de saída `dist`; diretório raiz `/`.
4. Build command: `node scripts/build-pages.mjs`. Configure `BUN_VERSION=1.4.4` no ambiente de produção. O script gera os bindings sem ativar código no backend, executa auditoria de dependências, lint, testes e build TypeScript/Vite e só depois publica o Convex. Qualquer falha interrompe a publicação. O Pages publica o frontend quando esse comando termina com sucesso.
5. Variável secreta `CONVEX_DEPLOY_KEY`: a chave específica do deployment Social Media OS; **NÃO** a do Barber OS. O script recusa chaves de outro deployment, exige `CF_PAGES_BRANCH=main` fornecida pelo Pages e define `VITE_CONVEX_URL` para este backend.
6. Variáveis `VITE_OPERATOR_NAME` (identificação) e `VITE_SUPPORT_EMAIL`: e-mail real do responsável para Termos e Privacidade. Sem ela, haverá uma pendência explícita nos textos legais.
7. Configure publicação automática apenas da `main` (`production_deployments_enabled=true`, `preview_deployment_setting=none`). Mantenha a chave de deploy somente no ambiente de produção. Faça o primeiro deploy e verifique o build e `/auth`. Não copie variáveis de outro aplicativo.

Se a conta Cloudflare/Convex não estiver conectada ao agente, estas ações exigem autenticação do titular. Não envie tokens por chat.

## 3. Segurança e aceitação obrigatórias
- Nenhuma credencial privada presente em arquivos versionados ou em assets do frontend.
- Cadastro sem convite ou com convite incorreto recusado pelo backend; cadastro com convite válido permitido.
- Login com senha correta aceita; senha incorreta recusada; logout bloqueia rotas privadas.
- Conta A cria cliente, tarefas e financeiro. Conta B não consegue listar, alterar, vincular ou excluir registros da A.
- Exclusão de um cliente não atinge registros de outro proprietário.
- Login e app carregam por `pages.dev`, inclusive acesso direto a `/app/dashboard` e refresh.
- Após limpar cache/armazenamento do navegador, registros permanecem no Convex e retornam quando o usuário entra novamente.
- Exportar backup JSON e restaurar em conta de teste vazia; verificar contagem e vínculos.
- Exportação CSV real em Configurações funciona, incluindo filtro por cliente. A planilha de referência é separada.
- Remover dados fictícios da conta do cliente antes de entregar.

**Não declarar pronto para venda antes de testar os itens acima com deploy real.**

## 4. Primeiro cliente — fluxo sem extras
1. Definir valor e periodicidade de cobrança fora do sistema, em contrato simples.
2. Emitir convite individual de 48 horas via `access:createInvite` e enviá-lo ao destinatário por canal privado.
3. Entregar o endereço `/auth`, acompanhar criação da conta e primeiro login.
4. Demonstrar cadastro de cliente, conteúdo, calendário, tarefas, financeiro e exportação do backup.
5. Suporte inicial por contato informado no contrato; sem prometer integração com redes sociais ou portal para os clientes do gestor.

## 5. Operação e recuperação
- Dados de clientes ficam no Convex, não no cache do navegador. Limpar cookies remove a sessão local, não o banco.
- Faça backup regular em `Configurações > Exportar JSON`; guarde o arquivo fora do app.
- Para restaurar: `Configurações > Importar backup`. A importação **acrescenta dados**: evite importar duas vezes e teste em conta vazia antes de restaurar em conta com dados.
- Gerar chave de emergência em Configurações. A recuperação com essa chave conserva o proprietário e revoga sessões antigas. Não há reset automático por e-mail; sem chave, o suporte deve investigar.

## 6. Pendências bloqueantes de liberação
- [x] Convex e Cloudflare configurados sob a conta correta, build e funções publicados.
- [x] CI com codegen e testes de autenticação/isolamento aprovados.
- [x] Smoke test do navegador e duas contas com dados distintos.
- [ ] Contato e textos contratuais/LGPD revisados com informações reais.
- [x] Chave histórica identificada como descriptografia dotenvx, sem payload cifrado encontrado no repositório; a nova instalação usa outras chaves. Arquivos externos não foram auditados.

Para criar a conta do operador e atender o primeiro cliente, siga [primeiro-acesso.md](primeiro-acesso.md). Não compartilhe o valor do convite em documentos públicos.

## Revisão posterior

As verificações de produção acima registram a revisão anterior. As mudanças de acesso e dados de 01/11/2026 exigem nova validação do deployment; consulte [correcoes-auditoria.md](correcoes-auditoria.md).
