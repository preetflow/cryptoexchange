"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useAuth, api } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  BarChart3,
  Clock,
  CheckCircle,
  Pause,
  Play,
  Trash2,
  Bell,
  Settings,
  List,
} from "lucide-react";

interface Trade {
  id: string;
  is_buyer: boolean;
  amount_usdt: number;
  amount_inr?: number;
  counterparty: string;
  status: string;
  created_at: string;
}

interface Offer {
  id: string;
  type: string;
  price_inr: number;
  network: string;
  available_usdt: number;
  is_paused: boolean;
}

interface Notification {
  id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  trade_id?: string;
}

type TabId = "overview" | "my-offers" | "active-trades" | "history" | "notifications" | "settings";

const statusColors: Record<string, string> = {
  COMPLETED: "bg-success/10 text-success",
  DISPUTED: "bg-destructive/10 text-destructive",
  CANCELLED: "bg-muted text-muted-foreground",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("overview");
  const [trades, setTrades] = useState<Trade[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "overview" || tab === "active-trades" || tab === "history") {
        const res = await api.get("/trades");
        setTrades(res.data);
      }
      if (tab === "overview" || tab === "my-offers") {
        const res = await api.get("/my-offers");
        setOffers(res.data);
      }
      if (tab === "notifications") {
        const res = await api.get("/notifications");
        setNotifications(res.data);
        api.patch("/notifications/mark-read").catch(() => {});
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleOffer = async (offerId: string) => {
    try {
      await api.patch(`/offers/${offerId}/toggle`);
      toast.success("Offer toggled");
      loadData();
    } catch {
      toast.error("Failed");
    }
  };

  const deleteOffer = async (offerId: string) => {
    if (!window.confirm("Delete this offer?")) return;
    try {
      await api.delete(`/offers/${offerId}`);
      toast.success("Offer deleted");
      loadData();
    } catch {
      toast.error("Failed");
    }
  };

  const activeTrades = trades.filter((t) =>
    ["INITIATED", "PAYMENT_SENT", "DISPUTED"].includes(t.status)
  );
  const completedTrades = trades.filter((t) => t.status === "COMPLETED");

  const tabs = [
    { id: "overview" as TabId, label: "Overview", icon: BarChart3 },
    { id: "my-offers" as TabId, label: "My Offers", icon: List },
    { id: "active-trades" as TabId, label: "Active Trades", icon: Clock },
    { id: "history" as TabId, label: "Trade History", icon: CheckCircle },
    { id: "notifications" as TabId, label: "Notifications", icon: Bell },
    { id: "settings" as TabId, label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8 w-full" data-testid="dashboard-page">
        <h1 className="font-sans text-3xl font-bold text-foreground mb-6">
          Dashboard
        </h1>

        {/* Tabs */}
        <div
          className="flex gap-2 mb-6 overflow-x-auto pb-2"
          data-testid="dashboard-tabs"
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                tab === t.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground border border-border hover:text-foreground"
              }`}
              data-testid={`tab-${t.id}`}
            >
              <t.icon className="size-4" /> {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {tab === "overview" && (
              <div className="space-y-6" data-testid="dashboard-overview">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    {
                      label: "Total Trades",
                      value: trades.length,
                      color: "text-foreground",
                    },
                    {
                      label: "Completed",
                      value: completedTrades.length,
                      color: "text-success",
                    },
                    {
                      label: "Active",
                      value: activeTrades.length,
                      color: "text-brand",
                    },
                    {
                      label: "Completion Rate",
                      value: `${user?.completion_rate || 0}%`,
                      color: "text-foreground",
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-card rounded-2xl p-6 border border-border"
                    >
                      <p className="text-sm text-muted-foreground">
                        {stat.label}
                      </p>
                      <p
                        className={`text-3xl font-bold font-sans mt-1 ${stat.color}`}
                      >
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Recent Trades */}
                <div className="bg-card rounded-2xl p-6 border border-border">
                  <h3 className="font-semibold text-foreground mb-4">
                    Recent Trades
                  </h3>
                  {trades.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No trades yet.{" "}
                      <Link href="/buy" className="text-brand">
                        Start trading
                      </Link>
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {trades.slice(0, 5).map((t) => (
                        <Link
                          href={`/trade/${t.id}`}
                          key={t.id}
                          className="flex items-center justify-between p-3 bg-surface rounded-xl hover:bg-muted transition-colors"
                          data-testid={`trade-row-${t.id}`}
                        >
                          <div>
                            <p className="font-medium text-foreground text-sm">
                              {t.is_buyer ? "Bought" : "Sold"} {t.amount_usdt}{" "}
                              USDT
                            </p>
                            <p className="text-xs text-muted-foreground">
                              with {t.counterparty}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              statusColors[t.status] ||
                              "bg-primary/10 text-brand"
                            }`}
                          >
                            {t.status}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* My Offers Tab */}
            {tab === "my-offers" && (
              <div className="space-y-4" data-testid="dashboard-offers">
                {offers.length === 0 ? (
                  <div className="bg-card rounded-2xl p-8 text-center border border-border">
                    <p className="text-muted-foreground mb-4">No offers yet</p>
                    <Link
                      href="/create-offer"
                      className="px-6 py-2 bg-primary text-primary-foreground font-semibold rounded-full"
                    >
                      Create Offer
                    </Link>
                  </div>
                ) : (
                  offers.map((offer) => (
                    <div
                      key={offer.id}
                      className="bg-card rounded-2xl p-6 border border-border flex flex-wrap items-center justify-between gap-4"
                      data-testid={`my-offer-${offer.id}`}
                    >
                      <div>
                        <p className="font-semibold text-foreground">
                          {offer.type === "sell" ? "Selling" : "Buying"} USDT
                        </p>
                        <p className="text-sm text-muted-foreground">
                          &#8377;{offer.price_inr}/USDT | {offer.network} |{" "}
                          {offer.available_usdt} USDT
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            offer.is_paused
                              ? "bg-amber-500/10 text-amber-400"
                              : "bg-success/10 text-success"
                          }`}
                        >
                          {offer.is_paused ? "Paused" : "Active"}
                        </span>
                        <button
                          onClick={() => toggleOffer(offer.id)}
                          className="p-2 hover:bg-muted rounded-lg"
                          title={offer.is_paused ? "Resume" : "Pause"}
                        >
                          {offer.is_paused ? (
                            <Play className="size-4 text-success" />
                          ) : (
                            <Pause className="size-4 text-amber-400" />
                          )}
                        </button>
                        <button
                          onClick={() => deleteOffer(offer.id)}
                          className="p-2 hover:bg-destructive/10 rounded-lg"
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Active Trades Tab */}
            {tab === "active-trades" && (
              <div className="space-y-4" data-testid="dashboard-active-trades">
                {activeTrades.length === 0 ? (
                  <div className="bg-card rounded-2xl p-8 text-center border border-border">
                    <p className="text-muted-foreground">No active trades</p>
                  </div>
                ) : (
                  activeTrades.map((t) => (
                    <Link
                      href={`/trade/${t.id}`}
                      key={t.id}
                      className="block bg-card rounded-2xl p-6 border border-border hover:-translate-y-0.5 transition-transform"
                      data-testid={`active-trade-${t.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-foreground">
                            {t.is_buyer ? "Buying" : "Selling"} {t.amount_usdt}{" "}
                            USDT
                          </p>
                          <p className="text-sm text-muted-foreground">
                            with {t.counterparty} | &#8377;
                            {t.amount_inr?.toFixed(2)}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            t.status === "DISPUTED"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-primary/10 text-brand"
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* Trade History Tab */}
            {tab === "history" && (
              <div
                className="bg-card rounded-2xl border border-border overflow-hidden"
                data-testid="dashboard-history"
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-surface">
                      <tr>
                        {["Date", "Type", "Amount", "Counterparty", "Status"].map(
                          (h) => (
                            <th
                              key={h}
                              className="px-6 py-3 text-left text-xs font-medium text-muted-foreground"
                            >
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {trades.map((t) => (
                        <tr
                          key={t.id}
                          className="hover:bg-surface cursor-pointer transition-colors"
                          onClick={() => router.push(`/trade/${t.id}`)}
                        >
                          <td className="px-6 py-4 text-muted-foreground">
                            {new Date(t.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-foreground">
                            {t.is_buyer ? "Buy" : "Sell"}
                          </td>
                          <td className="px-6 py-4 font-medium text-foreground">
                            {t.amount_usdt} USDT
                          </td>
                          <td className="px-6 py-4 text-foreground">
                            {t.counterparty}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs ${
                                statusColors[t.status] ||
                                "bg-primary/10 text-brand"
                              }`}
                            >
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {trades.length === 0 && (
                    <p className="text-center py-8 text-muted-foreground">
                      No trade history
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {tab === "notifications" && (
              <div className="space-y-3" data-testid="dashboard-notifications">
                {notifications.length === 0 ? (
                  <div className="bg-card rounded-2xl p-8 text-center border border-border">
                    <p className="text-muted-foreground">No notifications</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`bg-card rounded-2xl p-4 border ${
                        n.is_read ? "border-border" : "border-primary/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-foreground">{n.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(n.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {n.trade_id && (
                        <Link
                          href={`/trade/${n.trade_id}`}
                          className="text-xs text-brand mt-1 inline-block"
                        >
                          View Trade
                        </Link>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Settings Tab */}
            {tab === "settings" && (
              <div
                className="bg-card rounded-2xl p-6 border border-border"
                data-testid="dashboard-settings"
              >
                <h3 className="font-semibold text-foreground mb-6">
                  Profile Settings
                </h3>
                <div className="space-y-4">
                  {[
                    { label: "Username", value: user?.username },
                    { label: "Email", value: user?.email },
                    {
                      label: "Wallet Address",
                      value: user?.wallet_address || "Not set",
                    },
                    {
                      label: "Member Since",
                      value: user?.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : "N/A",
                    },
                  ].map((field) => (
                    <div key={field.label} className="p-4 bg-surface rounded-xl">
                      <p className="text-xs text-muted-foreground mb-1">
                        {field.label}
                      </p>
                      <p className="text-foreground font-medium">{field.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
