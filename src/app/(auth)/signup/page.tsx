"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authErrorMessage, useAuth } from "@/lib/auth/AuthProvider";
import { Button } from "@/components/ui/Button";

export default function SignupPage() {
  const { signUpEmail, signInGoogle, firebaseReady } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signUpEmail(email, password, fullName);
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
        <div className="mb-8">
          <div className="mb-4 overflow-visible">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/ceng-logo-light.png"
              alt="CENG"
              width={1024}
              height={410}
              className="hidden h-11 w-auto object-contain object-left [[data-theme=light]_&]:block"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/ceng-logo-dark.png"
              alt="CENG"
              width={1024}
              height={410}
              className="block h-11 w-auto object-contain object-left [[data-theme=light]_&]:hidden"
            />
          </div>
          <h1 className="text-xl font-medium tracking-tight">Join CENG</h1>
          <p className="mt-1 text-sm text-secondary">
            Create an account with your volunteer email
          </p>
        </div>

        {!firebaseReady && (
          <p className="mb-4 rounded-[var(--radius-sm)] border border-[var(--danger)]/30 bg-[var(--danger)]/5 px-3 py-2 text-xs text-[var(--danger)]">
            Firebase isn’t configured on this deploy. Add env vars in Vercel and
            redeploy.
          </p>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-tertiary">Full name</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input-field"
              placeholder="Alex Rivera"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-tertiary">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="Home, school, or @cengclass.org"
            />
            <p className="mt-1 text-[11px] text-tertiary">
              Must match the CENG contact list so your profile loads
              automatically.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-xs text-tertiary">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="At least 8 characters"
            />
          </div>
          {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
          <Button
            type="submit"
            className="w-full"
            loading={loading}
            disabled={!firebaseReady}
          >
            Create account
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
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-[var(--text-primary)] underline underline-offset-2"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
