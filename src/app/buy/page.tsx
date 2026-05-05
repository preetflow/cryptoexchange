"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { CheckCircle, X, ChevronDown, Search, ArrowRight } from "lucide-react";
import { useAuth, api } from "@/contexts/AuthContext";
import { toast } from "sonner";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "";

interface Offer {
  id: string;
  username: string;
  user_stats?: { completion_rate: number; completed_trades: number; is_verified_trader: boolean };
  payment_methods?: string[];
  price_inr: number;
  min_limit_inr: number;
  max_limit_inr: number;
  available_usdt: number;
}

const DEMO_OFFERS: Offer[] = [
  { id: "d1", username: "cryptoking", user_stats: { completion_rate: 99, completed_trades: 3420, is_verified_trader: true }, payment_methods: ["UPI", "IMPS"], price_inr: 87.20, min_limit_inr: 500, max_limit_inr: 50000, available_usdt: 2000 },
  { id: "d2", username: "usdtpro", user_stats: { completion_rate: 98, completed_trades: 2180, is_verified_trader: true }, payment_methods: ["Bank Transfer", "NEFT"], price_inr: 87.15, min_limit_inr: 1000, max_limit_inr: 100000, available_usdt: 5000 },
  { id: "d3", username: "tradervault", user_stats: { completion_rate: 97, completed_trades: 1760, is_verified_trader: true }, payment_methods: ["Paytm", "PhonePe"], price_inr: 87.10, min_limit_inr: 500, max_limit_inr: 25000, available_usdt: 800 },
  { id: "d4", username: "swiftexchange", user_stats: { completion_rate: 96, completed_trades: 890, is_verified_trader: false }, payment_methods: ["UPI", "Paytm"], price_inr: 87.05, min_limit_inr: 200, max_limit_inr: 10000, available_usdt: 400 },
  { id: "d5", username: "blockdealer", user_stats: { completion_rate: 95, completed_trades: 654, is_verified_trader: false }, payment_methods: ["IMPS", "NEFT"], price_inr: 87.00, min_limit_inr: 500, max_limit_inr: 30000, available_usdt: 1200 },
];

const PAYMENT_METHODS = ["UPI", "IMPS", "Bank Transfer", "Paytm", "PhonePe", "NEFT"];
const NETWORKS = ["TRC20", "ERC20", "BEP20"];

export default function BuyPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [offers, setOffers] = useState<Offer[]>(DEMO_OFFERS);
  const [loading, setLoading] = useState(true);
  const [paymentFilter, setPaymentFilter] = useState("");
  const [networkFilter, setNetworkFilter] = useState("");
  const [amountFilter, setAmountFilter] = useState("");
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [tradeAmount, setTradeAmount] = useState("");
  const [tradePayment, setTradePayment] = useState("");
  const [initiating, setInitiating] = useState(false);

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${API}/api/offers?type=sell`;
      if (paymentFilter) url += `&payment_method=${paymentFilter}`;
      if (networkFilter) url += `&network=${networkFilter}`;
      const res = await axios.get(url);
      setOffers(res.data);
    } catch {
      setOffers(DEMO_OFFERS);
    } finally {
      setLoading(false);
    }
  }, [paymentFilter, networkFilter]);

  useEffect(() => { fetchOffers(); }, [fetchOffers]);

  const filteredOffers = amountFilter
    ? offers.filter((o) => {
        const amt = parseFloat(amountFilter);
        return !isNaN(amt) && amt * o.price_inr >= o.min_limit_inr && amt * o.price_inr <= o.max_limit_inr;
      })
    : offers;

  const initiateTrade = async () => {
    if (!user) { router.push("/login"); return; }
    if (!tradeAmount || parseFloat(tradeAmount) <= 0) { toast.error("Enter valid amount"); return; }
    if (!tradePayment) { toast.error("Select payment method"); return; }
    if (!selectedOffer) return;
    const amountUsdt = parseFloat(tradeAmount);
    if (amountUsdt * selectedOffer.price_inr < selectedOffer.min_limit_inr) { toast.error(`Min trade ₹${selectedOffer.min_limit_inr}`); return; }
    if (amountUsdt * selectedOffer.price_inr > selectedOffer.max_limit_inr) { toast.error(`Max trade ₹${selectedOffer.max_limit_inr}`); return; }
    if (amountUsdt > selectedOffer.available_usdt) { toast.error("Exceeds available USDT"); return; }
    setInitiating(true);
    try {
      const res = await api.post("/trades", { offer_id: selectedOffer.id, amount_usdt: amountUsdt, payment_method: tradePayment });
      toast.success("Trade initiated!");
      router.push(`/trade/${res.data.id}`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      toast.error(e?.response?.data?.detail || "Failed to initiate trade");
    } finally { setInitiating(false); }
  };

  const inrAmount = selectedOffer && tradeAmount ? (parseFloat(tradeAmount || "0") * selectedOffer.price_inr).toFixed(2) : "0.00";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8 w-full flex-1" data-testid="buy-page">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-black text-2xl text-foreground">Buy USDT</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Choose a seller and start trading</p>
          </div>
          <Link href="/sell" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            Want to sell? <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6 p-4 bg-card border border-border rounded-xl">
          {/* Amount input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="number"
              value={amountFilter}
              onChange={(e) => setAmountFilter(e.target.value)}
              placeholder="Enter USDT amount..."
              className="pl-9 pr-4 py-2 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none w-48"
            />
          </div>
          <div className="relative">
            <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="appearance-none pl-4 pr-8 py-2 bg-surface border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none">
              <option value="">All Payments</option>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          </div>
          <div className="relative">
            <select value={networkFilter} onChange={(e) => setNetworkFilter(e.target.value)} className="appearance-none pl-4 pr-8 py-2 bg-surface border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none">
              <option value="">All Networks</option>
              {NETWORKS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Table Header */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[2fr_1.5fr_1.5fr_1.5fr_1fr] px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest border-b border-border">
            <span>Advertiser</span>
            <span>Price</span>
            <span>Available / Limits</span>
            <span>Payment</span>
            <span className="text-right">Trade</span>
          </div>

          {loading ? (
            <div className="flex flex-col gap-0">
              {[1,2,3,4].map((i) => (
                <div key={i} className="px-5 py-4 border-b border-border last:border-0 animate-pulse">
                  <div className="h-4 bg-surface rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : filteredOffers.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-3">No offers match your criteria</p>
              <Link href="/create-offer" className="text-primary text-sm font-semibold hover:underline">Post a buy offer</Link>
            </div>
          ) : (
            filteredOffers.map((offer, i) => (
              <div key={offer.id} className={`grid grid-cols-1 md:grid-cols-[2fr_1.5fr_1.5fr_1.5fr_1fr] px-5 py-4 gap-3 md:gap-0 items-center table-row-hover transition-colors ${i !== filteredOffers.length - 1 ? "border-b border-border" : ""}`} data-testid={`offer-row-${offer.id}`}>
                {/* Advertiser */}
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full bg-primary/15 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                    {offer.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Link href={`/user/${offer.username}`} className="font-semibold text-sm text-foreground hover:text-primary transition-colors">{offer.username}</Link>
                      {offer.user_stats?.is_verified_trader && <CheckCircle className="size-3.5 text-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {offer.user_stats?.completed_trades ?? 0} trades &middot; {offer.user_stats?.completion_rate ?? 0}% rate
                    </p>
                  </div>
                </div>
                {/* Price */}
                <div>
                  <p className="font-stat font-bold text-lg text-primary">₹{offer.price_inr.toFixed(2)}</p>
                  <p className="text-[11px] text-muted-foreground">per USDT</p>
                </div>
                {/* Available / Limits */}
                <div>
                  <p className="font-stat text-sm text-foreground font-medium">{offer.available_usdt.toLocaleString()} USDT</p>
                  <p className="text-xs text-muted-foreground mt-0.5">₹{offer.min_limit_inr.toLocaleString()} – ₹{offer.max_limit_inr.toLocaleString()}</p>
                </div>
                {/* Payment methods */}
                <div className="flex flex-wrap gap-1.5">
                  {offer.payment_methods?.slice(0, 3).map((m) => (
                    <span key={m} className="px-2 py-0.5 bg-surface border border-border text-muted-foreground text-[11px] rounded font-medium">{m}</span>
                  ))}
                  {(offer.payment_methods?.length ?? 0) > 3 && (
                    <span className="px-2 py-0.5 text-[11px] text-muted-foreground">+{(offer.payment_methods?.length ?? 0) - 3}</span>
                  )}
                </div>
                {/* CTA */}
                <div className="md:text-right">
                  <button
                    onClick={() => { setSelectedOffer(offer); setTradeAmount(""); setTradePayment(offer.payment_methods?.[0] || ""); }}
                    className="px-5 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:opacity-90 transition-opacity"
                    data-testid={`buy-btn-${offer.id}`}
                  >
                    Buy
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Trade Modal */}
      {selectedOffer && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" data-testid="trade-modal">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl shadow-black/60">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h3 className="font-bold text-foreground">Buy USDT</h3>
                <p className="text-xs text-muted-foreground mt-0.5">from {selectedOffer.username}</p>
              </div>
              <button onClick={() => setSelectedOffer(null)} className="p-1.5 rounded-lg hover:bg-surface transition-colors">
                <X className="size-4 text-muted-foreground" />
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-4">
              {/* Rate summary */}
              <div className="bg-surface rounded-xl p-4 flex flex-col gap-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Rate</span><span className="font-stat font-semibold text-primary">₹{selectedOffer.price_inr}/USDT</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Limits</span><span className="text-foreground">₹{selectedOffer.min_limit_inr.toLocaleString()} – ₹{selectedOffer.max_limit_inr.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Available</span><span className="text-foreground font-stat">{selectedOffer.available_usdt} USDT</span></div>
              </div>

              {/* Amount input */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Amount (USDT)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(e.target.value)}
                    className="w-full px-4 py-3 bg-surface border border-input rounded-xl text-foreground text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none pr-16"
                    placeholder="0.00"
                    data-testid="trade-amount-input"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">USDT</span>
                </div>
                {tradeAmount && parseFloat(tradeAmount) > 0 && (
                  <p className="text-xs text-muted-foreground mt-1.5 flex justify-between">
                    <span>You pay</span>
                    <span className="font-stat font-semibold text-foreground">₹{inrAmount}</span>
                  </p>
                )}
              </div>

              {/* Payment method */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Payment Method</label>
                <div className="relative">
                  <select value={tradePayment} onChange={(e) => setTradePayment(e.target.value)} className="w-full appearance-none px-4 py-3 bg-surface border border-input rounded-xl text-foreground text-sm focus:border-primary focus:outline-none" data-testid="trade-payment-select">
                    {selectedOffer.payment_methods?.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <button
                onClick={initiateTrade}
                disabled={initiating}
                className="w-full py-3.5 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 glow-teal"
                data-testid="initiate-trade-btn"
              >
                {initiating ? "Starting trade..." : "Confirm & Start Trade"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
