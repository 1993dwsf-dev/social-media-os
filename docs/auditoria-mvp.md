# Auditoria técnica e de segurança — Social Media OS

**Data:** 30/10/2026 • **Branch:** main • **Objetivo:** MVP único, sem novos módulos.

## Verificações objetivas

- GitHub Actions CI: lint, geração de tipos com Convex local e temporário, build Vite/TypeScript e 89 testes, 0 falhas (execução 41081403622).
- Isolamento: dados são filtrados no backend por `ownerId`; leituras e alterações entre dois gestores são negadas nos testes.
- Entrada de dados: mutations principais usam validação Zod; IDs externos não podem sobrescrever IDs internos ou `ownerId`.
- Backups: importação valida coleções e relacionamentos, remapeia IDs, é transacional e limitada a 1.000 registros por operação.
- Rotas privadas: protegidas pela sessão Convex Auth. Sem sessão, consultas retornam vazio e mutations são negadas.
- Sessão: Convex Auth com provider Password; cadastro com convite; entrada com senha sem convite.
- App: código do toolbar, JWT federado Freebuff, gateway de OTP e login de visitante retirados. Dependências diretas não usadas do antigo gateway removidas.
- Cloudflare Pages: SPA fallback `public/_redirects` e cabeçalhos básicos `public/_headers` adicionados.

## Riscos e ações necessárias

| Prioridade | Situação | Ação |
| --- | --- | --- |
| **CRÍTICA** | `.env.keys` contendo chave privada esteve no histórico de um repositório público. Foi removido da `main`, mas continua acessível em commits antigos. | Revogar/rotacionar chave privada e quaisquer segredos que tenham sido protegidos por ela. Remover arquivo do HEAD não revoga exposição histórica. |
| **ALTA** | Produção Convex e Cloudflare Pages ainda não configurados/validados neste trabalho. | Conectar as contas, definir envs privadas, implantar `main` e testar o endereço `*.pages.dev`. |
| **ALTA** | A autenticação anterior usava OTP e visitante; novos logins usam senha. Contas antigas não possuem automaticamente credenciais Password. | Antes de migrar um banco com usuários reais, avaliar dados vinculados aos IDs anteriores e elaborar migração de contas. Não reutilizar sem análise um banco com clientes reais. |
| **ALTA** | O código de convite é compartilhado até ser trocado. Não é uso único. | Criar código aleatório no Convex, enviar em particular e **trocar após ativar o primeiro cliente**. |
| **ALTA** | Não há verificação de e-mail nem recuperação automática de senha. Tampouco rate limiting de senha específico implementado neste projeto. | Adotar procedimento manual de suporte e revisar medidas antiabuso/monitoramento no provedor antes de escalar. Não prometer recuperação automática. |
| **ALTA** | Termos e privacidade precisam da identificação, contato reais e revisão jurídica. | Definir `VITE_SUPPORT_EMAIL` na publicação, completar documentos/contrato e formalizar responsabilidades de proteção de dados. |
| **MÉDIA** | `schemaValidation: false` permanece no Convex para tolerar legados. | Antes de ativar schema validation, auditar/migrar documentos históricos; escritas atuais são validadas com Zod. |
| **MÉDIA** | A planilha CSV não consulta dados reais do workspace. | Não vender como relatório exportado dos registros da carteira. Backup real é JSON. |
| **MÉDIA** | Ainda há módulos utilitários de Turnstile não conectados ao fluxo de login por senha. | Avaliar remoção após o lançamento ou habilitar proteção com desenho consistente; não confundir com proteção ativa no login atual. |

## Critérios de liberação comercial

- [x] Um único código em `main` com CI aprovado.
- [x] Build do frontend aprovado e testes de isolamento e importação concluídos.
- [x] Login e cadastro sem Freebuff no código.
- [ ] Segredos expostos rotacionados e novas variáveis seguras configuradas.
- [ ] Deployment Convex real publicado e validado.
- [ ] Projeto Cloudflare Pages real criado no domínio `*.pages.dev`.
- [ ] Teste de ponta a ponta com dois gestores no endereço público.
- [ ] Dados legais e contato reais configurados; contrato de prestação/assinatura pronto.

**Conclusão:** build e regressões validados, porém **ainda não está autorizado concluir “pronto para venda” sem o deployment, smoke tests e mitigação do segredo exposto**.
