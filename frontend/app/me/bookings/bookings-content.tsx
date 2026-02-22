"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, User, CheckCircle2, AlertTriangle } from "lucide-react";
import { Header } from "@/components/layout/header";
import { SkeletonList } from "@/components/skeleton-list";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { me, studios, Booking, APIError } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { formatDate, formatTime, getDurationLabel, getTypeColor, cn } from "@/lib/utils";

function BookingsInner() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await me.bookings();
      setBookings(res.data);
    } catch {
      toast({ variant: "destructive", title: "Failed to load bookings" });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (booking: Booking) => {
    if (confirmCancel !== booking.id) {
      setConfirmCancel(booking.id);
      return;
    }

    setCancellingId(booking.id);
    try {
      await studios.cancel("bodylab-demo", booking.session.id);
      toast({ title: "Booking cancelled", description: "Your spot has been freed." });
      setBookings((prev) => prev.filter((b) => b.id !== booking.id));
    } catch (err) {
      const msg = err instanceof APIError ? err.message : "Cancellation failed";
      toast({ variant: "destructive", title: "Cancel failed", description: msg });
    } finally {
      setCancellingId(null);
      setConfirmCancel(null);
    }
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header studioSlug="bodylab-demo" />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="pt-8 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
            <p className="text-muted-foreground mt-1">Your upcoming classes</p>
          </motion.div>
        </div>

        {loading ? (
          <SkeletonList count={4} />
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No upcoming bookings"
            description="You don't have any upcoming classes booked. Browse the schedule to find a class."
            action={{
              label: "Browse schedule",
              onClick: () => router.push("/bodylab-demo/schedule"),
            }}
          />
        ) : (
          <AnimatePresence>
            <div className="space-y-3">
              {bookings.map((booking, i) => {
                const session = booking.session;
                const isCancelling = cancellingId === booking.id;
                const isConfirming = confirmCancel === booking.id;

                return (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="group relative rounded-2xl border bg-card p-5 shadow-sm hover:shadow-md transition-all"
                  >
                    {/* Booked indicator */}
                    <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl bg-emerald-500" />

                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 pl-2">
                      {/* Date/time */}
                      <div className="flex sm:flex-col gap-3 sm:gap-1 min-w-[110px]">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {formatDate(session.start_at)}
                        </div>
                        <div className="text-lg font-bold tabular-nums">
                          {formatTime(session.start_at)}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {getDurationLabel(session.start_at, session.end_at)}
                        </div>
                      </div>

                      <div className="hidden sm:block w-px h-14 bg-border" />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                            getTypeColor(session.type)
                          )}>
                            {session.type}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" />
                            Confirmed
                          </span>
                        </div>
                        <h3 className="text-base font-semibold">{session.title}</h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                          <User className="h-3.5 w-3.5" />
                          {session.instructor}
                        </div>
                      </div>

                      {/* Cancel button */}
                      <div className="flex items-center gap-2">
                        {isConfirming ? (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400">
                              <AlertTriangle className="h-4 w-4" />
                              Confirm cancel?
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleCancel(booking)}
                              loading={isCancelling}
                            >
                              Yes, cancel
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setConfirmCancel(null)}
                            >
                              Keep
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancel(booking)}
                            className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}

export function BookingsContent() {
  return (
    <AuthProvider>
      <BookingsInner />
    </AuthProvider>
  );
}
