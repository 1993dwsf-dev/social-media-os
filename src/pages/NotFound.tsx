import { motion } from "framer-motion";
import { ArrowLeft, Compass } from "lucide-react";
import { Link } from "react-router";

import logo from "@/assets/logo.svg";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative flex min-h-screen flex-col bg-background text-foreground"
    >
      <div className="grid-paper pointer-events-none absolute inset-0" />
      <div className="relative flex flex-1 items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl border border-border/70 bg-card text-primary card-lift">
            <Compass className="size-7" />
          </div>
          <p className="tabular text-6xl font-semibold tracking-tight">404</p>
          <h1 className="mt-2 text-lg font-semibold">Esta página saiu do planejamento</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            O endereço que você abriu não existe ou mudou de lugar. O resto do
            Social Media OS está exatamente onde você deixou.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <Button asChild size="sm">
              <Link to="/app/dashboard">
                <ArrowLeft className="mr-1.5 size-3.5" /> Ir para o painel
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/">Página inicial</Link>
            </Button>
          </div>
          <img
            src={logo}
            alt="Social Media OS"
            className="mx-auto mt-10 size-8 rounded-lg opacity-40"
          />
        </div>
      </div>
    </motion.div>
  );
}
