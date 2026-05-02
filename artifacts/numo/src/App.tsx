import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { ClerkProvider, Show, useClerk } from "@clerk/react";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { CurrencyProvider } from "@/context/currency";
import { AuthModalProvider, clerkAppearance } from "@/context/auth-modal";

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
          <AuthModalProvider basePath={basePath}>
            <ClerkQueryClientCacheInvalidator />
            <Switch>
              <Route path="/" component={HomeRedirect} />
              {/* Redirect legacy route paths to home — modal handles auth */}
              <Route path="/sign-in/*?">
                <Redirect to="/" />
              </Route>
              <Route path="/sign-up/*?">
                <Redirect to="/" />
              </Route>
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
          </AuthModalProvider>
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
