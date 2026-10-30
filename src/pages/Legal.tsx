import { Link } from "react-router";
import logo from "@/assets/logo.svg";
import { Button } from "@/components/ui/button";

// Set the real operator contact before first paid customer.
const contact = (import.meta.env.VITE_SUPPORT_EMAIL as string | undefined)?.trim();
const updated = "30 de outubro de 2026";

function Contact() {
  if (!contact) return <span className="font-medium text-amber-700">Contato do responsável ainda não informado — publicação comercial pendente.</span>;
  return <a href={`mailto:${contact}`} className="underline">{contact}</a>;
}

function Layout({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <img src={logo} alt="" className="size-8" /> Social Media OS
          </Link>
          <Button asChild size="sm" variant="ghost" className="ml-auto"><Link to="/auth">Entrar</Link></Button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-12 text-sm leading-relaxed">
        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="text-muted-foreground">Atualizado em {updated}. {intro}</p>
        <div className="space-y-6">{children}</div>
        <footer className="flex gap-4 border-t border-border pt-5 text-muted-foreground">
          <Link to="/termos" className="underline">Termos de Uso</Link>
          <Link to="/privacidade" className="underline">Privacidade</Link>
        </footer>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="space-y-2"><h2 className="text-base font-semibold">{title}</h2><div className="space-y-2 text-muted-foreground">{children}</div></section>;
}

export function TermsPage() {
  return (
    <Layout title="Termos de Uso" intro="Minuta informativa para revisão antes da venda; não substitui contrato comercial ou análise jurídica.">
      <Section title="1. Serviço e público">
        <p>O Social Media OS organiza clientes, conteúdo, calendário, tarefas, aprovações, arquivos e finanças manuais de um gestor de social media por conta. Os clientes do gestor são registros e não têm acesso próprio ao sistema.</p>
        <p>Não publicamos automaticamente nas redes sociais, não coletamos métricas diretamente das plataformas e não processamos pagamentos de assinaturas dentro do aplicativo.</p>
      </Section>
      <Section title="2. Acesso">
        <p>O acesso é por e-mail e senha. Para criar conta é necessário um código de convite fornecido pelo responsável pela plataforma. Cada gestor deve manter suas credenciais em sigilo; contas distintas têm espaços de dados separados.</p>
        <p>Não há recuperação automática de senha neste MVP. Em caso de perda da senha, procure o suporte; a verificação de identidade será necessária antes de qualquer medida administrativa.</p>
      </Section>
      <Section title="3. Responsabilidades do usuário">
        <p>O gestor é responsável por cadastrar informações corretas, possuir base legal para o tratamento de dados dos seus clientes e fazer cópias de segurança pelo recurso de exportação JSON. Nunca inclua senhas de redes sociais, documentos confidenciais desnecessários ou dados sensíveis nas anotações.</p>
      </Section>
      <Section title="4. Backups e exclusão">
        <p>A plataforma armazena registros no Convex, não no cache do navegador. Limpar o cache pode encerrar a sessão sem apagar o banco. A opção “Limpar espaço de trabalho” exclui os registros da conta e deve ser usada com cautela.</p>
        <p>A importação JSON adiciona dados; repetir a operação pode criar registros duplicados. Teste a restauração em uma conta vazia.</p>
      </Section>
      <Section title="5. Cobrança e disponibilidade">
        <p>Preço, periodicidade, cancelamento, atendimento e eventuais condições de serviço precisam constar de proposta/contrato específico aceito pelo comprador. O aplicativo não oferece SLA, suporte 24h ou recursos de pagamento automático neste MVP.</p>
      </Section>
      <Section title="6. Suporte">
        <p>Responsável e canal de contato: <Contact /></p>
      </Section>
    </Layout>
  );
}

export function PrivacyPage() {
  return (
    <Layout title="Aviso de Privacidade" intro="Informações sobre o tratamento de dados. O responsável deve revisar este documento com sua identificação e contato reais antes de oferecer o sistema comercialmente.">
      <Section title="1. Papéis e contato">
        <p>O operador comercial do Social Media OS é responsável pelo tratamento necessário à operação das contas da plataforma. O gestor que cadastra dados dos seus próprios clientes também deve definir responsabilidades e cumprir a Lei Geral de Proteção de Dados (LGPD) no contexto do atendimento prestado.</p>
        <p>Canal para solicitações de privacidade: <Contact /></p>
      </Section>
      <Section title="2. Informações tratadas">
        <p>Armazenamos e-mail de cadastro, credenciais de autenticação protegidas pelo provedor, sessões, informações de perfil e registros inseridos pelo gestor: clientes, contatos, planejamento, tarefas, aprovações, arquivos e lançamentos financeiros.</p>
        <p>Não acessamos senhas de redes sociais nem importamos dados automaticamente das plataformas. Não cadastre dados sensíveis ou informações desnecessárias.</p>
      </Section>
      <Section title="3. Finalidades e infraestrutura">
        <p>Os dados são utilizados para autenticar usuários, manter o espaço de trabalho e executar as funcionalidades solicitadas. O frontend é servido pelo Cloudflare Pages; o banco de dados e a autenticação ficam no Convex, provedores de infraestrutura envolvidos no processamento técnico.</p>
      </Section>
      <Section title="4. Acesso e proteção">
        <p>O backend aplica autenticação e vincula registros ao identificador de proprietário da conta. A criptografia de transporte é fornecida pelas conexões HTTPS. O usuário deve manter senha forte, não compartilhar seu acesso e exportar backups regularmente.</p>
      </Section>
      <Section title="5. Retenção, exclusão e direitos">
        <p>Registros operacionais permanecem até exclusão pelo usuário ou encerramento e tratamento administrativo da conta, conforme obrigações legais aplicáveis. O gestor pode limpar os registros do seu espaço, e solicitar informações, correção ou exclusão pelo canal do responsável.</p>
        <p>A exclusão de registros do espaço não implica automaticamente a remoção da conta de autenticação, logs operacionais ou backups mantidos pelo usuário. Pedidos específicos devem ser analisados pelo responsável.</p>
      </Section>
    </Layout>
  );
}
