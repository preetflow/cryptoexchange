"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, api } from "@/contexts/AuthContext";
import {
  Bell,
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
  LayoutDashboard,
  ArrowRightLeft,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      api.get("/notifications/unread-count").then((r) => setUnreadCount(r.data.count)).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    router.push("/");
  };

  const navLinks = [
    { href: "/buy", label: "Buy USDT" },
    { href: "/sell", label: "Sell USDT" },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-[62px]">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0" data-testid="nav-logo">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center glow-teal">
              <ArrowRightLeft className="size-4 text-primary-foreground" />
            </div>
            <span className="font-black text-[17px] tracking-tight text-foreground">ChainSwap</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActive(link.href)
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <>
                <Link
                  href="/create-offer"
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                    isActive("/create-offer")
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                >
                  <Plus className="size-3.5" />
                  Post Offer
                </Link>
                <Link
                  href="/dashboard"
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                    isActive("/dashboard")
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                  data-testid="nav-dashboard"
                >
                  Dashboard
                </Link>
              </>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* Notification bell */}
                <Link href="/dashboard" className="relative p-2 rounded-lg hover:bg-white/5 transition-colors" data-testid="nav-notifications">
                  <Bell className="size-[18px] text-muted-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 size-[7px] bg-primary rounded-full" />
                  )}
                </Link>

                {/* User dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                    data-testid="nav-user-menu"
                  >
                    <div className="size-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                      {user.username?.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-foreground max-w-[100px] truncate">
                      {user.username}
                    </span>
                    <ChevronDown className="size-3.5 text-muted-foreground" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-1.5 w-52 bg-card border border-border rounded-xl shadow-2xl shadow-black/50 py-1.5 z-50" data-testid="user-dropdown">
                      <div className="px-3 py-2 border-b border-border mb-1">
                        <p className="text-xs font-semibold text-foreground truncate">{user.username}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <Link href="/dashboard" className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-white/5 transition-colors" onClick={() => setUserMenuOpen(false)}>
                        <LayoutDashboard className="size-4 text-muted-foreground" /> Dashboard
                      </Link>
                      <Link href={`/user/${user.username}`} className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-white/5 transition-colors" onClick={() => setUserMenuOpen(false)}>
                        <User className="size-4 text-muted-foreground" /> My Profile
                      </Link>
                      <div className="border-t border-border my-1" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-destructive hover:bg-white/5 w-full transition-colors"
                        data-testid="nav-logout"
                      >
                        <LogOut className="size-4" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-login">
                  Sign In
                </Link>
                <Link href="/register" className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity glow-teal" data-testid="nav-register">
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile toggle */}
            <button className="md:hidden p-2 rounded-lg hover:bg-white/5 text-foreground transition-colors" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-card">
          <div className="px-4 py-3 flex flex-col gap-0.5">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className={cn("py-2.5 px-3 text-sm rounded-lg transition-colors", isActive(link.href) ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-white/5")} onClick={() => setMenuOpen(false)}>
                {link.label}
              </Link>
            ))}
            {user && (
              <>
                <Link href="/create-offer" className="py-2.5 px-3 text-sm rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors" onClick={() => setMenuOpen(false)}>Post Offer</Link>
                <Link href="/dashboard" className="py-2.5 px-3 text-sm rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              </>
            )}
            {!user && (
              <div className="flex gap-2 pt-2 mt-1 border-t border-border">
                <Link href="/login" className="flex-1 py-2 text-center text-sm font-medium text-muted-foreground border border-border rounded-lg" onClick={() => setMenuOpen(false)}>Sign In</Link>
                <Link href="/register" className="flex-1 py-2 text-center text-sm font-semibold bg-primary text-primary-foreground rounded-lg" onClick={() => setMenuOpen(false)}>Get Started</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
