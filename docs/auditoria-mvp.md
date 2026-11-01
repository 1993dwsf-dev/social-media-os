# Auditoria técnica e de segurança — Social Media OS

**Data:** 01/11/2026 • **Branch:** main • **Objetivo:** MVP único, sem novos módulos.

## Registro da revisão anterior

As verificações e a matriz abaixo descrevem a revisão `e36c7d3`, antes das correções posteriores. O estado atual de código e suas pendências estão em [correcoes-auditoria.md](correcoes-auditoria.md). Testes anteriores não validam automaticamente o novo deployment.

## Verificações objetivas

- Validação funcional de referência: `e36c7d347683365641b4ae201d535114bfe39fef`, CI [41311175701](https://github.com/1993dwsf-dev/social-media-os/actions/runs/41311175701), concluída com sucesso. A CI executa lint, geração de tipos com Convex local e temporário, build Vite/TypeScript e testes. O [deployment Pages correspondente](https://dash.cloudflare.com/?to=/bb3055e676b5aff1531b35b7ab8eb90d/pages/view/social-media-os/cda0603c-3b4b-436f-8131-8c49834c6726) também concluiu com sucesso.
- Esta manutenção passou localmente e na CI em 82 testes, lint sem erros e build. Foram retirados 15 testes do utilitário de captcha removido e acrescentados 8 testes de segurança da publicação; os testes de autenticação, isolamento e importação permanecem.
- O script do Pages exige origem `main` e chave do backend exclusivo. Gera tipos sem ativar código no deployment, executa lint, testes e build e só então publica o backend. Uma falha nessas etapas interrompe a publicação; a execução não depende de a CI paralela terminar primeiro.
- Isolamento: dados são filtrados no backend por `ownerId`; leituras e alterações entre dois gestores são negadas nos testes.
- Entrada de dados: mutations principais usam validação Zod; IDs externos não podem sobrescrever IDs internos ou `ownerId`.
- Backups: importação valida coleções e relacionamentos, remapeia IDs, é transacional e limitada a 1.000 registros por operação.
- Rotas privadas: protegidas pela sessão Convex Auth. Sem sessão, consultas retornam vazio e mutations são negadas.
- Sessão: Convex Auth com provider Password; cadastro com convite; entrada com senha sem convite.
- App: toolbar do ambiente de criação, JWT federado do provedor anterior, gateway de OTP e login de visitante retirados. Os endpoints antigos de Turnstile e seu utilitário também foram removidos nesta manutenção. A tabela legada foi preservada para não excluir dados históricos.
- Identidade: Social Media OS, um produto de David William. A apresentação pública, o nome do backup e as mensagens usam a marca do produto; os avisos e licenças de terceiros são preservados.
- O inventário de segurança descobre os módulos Convex automaticamente, incluindo a consulta interna de auditoria, e exige classificação explícita de suas funções.
- Cloudflare Pages: SPA fallback `public/_redirects` e cabeçalhos básicos `public/_headers` adicionados.
- Produção publicada em https://social-media-os-b0c.pages.dev, com origem GitHub e deploy automático exclusivo da `main`; previews desativados. O disparo observado foi `github:push`.
- Convex exclusivo do produto: `charming-leopard-770`, projeto `david-william/social-media-os`, sem usar o banco do Barber OS.
- Na revisão publicada `e36c7d3`, foram aprovados novamente 13 grupos de testes reais de API e 14 cenários de navegador: convite, senha, duas contas, acesso cruzado, persistência, limpeza do armazenamento, logout, clientes, calendário, aprovação, tarefas, financeiro, CSV e backup/restauração com novos IDs e proprietário. O Chromium não registrou erros de execução.
- Os testes de navegador foram funcionais, sob o proxy do ambiente, com exceção de certificado no Chromium. As verificações HTTP separadas mantiveram a validação TLS pelo sistema e confirmaram status 200 e os cabeçalhos de segurança nas rotas verificadas. O HTML do domínio principal coincidiu com o endereço imutável do deployment.
- Vinte e um assets públicos foram examinados novamente: nenhuma correspondência com as credenciais verificadas nem com os deployments conhecidos do Barber OS. Os registros operacionais criados nos testes foram removidos; as contas técnicas de autenticação permanecem vazias.
- Chaves JWT, convite e chave de deploy desta instalação foram gerados novamente. A chave de deploy é `secret_text` apenas em produção no Pages; não existe chave de deploy no ambiente de preview.
- O schema exige validação estrutural do banco, complementar às regras Zod. A auditoria interna prévia de produção retornou `checked=0`, `invalidCount=0`, sem alterar documentos. A configuração ativa foi consultada em produção: `schemaValidation: true`, 16 tabelas; autenticação e gravação reais passaram nessa revisão.
- A API ativa passou de 49 para 45 funções: as quatro funções de Turnstile estão ausentes, a tabela legada permanece e a auditoria continua interna. Chamadas públicas aos endpoints removidos e à auditoria foram recusadas; a verificação de metadados confirma remoção e visibilidade, pois produção omite detalhes dessas recusas.
- O histórico anterior a esta manutenção foi examinado: 44 commits e 383 blobs únicos. A chave publicada em `.env.keys` era `DOTENV_PRIVATE_KEY_LOCAL`, de descriptografia do dotenvx. Não foi encontrado o arquivo cifrado correspondente nem correspondências com os formatos procurados de chaves Convex, tokens JWT, Resend, Brevo ou chaves PEM privadas. Isso delimita o resultado da varredura, sem provar ausência de todo segredo possível.

## Riscos e ações necessárias

| Prioridade | Situação | Ação |
| --- | --- | --- |
| **HISTÓRICO IDENTIFICADO** | A chave de descriptografia dotenvx continua exposta no histórico. A produção atual não usa dotenvx nem essa chave; usa novas credenciais independentes. Nenhum payload cifrado correspondente foi encontrado neste repositório. | Não reutilizar a chave. Caso existam cópias cifradas fora do repositório, não disponíveis nesta auditoria, recriptografá-las com novo par e trocar nos respectivos provedores as credenciais que contenham. A chave antiga não foi apagada nem declarada revogada. |
| **CONCLUÍDA** | Produção Convex e Cloudflare Pages configurados e testados no endereço real. | Manter `main`, backend exclusivo e previews desativados; consultar [implantacao-mvp.md](implantacao-mvp.md). |
| **ALTA** | A autenticação anterior usava OTP e visitante; novos logins usam senha. Contas antigas não possuem automaticamente credenciais Password. | Antes de migrar um banco com usuários reais, avaliar dados vinculados aos IDs anteriores e elaborar migração de contas. Não reutilizar sem análise um banco com clientes reais. |
| **ALTA** | O código de convite é compartilhado até ser trocado. Não é uso único. | Criar código aleatório no Convex, enviar em particular e **trocar após ativar o primeiro cliente**. |
| **ALTA** | Não há verificação de e-mail nem recuperação automática de senha. O Convex Auth instalado limita tentativas de senha malsucedidas por identificador, com capacidade padrão de 10 e reposição gradual; isso não é proteção por IP ou captcha de cadastro. | Adotar o procedimento manual de suporte em [primeiro-acesso.md](primeiro-acesso.md), sem solicitar senhas. Não prometer recuperação automática. |
| **ALTA** | Termos e privacidade precisam da identificação, contato reais e revisão jurídica. | Definir `VITE_SUPPORT_EMAIL` na publicação, completar documentos/contrato e formalizar responsabilidades de proteção de dados. |
| **CONCLUÍDA EM PRODUÇÃO** | `schemaValidation: true` confirmado no schema ativo de produção, após auditoria prévia sem inconsistências. Testes reais de autenticação e gravação passaram. | Manter a validação nas próximas publicações. A ativação valida documentos; não os exclui. |
| **MÉDIA** | A planilha CSV não consulta dados reais do workspace. | Não vender como relatório exportado dos registros da carteira. Backup real é JSON. |
| **CONCLUÍDA EM PRODUÇÃO** | Endpoints e utilitário do antigo Turnstile retirados; ausência confirmada na API ativa e tabela legada preservada. | Manter somente os providers e endpoints usados. Isso não acrescenta captcha ao login por senha. |

## Critérios de liberação comercial

- [x] Um único código em `main` com CI aprovado.
- [x] Build do frontend aprovado e testes de isolamento e importação concluídos.
- [x] Login e cadastro usando Convex Auth no backend exclusivo do produto.
- [x] Novas credenciais da instalação geradas sem reutilizar as históricas e variáveis privadas configuradas.
- [x] Natureza da chave histórica e alcance verificável no repositório identificados; credenciais da instalação atual independentes.
- [x] Deployment Convex real publicado e validado.
- [x] Projeto Cloudflare Pages real criado no domínio `*.pages.dev`.
- [x] Teste de ponta a ponta com dois gestores no endereço público.
- [ ] Dados legais e contato reais configurados; contrato de prestação/assinatura pronto.

**Conclusão:** a implantação e os fluxos desta revisão foram validados no deployment publicado. Termos, privacidade, contato e condições contratuais ficam para a etapa final, conforme orientação do operador; a liberação comercial permanece pendente. A investigação do histórico não abrange arquivos cifrados que possam existir fora deste repositório.
