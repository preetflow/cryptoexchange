"use client";

import React, { useEffect, useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import { useAuth, api } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Users,
  ArrowRightLeft,
  AlertTriangle,
  TrendingUp,
  Shield,
  CheckCircle,
  XCircle,
  Download,
  RefreshCw,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

type TabId = "overview" | "users" | "trades" | "disputes" | "reports";

interface Stats {
  total_users?: number;
  total_trades?: number;
  active_trades?: number;
  completed_trades?: number;
  disputed_trades?: number;
  total_volume_usdt?: number;
}

interface UserItem {
  id: string;
  username: string;
  email: string;
  role: string;
  is_verified_trader: boolean;
  completed_trades: number;
  created_at: string;
  is_active?: boolean;
}

interface TradeItem {
  id: string;
  amount_usdt: number;
  amount_inr?: number;
  price_inr: number;
  payment_method: string;
  status: string;
  created_at: string;
  buyer_info?: { username: string };
  seller_info?: { username: string };
}

interface DisputeItem extends TradeItem {
  dispute_reason?: string;
}

const CHART_COLORS = ["#4F8EF7", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

const statusColors: Record<string, string> = {
  INITIATED: "bg-primary/10 text-brand",
  PAYMENT_SENT: "bg-amber-500/10 text-amber-400",
  COMPLETED: "bg-success/10 text-success",
  DISPUTED: "bg-destructive/10 text-destructive",
  CANCELLED: "bg-muted text-muted-foreground",
  EXPIRED: "bg-muted text-muted-foreground",
};

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [stats, setStats] = useState<Stats>({});
  const [users, setUsers] = useState<UserItem[]>([]);
  const [trades, setTrades] = useState<TradeItem[]>([]);
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Resolve dispute dialog
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolveTradeId, setResolveTradeId] = useState<string | null>(null);
  const [resolveAction, setResolveAction] = useState<"buyer" | "seller">("buyer");
  const [resolveNote, setResolveNote] = useState("");
  const [resolveSubmitting, setResolveSubmitting] = useState(false);

  // Guard: admin only
  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") {
      router.push("/dashboard");
    }
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, tradesRes, disputesRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users"),
        api.get("/admin/trades"),
        api.get("/admin/disputes"),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setTrades(tradesRes.data);
      setDisputes(disputesRes.data);
    } catch {
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "admin") fetchAll();
  }, [user, fetchAll]);

  const handleVerify = async (userId: string, verify: boolean) => {
    try {
      await api.patch(`/admin/users/${userId}/verify`, { is_verified_trader: verify });
      toast.success(verify ? "User verified" : "Verification removed");
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_verified_trader: verify } : u))
      );
    } catch {
      toast.error("Failed to update verification");
    }
  };

  const handleBan = async (userId: string, ban: boolean) => {
    try {
      await api.patch(`/admin/users/${userId}/ban`, { is_active: !ban });
      toast.success(ban ? "User banned" : "User unbanned");
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: !ban } : u))
      );
    } catch {
      toast.error("Failed to update user status");
    }
  };

  const openResolveDialog = (tradeId: string, action: "buyer" | "seller") => {
    setResolveTradeId(tradeId);
    setResolveAction(action);
    setResolveNote("");
    setResolveOpen(true);
  };

  const handleResolveDispute = async () => {
    if (!resolveTradeId) return;
    setResolveSubmitting(true);
    try {
      await api.post(`/admin/disputes/${resolveTradeId}/resolve`, {
        resolution: resolveAction,
        admin_note: resolveNote,
      });
      toast.success("Dispute resolved");
      setDisputes((prev) => prev.filter((d) => d.id !== resolveTradeId));
      setResolveOpen(false);
    } catch {
      toast.error("Failed to resolve dispute");
    } finally {
      setResolveSubmitting(false);
    }
  };

  const exportCSV = () => {
    const rows = [
      ["ID", "Buyer", "Seller", "Amount (USDT)", "Price (INR)", "Status", "Created"],
      ...trades.map((t) => [
        t.id,
        t.buyer_info?.username || "",
        t.seller_info?.username || "",
        t.amount_usdt,
        t.price_inr,
        t.status,
        new Date(t.created_at).toLocaleDateString(),
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chainswap-trades.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Chart data derived from trades ---
  const volumeByDay = React.useMemo(() => {
    const map: Record<string, number> = {};
    trades.forEach((t) => {
      const day = new Date(t.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      map[day] = (map[day] || 0) + (t.amount_usdt || 0);
    });
    return Object.entries(map)
      .slice(-14)
      .map(([date, volume]) => ({ date, volume: Math.round(volume) }));
  }, [trades]);

  const tradesByDay = React.useMemo(() => {
    const map: Record<string, number> = {};
    trades.forEach((t) => {
      const day = new Date(t.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      map[day] = (map[day] || 0) + 1;
    });
    return Object.entries(map)
      .slice(-14)
      .map(([date, count]) => ({ date, count }));
  }, [trades]);

  const paymentMethodDist = React.useMemo(() => {
    const map: Record<string, number> = {};
    trades.forEach((t) => {
      const m = t.payment_method || "Unknown";
      map[m] = (map[m] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [trades]);

  const topTraders = React.useMemo(() => {
    const map: Record<string, { trades: number; volume: number }> = {};
    trades.forEach((t) => {
      const u = t.buyer_info?.username || t.seller_info?.username || "Unknown";
      if (!map[u]) map[u] = { trades: 0, volume: 0 };
      map[u].trades += 1;
      map[u].volume += t.amount_usdt || 0;
    });
    return Object.entries(map)
      .sort((a, b) => b[1].trades - a[1].trades)
      .slice(0, 10)
      .map(([username, data]) => ({ username, ...data }));
  }, [trades]);

  const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "users", label: "Users" },
    { id: "trades", label: "Trades" },
    { id: "disputes", label: `Disputes${disputes.length > 0 ? ` (${disputes.length})` : ""}` },
    { id: "reports", label: "Reports" },
  ];

  const statCards = [
    {
      label: "Total Users",
      value: stats.total_users ?? 0,
      icon: Users,
      color: "text-brand",
    },
    {
      label: "Total Trades",
      value: stats.total_trades ?? 0,
      icon: ArrowRightLeft,
      color: "text-brand",
    },
    {
      label: "Active Trades",
      value: stats.active_trades ?? 0,
      icon: TrendingUp,
      color: "text-amber-400",
    },
    {
      label: "Completed",
      value: stats.completed_trades ?? 0,
      icon: CheckCircle,
      color: "text-success",
    },
    {
      label: "Disputes",
      value: stats.disputed_trades ?? 0,
      icon: AlertTriangle,
      color: "text-destructive",
    },
    {
      label: "Volume (USDT)",
      value: stats.total_volume_usdt ? `${stats.total_volume_usdt.toLocaleString()}` : "0",
      icon: TrendingUp,
      color: "text-brand",
    },
  ];

  if (authLoading || (!user && !authLoading))
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6 w-full" data-testid="admin-dashboard">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="size-5 text-brand" />
            </div>
            <div>
              <h1 className="font-sans text-2xl font-bold text-foreground">Admin Panel</h1>
              <p className="text-sm text-muted-foreground">ChainSwap management console</p>
            </div>
          </div>
          <button
            onClick={fetchAll}
            className="flex items-center gap-2 px-4 py-2 border border-border text-sm text-muted-foreground hover:text-foreground rounded-full transition-colors"
          >
            <RefreshCw className="size-3.5" /> Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-surface rounded-xl p-1 w-fit overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`tab-${tab.id}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {statCards.map((card) => (
                <div key={card.label} className="bg-card rounded-2xl p-5 border border-border">
                  {loading ? (
                    <Skeleton className="h-14 w-full" />
                  ) : (
                    <>
                      <card.icon className={`size-5 mb-2 ${card.color}`} />
                      <p className={`text-2xl font-bold font-sans ${card.color}`}>
                        {card.value}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Recent disputes summary */}
            {disputes.length > 0 && (
              <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="size-4 text-destructive" />
                  <h3 className="font-semibold text-foreground">
                    {disputes.length} Open Dispute{disputes.length !== 1 ? "s" : ""} Require Attention
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab("disputes")}
                  className="text-sm text-brand hover:underline"
                >
                  View all disputes
                </button>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="p-5 border-b border-border">
              <h2 className="font-semibold text-foreground">
                All Users ({users.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="users-table">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left px-5 py-3 font-medium">Username</th>
                    <th className="text-left px-5 py-3 font-medium">Email</th>
                    <th className="text-left px-5 py-3 font-medium">Role</th>
                    <th className="text-left px-5 py-3 font-medium">Trades</th>
                    <th className="text-left px-5 py-3 font-medium">Verified</th>
                    <th className="text-left px-5 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="border-b border-border">
                          {Array.from({ length: 6 }).map((_, j) => (
                            <td key={j} className="px-5 py-3">
                              <Skeleton className="h-4 w-24" />
                            </td>
                          ))}
                        </tr>
                      ))
                    : users.map((u) => (
                        <tr
                          key={u.id}
                          className="border-b border-border hover:bg-surface/50 transition-colors"
                        >
                          <td className="px-5 py-3 font-medium text-foreground">{u.username}</td>
                          <td className="px-5 py-3 text-muted-foreground">{u.email}</td>
                          <td className="px-5 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                u.role === "admin"
                                  ? "bg-primary/10 text-brand"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-foreground">{u.completed_trades}</td>
                          <td className="px-5 py-3">
                            {u.is_verified_trader ? (
                              <span className="text-success text-xs font-semibold">Verified</span>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleVerify(u.id, !u.is_verified_trader)}
                                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                                  u.is_verified_trader
                                    ? "border-destructive/40 text-destructive hover:bg-destructive/10"
                                    : "border-success/40 text-success hover:bg-success/10"
                                }`}
                              >
                                {u.is_verified_trader ? "Unverify" : "Verify"}
                              </button>
                              {u.role !== "admin" && (
                                <button
                                  onClick={() => handleBan(u.id, u.is_active !== false)}
                                  className="text-xs px-3 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  {u.is_active === false ? "Unban" : "Ban"}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Trades Tab */}
        {activeTab === "trades" && (
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-foreground">
                All Trades ({trades.length})
              </h2>
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2 border border-border text-sm text-muted-foreground hover:text-foreground rounded-full transition-colors"
                data-testid="export-csv-btn"
              >
                <Download className="size-3.5" /> Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="trades-table">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left px-5 py-3 font-medium">Trade ID</th>
                    <th className="text-left px-5 py-3 font-medium">Buyer</th>
                    <th className="text-left px-5 py-3 font-medium">Seller</th>
                    <th className="text-left px-5 py-3 font-medium">Amount</th>
                    <th className="text-left px-5 py-3 font-medium">Payment</th>
                    <th className="text-left px-5 py-3 font-medium">Status</th>
                    <th className="text-left px-5 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="border-b border-border">
                          {Array.from({ length: 7 }).map((_, j) => (
                            <td key={j} className="px-5 py-3">
                              <Skeleton className="h-4 w-20" />
                            </td>
                          ))}
                        </tr>
                      ))
                    : trades.map((t) => (
                        <tr
                          key={t.id}
                          className="border-b border-border hover:bg-surface/50 transition-colors"
                        >
                          <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                            {t.id?.slice(0, 10)}...
                          </td>
                          <td className="px-5 py-3 text-foreground">
                            {t.buyer_info?.username || "—"}
                          </td>
                          <td className="px-5 py-3 text-foreground">
                            {t.seller_info?.username || "—"}
                          </td>
                          <td className="px-5 py-3 font-medium text-foreground">
                            {t.amount_usdt} USDT
                          </td>
                          <td className="px-5 py-3 text-muted-foreground">{t.payment_method}</td>
                          <td className="px-5 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[t.status] || "bg-muted text-muted-foreground"}`}
                            >
                              {t.status}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-muted-foreground">
                            {new Date(t.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Disputes Tab */}
        {activeTab === "disputes" && (
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-2xl" />
              ))
            ) : disputes.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border p-10 text-center">
                <CheckCircle className="size-12 text-success mx-auto mb-3" />
                <p className="text-foreground font-semibold">No open disputes</p>
                <p className="text-sm text-muted-foreground mt-1">
                  All disputes have been resolved
                </p>
              </div>
            ) : (
              disputes.map((d) => (
                <div
                  key={d.id}
                  className="bg-card rounded-2xl border border-destructive/20 p-5"
                  data-testid="dispute-card"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="size-4 text-destructive" />
                        <span className="font-semibold text-foreground">
                          {d.buyer_info?.username} vs {d.seller_info?.username}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        Trade ID: {d.id?.slice(0, 14)}...
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(d.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="p-3 bg-destructive/5 rounded-xl text-sm text-destructive mb-4">
                    <span className="font-medium">Reason: </span>
                    {d.dispute_reason || "No reason provided"}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                    <div className="p-3 bg-surface rounded-xl">
                      <p className="text-xs text-muted-foreground">Amount</p>
                      <p className="font-bold text-foreground">{d.amount_usdt} USDT</p>
                    </div>
                    <div className="p-3 bg-surface rounded-xl">
                      <p className="text-xs text-muted-foreground">Rate</p>
                      <p className="font-bold text-foreground">\u20B9{d.price_inr}</p>
                    </div>
                    <div className="p-3 bg-surface rounded-xl">
                      <p className="text-xs text-muted-foreground">Payment</p>
                      <p className="font-bold text-foreground">{d.payment_method}</p>
                    </div>
                    <div className="p-3 bg-surface rounded-xl">
                      <p className="text-xs text-muted-foreground">INR Total</p>
                      <p className="font-bold text-foreground">
                        \u20B9{d.amount_inr?.toFixed(0) || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => openResolveDialog(d.id, "buyer")}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-brand/10 text-brand border border-brand/30 text-sm font-semibold rounded-full hover:bg-brand/20 transition-colors"
                    >
                      <CheckCircle className="size-4" /> Favor Buyer
                    </button>
                    <button
                      onClick={() => openResolveDialog(d.id, "seller")}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-success/10 text-success border border-success/30 text-sm font-semibold rounded-full hover:bg-success/20 transition-colors"
                    >
                      <CheckCircle className="size-4" /> Favor Seller
                    </button>
                    <button
                      onClick={() => openResolveDialog(d.id, "buyer")}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 border border-border text-muted-foreground text-sm rounded-full hover:text-foreground transition-colors"
                    >
                      <XCircle className="size-4" /> Cancel Trade
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Analytics Reports</h2>
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2 border border-border text-sm text-muted-foreground hover:text-foreground rounded-full transition-colors"
              >
                <Download className="size-3.5" /> Export CSV
              </button>
            </div>

            {/* Volume Chart */}
            <div className="bg-card rounded-2xl p-6 border border-border">
              <h3 className="font-semibold text-foreground mb-1">
                Trading Volume (USDT) — Last 14 Days
              </h3>
              <p className="text-xs text-muted-foreground mb-5">
                Total USDT volume traded per day
              </p>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={volumeByDay}>
                    <defs>
                      <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F8EF7" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#4F8EF7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#6b7280", fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#6b7280", fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#111",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "12px",
                        color: "#f5f5f5",
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="volume"
                      stroke="#4F8EF7"
                      strokeWidth={2}
                      fill="url(#volumeGrad)"
                      name="Volume (USDT)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Trade Count Chart */}
            <div className="bg-card rounded-2xl p-6 border border-border">
              <h3 className="font-semibold text-foreground mb-1">
                Trade Count — Last 14 Days
              </h3>
              <p className="text-xs text-muted-foreground mb-5">
                Number of trades initiated per day
              </p>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={tradesByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#6b7280", fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#6b7280", fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#111",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "12px",
                        color: "#f5f5f5",
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="#4F8EF7"
                      radius={[4, 4, 0, 0]}
                      name="Trades"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Payment Methods Pie + Top Traders side-by-side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card rounded-2xl p-6 border border-border">
                <h3 className="font-semibold text-foreground mb-1">
                  Payment Method Distribution
                </h3>
                <p className="text-xs text-muted-foreground mb-5">
                  Breakdown of trades by payment method
                </p>
                {loading ? (
                  <Skeleton className="h-52 w-full" />
                ) : paymentMethodDist.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-10">No data yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={paymentMethodDist}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {paymentMethodDist.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "#111",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: "12px",
                          color: "#f5f5f5",
                          fontSize: 12,
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 12, color: "#9ca3af" }}
                        iconType="circle"
                        iconSize={8}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Top Traders */}
              <div className="bg-card rounded-2xl p-6 border border-border">
                <h3 className="font-semibold text-foreground mb-1">Top Traders</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  By number of completed trades
                </p>
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : topTraders.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-10">No data yet</p>
                ) : (
                  <div className="space-y-2">
                    {topTraders.map((trader, i) => (
                      <div
                        key={trader.username}
                        className="flex items-center justify-between p-3 bg-surface rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <span className="size-6 rounded-full bg-primary/10 text-brand text-xs font-bold flex items-center justify-center">
                            {i + 1}
                          </span>
                          <span className="text-sm font-medium text-foreground">
                            {trader.username}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{trader.trades} trades</span>
                          <span className="font-medium text-brand">
                            {Math.round(trader.volume)} USDT
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Resolve Dispute Dialog */}
      <AlertDialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Resolve Dispute</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              You are ruling in favor of the{" "}
              <span className="font-semibold text-foreground">{resolveAction}</span>. Add an
              optional admin note below.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={resolveNote}
            onChange={(e) => setResolveNote(e.target.value)}
            placeholder="Admin note (optional)..."
            rows={3}
            className="bg-surface border-input text-foreground placeholder:text-muted-foreground resize-none"
          />
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-foreground hover:bg-muted">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResolveDispute}
              disabled={resolveSubmitting}
              className="bg-primary text-primary-foreground hover:opacity-90"
            >
              {resolveSubmitting ? "Resolving..." : "Confirm Resolution"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
