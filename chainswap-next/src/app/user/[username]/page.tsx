"use client";

import React, { useEffect, useState, use } from "react";
import Navbar from "@/components/Navbar";
import { Star, CheckCircle, User, Award } from "lucide-react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "";

interface Offer {
  id: string;
  type: string;
  network: string;
  payment_methods?: string[];
  price_inr: number;
}

interface Profile {
  username: string;
  is_verified_trader: boolean;
  created_at: string;
  completed_trades: number;
  completion_rate: number;
  total_trades: number;
  offers?: Offer[];
}

interface Review {
  id: string;
  reviewer_username: string;
  rating: number;
  comment?: string;
}

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, reviewsRes] = await Promise.all([
          axios.get(`${API}/api/users/${username}`),
          axios.get(`${API}/api/users/${username}/reviews`),
        ]);
        setProfile(profileRes.data);
        setReviews(reviewsRes.data);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [username]);

  if (loading)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );

  if (!profile)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        User not found
      </div>
    );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main
        className="max-w-4xl mx-auto px-4 py-8 w-full"
        data-testid="user-profile-page"
      >
        {/* Profile Header */}
        <div className="bg-card rounded-2xl p-8 border border-border mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="size-8 text-brand" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1
                  className="font-sans text-2xl font-bold text-foreground"
                  data-testid="profile-username"
                >
                  {profile.username}
                </h1>
                {profile.is_verified_trader && (
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-brand rounded-full text-xs font-semibold"
                    data-testid="verified-badge"
                  >
                    <Award className="size-3.5" /> Verified Trader
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Member since{" "}
                {profile.created_at
                  ? new Date(profile.created_at).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Completed Trades",
                value: profile.completed_trades || 0,
                color: "text-foreground",
              },
              {
                label: "Completion Rate",
                value: `${profile.completion_rate || 0}%`,
                color: "text-success",
              },
              {
                label: "Total Trades",
                value: profile.total_trades || 0,
                color: "text-foreground",
              },
              {
                label: "Active Offers",
                value: profile.offers?.length || 0,
                color: "text-brand",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-4 bg-surface rounded-xl text-center"
              >
                <p className={`text-2xl font-bold font-sans ${stat.color}`}>
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Active Offers */}
        {profile.offers && profile.offers.length > 0 && (
          <div className="bg-card rounded-2xl p-6 border border-border mb-6">
            <h3 className="font-semibold text-foreground mb-4">
              Active Offers
            </h3>
            <div className="space-y-3">
              {profile.offers.map((offer) => (
                <div
                  key={offer.id}
                  className="p-4 bg-surface rounded-xl flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {offer.type === "sell" ? "Selling" : "Buying"} USDT
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {offer.network} | {offer.payment_methods?.join(", ")}
                    </p>
                  </div>
                  <p className="font-bold text-brand">
                    &#8377;{offer.price_inr}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h3 className="font-semibold text-foreground mb-4">
            Reviews ({reviews.length})
          </h3>
          {reviews.length === 0 ? (
            <p className="text-muted-foreground text-sm">No reviews yet</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="p-4 bg-surface rounded-xl"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-foreground text-sm">
                      {review.reviewer_username}
                    </p>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`size-3 ${
                            s <= review.rating
                              ? "text-amber-400 fill-amber-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground">
                      {review.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
