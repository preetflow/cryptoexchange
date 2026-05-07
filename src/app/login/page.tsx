"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(email, password);
      toast.success("Login successful!");
      if (data.role === "admin") router.push("/admin");
      else router.push("/dashboard");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: unknown } } };
      const detail = axiosErr?.response?.data?.detail;
      const msg =
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
          ? detail.map((e: { msg: string }) => e.msg).join(" ")
          : "Login failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md" data-testid="login-page">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-foreground font-black text-2xl"
          >
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <ArrowRightLeft className="size-4" />
            </div>
            ChainSwap
          </Link>
        </div>

        <div className="bg-card rounded-2xl p-8 border border-border">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Welcome Back
          </h2>

          {error && (
            <div
              className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm"
              data-testid="login-error"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Email or Username
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-input rounded-xl text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none transition-colors"
                placeholder="Enter email or username"
                required
                data-testid="login-email-input"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-input rounded-xl text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none transition-colors pr-10"
                  placeholder="Enter password"
                  required
                  data-testid="login-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPass ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-full hover:opacity-90 transition-colors disabled:opacity-50"
              data-testid="login-submit-btn"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="text-center text-muted-foreground text-sm mt-6">
            <Link
              href="/forgot-password"
              className="text-brand hover:underline"
              data-testid="forgot-password-link"
            >
              Forgot password?
            </Link>
            <span className="mx-2">|</span>
            New here?{" "}
            <Link
              href="/register"
              className="text-brand hover:underline"
              data-testid="login-register-link"
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
