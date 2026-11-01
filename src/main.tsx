import { Toaster } from "@/components/ui/sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import React, { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import "./index.css";

// Lazy load route components for better code splitting
const Landing = lazy(() => import("./pages/Landing.tsx"));
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
const Portal = lazy(() => import("./portal/Portal.tsx"));
const Workbook = lazy(() => import("./pages/Workbook.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Terms = lazy(() =>
  import("./pages/Legal.tsx").then((m) => ({ default: m.TermsPage })),
);
const Privacy = lazy(() =>
  import("./pages/Legal.tsx").then((m) => ({ default: m.PrivacyPage })),
);

// Simple loading fallback for route transitions
function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Carregando...</div>
    </div>
  );
}

/** Hard guard so runtime errors never leave the preview as a blank page. */
class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string; stack: string }
> {
  state = { hasError: false, message: "", stack: "" };
  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message || "Erro de execução desconhecido",
      stack: error.stack || "",
    };
  }
  componentDidCatch(err: Error) {
    console.error("[Social Media OS] Root crash:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-lg text-center">
            <p className="text-base font-semibold">Algo deu errado nesta tela</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Seus dados continuam salvos. Tente recarregar a página — se persistir, entre
              novamente e, se necessário, restaure o último backup (Configurações → Exportar JSON).
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              Recarregar a página
            </button>
            {/* Detalhe técnico fica escondido: ajuda no suporte sem poluir o usuário. */}
            <details className="mt-6 text-left">
              <summary className="cursor-pointer text-xs text-muted-foreground">
                Detalhe técnico
              </summary>
              <p className="mt-2 text-xs text-muted-foreground break-words">
                {this.state.message}
              </p>
              {this.state.stack && (
                <pre className="mt-2 text-left text-[10px] leading-4 text-muted-foreground/80 max-h-40 overflow-auto rounded border border-border/60 p-2">
                  {this.state.stack}
                </pre>
              )}
            </details>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <ConvexAuthProvider client={convex}>
        <BrowserRouter>
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route
                path="/auth"
                element={<AuthPage redirectAfterAuth="/app/dashboard" />}
              />
              <Route path="/app" element={<NavigateToDashboard />} />
              <Route
                path="/app/:section"
                element={
                  <RequireAuth>
                    <Portal />
                  </RequireAuth>
                }
              />
              <Route
                path="/workbook"
                element={
                  <RequireAuth>
                    <Workbook />
                  </RequireAuth>
                }
              />
              <Route path="/termos" element={<Terms />} />
              <Route path="/privacidade" element={<Privacy />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster />
      </ConvexAuthProvider>
    </RootErrorBoundary>
  </StrictMode>,
);

function NavigateToDashboard() {
  return <Navigate to="/app/dashboard" replace />;
}
