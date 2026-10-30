# Oferta comercial única — Social Media OS (primeiro cliente)

**Objetivo:** validar um primeiro cliente pagante sem desenvolver outro módulo.

## Plano único sugerido

**Social Media OS — Profissional (piloto)**

- Preço inicial sugerido: **R$ 49 por mês por gestor** (proposta comercial, não tarifação automatizada).
- Acesso individual ao workspace com cadastro de clientes, planejamento, calendário, tarefas, aprovações, financeiro manual, backup JSON e planilha de referência separada.
- Onboarding guiado de aproximadamente 15 minutos na primeira contratação.
- Cobrança, renovação e cancelamento por acordo e pagamento realizados **fora da plataforma**.
- Sem painel para cliente do gestor, publicação automática, métricas extraídas das redes, integração com WhatsApp ou cobrança automática.
- Não há bloqueio automático por inadimplência. O responsável deve controlar contratos e contas manualmente.
- Preço e condições são sugestão; confirmar viabilidade após demonstrar com o primeiro potencial cliente.

## Demonstração rápida

1. Mostre a tela de entrada e explique o acesso individual.
2. Cadastre um cliente fictício demonstrativo; nunca use dados reais sem consentimento.
3. Mostre a estratégia e crie uma pauta no calendário.
4. Converta a pauta em tarefa e mostre o fluxo de aprovação.
5. Registre uma receita manual e mostre o painel.
6. Exporte o JSON; explique que a planilha CSV é modelo independente.

Duração desejada: 8 a 12 minutos. Não usar integrações simuladas como se fossem reais.

## Primeiro acesso do cliente pagante

1. Assine proposta/contrato com preço, vencimento, cancelamento e contato de suporte definidos.
2. Gere e configure no Convex um código de convite aleatório `SOCIAL_MEDIA_OS_SIGNUP_CODE`.
3. Envie URL real de login e código por canal privado. Não compartilhe variáveis de backend.
4. Usuário clica em “Recebi um convite — criar conta”, informa e-mail, senha forte e convite.
5. Confirme login, cadastro, persistência e saída. Troque o convite no backend após o onboarding.
6. Oriente backup JSON periódico e cautela com “Limpar espaço de trabalho”.
7. Registre contato para suporte, respeitando LGPD, e trate cobranças fora do app.

## Suporte mínimo

- Canal: telefone ou e-mail definido no contrato; não prometa resposta 24 horas.
- Incidente de login: confirmar identidade antes de qualquer ação; não solicitar senha por mensagens.
- Incidente de dados: verificar a sessão, o ID do proprietário e backups sem copiar dados de clientes para chats públicos.
- Incidente de indisponibilidade: verificar deploy Cloudflare Pages, URL do Convex e status do GitHub Actions.
- Incidente de pagamento: conferir registro manual, sem afirmar conciliação ou webhook inexistentes.

## Critérios para iniciar cobrança

Não vender antes de concluir os itens de [auditoria-mvp.md](auditoria-mvp.md) marcados como bloqueantes; principalmente rotação de segredos, implantação real, dois logins isolados e contato/termos revisados.
