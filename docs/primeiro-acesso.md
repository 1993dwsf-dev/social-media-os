# Primeiro acesso e suporte — Social Media OS

## Endereços oficiais desta instalação

- Aplicação: https://social-media-os-b0c.pages.dev/auth
- Backend exclusivo: `charming-leopard-770`.
- Painel do operador: https://dashboard.convex.dev/t/david-william/social-media-os/charming-leopard-770
- Código e publicações: somente a branch `main` de `1993dwsf-dev/social-media-os`.

## Primeiro acesso do David

1. Entre no painel Convex acima e confirme o projeto `social-media-os` e o deployment `charming-leopard-770`.
2. Em configurações de variáveis de ambiente, consulte `SOCIAL_MEDIA_OS_SIGNUP_CODE` no próprio painel. O valor é privado: não o publique em arquivos, prints ou conversas de suporte. Não use `JWT_PRIVATE_KEY` nem `CONVEX_DEPLOY_KEY` como convite.
3. Abra o endereço da aplicação e clique em **Recebi um convite — criar conta**.
4. Informe seu e-mail, uma senha própria de 12 a 128 caracteres e o convite. A senha é escolhida por você; o suporte não precisa recebê-la.
5. Entre em **Configurações**, preencha seu perfil e salve. Em **Clientes**, cadastre o primeiro cliente.
6. Saia e entre novamente usando apenas e-mail e senha. O convite não é pedido nos próximos logins.
7. Após concluir esse acesso, substitua o convite no Convex por outro valor aleatório forte. A troca bloqueia novos cadastros com o convite anterior e não altera as senhas das contas existentes.

Cada conta é um espaço independente de gestor. Este MVP não possui um painel de administração da plataforma nem acesso próprio para os clientes cadastrados pelo gestor.

## Onboarding do primeiro cliente pagante — aproximadamente 15 minutos

| Etapa | Ação | Resultado esperado |
| --- | --- | --- |
| Contratação | Confirmar preço, vencimento, cancelamento e canal de suporte em proposta específica. | Condições entendidas antes da cobrança. |
| Convite | Enviar URL e convite por canal privado ao gestor contratado. | O gestor cria sua própria senha. |
| Perfil | Salvar nome do gestor e nome do negócio em Configurações. | Perfil reaparece após recarregar. |
| Cliente | Cadastrar uma empresa de teste com dados fictícios. | Cliente aparece somente nessa conta. |
| Produção | Criar conteúdo no calendário e uma tarefa ligada ao cliente. | Conteúdo e tarefa persistem após novo login. |
| Financeiro | Registrar um lançamento manual. | Não prometer cobrança ou conciliação automática. |
| Backup | Exportar JSON e explicar que a importação acrescenta registros. | Cliente sabe preservar os dados e evitar duplicação. |
| Encerramento | Remover apenas os dados demonstrativos e trocar o convite após o cadastro. | A conta segue acessível com sua senha. |

A proposta existente sugere um piloto de R$ 49 por mês por gestor; esse valor ainda precisa ser adotado pelo operador na proposta de venda. A cobrança é externa e manual.

## Suporte de acesso

- A primeira verificação é o endereço oficial e se o usuário está em **Entrar**, sem tentar criar outra conta.
- Oriente o uso do e-mail de cadastro e da senha correta. Convite só é necessário no cadastro.
- Não peça senha, token de sessão, chave de deploy ou exportação completa de clientes por mensagem.
- O e-mail de cadastro não é automaticamente verificado neste MVP. Não use apenas a declaração de um e-mail como prova suficiente para transferir dados.
- A biblioteca de autenticação limita tentativas malsucedidas por identificador. Isso não equivale a proteção por IP ou captcha ativo no cadastro.
- Não há botão de recuperação de senha por e-mail. Não apague uma conta para tentar recriá-la: os registros são ligados ao ID original.
- Se o gestor ainda tem uma sessão ativa em outro dispositivo, ele pode exportar seu JSON. Qualquer migração para uma nova conta deve ser acompanhada, autorizada pelo titular e validada antes de remover dados da conta anterior.
- Sem sessão ativa ou backup disponível, o caso exige avaliação técnica específica. Não prometa um procedimento de recuperação que ainda não foi implementado e testado.

## Suporte de dados e cobrança

- Limpar o armazenamento do navegador encerra a sessão local; não remove os registros do Convex.
- **Limpar espaço de trabalho** exclui registros operacionais da própria conta. A exclusão da conta de autenticação é uma operação distinta.
- Restaure primeiro em uma conta vazia: importar duas vezes pode duplicar registros.
- A planilha de referência exporta CSV, mas não consulta os clientes e lançamentos do workspace. O backup dos dados reais é JSON.
- Se houver divergência financeira, confira os lançamentos manuais e a conta em uso. Não atribua a confirmação a um webhook ou banco que o produto não integra.

## Antes de iniciar cobrança

- Preencher a identificação pública do responsável e o e-mail de suporte; a publicação ainda mostra esse contato como pendente.
- Revisar termos e privacidade com os dados reais e definir proposta/contrato, cancelamento e atendimento.
- Resolver a origem e eventual revogação de credenciais históricas, sem reutilizá-las nesta instalação.
- Não prometer publicação automática, métricas conectadas, portal do cliente, reset automático de senha ou cobrança automatizada.
