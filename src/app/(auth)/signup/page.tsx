"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Button } from "@/components/ui/Button";

export default function SignupPage() {
  const { signUpEmail, signInDemo, firebaseReady } = useAuth();
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
      if (!firebaseReady) {
        signInDemo();
        router.replace("/dashboard");
        return;
      }
      await signUpEmail(email, password, fullName);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-up failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-[var(--bg-base)]">
      <div className="w-full max-w-[360px]">
        <div className="mb-8">
          <h1 className="text-xl font-medium tracking-tight">Join CENG</h1>
          <p className="mt-1 text-sm text-secondary">Create an account</p>
        </div>

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
              placeholder="Home or school email from contact list"
            />
            <p className="mt-1 text-[11px] text-tertiary">
              Use your home, school, or @cengclass.org email — all match your CENG profile.
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
          <Button type="submit" className="w-full" loading={loading}>
            {firebaseReady ? "Create account" : "Continue in demo"}
          </Button>
        </form>

        <p className="mt-6 text-sm text-secondary">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--text-primary)] underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
