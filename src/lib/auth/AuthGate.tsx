"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";

const AUTH_ROUTES = ["/login", "/signup", "/forgot-password"];

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { member, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  useEffect(() => {
    if (loading) return;

    if (!member && !isAuthRoute) {
      router.replace("/login");
      return;
    }

    if (member && isAuthRoute) {
      router.replace("/dashboard");
    }
  }, [member, loading, isAuthRoute, router]);

  // Never paint login/signup while auth is still resolving — avoids the refresh flash
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-base)]">
        <p className="text-sm text-secondary">Loading…</p>
      </div>
    );
  }

  if (!member && !isAuthRoute) return null;
  if (member && isAuthRoute) return null;

  return <>{children}</>;
}
