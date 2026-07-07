import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useAuth } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "@/lib/queryClient";
import Landing from "@/pages/landing";
import Wardrobe from "@/pages/wardrobe";
import Analyze from "@/pages/analyze";
import Stats from "@/pages/stats";
import Outfits from "@/pages/outfits";
import Pricing from "@/pages/pricing";
import NotFound from "@/pages/not-found";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

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
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#C17A55",
    colorForeground: "#2C1A0E",
    colorMutedForeground: "#8B7B6F",
    colorDanger: "#DC2626",
    colorBackground: "#FAF7F4",
    colorInput: "#EEE8E0",
    colorInputForeground: "#2C1A0E",
    colorNeutral: "#C4B5AB",
    fontFamily: "'Playfair Display', Georgia, serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#FAF7F4] rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl shadow-stone-200/60",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-[#2C1A0E] font-serif",
    headerSubtitle: "text-[#8B7B6F]",
    socialButtonsBlockButtonText: "text-[#2C1A0E]",
    formFieldLabel: "text-[#2C1A0E]",
    footerActionLink: "text-[#C17A55] hover:text-[#a5633d]",
    footerActionText: "text-[#8B7B6F]",
    dividerText: "text-[#8B7B6F]",
    identityPreviewEditButton: "text-[#C17A55]",
    formFieldSuccessText: "text-emerald-700",
    alertText: "text-[#2C1A0E]",
    logoBox: "flex justify-center",
    logoImage: "h-10 w-10",
    socialButtonsBlockButton: "border-[#C4B5AB] bg-white hover:bg-[#F5EFE8]",
    formButtonPrimary: "bg-[#C17A55] hover:bg-[#a5633d] text-white",
    formFieldInput: "bg-[#EEE8E0] border-[#C4B5AB] text-[#2C1A0E]",
    footerAction: "bg-transparent",
    dividerLine: "bg-[#C4B5AB]",
    alert: "border-[#C4B5AB]",
    otpCodeFieldInput: "bg-[#EEE8E0] border-[#C4B5AB]",
    formFieldRow: "",
    main: "",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        forceRedirectUrl={`${basePath}/wardrobe`}
      />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        forceRedirectUrl={`${basePath}/wardrobe`}
      />
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/wardrobe" />
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
        <Component />
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function ClerkAuthTokenSetup() {
  const { getToken } = useAuth();
  useEffect(() => {
    if (!import.meta.env.VITE_API_BASE_URL) return;
    setAuthTokenGetter(() => getToken());
    return () => setAuthTokenGetter(null);
  }, [getToken]);
  return null;
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
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to your wardrobe",
          },
        },
        signUp: {
          start: {
            title: "Create your wardrobe",
            subtitle: "Start building your digital closet",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ClerkAuthTokenSetup />
          <ClerkQueryClientCacheInvalidator />
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/wardrobe">
              {() => <ProtectedRoute component={Wardrobe} />}
            </Route>
            <Route path="/analyze">
              {() => <ProtectedRoute component={Analyze} />}
            </Route>
            <Route path="/outfits">
              {() => <ProtectedRoute component={Outfits} />}
            </Route>
            <Route path="/stats">
              {() => <ProtectedRoute component={Stats} />}
            </Route>
            <Route path="/pricing" component={Pricing} />
            <Route component={NotFound} />
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
