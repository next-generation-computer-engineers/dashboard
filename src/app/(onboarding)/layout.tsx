"use client";

import { LogOut } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { useAuth } from "@/lib/auth/AuthProvider";
import { displayName } from "@/lib/permissions";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { member, signOut } = useAuth();
  const name = member ? displayName(member) : "";

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <header className="flex h-14 items-center justify-between border-b border-[var(--border)] px-4 md:px-6">
        <BrandLogo height={28} />
        <div className="flex items-center gap-3">
          {name && (
            <span className="hidden text-[13px] text-secondary sm:inline">
              {name}
            </span>
          )}
          <button
            type="button"
            onClick={() => void signOut()}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-[13px] text-secondary hover:bg-[var(--surface-hover)]"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl px-4 py-8 md:px-6">
        {children}
      </main>
    </div>
  );
}
