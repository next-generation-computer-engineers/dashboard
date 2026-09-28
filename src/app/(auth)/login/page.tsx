"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import { MEMBERS } from "@/data/seed";
import { displayName } from "@/lib/permissions";

export default function LoginPage() {
  const { signInEmail, signInGoogle, signInDemo, firebaseReady } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInEmail(email, password);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    setError("");
    setLoading(true);
    try {
      await signInGoogle();
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-[var(--bg-base)]">
      <div className="w-full max-w-[360px]">
        <div className="mb-8">
          <div className="mb-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/ceng-logo.jpg"
              alt="CENG"
              width={1024}
              height={411}
              className="h-10 w-auto rounded-sm"
            />
          </div>
          <p className="text-sm text-secondary">Sign in</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-tertiary">Email</label>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="Home or school email"
            />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs text-tertiary">Password</label>
              <Link
                href="/forgot-password"
                className="text-xs text-tertiary hover:text-secondary"
              >
                Forgot?
              </Link>
            </div>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-xs text-[var(--danger)]">{error}</p>}

          <Button
            type="submit"
            className="w-full"
            loading={loading}
            disabled={!firebaseReady}
          >
            Sign in
          </Button>
        </form>

        <Button
          type="button"
          variant="secondary"
          className="mt-2 w-full"
          onClick={onGoogle}
          disabled={!firebaseReady || loading}
        >
          Continue with Google
        </Button>

        {!firebaseReady && (
          <div className="mt-6 border-t border-[var(--border)] pt-5">
            <p className="mb-2 text-xs text-tertiary">Demo mode</p>
            <div className="space-y-0.5">
                {MEMBERS.filter((m) => m.status === "active")
                  .filter((m) =>
                    [
                      "v_om_anand_khaunte",
                      "v_alice_lee",
                      "v_jay_roy",
                      "v_cinty_lin",
                      "v_karthik_yarakaraju",
                    ].includes(m.id)
                  )
                  .map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        signInDemo(m.id);
                        router.replace("/dashboard");
                      }}
                      className="flex w-full items-center justify-between rounded-[var(--radius-sm)] px-2 py-2 text-left text-sm hover:bg-[var(--surface-hover)]"
                    >
                      <span>{displayName(m)}</span>
                      <span className="text-xs text-tertiary">{m.title}</span>
                    </button>
                  ))}
            </div>
          </div>
        )}

        <p className="mt-6 text-sm text-secondary">
          New here?{" "}
          <Link href="/signup" className="text-[var(--text-primary)] underline underline-offset-2">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
