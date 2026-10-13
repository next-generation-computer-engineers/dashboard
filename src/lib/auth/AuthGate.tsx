"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { needsOnboardingGate } from "@/lib/onboarding/gate";

const AUTH_ROUTES = ["/login", "/signup", "/forgot-password"];
const ONBOARDING_PREFIX = "/onboarding";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { member, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));
  const isOnboardingRoute = pathname.startsWith(ONBOARDING_PREFIX);

  useEffect(() => {
    if (loading) return;

    if (!member && !isAuthRoute) {
      router.replace("/login");
      return;
    }

    if (member && isAuthRoute) {
      router.replace(
        needsOnboardingGate(member) ? "/onboarding" : "/dashboard"
      );
      return;
    }

    if (member && needsOnboardingGate(member) && !isOnboardingRoute) {
      router.replace("/onboarding");
      return;
    }

    if (member && !needsOnboardingGate(member) && isOnboardingRoute) {
      router.replace("/dashboard");
    }
  }, [member, loading, isAuthRoute, isOnboardingRoute, pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-base)]">
        <p className="text-sm text-secondary">Loading…</p>
      </div>
    );
  }

  if (!member && !isAuthRoute) return null;
  if (member && isAuthRoute) return null;
  if (member && needsOnboardingGate(member) && !isOnboardingRoute) return null;
  if (member && !needsOnboardingGate(member) && isOnboardingRoute) return null;

  return <>{children}</>;
}
