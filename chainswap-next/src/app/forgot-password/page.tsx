"use client";

import React, { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import axios from "axios";
import { ArrowRightLeft, CheckCircle } from "lucide-react";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/api/auth/forgot-password`, { email });
      setSent(true);
      toast.success("Reset link sent! Check your email.");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      toast.error(axiosErr?.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md" data-testid="forgot-password-page">
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
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Forgot Password
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Enter your email and we&apos;ll send you a reset link.
          </p>

          {sent ? (
            <div className="text-center" data-testid="reset-sent-confirmation">
              <div className="size-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="size-8 text-success" />
              </div>
              <p className="text-foreground font-medium mb-2">
                Reset Link Sent!
              </p>
              <p className="text-muted-foreground text-sm mb-4">
                Check your email for the password reset link.
              </p>
              <Link
                href="/login"
                className="text-brand hover:underline text-sm"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-input rounded-xl text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none transition-colors"
                  placeholder="Enter your email"
                  required
                  data-testid="forgot-password-email-input"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-full hover:opacity-90 transition-colors disabled:opacity-50"
                data-testid="forgot-password-submit-btn"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
              <p className="text-center text-muted-foreground text-sm">
                Remember your password?{" "}
                <Link href="/login" className="text-brand hover:underline">
                  Login
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
