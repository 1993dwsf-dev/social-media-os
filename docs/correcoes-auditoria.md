# Correções da auditoria — 01/11/2026

Base: `200441e3edef5a4ea257b796aa187d2860601ae7`, exclusivamente `main`.

## Implementação

- Demonstração: bloqueio no backend se qualquer coleção contiver registros; perfil existente preservado.
- Backup: consulta consistente das sete coleções no servidor, carregamento completo da interface, limites compartilhados de importação/exportação e capacidade transacional do piloto (1.000 registros / 500 KB). Nenhum dado antigo é excluído.
- Importação: confirmação visual, proteção contra mescla acidental no backend e validação integral antes da gravação.
- CSV real das sete coleções, filtro por cliente, formato compatível com Excel em PT-BR e neutralização de fórmulas em textos.
- Convites: individuais, vinculados ao e-mail, 48 horas, uso único e digest no banco; emissão interna pelo dashboard Convex. O código compartilhado antigo deixa de habilitar cadastros.
- Recuperação: chave de emergência de 256 bits, emissão com senha atual, hash armazenado, consumo único e troca pelo provider Convex Auth. Proprietário e dados preservados; sessões antigas revogadas e conferidas no backend.
- Aceite: checkbox obrigatório, versão e data persistidas no cadastro. A versão atual está explicitamente marcada como minuta; o texto comercial final e os dados reais do responsável ainda precisam ser fornecidos.
- Dependências: atualização do lockfile e auditoria bloqueante na CI e no build Pages. Override `minimatch` 11.0.3 para corrigir o alerta transitivo; lint, build e testes verificam a compatibilidade com ESLint/TypeScript ESLint.
- Limpeza: servidor alternativo Hono/Deno, arquivo SST, dependências diretas sem uso e referência à antiga toolbar removidos; dependências legítimas mantêm seus nomes e licenças.
- Segurança adicional: CSP no Pages, alvo ES2020 e limpeza de sessões paginada em lotes de 200, com continuação agendada.

## Validação

Validação local: **94 testes aprovados, zero falhas; build aprovado; lint sem erros (9 avisos de Fast Refresh); `bun audit` sem alertas no lockfile atualizado.** Consultar também a execução CI do commit de entrega. Os testes incluem isolamento entre contas, rotas sem sessão, recuperação real dos handlers com mudança de senha e revogação, restauração das sete coleções, rollback de capacidade e geração de faturas idempotente.

A execução local usa `convex-test` e os geradores oficiais de tipos do Convex. Testes em memória não comprovam sozinhos o estado do deployment ou a configuração das contas externas.

Em 02/11/2026, a revisão publicada `e0794d2c2448a40ac7f4020de89ded92dfea4498` passou em **14 cenários reais** no Pages/Convex de produção (execução `7a0baebb-3c74-468d-9efe-4fb6920f55e4`). Foram exercitados convite individual e substituição, vínculo ao e-mail e uso único, aceite, cadastro de duas contas, isolamento, bloqueio de demonstração sobre dados, JSON das sete coleções, CSV real e filtro, chave de emergência e substituição, recuperação preservando dados, revogação de senha/sessões/tokens antigos, limites de importação, confirmação e remapeamento da restauração, proteção de mescla e logout. Não houve erro de execução capturado no navegador. Os registros operacionais das duas contas de teste foram limpos; as contas técnicas de autenticação permaneceram vazias.

O envio de convites por Resend foi acrescentado posteriormente. Sua configuração privada e entrega real têm validação própria descrita em [convites-resend.md](convites-resend.md); os 14 cenários anteriores não comprovam essa entrega.

## Limites e pendências

- Verificação e reset automático por e-mail não foram adicionados. Não há dependência de Brevo ou outro envio pago.
- A recuperação exige que o gestor tenha gerado e guardado sua chave previamente. Sem ela, o suporte deve investigar sem excluir a conta.
- O modelo continua individual; equipe e portal do cliente não foram acrescentados.
- A capacidade limitada evita crescimento ilimitado de consultas; paginação do workspace exige projeto posterior para carteiras maiores.
- Preencher nome do responsável e suporte e finalizar documentos/contrato. Os novos fluxos de acesso e dados já foram testados no endereço público, conforme o registro acima.
- A chave dotenvx identificada no histórico anterior continua sem uso. Não houve reescrita de histórico nem varredura de arquivos externos.
