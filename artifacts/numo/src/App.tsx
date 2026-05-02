import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { CurrencyProvider } from "@/context/currency";

import Landing from "./pages/landing";
import Dashboard from "./pages/dashboard";
import Watchlist from "./pages/watchlist";
import Portfolio from "./pages/portfolio";
import Alerts from "./pages/alerts";
import AssetDetail from "./pages/asset-detail";
import News from "./pages/news";
import NotFound from "./pages/not-found";
import Onboarding from "./pages/onboarding";

const queryClient = new QueryClient();

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL || undefined;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  cssLayerName: "clerk",
  variables: {
    colorPrimary: "#4CAF50",
    colorBackground: "#111a10",
    colorInputBackground: "#1c2e1a",
    colorInputText: "#f0f4f0",
    colorText: "#f0f4f0",
    colorTextSecondary: "#8aA087",
    colorDanger: "#f87171",
    colorSuccess: "#4CAF50",
    colorNeutral: "#73796F",
    fontFamily: "'Work Sans', sans-serif",
    borderRadius: "0.625rem",
    fontSize: "15px",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full !shadow-none !border-0 !bg-transparent",
    card: "!shadow-none !border-0 !bg-transparent !p-0",
    footer: "!shadow-none !border-0 !bg-transparent",
    header: "!text-center !mb-6",
    headerTitle: "!text-white !font-bold !text-2xl !tracking-tight",
    headerSubtitle: "!text-white/50 !text-sm !mt-1",
    logoBox: "!hidden",
    socialButtonsBlockButton:
      "!bg-white/5 !border !border-white/10 hover:!bg-white/10 !text-white !rounded-lg !h-11",
    socialButtonsBlockButtonText: "!text-white !font-medium !text-sm",
    socialButtonsBlockButtonArrow: "!text-white/50",
    dividerRow: "!my-5",
    dividerText: "!text-white/30 !text-xs !uppercase !tracking-widest",
    dividerLine: "!bg-white/10",
    formFieldLabel: "!text-white/70 !font-medium !text-sm !mb-1",
    formFieldInput:
      "!bg-white/5 !border !border-white/10 !text-white placeholder:!text-white/20 focus:!border-[#4CAF50] focus:!ring-0 !rounded-lg !h-11",
    formButtonPrimary:
      "!bg-[#4CAF50] hover:!bg-[#43A047] active:!bg-[#388E3C] !text-white !font-semibold !rounded-lg !h-11 !mt-2 !shadow-lg !shadow-green-900/30",
    footerActionLink: "!text-[#4CAF50] hover:!text-[#66BB6A] !font-semibold",
    footerActionText: "!text-white/40 !text-sm",
    footerAction: "!mt-5 !text-center !text-sm",
    identityPreviewText: "!text-white",
    identityPreviewEditButton: "!text-[#4CAF50]",
    formFieldSuccessText: "!text-[#4CAF50]",
    formFieldErrorText: "!text-red-400",
    alertText: "!text-white",
    alert: "!bg-red-500/10 !border !border-red-500/30 !rounded-lg",
    otpCodeFieldInput:
      "!bg-white/5 !border !border-white/10 !text-white !rounded-lg",
    formFieldRow: "!mb-4",
    main: "!p-0",
  },
};

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ background: "#0b1509" }}>
      {/* Subtle radial glow from top */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 40% at 50% -5%, rgba(76,175,80,0.18) 0%, transparent 70%)",
        }}
      />
      {/* Logo header */}
      <header className="relative z-10 flex justify-center pt-10 pb-2">
        <a href={basePath || "/"} className="flex items-center gap-3 group">
          <img
            src="/numo-logo-icon.png"
            alt="Numo"
            className="w-11 h-11 rounded-2xl object-contain shadow-lg shadow-green-900/40"
          />
          <div className="flex flex-col leading-none">
            <span className="font-extrabold text-xl lowercase text-white tracking-tight">
              numo
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-widest text-white/35">
              Market Intelligence
            </span>
          </div>
        </a>
      </header>

      {/* Card */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div
          className="w-full max-w-[420px] rounded-2xl p-8 shadow-2xl"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)",
          }}
        >
          {children}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 pb-8 text-center text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
        © {new Date().getFullYear()} Numo Market Intelligence
      </footer>
    </div>
  );
}

function SignInPage() {
  return (
    <AuthLayout>
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </AuthLayout>
  );
}

function SignUpPage() {
  return (
    <AuthLayout>
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </AuthLayout>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function HomeRedirect() {
  const onboardingDone = localStorage.getItem("numo_onboarding_done");
  return (
    <>
      <Show when="signed-in">
        <Redirect to={onboardingDone ? "/dashboard" : "/onboarding"} />
      </Show>
      <Show when="signed-out">
        <Landing />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <>
      <Show when="signed-in">
        <Layout>
          <Component />
        </Layout>
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: "Welcome to Numo", subtitle: "Sign in to access your cockpit" } },
        signUp: { start: { title: "Join Numo", subtitle: "Start tracking with precision" } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <CurrencyProvider>
        <ClerkQueryClientCacheInvalidator />
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route path="/onboarding">
            <Show when="signed-in">
              <Onboarding />
            </Show>
            <Show when="signed-out">
              <Redirect to="/" />
            </Show>
          </Route>
          <Route path="/dashboard">
            <ProtectedRoute component={Dashboard} />
          </Route>
          <Route path="/watchlist">
            <ProtectedRoute component={Watchlist} />
          </Route>
          <Route path="/portfolio">
            <ProtectedRoute component={Portfolio} />
          </Route>
          <Route path="/alerts">
            <ProtectedRoute component={Alerts} />
          </Route>
          <Route path="/assets/:ticker">
            <ProtectedRoute component={AssetDetail} />
          </Route>
          <Route path="/news">
            <ProtectedRoute component={News} />
          </Route>
          <Route component={NotFound} />
        </Switch>
        </CurrencyProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <TooltipProvider>
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
