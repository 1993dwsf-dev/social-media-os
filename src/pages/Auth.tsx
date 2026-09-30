import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Turnstile } from "@marsidev/react-turnstile";
import { useAction, useQuery } from "convex/react";
import logo from "@/assets/logo.svg";
import { ArrowRight, Loader2, Mail, ShieldAlert, UserX } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

interface AuthProps {
  redirectAfterAuth?: string;
}

/** Site key do widget (aba Keys). Sem ela, o widget não é renderizado. */
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as
  | string
  | undefined;

function resolveRedirectAfterAuth(
  returnTo: string | null,
  fallback = "/dashboard",
) {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

/**
 * Erros de mutation/action chegam embrulhados pelo runtime do Convex; quando o
 * servidor manda um `ConvexError` com texto em pt-BR, ele aparece em `data`.
 */
function authErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { data?: unknown } | null)?.data;
  if (typeof data === "string" && data.trim()) return data;
  return fallback;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth,
  );
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Anti-robô (Cloudflare Turnstile). O site key manda no widget; o servidor
  // decide se exige o token, e avisamos quando as duas pontas divergirem.
  const captchaEnabled = Boolean(TURNSTILE_SITE_KEY);
  const turnstileStatus = useQuery(api.turnstile.getTurnstileStatus);
  const verifyTurnstile = useAction(api.turnstile.verifyTurnstile);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileNonce, setTurnstileNonce] = useState(0);

  const resetTurnstile = () => {
    setTurnstileToken("");
    setTurnstileNonce((nonce) => nonce + 1);
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      const email = String(formData.get("email") ?? "");

      if (captchaEnabled) {
        if (!turnstileToken) {
          setError("Resolva a verificação de segurança antes de continuar.");
          setIsLoading(false);
          return;
        }
        // O token é de uso único: validamos aqui para liberar o envio do código.
        const verification = await verifyTurnstile({
          email,
          token: turnstileToken,
        });
        if (!verification.ok) {
          setError(verification.message);
          resetTurnstile();
          setIsLoading(false);
          return;
        }
      }

      await signIn("email-otp", formData);
      setStep({ email });
      setIsLoading(false);
    } catch (error) {
      console.error("Erro ao entrar com e-mail:", error);
      setError(
        authErrorMessage(
          error,
          "Não foi possível enviar o código de verificação. Tente novamente.",
        ),
      );
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      navigate(redirect);
    } catch (error) {
      console.error("Erro na verificação do código:", error);

      setError("O código de verificação informado está incorreto.");
      setIsLoading(false);

      setOtp("");
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (captchaEnabled && !turnstileToken) {
        setError("Resolva a verificação de segurança antes de continuar.");
        setIsLoading(false);
        return;
      }
      await signIn("anonymous", { turnstileToken });
      navigate(redirect);
    } catch (error) {
      console.error("Erro ao entrar como visitante:", error);
      setError(
        authErrorMessage(
          error,
          "Não foi possível entrar como visitante. Tente novamente.",
        ),
      );
      resetTurnstile();
      setIsLoading(false);
    }
  };

  /** Volta ao primeiro passo com um widget novo (o token anterior já foi usado). */
  const backToSignIn = () => {
    setStep("signIn");
    setOtp("");
    setError(null);
    resetTurnstile();
  };

  const captchaPending = captchaEnabled && !turnstileToken;

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Textura de marca, a mesma da landing page. */}
      <div className="grid-paper pointer-events-none absolute inset-0" />

      {/* Conteúdo de autenticação */}
      <div className="relative flex-1 flex items-center justify-center">
        <div className="flex items-center justify-center h-full flex-col">
        <Card className="min-w-[350px] pb-0 border shadow-md">
          {step === "signIn" ? (
            <>
              <CardHeader className="text-center">
              <div className="flex justify-center">
                    <img
                      src={logo}
                      alt="Logotipo"
                      width={64}
                      height={64}
                      className="rounded-lg mb-4 mt-4 cursor-pointer"
                      onClick={() => navigate("/")}
                    />
                  </div>
                <CardTitle className="text-xl">Comece agora</CardTitle>
                <CardDescription>
                  Informe seu e-mail para entrar ou criar uma conta
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleEmailSubmit}>
                <CardContent>
                  
                  <div className="relative flex items-center gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        name="email"
                        placeholder="nome@exemplo.com"
                        type="email"
                        className="pl-9"
                        disabled={isLoading}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="outline"
                      size="icon"
                      disabled={isLoading || captchaPending}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {error && (
                    <p className="mt-2 text-sm text-red-500">{error}</p>
                  )}

                  {captchaEnabled && (
                    <div className="mt-4 w-full">
                      <Turnstile
                        key={turnstileNonce}
                        siteKey={TURNSTILE_SITE_KEY as string}
                        onSuccess={(token) => {
                          setTurnstileToken(token);
                          setError(null);
                        }}
                        onExpire={() => setTurnstileToken("")}
                        onError={() => {
                          setTurnstileToken("");
                          setError(
                            "Não foi possível carregar a verificação de segurança. Recarregue a página.",
                          );
                        }}
                        options={{
                          theme: "light",
                          language: "pt-BR",
                          size: "flexible",
                        }}
                      />
                      {captchaPending && (
                        <p className="mt-2 text-xs text-muted-foreground text-center">
                          Resolva a verificação acima para liberar o acesso.
                        </p>
                      )}
                    </div>
                  )}

                  {turnstileStatus?.enforced && !captchaEnabled && (
                    <div className="mt-4 flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-700">
                      <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>
                        A verificação anti-robô está ativa no servidor, mas o
                        widget não foi configurado nesta instalação
                        (VITE_TURNSTILE_SITE_KEY). O envio do código vai falhar
                        até a chave ser adicionada.
                      </span>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          ou
                        </span>
                      </div>
                    </div>
                    
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full mt-4"
                      onClick={handleGuestLogin}
                      disabled={isLoading || captchaPending}
                    >
                      <UserX className="mr-2 h-4 w-4" />
                      Continuar como visitante
                    </Button>
                  </div>
                </CardContent>
              </form>
            </>
          ) : (
            <>
              <CardHeader className="text-center mt-4">
                <CardTitle>Confira seu e-mail</CardTitle>
                <CardDescription>
                  Enviamos um código para {step.email}
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleOtpSubmit}>
                <CardContent className="pb-4">
                  <input type="hidden" name="email" value={step.email} />
                  <input type="hidden" name="code" value={otp} />

                  <div className="flex justify-center">
                    <InputOTP
                      value={otp}
                      onChange={setOtp}
                      maxLength={6}
                      disabled={isLoading}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && otp.length === 6 && !isLoading) {
                          // Find the closest form and submit it
                          const form = (e.target as HTMLElement).closest("form");
                          if (form) {
                            form.requestSubmit();
                          }
                        }
                      }}
                    >
                      <InputOTPGroup>
                        {Array.from({ length: 6 }).map((_, index) => (
                          <InputOTPSlot key={index} index={index} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  {error && (
                    <p className="mt-2 text-sm text-red-500 text-center">
                      {error}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground text-center mt-4">
                    Não recebeu o código?{" "}
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={backToSignIn}
                    >
                      Tentar novamente
                    </Button>
                  </p>
                </CardContent>
                <CardFooter className="flex-col gap-2">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || otp.length !== 6}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        Verificar código
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={backToSignIn}
                    disabled={isLoading}
                    className="w-full"
                  >
                    Usar outro e-mail
                  </Button>
                </CardFooter>
              </form>
            </>
          )}

          <div className="py-4 px-6 text-xs text-center text-muted-foreground bg-muted border-t rounded-b-lg">
            Protegido por{" "}
            <a
              href="https://freebuff.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary transition-colors"
            >
              freebuff.com
            </a>
          </div>
        </Card>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}
