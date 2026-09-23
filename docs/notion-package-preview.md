# Pacote para o Notion — o que é exportado

Ao clicar em **Pacote para o Notion** em Configurações, são baixadas as páginas em
markdown e as bases em CSV listadas abaixo, geradas a partir do mesmo modelo de dados
que o portal renderiza — então status, categorias e nomes de clientes batem 1:1.

```
README.md                          ← como importar + aviso de privacidade
Reuniões.md                        ← as reuniões de todos os clientes em uma linha do tempo
databases/
├── Clients.csv                    ← Cliente, Contato, E-mail, Telefone, Site, Segmento,
│                                     Pacote, Mensalidade, Data de início, Status,
│                                     Instagram, TikTok, LinkedIn, YouTube, Facebook,
│                                     Pinterest, Outro, Observações
├── Content.csv                    ← Cliente, Data, Plataforma, Formato, Pilar, Tema, Status
├── Tasks.csv                      ← Cliente, Tarefa, Projeto, Categoria, Prioridade, Status,
│                                     Data de início, Prazo, Observações
├── Requests.csv                   ← Cliente, Solicitação, Categoria, Prioridade,
│                                     Solicitado em, Status, Responsável, Prazo, Comentários
├── Meetings.csv                   ← Cliente, Data, Horário, Reunião, Pauta, Participantes,
│                                     Status, Observações, Itens de ação
├── Deliverables.csv               ← Cliente, Nome do arquivo, Categoria, Descrição, Data,
│                                     Status, Projeto relacionado
└── Finance.csv                    ← Cliente, Data, Tipo, Valor, Categoria, Descrição,
                                      Status, Vencimento, Data de pagamento
clients/<slug-do-cliente>/
├── Cliente.md                     ← contato, perfis sociais, estratégia, indicadores,
│                                     observações internas (somente para o gestor)
├── Calendário de Conteúdo.md      ← as linhas de conteúdo daquele cliente
├── Solicitações.md                ← as solicitações daquele cliente
└── Arquivos e Entregas.md         ← os arquivos daquele cliente
```

É gerado um conjunto de páginas por cliente, usando o slug do cliente como nome da pasta
(ex.: `northwind-coffee-roasters/`).

## Importando no Notion

1. **Importe os CSVs** — Notion → Workspace → Import → CSV. Cada arquivo vira uma base;
   o Notion detecta automaticamente datas, números e textos no estilo de seleção.
2. **Crie as páginas** — cole (ou importe) cada arquivo markdown como uma página dentro de
   uma página principal com o nome do cliente.
3. **Conecte tudo** — `Clients` é a base principal; adicione relações de `Content`,
   `Tasks`, `Requests`, `Meetings`, `Deliverables` e `Finance` de volta para ela pela
   coluna `Cliente`, e uma relação `Content ↔ Deliverables` via `Projeto relacionado`.
4. **Monte o quadro de aprovações** — na base `Content`, adicione uma visão de quadro
   agrupada por **Status**. `In Review` = precisa de decisão; `Changes Requested` =
   refazer.
5. **Adicione visões de calendário** — base `Content`: calendário por **Data** e quadro
   por **Plataforma**.

## Aviso de privacidade

`Finance.csv`, as tabelas de indicadores e a seção "observações internas (somente para o
gestor)" de `Cliente.md` são de uso interno do negócio. Remova-os antes de compartilhar a
pasta de um cliente com o próprio cliente. O pacote nunca contém métricas de redes sociais
— o espaço de trabalho não tem conexão com APIs de plataformas, então ele acompanha apenas
o que o gestor controla (entrega, aprovações e dinheiro).
