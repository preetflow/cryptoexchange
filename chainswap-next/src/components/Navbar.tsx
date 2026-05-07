"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, api } from "@/contexts/AuthContext";
import {
  Bell,
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
  LayoutDashboard,
  Shield,
  ArrowRightLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      api
        .get("/notifications/unread-count")
        .then((r) => setUnreadCount(r.data.count))
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const navLinks = [
    { href: "/buy", label: "Buy USDT" },
    { href: "/sell", label: "Sell USDT" },
    { href: "/create-offer", label: "Create Offer" },
  ];

  return (
    <nav
      className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border"
      data-testid="navbar"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-black text-xl text-foreground"
            data-testid="nav-logo"
          >
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
              <ArrowRightLeft className="size-4" />
            </div>
            <span>ChainSwap</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <Link
                href="/dashboard"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                data-testid="nav-dashboard"
              >
                Dashboard
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Notifications */}
                <Link
                  href="/dashboard"
                  className="relative p-2"
                  data-testid="nav-notifications"
                >
                  <Bell className="size-5 text-muted-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 size-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Link>

                {/* User dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 text-sm font-medium text-foreground"
                    data-testid="nav-user-menu"
                  >
                    <div className="size-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                      {user.username?.charAt(0).toUpperCase()}
                    </div>
                    <ChevronDown className="size-4 text-muted-foreground" />
                  </button>

                  {userMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-lg py-2 z-50"
                      data-testid="user-dropdown"
                    >
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <LayoutDashboard className="size-4" /> Dashboard
                      </Link>
                      <Link
                        href={`/user/${user.username}`}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="size-4" /> Profile
                      </Link>
                      {user.role === "admin" && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Shield className="size-4" /> Admin Panel
                        </Link>
                      )}
                      <div className="border-t border-border my-1" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-muted w-full transition-colors"
                        data-testid="nav-logout"
                      >
                        <LogOut className="size-4" /> Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="nav-login"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-full hover:opacity-90 transition-opacity"
                  data-testid="nav-register"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile toggle */}
            <button
              className="md:hidden p-2 text-foreground"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden px-4 pb-4 bg-card border-t border-border">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "block py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              )}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {user && (
            <Link
              href="/dashboard"
              className="block py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Dashboard
            </Link>
          )}
          {!user && (
            <div className="flex gap-3 mt-3">
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground"
                onClick={() => setMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-4 py-1.5 bg-primary text-primary-foreground text-sm font-semibold rounded-full"
                onClick={() => setMenuOpen(false)}
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
