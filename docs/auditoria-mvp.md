# Auditoria técnica e de segurança — Social Media OS

**Data:** 30/10/2026 • **Branch:** main • **Objetivo:** MVP único, sem novos módulos.

## Verificações objetivas

- GitHub Actions CI: lint, geração de tipos com Convex local e temporário, build Vite/TypeScript e 89 testes. A implantação inicial validada está no commit `f8bae9251067075e5a8a65a840662cdd4ac27103`, CI [41112921022](https://github.com/1993dwsf-dev/social-media-os/actions/runs/41112921022), concluída com sucesso.
- Isolamento: dados são filtrados no backend por `ownerId`; leituras e alterações entre dois gestores são negadas nos testes.
- Entrada de dados: mutations principais usam validação Zod; IDs externos não podem sobrescrever IDs internos ou `ownerId`.
- Backups: importação valida coleções e relacionamentos, remapeia IDs, é transacional e limitada a 1.000 registros por operação.
- Rotas privadas: protegidas pela sessão Convex Auth. Sem sessão, consultas retornam vazio e mutations são negadas.
- Sessão: Convex Auth com provider Password; cadastro com convite; entrada com senha sem convite.
- App: código do toolbar, JWT federado Freebuff, gateway de OTP e login de visitante retirados. Dependências diretas não usadas do antigo gateway removidas.
- Cloudflare Pages: SPA fallback `public/_redirects` e cabeçalhos básicos `public/_headers` adicionados.
- Produção publicada em https://social-media-os-b0c.pages.dev, com origem GitHub e deploy automático exclusivo da `main`; previews desativados. O disparo observado foi `github:push`.
- Convex exclusivo do produto: `charming-leopard-770`, projeto `david-william/social-media-os`, sem usar o banco do Barber OS.
- Foram aprovados 13 grupos de testes reais de API e 9 cenários de navegador: convite, senha, duas contas, acesso cruzado, persistência, limpeza do armazenamento, logout e backup/restauração com novos IDs e proprietário.
- Vinte e um assets públicos foram examinados: nenhuma correspondência com as novas credenciais nem com os deployments conhecidos do Barber OS. Os registros operacionais criados nos testes foram removidos.
- Chaves JWT, convite e chave de deploy desta instalação foram gerados novamente. A chave de deploy é `secret_text` apenas em produção no Pages; não existe chave de deploy no ambiente de preview.
- O schema passou a exigir validação estrutural do banco, complementar às regras Zod. A auditoria interna prévia de produção retornou `checked=0`, `invalidCount=0`, sem alterar documentos. Os 89 testes existentes também passaram com a validação habilitada.

## Riscos e ações necessárias

| Prioridade | Situação | Ação |
| --- | --- | --- |
| **CRÍTICA — histórico** | `.env.keys` contendo chave privada esteve no histórico de um repositório público. A instalação nova não reutiliza essa chave nem os segredos anteriores. A revogação na origem de eventuais credenciais históricas não foi comprovada. | Identificar a origem das credenciais antigas e revogá-las caso ainda tenham validade. Remover arquivo do HEAD não revoga a exposição histórica; não reescrever o histórico nem copiar valores privados para relatórios. |
| **CONCLUÍDA** | Produção Convex e Cloudflare Pages configurados e testados no endereço real. | Manter `main`, backend exclusivo e previews desativados; consultar [implantacao-mvp.md](implantacao-mvp.md). |
| **ALTA** | A autenticação anterior usava OTP e visitante; novos logins usam senha. Contas antigas não possuem automaticamente credenciais Password. | Antes de migrar um banco com usuários reais, avaliar dados vinculados aos IDs anteriores e elaborar migração de contas. Não reutilizar sem análise um banco com clientes reais. |
| **ALTA** | O código de convite é compartilhado até ser trocado. Não é uso único. | Criar código aleatório no Convex, enviar em particular e **trocar após ativar o primeiro cliente**. |
| **ALTA** | Não há verificação de e-mail nem recuperação automática de senha. O Convex Auth instalado limita tentativas de senha malsucedidas por identificador, com capacidade padrão de 10 e reposição gradual; isso não é proteção por IP ou captcha de cadastro. | Adotar o procedimento manual de suporte em [primeiro-acesso.md](primeiro-acesso.md), sem solicitar senhas. Não prometer recuperação automática. |
| **ALTA** | Termos e privacidade precisam da identificação, contato reais e revisão jurídica. | Definir `VITE_SUPPORT_EMAIL` na publicação, completar documentos/contrato e formalizar responsabilidades de proteção de dados. |
| **CONCLUÍDA NO CÓDIGO** | `schemaValidation: true` após auditoria prévia sem inconsistências e 89 testes aprovados. | Confirmar a publicação da revisão e repetir o teste real de autenticação e gravação. A ativação valida documentos; não os exclui. |
| **MÉDIA** | A planilha CSV não consulta dados reais do workspace. | Não vender como relatório exportado dos registros da carteira. Backup real é JSON. |
| **MÉDIA** | Ainda há módulos utilitários de Turnstile não conectados ao fluxo de login por senha. | Avaliar remoção após o lançamento ou habilitar proteção com desenho consistente; não confundir com proteção ativa no login atual. |

## Critérios de liberação comercial

- [x] Um único código em `main` com CI aprovado.
- [x] Build do frontend aprovado e testes de isolamento e importação concluídos.
- [x] Login e cadastro sem Freebuff no código.
- [x] Novas credenciais da instalação geradas sem reutilizar as históricas e variáveis privadas configuradas.
- [ ] Revogação na origem de eventuais credenciais históricas expostas comprovada.
- [x] Deployment Convex real publicado e validado.
- [x] Projeto Cloudflare Pages real criado no domínio `*.pages.dev`.
- [x] Teste de ponta a ponta com dois gestores no endereço público.
- [ ] Dados legais e contato reais configurados; contrato de prestação/assinatura pronto.

**Conclusão:** implantação e fluxos testados foram validados. A liberação comercial ainda depende dos dados legais/contato reais, condições contratuais e tratamento das credenciais históricas na origem. Essas pendências não devem ser marcadas como concluídas apenas porque o sistema está publicado.
