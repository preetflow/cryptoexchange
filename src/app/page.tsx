"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  Shield,
  Zap,
  Globe,
  ChevronRight,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  Users,
  Lock,
  Star,
} from "lucide-react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "";

interface Stats { total_offers: number; total_volume_inr: number; payment_methods: number; }
interface Trader { rank: number; username: string; is_verified_trader: boolean; completion_rate: number; completed_trades: number; volume_usdt: number; }

const DEMO_STATS: Stats = { total_offers: 1240, total_volume_inr: 48500000, payment_methods: 12 };
const DEMO_TRADERS: Trader[] = [
  { rank: 1, username: "cryptoking", is_verified_trader: true, completion_rate: 99, completed_trades: 3420, volume_usdt: 980000 },
  { rank: 2, username: "usdtpro", is_verified_trader: true, completion_rate: 98, completed_trades: 2180, volume_usdt: 640000 },
  { rank: 3, username: "tradervault", is_verified_trader: true, completion_rate: 97, completed_trades: 1760, volume_usdt: 510000 },
  { rank: 4, username: "swiftexchange", is_verified_trader: false, completion_rate: 96, completed_trades: 890, volume_usdt: 220000 },
  { rank: 5, username: "blockdealer", is_verified_trader: false, completion_rate: 95, completed_trades: 654, volume_usdt: 180000 },
];

export default function HomePage() {
  const [stats, setStats] = useState<Stats>(DEMO_STATS);
  const [topTraders, setTopTraders] = useState<Trader[]>(DEMO_TRADERS);

  useEffect(() => {
    axios.get(`${API}/api/stats`).then((r) => setStats(r.data)).catch(() => {});
    axios.get(`${API}/api/top-traders?days=90&limit=5`).then((r) => setTopTraders(r.data)).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative px-4 pt-20 pb-28 overflow-hidden">
        {/* Background accent — teal shimmer */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-primary/8 blur-[120px]" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/25 bg-primary/8 text-primary text-xs font-semibold tracking-wide mb-8">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            Non-custodial · Zero counterparty risk
          </div>

          <h1 className="font-black text-5xl sm:text-6xl lg:text-[72px] leading-[1.05] tracking-tight mb-6 text-balance">
            The fastest way to<br />
            <span className="text-primary">buy &amp; sell USDT</span>
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-10">
            Trade USDT peer-to-peer with verified traders. 12+ payment methods, escrow-protected, instant settlement. No middlemen, no delays.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-14">
            <Link
              href="/register"
              className="flex items-center gap-2 px-7 py-3.5 bg-primary text-primary-foreground font-bold text-sm rounded-lg hover:opacity-90 transition-opacity glow-teal"
              data-testid="start-trading-btn"
            >
              Start Trading Free <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/buy"
              className="flex items-center gap-2 px-7 py-3.5 border border-border text-foreground font-semibold text-sm rounded-lg hover:bg-surface transition-colors"
            >
              Browse Offers
            </Link>
          </div>

          {/* Trust bar */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            {[
              { icon: Shield, text: "Escrow protected" },
              { icon: Zap, text: "Under 5 min settlement" },
              { icon: Globe, text: "12+ payment methods" },
              { icon: Lock, text: "Non-custodial" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5">
                <Icon className="size-4 text-primary" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats bar ───────────────────────────────── */}
      <section className="border-y border-border bg-card">
        <div className="max-w-5xl mx-auto grid grid-cols-3 divide-x divide-border">
          {[
            { label: "Active Offers", value: `${stats.total_offers.toLocaleString()}+`, color: "text-foreground" },
            { label: "Volume Traded", value: `₹${(stats.total_volume_inr / 1000000).toFixed(1)}M+`, color: "text-primary" },
            { label: "Payment Methods", value: `${stats.payment_methods}+`, color: "text-foreground" },
          ].map((s) => (
            <div key={s.label} className="py-10 text-center">
              <p className={`font-stat text-3xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Trade USDT CTA row ──────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-16 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-xl text-foreground">Trade USDT Now</h2>
            <p className="text-muted-foreground text-sm mt-0.5">Select your direction</p>
          </div>
          <Link href="/buy" className="text-sm text-primary font-medium flex items-center gap-1 hover:opacity-80">
            View all offers <ChevronRight className="size-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Buy card */}
          <Link href="/buy" className="group relative overflow-hidden bg-card border border-border rounded-xl p-6 hover:border-primary/30 transition-colors">
            <div className="absolute inset-0 bg-primary/3 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-10 rounded-lg bg-primary/15 flex items-center justify-center">
                  <TrendingUp className="size-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-foreground">Buy USDT</p>
                  <p className="text-xs text-muted-foreground">Pay INR, receive USDT</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Browse verified sellers offering competitive rates. Pay via UPI, IMPS, bank transfer &amp; more.</p>
              <div className="flex items-center gap-1.5 text-primary text-sm font-semibold">
                Browse buy offers <ArrowRight className="size-4" />
              </div>
            </div>
          </Link>

          {/* Sell card */}
          <Link href="/sell" className="group relative overflow-hidden bg-card border border-border rounded-xl p-6 hover:border-success/30 transition-colors">
            <div className="absolute inset-0 bg-success/3 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-10 rounded-lg bg-success/15 flex items-center justify-center">
                  <TrendingUp className="size-5 text-success rotate-180" />
                </div>
                <div>
                  <p className="font-bold text-foreground">Sell USDT</p>
                  <p className="text-xs text-muted-foreground">Send USDT, receive INR</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Find buyers at the best rates. Get INR instantly via your preferred payment method.</p>
              <div className="flex items-center gap-1.5 text-success text-sm font-semibold">
                Browse sell offers <ArrowRight className="size-4" />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ── Supported Networks ──────────────────────── */}
      <section className="border-t border-border bg-card/50">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="font-bold text-xl text-foreground mb-6">Supported Networks</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { name: "Tron Network", short: "TRC-20", color: "#FF0013", fee: "Near-zero fees", speed: "~3 sec" },
              { name: "Ethereum", short: "ERC-20", color: "#627EEA", fee: "Standard gas", speed: "~15 sec" },
              { name: "BNB Chain", short: "BEP-20", color: "#F3BA2F", fee: "Low fees", speed: "~5 sec" },
            ].map((net) => (
              <div key={net.short} className="bg-card border border-border rounded-xl p-5 flex items-start gap-4">
                <div className="size-10 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs" style={{ backgroundColor: net.color + "22", color: net.color }}>
                  {net.short}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{net.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{net.fee} &middot; {net.speed}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-16 w-full">
        <div className="text-center mb-12">
          <h2 className="font-black text-3xl text-foreground mb-3">How ChainSwap Works</h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed">Simple, transparent, and secure. Trade USDT in minutes — no KYC required for basic trades.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { step: "01", title: "Create Account", desc: "Sign up in 30 seconds. No complex verification required." },
            { step: "02", title: "Find an Offer", desc: "Browse buy or sell offers filtered by payment method and price." },
            { step: "03", title: "Initiate Trade", desc: "Click trade, chat with the counterparty, complete payment." },
            { step: "04", title: "Receive USDT", desc: "USDT released from escrow to your wallet instantly." },
          ].map((s) => (
            <div key={s.step} className="relative">
              <div className="text-5xl font-black text-border/60 font-stat mb-3">{s.step}</div>
              <h4 className="font-bold text-foreground mb-1.5">{s.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why ChainSwap ───────────────────────────── */}
      <section className="border-t border-border bg-card/50">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="font-bold text-xl text-foreground mb-8">Why traders choose ChainSwap</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Lock, title: "Escrow Security", desc: "USDT is locked in smart contract escrow until both parties confirm payment." },
              { icon: Zap, title: "Lightning Fast", desc: "Most trades complete in under 5 minutes. Real-time chat keeps you informed." },
              { icon: Users, title: "Verified Traders", desc: "Top traders are verified with badges, ratings, and full trade history." },
              { icon: Globe, title: "12+ Payment Methods", desc: "UPI, IMPS, NEFT, Paytm, PhonePe, Google Pay, and more." },
              { icon: Shield, title: "Dispute Resolution", desc: "24/7 dispute team resolves issues fairly. Your funds are always safe." },
              { icon: Star, title: "Reputation System", desc: "Review your counterparty after every trade. Build trust in the community." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-card border border-border rounded-xl p-5">
                <div className="size-9 rounded-lg bg-primary/12 flex items-center justify-center mb-3">
                  <Icon className="size-4.5 text-primary" />
                </div>
                <p className="font-semibold text-sm text-foreground mb-1">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Top Traders ─────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-16 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-xl text-foreground">Top Traders</h2>
            <p className="text-muted-foreground text-sm mt-0.5">Most trusted members of our community</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-5 px-5 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest border-b border-border">
            <span>#</span>
            <span className="col-span-2">Trader</span>
            <span className="text-right">Trades</span>
            <span className="text-right">Rate</span>
          </div>
          {topTraders.map((trader, i) => (
            <Link
              key={trader.rank}
              href={`/user/${trader.username}`}
              className={`grid grid-cols-5 px-5 py-3.5 items-center table-row-hover transition-colors ${i !== topTraders.length - 1 ? "border-b border-border" : ""}`}
            >
              <span className={`font-stat text-sm font-bold ${trader.rank === 1 ? "text-yellow-400" : trader.rank === 2 ? "text-slate-300" : trader.rank === 3 ? "text-orange-400" : "text-muted-foreground"}`}>
                #{trader.rank}
              </span>
              <div className="col-span-2 flex items-center gap-2.5">
                <div className="size-7 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                  {trader.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{trader.username}</p>
                  {trader.is_verified_trader && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-primary font-medium">
                      <CheckCircle className="size-2.5" /> Verified
                    </span>
                  )}
                </div>
              </div>
              <span className="text-right text-sm font-stat text-foreground">{trader.completed_trades.toLocaleString()}</span>
              <span className={`text-right text-sm font-stat font-semibold ${trader.completion_rate >= 98 ? "text-success" : "text-yellow-400"}`}>
                {trader.completion_rate}%
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── CTA banner ──────────────────────────────── */}
      <section className="border-t border-border">
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <h2 className="font-black text-3xl sm:text-4xl text-foreground mb-4 text-balance">
            Ready to trade USDT?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto text-sm">
            Join thousands of traders. Create a free account and start trading in minutes.
          </p>
          <Link href="/register" className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground font-bold rounded-lg hover:opacity-90 transition-opacity glow-teal">
            Create Free Account <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────── */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="size-5 rounded bg-primary/20 flex items-center justify-center">
              <span className="text-primary text-[10px] font-bold">CS</span>
            </div>
            <span className="font-semibold text-foreground">ChainSwap</span>
            <span>&copy; 2026. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/buy" className="hover:text-foreground transition-colors">Buy USDT</Link>
            <Link href="/sell" className="hover:text-foreground transition-colors">Sell USDT</Link>
            <Link href="/register" className="hover:text-foreground transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
