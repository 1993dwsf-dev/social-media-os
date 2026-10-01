// Termos de Uso e Aviso de Privacidade do Contentplane.
//
// São páginas públicas (sem sessão), escritas para o gestor de social media que
// vai usar o sistema e para os clientes dele, cujos dados o gestor cadastra.
// O texto descreve o que o produto **realmente** faz — nada de promessa que o
// código não cumpra (ver `docs/entrega.md`, §7 "O que não prometer").
//
// Antes de publicar: trocar `CONTATO` pelo e-mail real do responsável e revisar o
// texto com um profissional de direito — este é um modelo honesto e específico,
// não peça jurídica pronta.

import { Link } from "react-router";

import logo from "@/assets/logo.svg";
import { Button } from "@/components/ui/button";

/** E-mail do responsável pelo produto (controlador). Trocar antes de publicar. */
const CONTATO = "contato@contentplane.app";

const ATUALIZADO = "1º de outubro de 2026";

function LegalLayout({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="" className="size-8 rounded-lg" />
            <span className="text-base font-semibold tracking-tight">Contentplane</span>
          </Link>
          <Button asChild variant="ghost" size="sm" className="ml-auto">
            <Link to="/auth">Entrar</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Atualizado em {ATUALIZADO}</p>
        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{intro}</p>
        <div className="mt-8 space-y-8 text-sm leading-relaxed">{children}</div>

        <footer className="mt-12 flex flex-wrap gap-4 border-t border-border/60 pt-6 text-xs text-muted-foreground">
          <Link to="/termos" className="transition-colors hover:text-foreground">
            Termos de Uso
          </Link>
          <Link to="/privacidade" className="transition-colors hover:text-foreground">
            Privacidade
          </Link>
          <Link to="/" className="transition-colors hover:text-foreground">
            Página inicial
          </Link>
        </footer>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="mt-2 space-y-2 text-muted-foreground">{children}</div>
    </section>
  );
}

export function TermsPage() {
  return (
    <LegalLayout
      title="Termos de Uso"
      intro="Ao usar o Contentplane você concorda com as condições abaixo. Este é um produto de assinatura única: uma conta por pessoa, sem plano pago e sem cobrança."
    >
      <Section title="1. O que é o Contentplane">
        <p>
          Um sistema operacional para gestores de social media independientes: carteira de
          clientes, calendário de conteúdo, tarefas, aprovações, solicitações, reuniões,
          entregas, financeiro e uma planilha completa de 29 abas. Tudo o que você registra fica
          na sua conta.
        </p>
      </Section>

      <Section title="2. Conta e acesso">
        <p>
          O acesso é por e-mail, com um código de uso único válido por 15 minutos. A opção
          &quot;Continuar como visitante&quot; cria uma sessão anônima sem e-mail: serve para
          demonstração e <strong>não</strong> permite recuperar o acesso se o navegador for
          limpo. Não compartilhe seu acesso com terceiros — a conta é individual e cada pessoa
          precisa da própria.
        </p>
      </Section>

      <Section title="3. O que é responsabilidade sua">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Backup.</strong> Seus dados são seus, mas só você controla as cópias. Configure
            uma periodicidade para exportar o JSON em Configurações → Exportar JSON e guarde o
            arquivo fora do navegador. O serviço não guarda cópia de segurança do seu conteúdo.
          </li>
          <li>
            <strong>Dados de terceiros.</strong> Ao cadastrar contatos, notas e dados financeiros de
            clientes, perfil e redes sociais, você age como controlador desses dados e é
            responsável por ter autorização do cliente e por cumprir a LGPD — ver o{" "}
            <Link to="/privacidade" className="underline">
              Aviso de Privacidade
            </Link>
            .
          </li>
          <li>
            <strong>Uso dentro da lei.</strong> Nada de uso ilegal, discurso de ódio, material de
            menores sem autorização ou tentativa de acessar dados de outra conta.
          </li>
        </ul>
      </Section>

      <Section title="4. Limites do produto (leia antes de vender para o cliente final)">
        <ul className="list-disc space-y-1 pl-5">
          <li>Não há integração com redes sociais: seguidores, alcance e engajamento não são importados.</li>
          <li>Não há publicação automática de posts — o sistema organiza e aprova, quem publica é você.</li>
          <li>Não há login para o cliente: ele não acessa o sistema.</li>
          <li>É um assento: uma conta = um gestor. Agências com várias pessoas usam uma conta por pessoa.</li>
        </ul>
      </Section>

      <Section title="5. Disponibilidade e cobrança">
        <p>
          O serviço é oferecido sem cobrança e sem garantia de disponibilidade contínua: pode haver
          manutenções, e o produto pode ganhar, perder ou alterar recursos. Não há SLA. Se você
          depende do sistema para cobrar mensalidades de clientes, mantenha seu backup em dia.
        </p>
      </Section>

      <Section title="6. Encerramento e exclusão">
        <p>
          Você pode apagar tudo a qualquer momento em Configurações → Limpar espaço de trabalho. O
          logout apenas encerra a sessão: <strong>não</strong> apaga dados. Pedidos de exclusão
          permanente da conta e dos dados podem ser feitos pelo e-mail de contato; a exclusão é
          definitiva e não pode ser desfeita.
        </p>
      </Section>

      <Section title="7. Contato">
        <p>
          Dúvidas sobre estes termos:{" "}
          <a href={`mailto:${CONTATO}`} className="underline">
            {CONTATO}
          </a>
          .
        </p>
      </Section>
    </LegalLayout>
  );
}

export function PrivacyPage() {
  return (
    <LegalLayout
      title="Aviso de Privacidade"
      intro="Este aviso explica quais dados o Contentplane coleta, por que, com quem compartilha e como você exerce seus direitos, em conformidade com a Lei nº 13.709/2018 (LGPD)."
    >
      <Section title="1. Quem é o controlador">
        <p>
          O controlador é quem opera o Contentplane. Para assuntos de privacidade e para os
          direitos de titulares (inclusive os dados de clientes que você cadastra), escreva para{" "}
          <a href={`mailto:${CONTATO}`} className="underline">
            {CONTATO}
          </a>
          . Quando você cadastra dados de terceiros em nome do seu cliente, você também é controlador
          desses dados perante eles — e o Contentplane é apenas a ferramenta de registro.
        </p>
      </Section>

      <Section title="2. Dados coletados">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Da sua conta:</strong> e-mail de acesso, nome de exibição, foto (se houver) e
            o perfil do espaço (nome, agência, moeda, preferências de notificação).
          </li>
          <li>
            <strong>Do seu espaço de trabalho:</strong> clientes, contatos, notas, conteúdo,
            calendário, tarefas, aprovações, solicitações, reuniões, arquivos e lançamentos
            financeiros que você registra.
          </li>
          <li>
            <strong>Técnicos, necessários para o login funcionar:</strong> sessão e token de
            renovação (validade de 30 dias, renováveis), registro das tentativas de verificação de
            código (limite de 10 por hora por e-mail) e, quando a proteção anti-robô está ativa, o
            token do desafio de captcha ligado ao e-mail, guardado por 10 minutos e consumido no
            primeiro uso.
          </li>
        </ul>
        <p>
          Não coletamos documentos, biometria, dados de pagamento ou dados sensíveis. Não há
          rastreamento de terceiros: o único cookie do sistema é funcional, guarda se a barra
          lateral está aberta e não identifica você.
        </p>
      </Section>

      <Section title="3. Para que usamos e com que base legal">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Executar o serviço que você contratou</strong> — manter sua conta, gravar e
            exibir os dados do seu espaço (base legal: execução de contrato, art. 7º, V da LGPD).
          </li>
          <li>
            <strong>Proteger o acesso e o serviço</strong> — código de uso único, captcha,
            limite de tentativas e limpeza de sessões inativas (base legal: legítimo interesse,
            art. 7º, IX).
          </li>
          <li>
            <strong>Comunicações sobre o serviço</strong> — como o e-mail com o código de acesso
            (base legal: execução de contrato). Avisos de manutenção ou novidades dependem do seu
            consentimento, que você pode revogar a qualquer momento.
          </li>
        </ul>
      </Section>

      <Section title="4. Com quem compartilhamos">
        <p>
          Apenas operadores de infraestrutura, o mínimo necessário: a plataforma que hospeda o
          aplicativo e o banco de dados, e — se você ativar a proteção anti-robô — a Cloudflare,
          que valida o desafio do captcha. Não vendemos, alugamos nem exibimos publicidade com
          seus dados, e não compartilhamos com anunciantes.
        </p>
      </Section>

      <Section title="5. Por quanto tempo guardamos">
        <ul className="list-disc space-y-1 pl-5">
          <li>Conteúdo do espaço: enquanto a conta existir — a exclusão é sua, imediata.</li>
          <li>Sessões e tokens de renovação: 30 dias, renovados a cada uso; sessões inativas são removidas automaticamente na limpeza diária.</li>
          <li>Autorizações de captcha: 10 minutos, de uso único.</li>
          <li>Registros de tentativas de código: 1 hora.</li>
        </ul>
        <p>
          Apagou o navegador ou perdeu o acesso? O e-mail de acesso é a chave: entrar novamente
          com o mesmo e-mail devolve exatamente o mesmo espaço de trabalho.
        </p>
      </Section>

      <Section title="6. Seus direitos (art. 18 da LGPD)">
        <p>
          Você pode, a qualquer momento e gratuitamente: confirmar a existência de tratamento;
          acessar e corrigir seus dados (na própria interface); pedir anonimização, bloqueio ou
          eliminação; obter portabilidade; saber com quem compartilhamos; revogar consentimentos.
        </p>
        <p>
          <strong>No produto:</strong> Configurações → Exportar JSON entrega uma cópia de tudo;
          Limpar espaço de trabalho apaga clientes, conteúdos, tarefas, finanças e perfil. Para o
          restante (exclusão da conta, cópias de backup do operador), escreva para{" "}
          <a href={`mailto:${CONTATO}`} className="underline">
            {CONTATO}
          </a>
          .
        </p>
      </Section>

      <Section title="7. Segurança">
        <p>
          Senha não existe: o acesso é por código de uso único de e-mail, com captcha anti-robô e
          limite de tentativas. Sessões expiram sozinhas, tokens de renovação ficam apenas no
          servidor, e cada registro é limitado à conta dona — nenhuma consulta alcança dados de
          outra conta. Nenhum sistema é infalível: mantenha seu backup.
        </p>
      </Section>

      <Section title="8. Alterações">
        <p>
          Este aviso pode ser atualizado. Mudanças relevantes são comunicadas por e-mail ou na
          primeira tela após o login, com a data da nova versão.
        </p>
      </Section>
    </LegalLayout>
  );
}
