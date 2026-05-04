"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  Shield,
  ArrowRightLeft,
  Headphones,
  TrendingUp,
  CheckCircle,
} from "lucide-react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "";

interface Stats {
  total_offers: number;
  total_volume_inr: number;
  payment_methods: number;
}

interface Trader {
  rank: number;
  username: string;
  is_verified_trader: boolean;
  completion_rate: number;
  completed_trades: number;
  volume_usdt: number;
}

export default function HomePage() {
  const [stats, setStats] = useState<Stats>({
    total_offers: 0,
    total_volume_inr: 0,
    payment_methods: 6,
  });
  const [topTraders, setTopTraders] = useState<Trader[]>([]);

  useEffect(() => {
    axios
      .get(`${API}/api/stats`)
      .then((r) => setStats(r.data))
      .catch(() => {});
    axios
      .get(`${API}/api/top-traders?days=90&limit=5`)
      .then((r) => setTopTraders(r.data))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section
        className="relative flex-1 flex items-center justify-center px-4 py-24"
        data-testid="hero-section"
      >
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-surface text-muted-foreground text-sm mb-8">
            <span className="size-2 rounded-full bg-success animate-pulse" />
            Non-custodial P2P trading
          </div>
          <h1
            className="font-sans text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-6 text-balance"
            data-testid="hero-heading"
          >
            <span className="text-brand">Buy</span> &amp;{" "}
            <span className="text-success">Sell</span> USDT
          </h1>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Trade USDT peer-to-peer with 10+ payment methods. Fast, secure, and
            non-custodial.
          </p>

          {/* Trust Icons */}
          <div className="flex flex-wrap justify-center gap-8 mb-10">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowRightLeft className="size-5 text-brand" />
              <span>Trade P2P</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="size-5 text-brand" />
              <span>Non Custodial</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Headphones className="size-5 text-brand" />
              <span>24x7 Support</span>
            </div>
          </div>

          <Link
            href="/buy"
            className="inline-block px-10 py-4 bg-primary text-primary-foreground font-semibold text-lg rounded-full hover:opacity-90 transition-all hover:scale-105"
            data-testid="start-trading-btn"
          >
            Start Trading
          </Link>
        </div>
      </section>

      {/* Stats Bar */}
      <section
        className="relative z-10 py-16 border-t border-border"
        data-testid="stats-section"
      >
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center px-4">
          <div>
            <p className="text-4xl font-black text-foreground font-sans">
              {stats.total_offers}+
            </p>
            <p className="text-sm text-muted-foreground uppercase tracking-widest mt-2">
              Trade Offers
            </p>
          </div>
          <div>
            <p className="text-4xl font-black text-brand font-sans">
              &#8377;{(stats.total_volume_inr / 1000000).toFixed(1)}M+
            </p>
            <p className="text-sm text-muted-foreground uppercase tracking-widest mt-2">
              In Trades
            </p>
          </div>
          <div>
            <p className="text-4xl font-black text-foreground font-sans">
              {stats.payment_methods}+
            </p>
            <p className="text-sm text-muted-foreground uppercase tracking-widest mt-2">
              Payment Methods
            </p>
          </div>
        </div>
      </section>

      {/* USDT Row */}
      <section
        className="relative z-10 py-12 px-4"
        data-testid="usdt-section"
      >
        <div className="max-w-5xl mx-auto">
          <h2 className="font-sans text-3xl font-bold mb-8">Trade USDT</h2>
          <div className="bg-card rounded-2xl p-6 border border-border flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-full bg-[#26A17B] flex items-center justify-center text-white font-bold text-lg">
                &#8357;
              </div>
              <div>
                <p className="font-semibold text-foreground">Tether</p>
                <p className="text-sm text-muted-foreground">USDT</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-success" />
              <span className="text-success text-sm">Stable</span>
            </div>
            <div className="flex gap-3">
              <Link
                href="/buy"
                className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-full hover:opacity-90 transition-colors"
                data-testid="hero-buy-btn"
              >
                Buy
              </Link>
              <Link
                href="/sell"
                className="px-6 py-2.5 border border-border text-foreground font-semibold rounded-full hover:bg-muted transition-colors"
                data-testid="hero-sell-btn"
              >
                Sell
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Networks */}
      <section
        className="relative z-10 py-16 px-4"
        data-testid="networks-section"
      >
        <div className="max-w-5xl mx-auto">
          <h2 className="font-sans text-3xl font-bold mb-8">
            Supported Networks
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Ethereum",
                short: "ERC20",
                color: "#627EEA",
                desc: "Trade USDT on Ethereum network with full security",
              },
              {
                name: "Binance Smart Chain",
                short: "BEP20",
                color: "#F3BA2F",
                desc: "Fast and low-cost trades on BSC network",
              },
              {
                name: "Tron",
                short: "TRC20",
                color: "#FF0013",
                desc: "Zero-fee USDT transfers on Tron network",
              },
            ].map((net) => (
              <div
                key={net.short}
                className="bg-card rounded-2xl p-6 border border-border hover:-translate-y-1 transition-transform"
              >
                <div
                  className="size-12 rounded-xl mb-4 flex items-center justify-center"
                  style={{ backgroundColor: net.color + "20" }}
                >
                  <span
                    className="font-bold text-sm"
                    style={{ color: net.color }}
                  >
                    {net.short}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  {net.name}
                </h3>
                <p className="text-sm text-muted-foreground">{net.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section
        className="relative z-10 py-16 px-4 border-t border-border"
        data-testid="how-it-works"
      >
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="font-sans text-3xl font-bold mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: "1", title: "Register", desc: "Create account in seconds" },
              { step: "2", title: "Find Offer", desc: "Browse buy/sell offers" },
              { step: "3", title: "Trade", desc: "Complete payment securely" },
              { step: "4", title: "Receive", desc: "Get USDT in your wallet" },
            ].map((s) => (
              <div key={s.step}>
                <div className="size-12 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center mx-auto mb-4">
                  {s.step}
                </div>
                <h4 className="font-semibold text-foreground mb-1">
                  {s.title}
                </h4>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Traders Leaderboard */}
      {topTraders.length > 0 && (
        <section
          className="relative z-10 py-16 px-4 border-t border-border"
          data-testid="top-traders-section"
        >
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="font-sans text-3xl font-bold mb-3">
                Top Traders
              </h2>
              <p className="text-muted-foreground">
                Our most trusted community members
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {topTraders.map((trader) => (
                <Link
                  href={`/user/${trader.username}`}
                  key={trader.rank}
                  className="bg-card rounded-2xl p-5 border border-border hover:border-brand/30 hover:-translate-y-1 transition-all group"
                  data-testid={`top-trader-${trader.rank}`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`size-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        trader.rank === 1
                          ? "bg-amber-500/20 text-amber-400"
                          : trader.rank === 2
                          ? "bg-muted text-muted-foreground"
                          : trader.rank === 3
                          ? "bg-orange-800/20 text-orange-400"
                          : "bg-primary/10 text-brand"
                      }`}
                    >
                      #{trader.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="font-semibold text-foreground text-sm truncate group-hover:text-brand transition-colors">
                          {trader.username}
                        </p>
                        {trader.is_verified_trader && (
                          <CheckCircle className="size-3.5 text-brand flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Trades</span>
                      <span className="text-foreground font-medium">
                        {trader.completed_trades}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Rate</span>
                      <span
                        className={`font-medium ${
                          trader.completion_rate >= 90
                            ? "text-success"
                            : "text-amber-400"
                        }`}
                      >
                        {trader.completion_rate}%
                      </span>
                    </div>
                    {trader.volume_usdt > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Volume</span>
                        <span className="text-brand font-medium">
                          {trader.volume_usdt.toFixed(0)} USDT
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="relative z-10 py-8 px-4 border-t border-border text-center text-muted-foreground text-sm">
        <p>
          &copy; 2026 ChainSwap. P2P USDT Trading Platform. All rights
          reserved.
        </p>
      </footer>
    </div>
  );
}
