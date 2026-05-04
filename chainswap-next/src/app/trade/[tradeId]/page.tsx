"use client";

import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  use,
} from "react";
import Navbar from "@/components/Navbar";
import { useAuth, api } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Send,
  Upload,
  AlertTriangle,
  CheckCircle,
  Clock,
  MessageCircle,
  Wifi,
  WifiOff,
  Star,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "";

interface TradeInfo {
  username: string;
}

interface Trade {
  id: string;
  is_buyer: boolean;
  is_seller: boolean;
  amount_usdt: number;
  amount_inr?: number;
  price_inr: number;
  payment_method: string;
  network: string;
  payment_window_mins: number;
  trade_terms?: string;
  status: string;
  created_at: string;
  dispute_reason?: string;
  payment_proof_url?: string;
  seller_info?: TradeInfo;
  buyer_info?: TradeInfo;
}

interface Message {
  id: string;
  sender_id: string;
  sender_username: string;
  message: string;
  message_type: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  INITIATED: "bg-primary/10 text-brand",
  PAYMENT_SENT: "bg-amber-500/10 text-amber-400",
  PAYMENT_CONFIRMED: "bg-success/10 text-success",
  COMPLETED: "bg-success/10 text-success",
  DISPUTED: "bg-destructive/10 text-destructive",
  CANCELLED: "bg-muted text-muted-foreground",
  EXPIRED: "bg-muted text-muted-foreground",
};

export default function TradePage({
  params,
}: {
  params: Promise<{ tradeId: string }>;
}) {
  const { tradeId } = use(params);
  const { user } = useAuth();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  // Dispute modal
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);

  // Review state
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTrade = useCallback(async () => {
    try {
      const res = await api.get(`/trades/${tradeId}`);
      setTrade(res.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [tradeId]);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await api.get(`/trades/${tradeId}/messages`);
      setMessages(res.data);
    } catch {
      // silently fail
    }
  }, [tradeId]);

  // WebSocket connection
  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token || !tradeId) return;

    const wsUrl = API_BASE.replace("https://", "wss://").replace(
      "http://",
      "ws://"
    );
    const ws = new WebSocket(
      `${wsUrl}/api/ws/trade/${tradeId}?token=${token}`
    );

    ws.onopen = () => {
      setWsConnected(true);
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "new_message") {
          setMessages((prev) => [
            ...prev,
            {
              id: data.id,
              sender_id: data.sender_id,
              sender_username: data.sender_username,
              message: data.message,
              message_type: data.message_type,
              created_at: data.created_at,
            },
          ]);
        } else if (data.type === "status_update") {
          fetchTrade();
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
      if (!pollRef.current) {
        pollRef.current = setInterval(() => {
          fetchTrade();
          fetchMessages();
        }, 5000);
      }
    };

    ws.onerror = () => setWsConnected(false);
    wsRef.current = ws;

    return () => {
      ws.close();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [tradeId, fetchTrade, fetchMessages]);

  useEffect(() => {
    fetchTrade();
    fetchMessages();
    pollRef.current = setInterval(() => {
      fetchTrade();
      fetchMessages();
    }, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [tradeId, fetchTrade, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!trade) return;
    if (!["INITIATED", "PAYMENT_SENT"].includes(trade.status)) return;
    const interval = setInterval(() => {
      const created = new Date(trade.created_at);
      const deadline = new Date(
        created.getTime() + (trade.payment_window_mins || 30) * 60000
      );
      const diff = deadline.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("EXPIRED");
        clearInterval(interval);
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${mins}:${secs.toString().padStart(2, "0")}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [trade]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ type: "message", message: newMessage })
      );
      setNewMessage("");
    } else {
      try {
        await api.post(`/trades/${tradeId}/messages`, { message: newMessage });
        setNewMessage("");
        fetchMessages();
      } catch {
        toast.error("Failed to send message");
      }
    }
  };

  const updateStatus = async (status: string, disputeReason?: string) => {
    try {
      await api.patch(`/trades/${tradeId}/status`, {
        status,
        dispute_reason: disputeReason,
      });
      toast.success(`Trade status updated to ${status}`);
      fetchTrade();
      fetchMessages();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      toast.error(
        axiosErr?.response?.data?.detail || "Failed to update status"
      );
    }
  };

  const handleDisputeSubmit = async () => {
    if (!disputeReason.trim()) {
      toast.error("Please provide a reason for the dispute");
      return;
    }
    setDisputeSubmitting(true);
    await updateStatus("DISPUTED", disputeReason);
    setDisputeSubmitting(false);
    setDisputeOpen(false);
    setDisputeReason("");
  };

  const handlePaymentProof = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      await api.post(`/trades/${tradeId}/upload-proof`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Payment proof uploaded");
      fetchTrade();
    } catch {
      toast.error("Upload failed");
    }
  };

  const handleReviewSubmit = async () => {
    setReviewSubmitting(true);
    try {
      const counterpartyUsername =
        trade?.is_buyer
          ? trade?.seller_info?.username
          : trade?.buyer_info?.username;
      await api.post(`/users/${counterpartyUsername}/reviews`, {
        trade_id: tradeId,
        rating: reviewRating,
        comment: reviewComment,
      });
      toast.success("Review submitted!");
      setReviewSubmitted(true);
      setReviewOpen(false);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      toast.error(axiosErr?.response?.data?.detail || "Failed to submit review");
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );

  if (!trade)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        Trade not found
      </div>
    );

  const isTimerWarning =
    timeLeft === "EXPIRED" ||
    (timeLeft !== null && parseInt(timeLeft) < 5);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6 w-full" data-testid="trade-page">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="bg-card rounded-2xl p-6 border border-border">
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="font-sans text-xl font-bold text-foreground"
                  data-testid="trade-title"
                >
                  {trade.is_buyer
                    ? `Buy USDT from ${trade.seller_info?.username}`
                    : `Sell USDT to ${trade.buyer_info?.username}`}
                </h2>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[trade.status] || "bg-muted text-muted-foreground"}`}
                  data-testid="trade-status-badge"
                >
                  {trade.status}
                </span>
              </div>

              {/* Timer */}
              {timeLeft &&
                !["COMPLETED", "CANCELLED", "EXPIRED"].includes(trade.status) && (
                  <div
                    className={`flex items-center gap-2 mb-4 p-3 rounded-xl text-sm font-medium ${
                      isTimerWarning
                        ? "bg-destructive/10 text-destructive"
                        : "bg-primary/10 text-brand"
                    }`}
                    data-testid="trade-timer"
                  >
                    <Clock className="size-4" />
                    <span>
                      {timeLeft === "EXPIRED"
                        ? "Payment window expired"
                        : `Time remaining: ${timeLeft}`}
                    </span>
                  </div>
                )}

              {/* Trade Info Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { label: "Amount", value: `${trade.amount_usdt} USDT` },
                  { label: "Total INR", value: `\u20B9${trade.amount_inr?.toFixed(2)}` },
                  { label: "Rate", value: `1 USDT = \u20B9${trade.price_inr}` },
                  { label: "Payment Method", value: trade.payment_method },
                ].map((item) => (
                  <div key={item.label} className="p-4 bg-surface rounded-xl">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>

              {trade.trade_terms && (
                <div className="p-4 bg-surface rounded-xl mb-6">
                  <p className="text-xs text-muted-foreground mb-1">Trade Terms</p>
                  <p className="text-sm text-foreground">{trade.trade_terms}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3" data-testid="trade-actions">
                {trade.status === "INITIATED" && trade.is_buyer && (
                  <>
                    <label className="block w-full cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePaymentProof}
                        className="hidden"
                      />
                      <div className="flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:border-primary hover:text-brand transition-colors">
                        <Upload className="size-4" /> Upload Payment Proof
                      </div>
                    </label>
                    <button
                      onClick={() => updateStatus("PAYMENT_SENT")}
                      className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-full hover:opacity-90 transition-colors"
                      data-testid="payment-sent-btn"
                    >
                      I have sent the payment
                    </button>
                  </>
                )}
                {trade.status === "PAYMENT_SENT" && trade.is_buyer && (
                  <div className="p-4 bg-amber-500/10 rounded-xl text-amber-400 text-sm flex items-center gap-2">
                    <Clock className="size-4" /> Waiting for seller to confirm payment...
                  </div>
                )}
                {trade.status === "PAYMENT_SENT" && trade.is_seller && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => updateStatus("COMPLETED")}
                      className="flex-1 py-3 bg-success text-success-foreground font-semibold rounded-full hover:opacity-90 transition-colors"
                      data-testid="confirm-payment-btn"
                    >
                      <CheckCircle className="size-4 inline mr-1" /> Release USDT
                    </button>
                    <button
                      onClick={() => setDisputeOpen(true)}
                      className="flex-1 py-3 bg-destructive text-destructive-foreground font-semibold rounded-full hover:opacity-90 transition-colors"
                      data-testid="dispute-btn"
                    >
                      <AlertTriangle className="size-4 inline mr-1" /> Dispute
                    </button>
                  </div>
                )}
                {trade.status === "COMPLETED" && (
                  <div
                    className="p-4 bg-success/10 rounded-xl text-success text-sm flex items-center gap-2"
                    data-testid="trade-completed-msg"
                  >
                    <CheckCircle className="size-5" /> Trade Completed Successfully!
                  </div>
                )}
                {trade.status === "DISPUTED" && (
                  <div
                    className="p-4 bg-destructive/10 rounded-xl text-destructive text-sm flex items-center gap-2"
                    data-testid="trade-disputed-msg"
                  >
                    <AlertTriangle className="size-5" /> Trade under review by admin.
                    Reason: {trade.dispute_reason}
                  </div>
                )}
                {trade.status === "EXPIRED" && (
                  <div
                    className="p-4 bg-muted rounded-xl text-muted-foreground text-sm flex items-center gap-2"
                    data-testid="trade-expired-msg"
                  >
                    <Clock className="size-5" /> Trade expired — payment window exceeded.
                    USDT returned to seller.
                  </div>
                )}
                {trade.status === "PAYMENT_SENT" && trade.is_buyer && (
                  <button
                    onClick={() => setDisputeOpen(true)}
                    className="w-full py-2 border border-destructive/40 text-destructive font-medium rounded-full hover:bg-destructive/10 transition-colors text-sm"
                  >
                    Open Dispute
                  </button>
                )}
              </div>
            </div>

            {/* Leave a Review — shown only when trade COMPLETED */}
            {trade.status === "COMPLETED" && !reviewSubmitted && (
              <div className="bg-card rounded-2xl p-6 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">Leave a Review</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Rate your experience with{" "}
                      {trade.is_buyer
                        ? trade.seller_info?.username
                        : trade.buyer_info?.username}
                    </p>
                  </div>
                  <button
                    onClick={() => setReviewOpen(true)}
                    className="px-5 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-full hover:opacity-90 transition-opacity"
                    data-testid="leave-review-btn"
                  >
                    Write Review
                  </button>
                </div>
              </div>
            )}
            {trade.status === "COMPLETED" && reviewSubmitted && (
              <div className="bg-success/10 rounded-2xl p-4 border border-success/20 flex items-center gap-2 text-success text-sm font-medium">
                <CheckCircle className="size-4" /> Review submitted. Thank you!
              </div>
            )}

            {/* Trade Details Panel */}
            <div className="bg-card rounded-2xl p-6 border border-border">
              <h3 className="font-semibold text-foreground mb-3">Trade Details</h3>
              <div className="space-y-2 text-sm">
                {[
                  {
                    label: "Trade ID",
                    value: (
                      <span className="font-mono text-muted-foreground">
                        {trade.id?.slice(0, 12)}...
                      </span>
                    ),
                  },
                  { label: "Network", value: trade.network },
                  { label: "Payment Window", value: `${trade.payment_window_mins} minutes` },
                  { label: "Created", value: new Date(trade.created_at).toLocaleString() },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="text-foreground">{row.value}</span>
                  </div>
                ))}
                {trade.payment_proof_url && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Proof</span>
                    <a
                      href={`${API_BASE}${trade.payment_proof_url}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand hover:underline"
                    >
                      View
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel — Chat */}
          <div className="lg:col-span-5">
            <div
              className="bg-card rounded-2xl border border-border flex flex-col h-[calc(100vh-120px)] sticky top-20"
              data-testid="trade-chat"
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="size-5 text-brand" />
                  <h3 className="font-semibold text-foreground">Trade Chat</h3>
                </div>
                <div className="flex items-center gap-1 text-xs" data-testid="ws-status">
                  {wsConnected ? (
                    <>
                      <Wifi className="size-3 text-success" />
                      <span className="text-success">Live</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="size-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Polling</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`${
                      msg.sender_id === "system"
                        ? "text-center"
                        : msg.sender_id === user?.id
                        ? "text-right"
                        : "text-left"
                    }`}
                  >
                    {msg.sender_id === "system" ? (
                      <p className="text-xs text-muted-foreground italic py-1">
                        {msg.message}
                      </p>
                    ) : (
                      <div
                        className={`inline-block max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                          msg.sender_id === user?.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-surface text-foreground"
                        }`}
                      >
                        <p className="text-[10px] font-medium opacity-70 mb-0.5">
                          {msg.sender_username}
                        </p>
                        <p>{msg.message}</p>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Replies */}
              <div className="px-4 py-2 border-t border-border flex gap-2 overflow-x-auto">
                {["Payment sent", "Please check your account", "Waiting for confirmation"].map(
                  (qr) => (
                    <button
                      key={qr}
                      onClick={() => setNewMessage(qr)}
                      className="px-3 py-1 bg-muted text-muted-foreground text-xs rounded-full whitespace-nowrap hover:text-foreground transition-colors"
                    >
                      {qr}
                    </button>
                  )
                )}
              </div>

              <form
                onSubmit={sendMessage}
                className="p-4 border-t border-border flex gap-2"
              >
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 px-4 py-2 bg-background border border-input rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  placeholder="Type a message..."
                  data-testid="chat-message-input"
                />
                <button
                  type="submit"
                  className="p-2 bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-colors"
                  data-testid="chat-send-btn"
                >
                  <Send className="size-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Dispute Dialog */}
      <AlertDialog open={disputeOpen} onOpenChange={setDisputeOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Open a Dispute</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Please describe why you are opening a dispute. An admin will review your case.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            placeholder="Describe the issue in detail..."
            rows={4}
            className="bg-surface border-input text-foreground placeholder:text-muted-foreground resize-none"
          />
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-foreground hover:bg-muted">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisputeSubmit}
              disabled={disputeSubmitting}
              className="bg-destructive text-destructive-foreground hover:opacity-90"
            >
              {disputeSubmitting ? "Submitting..." : "Submit Dispute"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Review Dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Leave a Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Rating</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setReviewRating(s)}>
                    <Star
                      className={`size-7 transition-colors ${
                        s <= reviewRating
                          ? "text-amber-400 fill-amber-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Comment (optional)</p>
              <Textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your experience..."
                rows={3}
                className="bg-surface border-input text-foreground placeholder:text-muted-foreground resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setReviewOpen(false)}
              className="px-5 py-2 border border-border text-foreground text-sm rounded-full hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleReviewSubmit}
              disabled={reviewSubmitting}
              className="px-5 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-full hover:opacity-90 transition-opacity disabled:opacity-50"
              data-testid="submit-review-btn"
            >
              {reviewSubmitting ? "Submitting..." : "Submit Review"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
