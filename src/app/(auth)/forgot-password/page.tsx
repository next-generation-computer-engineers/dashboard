"use client";

import Link from "next/link";
import { useState } from "react";
import { authErrorMessage, useAuth } from "@/lib/auth/AuthProvider";
import { Button } from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const { resetPassword, firebaseReady } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
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
          <h1 className="text-xl font-medium tracking-tight">Reset password</h1>
          <p className="mt-1 text-sm text-secondary">
            We&apos;ll email you a reset link
          </p>
        </div>

        {!firebaseReady && (
          <p className="mb-4 text-xs text-[var(--danger)]">
            Firebase isn’t configured on this deploy.
          </p>
        )}

        {sent ? (
          <div>
            <p className="text-sm text-secondary">
              If an account exists for that email, a reset link is on the way.
            </p>
            <Link href="/login">
              <Button variant="secondary" className="mt-5 w-full">
                Back to sign in
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-tertiary">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@email.com"
              />
            </div>
            {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
            <Button
              type="submit"
              className="w-full"
              loading={loading}
              disabled={!firebaseReady}
            >
              Send reset link
            </Button>
          </form>
        )}

        <p className="mt-6 text-sm text-secondary">
          <Link href="/login" className="underline underline-offset-2">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
