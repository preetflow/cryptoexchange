"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth, api } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Users, ArrowRightLeft, AlertTriangle, TrendingUp, Shield,
  CheckCircle, Download, RefreshCw, LogOut, LayoutDashboard,
  FileText, Ban, BadgeCheck, ChevronRight, Activity,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

type TabId = "overview" | "users" | "trades" | "disputes" | "reports";

interface Stats {
  total_users?: number; total_trades?: number; active_trades?: number;
  completed_trades?: number; disputed_trades?: number; total_volume_usdt?: number;
}
interface UserItem {
  id: string; username: string; email: string; role: string;
  is_verified_trader: boolean; completed_trades: number;
  created_at: string; is_active?: boolean;
}
interface TradeItem {
  id: string; amount_usdt: number; price_inr: number;
  payment_method: string; status: string; created_at: string;
  buyer_info?: { username: string }; seller_info?: { username: string };
}
interface DisputeItem extends TradeItem { dispute_reason?: string; }

const TEAL = "#0ECAD4";
const EMERALD = "#10B981";
const ROSE = "#F43F5E";
const AMBER = "#F59E0B";
const CHART_COLORS = [TEAL, EMERALD, AMBER, ROSE, "#8B5CF6"];

const STATUS_STYLES: Record<string, string> = {
  INITIATED: "bg-sky-500/10 text-sky-400",
  PAYMENT_SENT: "bg-amber-500/10 text-amber-400",
  COMPLETED: "bg-emerald-500/10 text-emerald-400",
  DISPUTED: "bg-rose-500/10 text-rose-400",
  CANCELLED: "bg-zinc-700/40 text-zinc-500",
  EXPIRED: "bg-zinc-700/40 text-zinc-500",
};

const SIDEBAR_TABS: { id: TabId; label: string; Icon: React.ElementType }[] = [
  { id: "overview",  label: "Overview",  Icon: LayoutDashboard },
  { id: "users",     label: "Users",     Icon: Users },
  { id: "trades",    label: "Trades",    Icon: ArrowRightLeft },
  { id: "disputes",  label: "Disputes",  Icon: AlertTriangle },
  { id: "reports",   label: "Reports",   Icon: FileText },
];

// ── Demo data used when no backend is connected ──────────────────────────────
const DEMO_STATS: Stats = {
  total_users: 1284, total_trades: 8732, active_trades: 47,
  completed_trades: 8521, disputed_trades: 12, total_volume_usdt: 4280000,
};
const DEMO_USERS: UserItem[] = [
  { id: "1", username: "alice_trader", email: "alice@example.com", role: "user", is_verified_trader: true,  completed_trades: 342, created_at: "2024-01-10", is_active: true },
  { id: "2", username: "bob_crypto",   email: "bob@example.com",   role: "user", is_verified_trader: false, completed_trades: 87,  created_at: "2024-03-22", is_active: true },
  { id: "3", username: "carol_p2p",    email: "carol@example.com", role: "user", is_verified_trader: true,  completed_trades: 511, created_at: "2023-11-05", is_active: true },
  { id: "4", username: "dave_swap",    email: "dave@example.com",  role: "user", is_verified_trader: false, completed_trades: 23,  created_at: "2024-05-18", is_active: false },
  { id: "5", username: "eve_usdt",     email: "eve@example.com",   role: "user", is_verified_trader: true,  completed_trades: 198, created_at: "2024-02-28", is_active: true },
];
const DEMO_TRADES: TradeItem[] = [
  { id: "tx_001", amount_usdt: 500,  price_inr: 87.4, payment_method: "UPI",      status: "COMPLETED",     created_at: "2025-04-28", buyer_info: { username: "alice_trader" }, seller_info: { username: "bob_crypto" } },
  { id: "tx_002", amount_usdt: 1200, price_inr: 87.6, payment_method: "IMPS",     status: "PAYMENT_SENT",  created_at: "2025-04-29", buyer_info: { username: "carol_p2p" },   seller_info: { username: "eve_usdt" } },
  { id: "tx_003", amount_usdt: 300,  price_inr: 87.2, payment_method: "NEFT",     status: "DISPUTED",      created_at: "2025-04-30", buyer_info: { username: "dave_swap" },   seller_info: { username: "alice_trader" } },
  { id: "tx_004", amount_usdt: 800,  price_inr: 87.8, payment_method: "UPI",      status: "COMPLETED",     created_at: "2025-05-01", buyer_info: { username: "eve_usdt" },    seller_info: { username: "carol_p2p" } },
  { id: "tx_005", amount_usdt: 2000, price_inr: 88.0, payment_method: "Bank",     status: "INITIATED",     created_at: "2025-05-02", buyer_info: { username: "bob_crypto" },  seller_info: { username: "alice_trader" } },
];
const DEMO_DISPUTES: DisputeItem[] = [
  { ...DEMO_TRADES[2], dispute_reason: "Seller did not release USDT after payment confirmed" },
];
const DEMO_VOLUME = [
  { date: "Apr 24", volume: 12400 }, { date: "Apr 25", volume: 18700 }, { date: "Apr 26", volume: 15200 },
  { date: "Apr 27", volume: 21000 }, { date: "Apr 28", volume: 19500 }, { date: "Apr 29", volume: 28000 },
  { date: "Apr 30", volume: 32000 }, { date: "May 1",  volume: 27400 }, { date: "May 2",  volume: 35000 },
  { date: "May 3",  volume: 41200 }, { date: "May 4",  volume: 38000 }, { date: "May 5",  volume: 44800 },
];
const DEMO_COUNT = [
  { date: "Apr 24", count: 24 }, { date: "Apr 25", count: 38 }, { date: "Apr 26", count: 31 },
  { date: "Apr 27", count: 44 }, { date: "Apr 28", count: 40 }, { date: "Apr 29", count: 56 },
  { date: "Apr 30", count: 62 }, { date: "May 1",  count: 51 }, { date: "May 2",  count: 69 },
  { date: "May 3",  count: 82 }, { date: "May 4",  count: 74 }, { date: "May 5",  count: 91 },
];
const DEMO_PAYMENT = [
  { name: "UPI", value: 48 }, { name: "IMPS", value: 27 }, { name: "NEFT", value: 15 }, { name: "Bank Transfer", value: 10 },
];

export default function AdminDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("overview");
  const [stats, setStats] = useState<Stats>({});
  const [users, setUsers] = useState<UserItem[]>([]);
  const [trades, setTrades] = useState<TradeItem[]>([]);
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  // Resolve dialog
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolveTradeId, setResolveTradeId] = useState<string | null>(null);
  const [resolveAction, setResolveAction] = useState<"buyer" | "seller">("buyer");
  const [resolveNote, setResolveNote] = useState("");
  const [resolving, setResolving] = useState(false);

  // Guard
  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    if (user.role !== "admin") { router.push("/dashboard"); }
  }, [user, authLoading, router]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, u, t, d] = await Promise.all([
        api.get("/admin/stats"), api.get("/admin/users"),
        api.get("/admin/trades"), api.get("/admin/disputes"),
      ]);
      setStats(s.data); setUsers(u.data); setTrades(t.data); setDisputes(d.data);
      setIsDemo(false);
    } catch {
      // Fall back to demo data when no backend is connected
      setStats(DEMO_STATS); setUsers(DEMO_USERS); setTrades(DEMO_TRADES);
      setDisputes(DEMO_DISPUTES); setIsDemo(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (user?.role === "admin") fetchAll(); }, [user, fetchAll]);

  const handleVerify = async (userId: string, verify: boolean) => {
    if (isDemo) {
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_verified_trader: verify } : u));
      toast.success(verify ? "User verified (demo)" : "Verification removed (demo)");
      return;
    }
    try {
      await api.patch(`/admin/users/${userId}/verify`, { is_verified_trader: verify });
      toast.success(verify ? "User verified" : "Verification removed");
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_verified_trader: verify } : u));
    } catch { toast.error("Failed"); }
  };

  const handleBan = async (userId: string, ban: boolean) => {
    if (isDemo) {
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_active: !ban } : u));
      toast.success(ban ? "User banned (demo)" : "User unbanned (demo)");
      return;
    }
    try {
      await api.patch(`/admin/users/${userId}/ban`, { is_active: !ban });
      toast.success(ban ? "User banned" : "User unbanned");
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_active: !ban } : u));
    } catch { toast.error("Failed"); }
  };

  const handleResolve = async () => {
    if (!resolveTradeId) return;
    setResolving(true);
    if (isDemo) {
      setDisputes((prev) => prev.filter((d) => d.id !== resolveTradeId));
      toast.success("Dispute resolved (demo)");
      setResolveOpen(false); setResolving(false); return;
    }
    try {
      await api.post(`/admin/disputes/${resolveTradeId}/resolve`, {
        resolution: resolveAction, admin_note: resolveNote,
      });
      toast.success("Dispute resolved");
      setDisputes((prev) => prev.filter((d) => d.id !== resolveTradeId));
      setResolveOpen(false);
    } catch { toast.error("Failed to resolve"); }
    finally { setResolving(false); }
  };

  const exportCSV = () => {
    const rows = [
      ["ID", "Buyer", "Seller", "USDT", "INR Rate", "Payment", "Status", "Date"],
      ...trades.map((t) => [
        t.id, t.buyer_info?.username || "", t.seller_info?.username || "",
        t.amount_usdt, t.price_inr, t.payment_method, t.status,
        new Date(t.created_at).toLocaleDateString(),
      ]),
    ];
    const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" });
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(blob), download: "chainswap-trades.csv",
    });
    a.click(); URL.revokeObjectURL(a.href);
  };

  // Chart data
  const volumeData = isDemo ? DEMO_VOLUME : React.useMemo(() => {
    const m: Record<string, number> = {};
    trades.forEach((t) => {
      const d = new Date(t.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      m[d] = (m[d] || 0) + t.amount_usdt;
    });
    return Object.entries(m).slice(-14).map(([date, volume]) => ({ date, volume: Math.round(volume) }));
  }, [trades]);

  const countData = isDemo ? DEMO_COUNT : React.useMemo(() => {
    const m: Record<string, number> = {};
    trades.forEach((t) => {
      const d = new Date(t.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      m[d] = (m[d] || 0) + 1;
    });
    return Object.entries(m).slice(-14).map(([date, count]) => ({ date, count }));
  }, [trades]);

  const paymentData = isDemo ? DEMO_PAYMENT : React.useMemo(() => {
    const m: Record<string, number> = {};
    trades.forEach((t) => { m[t.payment_method || "Unknown"] = (m[t.payment_method || "Unknown"] || 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [trades]);

  const topTraders = React.useMemo(() => {
    const m: Record<string, { trades: number; volume: number }> = {};
    trades.forEach((t) => {
      [t.buyer_info?.username, t.seller_info?.username].forEach((u) => {
        if (!u) return;
        if (!m[u]) m[u] = { trades: 0, volume: 0 };
        m[u].trades++; m[u].volume += t.amount_usdt || 0;
      });
    });
    return Object.entries(m).sort((a, b) => b[1].volume - a[1].volume).slice(0, 10)
      .map(([username, d]) => ({ username, ...d }));
  }, [trades]);

  const statCards = [
    { label: "Total Users",    value: (stats.total_users ?? 0).toLocaleString(),    icon: Users,            color: TEAL,    bg: "bg-cyan-500/10" },
    { label: "Total Trades",   value: (stats.total_trades ?? 0).toLocaleString(),   icon: ArrowRightLeft,   color: TEAL,    bg: "bg-cyan-500/10" },
    { label: "Active Now",     value: (stats.active_trades ?? 0).toLocaleString(),  icon: Activity,         color: AMBER,   bg: "bg-amber-500/10" },
    { label: "Completed",      value: (stats.completed_trades ?? 0).toLocaleString(), icon: CheckCircle,    color: EMERALD, bg: "bg-emerald-500/10" },
    { label: "Disputes",       value: (stats.disputed_trades ?? 0).toLocaleString(), icon: AlertTriangle,   color: ROSE,    bg: "bg-rose-500/10" },
    { label: "Volume (USDT)",  value: `${((stats.total_volume_usdt ?? 0) / 1000).toFixed(1)}K`, icon: TrendingUp, color: TEAL, bg: "bg-cyan-500/10" },
  ];

  if (authLoading || (!user && !authLoading))
    return (
      <div className="min-h-screen bg-[#060a0d] flex items-center justify-center">
        <div className="animate-spin size-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );

  return (
    <div className="min-h-screen bg-[#060a0d] flex font-sans">
      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <aside className="w-64 shrink-0 border-r border-white/5 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-white/5">
          <div className="size-8 rounded-lg bg-cyan-500/15 flex items-center justify-center">
            <Shield className="size-4 text-cyan-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">ChainSwap</p>
            <p className="text-[10px] text-cyan-500 font-semibold tracking-widest uppercase mt-0.5">Admin Console</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {SIDEBAR_TABS.map(({ id, label, Icon }) => {
            const active = tab === id;
            const isBadge = id === "disputes" && disputes.length > 0;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors group ${
                  active
                    ? "bg-cyan-500/10 text-cyan-400"
                    : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
                }`}
                data-testid={`sidebar-${id}`}
              >
                <Icon className="size-4 shrink-0" />
                <span className="font-medium">{label}</span>
                {isBadge && (
                  <span className="ml-auto size-5 flex items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                    {disputes.length}
                  </span>
                )}
                {active && <ChevronRight className="ml-auto size-3.5 text-cyan-500" />}
              </button>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/3">
            <div className="size-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-cyan-400">
                {user?.username?.[0]?.toUpperCase() ?? "A"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.username}</p>
              <p className="text-[10px] text-cyan-500 font-semibold">Administrator</p>
            </div>
            <button
              onClick={async () => { await logout(); router.push("/login"); }}
              className="text-zinc-600 hover:text-zinc-300 transition-colors"
              title="Sign out"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
          {isDemo && (
            <p className="text-[10px] text-amber-500/70 text-center mt-2 px-1">
              Demo mode — connect a backend to see live data
            </p>
          )}
        </div>
      </aside>

      {/* ── Main area ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8">
          <div>
            <h1 className="text-lg font-bold text-white capitalize">{tab}</h1>
            <p className="text-xs text-zinc-500">
              {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <button
            onClick={fetchAll}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/8 text-xs text-zinc-400 hover:text-zinc-200 hover:border-white/15 transition-colors"
          >
            <RefreshCw className="size-3" /> Refresh
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-8" data-testid="admin-dashboard">

          {/* ── OVERVIEW ───────────────────────────────────────── */}
          {tab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {statCards.map((c) => (
                  <div key={c.label} className="bg-white/3 border border-white/6 rounded-2xl p-5">
                    {loading ? <Skeleton className="h-16 w-full bg-white/5" /> : (
                      <>
                        <div className={`size-8 rounded-lg ${c.bg} flex items-center justify-center mb-3`}>
                          <c.icon className="size-4" style={{ color: c.color }} />
                        </div>
                        <p className="text-2xl font-bold font-stat" style={{ color: c.color }}>{c.value}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{c.label}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Alerts */}
              {disputes.length > 0 && (
                <div className="flex items-start gap-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl p-5">
                  <AlertTriangle className="size-4 text-rose-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {disputes.length} open dispute{disputes.length !== 1 ? "s" : ""} need your attention
                    </p>
                    <button onClick={() => setTab("disputes")} className="text-xs text-rose-400 hover:underline mt-1">
                      View disputes
                    </button>
                  </div>
                </div>
              )}

              {/* Quick stats charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/3 border border-white/6 rounded-2xl p-6">
                  <p className="text-sm font-semibold text-zinc-300 mb-4">Volume (USDT) — Last 12 Days</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={volumeData}>
                      <defs>
                        <linearGradient id="vol" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={TEAL} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={TEAL} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" tick={{ fill: "#52525b", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#52525b", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: "#0e1318", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, fontSize: 12 }} />
                      <Area type="monotone" dataKey="volume" stroke={TEAL} fill="url(#vol)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white/3 border border-white/6 rounded-2xl p-6">
                  <p className="text-sm font-semibold text-zinc-300 mb-4">Trade Count — Last 12 Days</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={countData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" tick={{ fill: "#52525b", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#52525b", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: "#0e1318", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, fontSize: 12 }} />
                      <Bar dataKey="count" fill={EMERALD} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ── USERS ──────────────────────────────────────────── */}
          {tab === "users" && (
            <div className="bg-white/3 border border-white/6 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/6 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-200">All Users
                  <span className="ml-2 text-zinc-500 font-normal">({users.length})</span>
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="users-table">
                  <thead>
                    <tr className="text-left text-xs text-zinc-600 border-b border-white/5">
                      {["Username", "Email", "Role", "Trades", "Status", "Joined", "Actions"].map((h) => (
                        <th key={h} className="px-6 py-3 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-white/5">
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} className="px-6 py-4"><Skeleton className="h-4 w-24 bg-white/5" /></td>
                        ))}
                      </tr>
                    )) : users.map((u) => (
                      <tr key={u.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="size-7 rounded-full bg-cyan-500/15 flex items-center justify-center text-[11px] font-bold text-cyan-400">
                              {u.username[0]?.toUpperCase()}
                            </div>
                            <span className="font-medium text-zinc-200">{u.username}</span>
                            {u.is_verified_trader && (
                              <BadgeCheck className="size-3.5 text-cyan-400" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-zinc-500">{u.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            u.role === "admin" ? "bg-cyan-500/15 text-cyan-400" : "bg-white/5 text-zinc-400"
                          }`}>{u.role}</span>
                        </td>
                        <td className="px-6 py-4 text-zinc-400 font-stat">{u.completed_trades}</td>
                        <td className="px-6 py-4">
                          {u.is_active === false
                            ? <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/10 text-rose-400">Banned</span>
                            : <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400">Active</span>
                          }
                        </td>
                        <td className="px-6 py-4 text-zinc-600 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleVerify(u.id, !u.is_verified_trader)}
                              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                                u.is_verified_trader
                                  ? "border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                                  : "border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                              }`}
                            >
                              {u.is_verified_trader ? "Unverify" : "Verify"}
                            </button>
                            {u.role !== "admin" && (
                              <button
                                onClick={() => handleBan(u.id, u.is_active !== false)}
                                className="text-xs px-3 py-1 rounded-full border border-white/10 text-zinc-500 hover:text-zinc-300 transition-colors"
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

          {/* ── TRADES ─────────────────────────────────────────── */}
          {tab === "trades" && (
            <div className="bg-white/3 border border-white/6 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/6 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-200">All Trades
                  <span className="ml-2 text-zinc-500 font-normal">({trades.length})</span>
                </h2>
                <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 text-xs text-zinc-400 hover:text-zinc-200 transition-colors" data-testid="export-csv-btn">
                  <Download className="size-3" /> Export CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="trades-table">
                  <thead>
                    <tr className="text-left text-xs text-zinc-600 border-b border-white/5">
                      {["Trade ID", "Buyer", "Seller", "Amount", "Rate", "Payment", "Status", "Date"].map((h) => (
                        <th key={h} className="px-6 py-3 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-b border-white/5">
                        {Array.from({ length: 8 }).map((_, j) => (
                          <td key={j} className="px-6 py-4"><Skeleton className="h-4 w-20 bg-white/5" /></td>
                        ))}
                      </tr>
                    )) : trades.map((t) => (
                      <tr key={t.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                        <td className="px-6 py-4 font-mono text-[11px] text-zinc-600">{t.id.slice(0, 10)}…</td>
                        <td className="px-6 py-4 text-zinc-300">{t.buyer_info?.username || "—"}</td>
                        <td className="px-6 py-4 text-zinc-300">{t.seller_info?.username || "—"}</td>
                        <td className="px-6 py-4 text-cyan-400 font-stat font-semibold">{t.amount_usdt} USDT</td>
                        <td className="px-6 py-4 text-zinc-400 font-stat">₹{t.price_inr}</td>
                        <td className="px-6 py-4 text-zinc-500">{t.payment_method}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${STATUS_STYLES[t.status] || "bg-white/5 text-zinc-500"}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-600 text-xs">{new Date(t.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── DISPUTES ───────────────────────────────────────── */}
          {tab === "disputes" && (
            <div className="space-y-4">
              {disputes.length === 0 && !loading && (
                <div className="text-center py-20 text-zinc-600">
                  <CheckCircle className="size-10 mx-auto mb-3 text-emerald-500/40" />
                  <p className="text-sm">No open disputes</p>
                </div>
              )}
              {disputes.map((d) => (
                <div key={d.id} className="bg-white/3 border border-rose-500/15 rounded-2xl p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-zinc-600">{d.id.slice(0, 14)}…</span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/10 text-rose-400">DISPUTED</span>
                      </div>
                      <p className="text-sm font-semibold text-zinc-200 mb-2">
                        {d.buyer_info?.username} vs {d.seller_info?.username} — {d.amount_usdt} USDT
                      </p>
                      {d.dispute_reason && (
                        <p className="text-xs text-zinc-500 bg-white/3 rounded-lg px-3 py-2">
                          &ldquo;{d.dispute_reason}&rdquo;
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => { setResolveTradeId(d.id); setResolveAction("buyer"); setResolveNote(""); setResolveOpen(true); }}
                        className="px-4 py-2 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors border border-cyan-500/20"
                      >
                        Favour Buyer
                      </button>
                      <button
                        onClick={() => { setResolveTradeId(d.id); setResolveAction("seller"); setResolveNote(""); setResolveOpen(true); }}
                        className="px-4 py-2 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors border border-emerald-500/20"
                      >
                        Favour Seller
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── REPORTS ────────────────────────────────────────── */}
          {tab === "reports" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Volume area chart */}
                <div className="bg-white/3 border border-white/6 rounded-2xl p-6">
                  <p className="text-sm font-semibold text-zinc-300 mb-1">Volume Over Time (USDT)</p>
                  <p className="text-xs text-zinc-600 mb-4">Last 12 days of trading volume</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={volumeData}>
                      <defs>
                        <linearGradient id="rVol" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={TEAL} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={TEAL} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="date" tick={{ fill: "#3f3f46", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#3f3f46", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: "#0e1318", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12 }} />
                      <Area type="monotone" dataKey="volume" stroke={TEAL} fill="url(#rVol)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Trade count bar chart */}
                <div className="bg-white/3 border border-white/6 rounded-2xl p-6">
                  <p className="text-sm font-semibold text-zinc-300 mb-1">Trade Count</p>
                  <p className="text-xs text-zinc-600 mb-4">Number of trades per day</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={countData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="date" tick={{ fill: "#3f3f46", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#3f3f46", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: "#0e1318", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="count" fill={EMERALD} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Payment methods pie */}
                <div className="bg-white/3 border border-white/6 rounded-2xl p-6">
                  <p className="text-sm font-semibold text-zinc-300 mb-1">Payment Methods</p>
                  <p className="text-xs text-zinc-600 mb-4">Distribution by payment type</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={paymentData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                        {paymentData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#0e1318", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12, color: "#71717a" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Top traders */}
                <div className="bg-white/3 border border-white/6 rounded-2xl p-6">
                  <p className="text-sm font-semibold text-zinc-300 mb-1">Top Traders</p>
                  <p className="text-xs text-zinc-600 mb-4">By total volume</p>
                  <div className="space-y-2">
                    {topTraders.slice(0, 8).map((t, i) => (
                      <div key={t.username} className="flex items-center gap-3">
                        <span className="text-xs text-zinc-600 w-5 text-right shrink-0">{i + 1}</span>
                        <div className="size-6 rounded-full bg-cyan-500/15 flex items-center justify-center text-[10px] font-bold text-cyan-400 shrink-0">
                          {t.username[0]?.toUpperCase()}
                        </div>
                        <span className="text-xs text-zinc-300 flex-1 truncate">{t.username}</span>
                        <span className="text-xs text-cyan-400 font-stat font-semibold">{Math.round(t.volume).toLocaleString()} USDT</span>
                        <span className="text-xs text-zinc-600 w-14 text-right font-stat">{t.trades} trades</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Resolve Dispute Dialog */}
      <AlertDialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <AlertDialogContent className="bg-[#0e1318] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">
              Resolve Dispute — Favour {resolveAction === "buyer" ? "Buyer" : "Seller"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-500">
              This action is irreversible. The trade will be marked as resolved with the selected outcome.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={resolveNote}
            onChange={(e) => setResolveNote(e.target.value)}
            placeholder="Add an admin note (optional)"
            className="mt-2 bg-white/5 border-white/10 text-zinc-200 placeholder:text-zinc-600 resize-none"
            rows={3}
          />
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 text-zinc-400 hover:bg-white/5">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResolve}
              disabled={resolving}
              className="bg-cyan-500 text-[#060a0d] hover:bg-cyan-400 font-semibold"
            >
              {resolving ? "Resolving…" : "Confirm Resolution"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
