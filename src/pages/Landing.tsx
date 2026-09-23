import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Download,
  FileCheck2,
  Table2,
  Wallet,
} from "lucide-react";
import { Link } from "react-router";

import logo from "@/assets/logo.svg";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5 },
};

const FEATURES = [
  {
    icon: Table2,
    title: "Planilha do gestor",
    body: "Configuração, carteira de clientes, um ano inteiro de calendários mensais, Plano de Conteúdo, Tarefas, Hashtags, Parcerias e Financeiro — cada aba estruturada com listas suspensas, fórmulas e formatação de status.",
  },
  {
    icon: Building2,
    title: "Cadastro e CRM de clientes",
    body: "Cadastre cada cliente com contatos, perfis sociais, pacote, mensalidade e um espaço privado de anotações. Prospectos, ativos e pausados convivem lado a lado.",
  },
  {
    icon: FileCheck2,
    title: "Aprovações multi-cliente",
    body: "Rascunho → Em revisão → Aprovado → Agendado → Publicado, acompanhado por cliente. Filtre calendário e aprovações por conta, para que o fluxo de cada cliente continue separado.",
  },
  {
    icon: Wallet,
    title: "Seu dinheiro em um só lugar",
    body: "Registre mensalidades, receitas de parcerias, softwares, freelancers e equipamentos. Veja receitas, despesas, resultado líquido e o que ainda falta receber — por cliente e para o negócio inteiro.",
  },
  {
    icon: CalendarDays,
    title: "Planeje meses à frente",
    body: "Temas anuais, calendários mensais, execução semanal e um Banco de Ideias — da faísca ao post publicado, para cada cliente atendido.",
  },
  {
    icon: Download,
    title: "Backup que é seu",
    body: "Exporte todo o espaço de trabalho em um arquivo JSON e importe em outra conta quando quiser. Seus clientes, conteúdos e números nunca ficam presos aqui.",
  },
];

const WORKFLOW = [
  { step: "01", title: "Cadastre", body: "Adicione o cliente: contatos, perfis, pacote, mensalidade e anotações." },
  { step: "02", title: "Planeje", body: "Os temas anuais viram calendários mensais e execução semanal por cliente." },
  { step: "03", title: "Produza", body: "Conteúdos, tarefas e aprovações avançam no fluxo, filtrados por cliente." },
  { step: "04", title: "Receba", body: "Registre mensalidades e despesas, acompanhe o que falta receber e veja seu líquido do mês." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <img src={logo} alt="" className="size-8 rounded-lg" />
          <span className="text-base font-semibold tracking-tight">Contentplane</span>
          <nav className="ml-auto hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#system" className="transition-colors hover:text-foreground">O sistema</a>
            <a href="#features" className="transition-colors hover:text-foreground">Recursos</a>
            <a href="#workflow" className="transition-colors hover:text-foreground">Fluxo</a>
          </nav>
          <div className="ml-auto flex items-center gap-2 md:ml-4">
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">Entrar</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth">
                Abrir o painel <ArrowRight className="ml-1 size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="grid-paper pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-20 sm:px-6 sm:pt-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <Badge variant="outline" className="mb-6 gap-1.5 rounded-full bg-card px-3 py-1">
              <span className="size-1.5 rounded-full bg-primary" />
              Para freelancers e agências de social media
            </Badge>
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
              O sistema operacional de quem
              <span className="text-primary"> gerencia redes sociais</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Administre todos os seus clientes em um só lugar: carteira de clientes com
              anotações, calendários e tarefas por conta, aprovações multi-cliente e seu próprio
              controle financeiro — feito para o seu jeito real de trabalhar.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="h-11 px-6">
                <Link to="/auth">
                  Explorar o espaço de exemplo <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-11 px-6">
                <Link to="/workbook">
                  <Table2 className="mr-2 size-4" /> Ver a planilha do gestor
                </Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Abre com uma agência fictícia totalmente populada — quatro clientes de exemplo inclusos.
            </p>
          </motion.div>

          {/* Faixa de números */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="card-lift mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border/70 bg-border/60 sm:grid-cols-4"
          >
            {[
              ["4", "clientes de exemplo"],
              ["10+", "seções no espaço"],
              ["29", "abas na planilha"],
              ["100%", "seus dados, sua conta"],
            ].map(([v, l]) => (
              <div key={l} className="bg-card px-6 py-5">
                <p className="tabular text-2xl font-semibold tracking-tight">{v}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{l}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Sistema */}
      <section id="system" className="border-y border-border/60 bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <motion.div {...fadeUp} className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Um sistema, duas superfícies
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Tudo compartilha a mesma arquitetura de informação
            </h2>
            <p className="mt-4 text-muted-foreground">
              A planilha e o espaço do gestor são duas visões do mesmo modelo — cadastre o cliente
              uma vez e as duas acompanham.
            </p>
          </motion.div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {            [
              {
                title: "Planilha do gestor",
                sub: "A sala de máquinas",
                body: "Planejamento anual, calendários mensais por cliente, produção de conteúdo, tarefas, hashtags, parcerias e financeiro — com fórmulas de painel que leem a carteira de clientes.",
                points: ["Painel com fórmulas ao vivo", "12 calendários mensais com coluna de cliente", "Relatórios por cliente e registro de entregas"],
              },
              {
                title: "Espaço do gestor",
                sub: "Seu cockpit diário",
                body: "Clientes, estratégia, calendário, tarefas, aprovações, solicitações, reuniões e dinheiro — tudo na sua conta, filtrado por cliente quando você precisa de foco.",
                points: ["Carteira de clientes com anotações", "Fila de aprovações entre clientes", "Financeiro com resultado líquido"],
              },
            ].map((c) => (
              <motion.div
                key={c.title}
                {...fadeUp}
                className="card-lift card-lift-hover rounded-xl border border-border/70 bg-card p-6"
              >
                <p className="text-xs font-medium uppercase tracking-wider text-primary">{c.sub}</p>
                <h3 className="mt-2 text-lg font-semibold">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
                <ul className="mt-4 space-y-1.5">
                  {c.points.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="size-3.5 text-primary" /> {p}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Recursos */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <motion.div {...fadeUp} className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Feito para o jeito real de trabalhar de quem gerencia
          </h2>
          <p className="mt-4 text-muted-foreground">
            Nada de painel genérico — um fluxo que vai da primeira conversa com o cliente até a
            fatura paga.
          </p>
        </motion.div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                {...fadeUp}
                className="card-lift card-lift-hover rounded-xl border border-border/70 bg-card p-6"
              >
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Fluxo */}
      <section id="workflow" className="border-t border-border/60 bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <motion.div {...fadeUp} className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Da faísca ao relatório em quatro passos
            </h2>
          </motion.div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WORKFLOW.map((w) => (
              <motion.div key={w.step} {...fadeUp} className="relative">
                <p className="tabular text-4xl font-semibold text-primary/25">{w.step}</p>
                <h3 className="mt-2 text-base font-semibold">{w.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{w.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <motion.div
          {...fadeUp}
          className="card-lift relative overflow-hidden rounded-2xl border border-border/70 bg-card px-6 py-14 text-center sm:px-12"
        >
          <div className="grid-paper pointer-events-none absolute inset-0 opacity-60" />
          <div className="relative">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Abra o espaço de trabalho
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Entre e o espaço de exemplo carrega na hora — quatro clientes fictícios, calendário,
              tarefas, aprovações e financeiro. Exporte um backup em JSON quando quiser.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="h-11 px-6">
                <Link to="/auth">
                  Abrir o espaço de exemplo <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 text-xs text-muted-foreground sm:px-6">
          <img src={logo} alt="" className="size-5 rounded" />
          <span className="font-medium text-foreground">Contentplane</span>
          <span>· Sistema operacional para gestores de social media</span>
          <span className="ml-auto">Produto original — sem vínculo com qualquer ferramenta existente.</span>
        </div>
      </footer>
    </div>
  );
}
