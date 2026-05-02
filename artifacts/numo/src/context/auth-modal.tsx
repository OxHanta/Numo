import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { SignIn, SignUp } from "@clerk/react";
import { X } from "lucide-react";

export type AuthMode = "sign-in" | "sign-up" | null;

interface AuthModalCtx {
  open: (mode: "sign-in" | "sign-up") => void;
  close: () => void;
  mode: AuthMode;
}

const AuthModalContext = createContext<AuthModalCtx>({
  open: () => {},
  close: () => {},
  mode: null,
});

export function useAuthModal() {
  return useContext(AuthModalContext);
}

export const clerkAppearance = {
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
    rootBox: "w-full max-w-full overflow-hidden",
    cardBox: "w-full max-w-full !shadow-none !border-0 !bg-transparent overflow-hidden",
    card: "!shadow-none !border-0 !bg-transparent !p-0 w-full max-w-full",
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

interface AuthModalProviderProps {
  children: React.ReactNode;
  basePath: string;
}

export function AuthModalProvider({ children, basePath }: AuthModalProviderProps) {
  const [mode, setMode] = useState<AuthMode>(null);

  const open = useCallback((m: "sign-in" | "sign-up") => setMode(m), []);
  const close = useCallback(() => setMode(null), []);

  useEffect(() => {
    if (!mode) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mode, close]);

  useEffect(() => {
    document.body.style.overflow = mode ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mode]);

  return (
    <AuthModalContext.Provider value={{ open, close, mode }}>
      {children}

      {mode && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={close}
        >
          {/* Glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 60% 40% at 50% 40%, rgba(76,175,80,0.12) 0%, transparent 70%)",
            }}
          />

          <div
            className="relative w-full max-w-[420px] rounded-2xl shadow-2xl"
            style={{
              background: "rgba(14, 22, 13, 0.97)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={close}
              className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full text-white/40 hover:text-white/90 hover:bg-white/10 transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Logo */}
            <div className="flex justify-center pt-7 pb-1">
              <div className="flex items-center gap-2.5">
                <img
                  src={`${basePath}/numo-logo-icon.png`}
                  alt="Numo"
                  className="w-9 h-9 rounded-xl object-contain shadow-lg shadow-green-900/40"
                />
                <div className="flex flex-col leading-none">
                  <span className="font-extrabold text-lg lowercase text-white tracking-tight">numo</span>
                  <span className="text-[9px] font-semibold uppercase tracking-widest text-white/35">
                    Market Intelligence
                  </span>
                </div>
              </div>
            </div>

            {/* Clerk form */}
            <div className="px-7 pb-7 pt-2">
              {mode === "sign-in" ? (
                <SignIn
                  routing="hash"
                  forceRedirectUrl={`${basePath}/dashboard`}
                  appearance={clerkAppearance}
                />
              ) : (
                <SignUp
                  routing="hash"
                  forceRedirectUrl={`${basePath}/onboarding`}
                  appearance={clerkAppearance}
                />
              )}
            </div>

            {/* Switch mode */}
            <div className="border-t border-white/[0.07] py-4 text-center text-sm text-white/40">
              {mode === "sign-in" ? (
                <>
                  Don't have an account?{" "}
                  <button
                    onClick={() => setMode("sign-up")}
                    className="text-[#4CAF50] font-semibold hover:text-[#66BB6A] transition-colors"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => setMode("sign-in")}
                    className="text-[#4CAF50] font-semibold hover:text-[#66BB6A] transition-colors"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </AuthModalContext.Provider>
  );
}
