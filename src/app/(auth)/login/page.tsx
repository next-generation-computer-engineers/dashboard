"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authErrorMessage, useAuth } from "@/lib/auth/AuthProvider";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const { signInEmail, signInGoogle, firebaseReady } = useAuth();
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
      setError(authErrorMessage(err));
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
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-[var(--bg-base)]">
      <div className="w-full max-w-[360px]">
        <div className="mb-8 text-center">
          <div className="mb-5 flex justify-center overflow-visible">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/ceng-logo-light.png"
              alt="CENG"
              width={1024}
              height={410}
              className="hidden h-16 w-auto object-contain [[data-theme=light]_&]:block"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/ceng-logo-dark.png"
              alt="CENG"
              width={1024}
              height={410}
              className="block h-16 w-auto object-contain [[data-theme=light]_&]:hidden"
            />
          </div>
          <p className="text-sm text-secondary">
            Sign in to the volunteer dashboard
          </p>
        </div>

        {!firebaseReady && (
          <p className="mb-4 rounded-[var(--radius-sm)] border border-[var(--danger)]/30 bg-[var(--danger)]/5 px-3 py-2 text-xs text-[var(--danger)]">
            Firebase isn’t configured on this deploy. Add{" "}
            <code className="text-[10px]">NEXT_PUBLIC_FIREBASE_*</code> env vars
            in Vercel and redeploy.
          </p>
        )}

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
              placeholder="Home, school, or @cengclass.org"
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

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--border)]" />
          <span className="text-[11px] text-tertiary">or</span>
          <div className="h-px flex-1 bg-[var(--border)]" />
        </div>

        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={onGoogle}
          disabled={!firebaseReady || loading}
        >
          Continue with Google
        </Button>

        <p className="mt-6 text-sm text-secondary">
          New here?{" "}
          <Link
            href="/signup"
            className="text-[var(--text-primary)] underline underline-offset-2"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
