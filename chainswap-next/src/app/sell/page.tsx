"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { User, Star, Clock, X, CheckCircle } from "lucide-react";
import { useAuth, api } from "@/contexts/AuthContext";
import { toast } from "sonner";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "";

interface UserStats {
  completion_rate: number;
  completed_trades: number;
  is_verified_trader: boolean;
}

interface Offer {
  id: string;
  username: string;
  user_stats?: UserStats;
  payment_methods?: string[];
  price_inr: number;
  min_limit_inr: number;
  max_limit_inr: number;
  available_usdt: number;
}

export default function SellPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentFilter, setPaymentFilter] = useState("");
  const [networkFilter, setNetworkFilter] = useState("");
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [tradeAmount, setTradeAmount] = useState("");
  const [tradePayment, setTradePayment] = useState("");
  const [initiating, setInitiating] = useState(false);

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${API}/api/offers?type=buy`;
      if (paymentFilter) url += `&payment_method=${paymentFilter}`;
      if (networkFilter) url += `&network=${networkFilter}`;
      const res = await axios.get(url);
      setOffers(res.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [paymentFilter, networkFilter]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const initiateTrade = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!tradeAmount || parseFloat(tradeAmount) <= 0) {
      toast.error("Enter valid amount");
      return;
    }
    if (!tradePayment) {
      toast.error("Select payment method");
      return;
    }
    if (!selectedOffer) return;

    const amountUsdt = parseFloat(tradeAmount);
    if (amountUsdt * selectedOffer.price_inr < selectedOffer.min_limit_inr) {
      toast.error(`Minimum trade is \u20B9${selectedOffer.min_limit_inr}`);
      return;
    }
    if (amountUsdt * selectedOffer.price_inr > selectedOffer.max_limit_inr) {
      toast.error(`Maximum trade is \u20B9${selectedOffer.max_limit_inr}`);
      return;
    }
    if (amountUsdt > selectedOffer.available_usdt) {
      toast.error("Amount exceeds available USDT");
      return;
    }

    setInitiating(true);
    try {
      const res = await api.post("/trades", {
        offer_id: selectedOffer.id,
        amount_usdt: amountUsdt,
        payment_method: tradePayment,
      });
      toast.success("Trade initiated!");
      router.push(`/trade/${res.data.id}`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      toast.error(axiosErr?.response?.data?.detail || "Failed to initiate trade");
    } finally {
      setInitiating(false);
    }
  };

  const paymentMethods = ["UPI", "IMPS", "Bank Transfer", "Paytm", "PhonePe", "NEFT"];
  const networks = ["TRC20", "ERC20", "BEP20"];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8 w-full" data-testid="sell-page">
        <h1 className="font-sans text-3xl font-bold text-foreground mb-2">
          Sell USDT
        </h1>
        <p className="text-muted-foreground mb-6">
          Find buyers and sell your USDT for INR
        </p>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6" data-testid="sell-filters">
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-4 py-2 rounded-xl border border-border bg-card text-foreground text-sm focus:border-primary focus:outline-none"
          >
            <option value="">All Payment Methods</option>
            {paymentMethods.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={networkFilter}
            onChange={(e) => setNetworkFilter(e.target.value)}
            className="px-4 py-2 rounded-xl border border-border bg-card text-foreground text-sm focus:border-primary focus:outline-none"
          >
            <option value="">All Networks</option>
            {networks.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        {/* Offers List */}
        <div className="space-y-4" data-testid="sell-offers-list">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading offers...
            </div>
          ) : offers.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-border">
              <p className="text-muted-foreground mb-4">
                No active buy offers found
              </p>
              <Link
                href="/create-offer"
                className="text-brand font-semibold hover:underline"
              >
                Be the first to create one
              </Link>
            </div>
          ) : (
            offers.map((offer) => (
              <div
                key={offer.id}
                className="bg-card rounded-2xl p-6 border border-border hover:-translate-y-0.5 transition-transform"
                data-testid={`offer-card-${offer.id}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-success/10 flex items-center justify-center">
                      <User className="size-5 text-success" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/user/${offer.username}`}
                          className="font-semibold text-foreground hover:text-brand"
                        >
                          {offer.username}
                        </Link>
                        {offer.user_stats?.is_verified_trader && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-success/10 text-success rounded-full text-[10px] font-semibold">
                            <CheckCircle className="size-2.5" /> Verified
                          </span>
                        )}
                        <span className="size-2 rounded-full bg-success" />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <Star className="size-3" />{" "}
                          {offer.user_stats?.completion_rate || 0}%
                        </span>
                        <span>
                          {offer.user_stats?.completed_trades || 0} trades
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {offer.payment_methods?.map((m) => (
                      <span
                        key={m}
                        className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full"
                      >
                        {m}
                      </span>
                    ))}
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-success font-sans">
                      &#8377;{offer.price_inr}
                    </p>
                    <p className="text-xs text-muted-foreground">per USDT</p>
                  </div>

                  <div className="text-right text-sm text-muted-foreground">
                    <p>
                      Limits: &#8377;{offer.min_limit_inr} - &#8377;
                      {offer.max_limit_inr}
                    </p>
                    <p className="flex items-center gap-1 justify-end">
                      <Clock className="size-3" /> {offer.available_usdt} USDT
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedOffer(offer);
                      setTradePayment(offer.payment_methods?.[0] || "");
                    }}
                    className="px-6 py-2.5 bg-success text-success-foreground font-semibold rounded-full hover:opacity-90 transition-colors"
                    data-testid={`sell-btn-${offer.id}`}
                  >
                    Sell
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Trade Initiation Modal */}
      {selectedOffer && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          data-testid="trade-modal"
        >
          <div className="bg-card rounded-2xl p-6 w-full max-w-md border border-border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-sans text-xl font-bold text-foreground">
                Sell USDT to {selectedOffer.username}
              </h3>
              <button
                onClick={() => setSelectedOffer(null)}
                className="p-1 hover:bg-muted rounded-lg"
              >
                <X className="size-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-surface rounded-xl text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rate</span>
                  <span className="font-medium text-foreground">
                    &#8377;{selectedOffer.price_inr}/USDT
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-muted-foreground">Limits</span>
                  <span className="text-foreground">
                    &#8377;{selectedOffer.min_limit_inr} - &#8377;
                    {selectedOffer.max_limit_inr}
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-muted-foreground">Available</span>
                  <span className="text-foreground">
                    {selectedOffer.available_usdt} USDT
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">
                  Amount (USDT)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-input rounded-xl text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
                  placeholder="Enter USDT amount"
                  data-testid="trade-amount-input"
                />
                {tradeAmount && (
                  <p className="text-sm text-muted-foreground mt-1">
                    You receive: &#8377;
                    {(
                      parseFloat(tradeAmount || "0") * selectedOffer.price_inr
                    ).toFixed(2)}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">
                  Payment Method
                </label>
                <select
                  value={tradePayment}
                  onChange={(e) => setTradePayment(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-input rounded-xl text-foreground focus:border-primary focus:outline-none"
                  data-testid="trade-payment-select"
                >
                  {selectedOffer.payment_methods?.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={initiateTrade}
                disabled={initiating}
                className="w-full py-3 bg-success text-success-foreground font-semibold rounded-full hover:opacity-90 transition-colors disabled:opacity-50"
                data-testid="initiate-trade-btn"
              >
                {initiating ? "Initiating..." : "Start Trade"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
