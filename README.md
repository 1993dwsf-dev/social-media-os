# Social Media OS — MVP de gestão de clientes e conteúdo

Aplicação React + TypeScript + Vite + Convex para **um gestor de social media por conta**, com vários clientes cadastrados no seu espaço. Clientes não possuem login e não veem o painel.

## O que já existe
- Cadastro e acompanhamento de clientes, estratégia e onboarding
- Planejamento e calendário de conteúdo, tarefas, aprovações e solicitações
- Reuniões, registros de entregas e financeiro manual
- Exportação/importação de backup JSON do workspace
- Planilha de referência com 29 abas e exportação CSV (NÃO sincronizada com o workspace)

**Não inclui** postagem automática, métricas conectadas às redes sociais, portal do cliente, cobrança automática, envio de e-mail ou sincronização da planilha com o banco. Não prometa esses recursos.

## Arquitetura única
- Frontend: Cloudflare Pages (uma única branch `main`, um único endereço público).
- Backend e banco: **um único deployment Convex**, com autenticação Convex Auth e dados isolados por `ownerId`.
- Login: e-mail/senha, cadastro restrito por `SOCIAL_MEDIA_OS_SIGNUP_CODE` configurado APENAS no backend Convex. Sem serviços do Freebuff, Google ou envio de OTP.
- Sem domínio próprio obrigatório para a URL `*.pages.dev`.
- Recuperação automática de senha não existe neste MVP; o operador precisará prestar suporte ao usuário que perder acesso, mediante verificação de identidade.

## Operação e implantação
Consulte [docs/implantacao-mvp.md](docs/implantacao-mvp.md) para a configuração exata de Convex, Cloudflare Pages, ações necessárias, testes de segurança e entrega do primeiro cliente.

## Fluxo de uso
1. Operador cria convite privado (env do Convex) e o informa ao novo gestor.
2. Gestor abre `/auth`, cria a conta com e-mail, senha de 12+ caracteres e convite.
3. Gestor cadastra o primeiro cliente e utiliza painel, calendário, tarefas e financeiro.
4. Faz backup regular em Configurações > Exportar JSON; planilha CSV é separada dos registros reais.
5. Cancelamento, suporte e recebimento de assinatura são feitos **fora do app**.

## Desenvolvimento
```bash
bun install --frozen-lockfile
# Backend: configurar CONVEX_DEPLOY_KEY e variáveis de Convex Auth
bunx convex deploy
bun run lint
bun test
bun run build
```
Os tipos em `src/convex/_generated` são gerados pelo CLI Convex; sem implantação acessível, a etapa de codegen e o build completo não funcionam. Não inclua chaves em `VITE_*`, commits ou issues.

## Segurança
- Backend exige autenticação em mutations, filtra listagens por `ownerId` e valida referências de clientes nas escritas.
- As importações de JSON são validadas, limitadas e transacionais; os IDs de origem não viram identidades de destino.
- A chave privada `.env.keys` foi removida da branch principal; **rotacione-a se foi utilizada, pois o histórico do Git é público**.
- Antes de vender, rode todos os testes, verifique o login de duas contas distintas e valide backup/restauração.
- Atualize e revise os textos legais e informe os dados reais de contato do responsável.

Este repositório não é evidência de que o deploy está ativo. O lançamento só é confirmado depois do build, deploy e smoke test em `*.pages.dev`.
