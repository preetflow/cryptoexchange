"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { api } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function CreateOfferPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    type: "sell",
    network: "TRC20",
    price_inr: "",
    available_usdt: "",
    min_limit_inr: "",
    max_limit_inr: "",
    payment_methods: [] as string[],
    payment_window_mins: 30,
    trade_terms: "",
  });

  const paymentOptions = ["UPI", "IMPS", "Bank Transfer", "Paytm", "PhonePe", "NEFT"];

  const togglePayment = (method: string) => {
    setForm((prev) => ({
      ...prev,
      payment_methods: prev.payment_methods.includes(method)
        ? prev.payment_methods.filter((m) => m !== method)
        : [...prev.payment_methods, method],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.payment_methods.length === 0) {
      toast.error("Select at least one payment method");
      return;
    }
    setLoading(true);
    try {
      await api.post("/offers", {
        ...form,
        price_inr: parseFloat(form.price_inr),
        available_usdt: parseFloat(form.available_usdt),
        min_limit_inr: parseFloat(form.min_limit_inr),
        max_limit_inr: parseFloat(form.max_limit_inr),
      });
      toast.success("Offer created successfully!");
      router.push("/dashboard");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      toast.error(axiosErr?.response?.data?.detail || "Failed to create offer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8 w-full" data-testid="create-offer-page">
        <h1 className="font-sans text-3xl font-bold text-foreground mb-2">
          Create Offer
        </h1>
        <p className="text-muted-foreground mb-8">
          Set your terms and start trading
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-card rounded-2xl p-8 border border-border space-y-6"
        >
          {/* Type Toggle */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              I want to
            </label>
            <div className="flex gap-2" data-testid="offer-type-toggle">
              <button
                type="button"
                onClick={() => setForm({ ...form, type: "sell" })}
                className={`px-6 py-2 rounded-full font-medium text-sm transition-colors ${
                  form.type === "sell"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
                data-testid="offer-type-sell"
              >
                Sell USDT
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, type: "buy" })}
                className={`px-6 py-2 rounded-full font-medium text-sm transition-colors ${
                  form.type === "buy"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
                data-testid="offer-type-buy"
              >
                Buy USDT
              </button>
            </div>
          </div>

          {/* Network */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Network
            </label>
            <div className="flex gap-2" data-testid="offer-network-select">
              {["TRC20", "ERC20", "BEP20"].map((net) => (
                <button
                  key={net}
                  type="button"
                  onClick={() => setForm({ ...form, network: net })}
                  className={`px-4 py-2 rounded-full font-medium text-sm transition-colors ${
                    form.network === net
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {net}
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Price per USDT (INR)
            </label>
            <input
              type="number"
              step="0.01"
              value={form.price_inr}
              onChange={(e) => setForm({ ...form, price_inr: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-input rounded-xl text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
              placeholder="e.g. 88.50"
              required
              data-testid="offer-price-input"
            />
          </div>

          {/* Available USDT */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Available USDT Amount
            </label>
            <input
              type="number"
              step="0.01"
              value={form.available_usdt}
              onChange={(e) =>
                setForm({ ...form, available_usdt: e.target.value })
              }
              className="w-full px-4 py-3 bg-background border border-input rounded-xl text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
              placeholder="e.g. 1000"
              required
              data-testid="offer-amount-input"
            />
          </div>

          {/* Limits */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Min Limit (INR)
              </label>
              <input
                type="number"
                value={form.min_limit_inr}
                onChange={(e) =>
                  setForm({ ...form, min_limit_inr: e.target.value })
                }
                className="w-full px-4 py-3 bg-background border border-input rounded-xl text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
                placeholder="500"
                required
                data-testid="offer-min-limit"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Max Limit (INR)
              </label>
              <input
                type="number"
                value={form.max_limit_inr}
                onChange={(e) =>
                  setForm({ ...form, max_limit_inr: e.target.value })
                }
                className="w-full px-4 py-3 bg-background border border-input rounded-xl text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
                placeholder="50000"
                required
                data-testid="offer-max-limit"
              />
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Payment Methods
            </label>
            <div
              className="flex flex-wrap gap-2"
              data-testid="offer-payment-methods"
            >
              {paymentOptions.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => togglePayment(m)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    form.payment_methods.includes(m)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid={`payment-method-${m.replace(/\s+/g, "-").toLowerCase()}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Window */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Payment Window
            </label>
            <div className="flex gap-2">
              {[15, 30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() =>
                    setForm({ ...form, payment_window_mins: mins })
                  }
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    form.payment_window_mins === mins
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>
          </div>

          {/* Trade Terms */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Trade Terms{" "}
              <span className="text-muted-foreground/60">(optional)</span>
            </label>
            <textarea
              value={form.trade_terms}
              onChange={(e) =>
                setForm({ ...form, trade_terms: e.target.value })
              }
              className="w-full px-4 py-3 bg-background border border-input rounded-xl text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none h-24 resize-none"
              placeholder="Any specific instructions for traders..."
              data-testid="offer-terms-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-full hover:opacity-90 transition-colors disabled:opacity-50"
            data-testid="create-offer-submit-btn"
          >
            {loading ? "Creating..." : "Create Offer"}
          </button>
        </form>
      </main>
    </div>
  );
}
