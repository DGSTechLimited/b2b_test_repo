"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (!errorParam) {
      return;
    }
    if (errorParam === "dealer_inactive") {
      setError("Your dealer account is inactive. Contact your administrator.");
      return;
    }
    if (errorParam === "dealer_suspended") {
      setError("Your dealer account is suspended. Contact your administrator.");
      return;
    }
    setError("Unable to sign in. Please try again.");
  }, [searchParams]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false
    });

    setLoading(false);
    if (result?.error) {
      setError("Invalid credentials.");
      return;
    }

    router.push("/");
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[1.7fr_1fr]">
      <div className="relative hidden lg:flex overflow-hidden">
        <div className="absolute inset-0 bg-[url('/assets/login-hero.webp')] bg-cover bg-center saturate-75" />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#0b4395]/80 via-[#0b4395]/55 to-transparent" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(transparent_0%,rgba(255,255,255,0.06)_50%,transparent_100%)]" />
        <div className="relative z-10 flex h-full flex-col justify-between px-12 py-14 text-white">
          <div className="space-y-10">
            <div className="space-y-3">
              <div className="inline-flex items-center rounded-lg border border-white/25 bg-slate-50/90 px-4 py-2">
                <Image
                  src="/brand/client-logo.svg"
                  alt="Client logo"
                  width={64}
                  height={64}
                  className="h-16 w-auto object-contain"
                />
              </div>
            </div>
            <div className="space-y-5">
              <h1 className="text-4xl font-semibold leading-[1.15] tracking-[-0.02em] text-white">
                Precision parts sourcing for modern dealerships.
              </h1>
              <p className="max-w-lg text-base font-normal leading-relaxed text-slate-200">
                Secure access to catalog feeds, supersession mapping, and order tracking.
              </p>
            </div>
            <div className="space-y-5">
              <div className="flex w-full max-w-sm items-start gap-3 rounded-2xl bg-white/10 px-4 py-2.5 backdrop-blur">
                <CheckCircle2 className="mt-1 h-5 w-5 text-white" />
                <div>
                  <p className="text-sm font-semibold text-white">Live parts catalog</p>
                  <p className="text-xs leading-snug text-white/75">Search OEM, supplier, and availability in one view.</p>
                </div>
              </div>
              <div className="flex w-full max-w-sm items-start gap-3 rounded-2xl bg-white/10 px-4 py-2.5 backdrop-blur">
                <CheckCircle2 className="mt-1 h-5 w-5 text-white" />
                <div>
                  <p className="text-sm font-semibold text-white">Supersession intelligence</p>
                  <p className="text-xs leading-snug text-white/75">Stay aligned with approved replacement parts.</p>
                </div>
              </div>
              <div className="flex w-full max-w-sm items-start gap-3 rounded-2xl bg-white/10 px-4 py-2.5 backdrop-blur">
                <CheckCircle2 className="mt-1 h-5 w-5 text-white" />
                <div>
                  <p className="text-sm font-semibold text-white">Order tracking</p>
                  <p className="text-xs leading-snug text-white/75">Monitor fulfillment status with clarity.</p>
                </div>
              </div>
            </div>
          </div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/55">
            Trusted by dealer operations teams.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center bg-surface-50 px-6 py-12">
        <div className="w-full max-w-sm rounded-3xl border border-surface-200 bg-white px-8 py-10 shadow-card">
          <div className="mb-6 space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
              Welcome back
            </p>
            <h2 className="text-3xl font-semibold text-brand-950">Sign in</h2>
            <p className="text-sm font-normal leading-relaxed text-brand-700">
              Sign in to access your dealer account
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-brand-700">Email</label>
              <Input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-brand-700">Password</label>
              <Input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12"
              />
            </div>
            {error ? <p className="text-sm text-status-error">{error}</p> : null}
            <Button
              type="submit"
              variant="accent"
              className="h-12 w-full bg-gradient-to-r from-accent-600 to-accent-500 text-base transition hover:brightness-110"
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sign in
            </Button>
          </form>
          <div className="mt-6 space-y-2 text-xs text-brand-700">
            <p>Need access? Contact your administrator.</p>
            <p className="text-brand-600">© Hotbray</p>
          </div>
        </div>
      </div>
    </div>
  );
}
