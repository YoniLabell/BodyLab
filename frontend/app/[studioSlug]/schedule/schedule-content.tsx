"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Header } from "@/components/layout/header";
import { FilterBar } from "@/components/filter-bar";
import { SessionCard } from "@/components/session-card";
import { SkeletonList } from "@/components/skeleton-list";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { studios, ClassSession, APIError } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";

interface ScheduleContentProps {
  studioSlug: string;
}

function ScheduleInner({ studioSlug }: ScheduleContentProps) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<{ q?: string; type?: string }>({});
  const filtersRef = useRef(filters);

  const fetchSessions = useCallback(async (pg: number = 1, f = filtersRef.current) => {
    setLoading(true);
    try {
      const now = new Date();
      const from = now.toISOString();
      const to = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();

      const fn = user ? studios.schedule : studios.schedulePublic;
      const res = await fn(studioSlug, { from, to, ...f, page: pg, page_size: 20 });
      setSessions(res.data.sessions);
      setTotalPages(res.data.pages);
      setTotal(res.data.total);
      setPage(pg);
    } catch (err) {
      toast({ variant: "destructive", title: "Failed to load schedule" });
    } finally {
      setLoading(false);
    }
  }, [studioSlug, user]);

  useEffect(() => {
    filtersRef.current = filters;
    fetchSessions(1, filters);
  }, [filters, fetchSessions]);

  const handleBook = async (session: ClassSession) => {
    if (!user) return;
    setActionLoading(session.id);
    try {
      const res = await studios.book(studioSlug, session.id) as any;
      const isWaitlist = res?.data?.type === "waitlist";
      toast({
        title: isWaitlist ? "Added to waitlist" : "Booked!",
        description: isWaitlist
          ? `You're #${res.data.entry?.position} on the waitlist.`
          : `You're booked for ${session.title}.`,
        variant: isWaitlist ? "default" : "success" as any,
      });
      fetchSessions(page, filters);
    } catch (err) {
      const msg = err instanceof APIError ? err.message : "Booking failed";
      toast({ variant: "destructive", title: "Booking failed", description: msg });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (session: ClassSession) => {
    setActionLoading(session.id);
    try {
      await studios.cancel(studioSlug, session.id);
      toast({ title: "Booking cancelled", description: "Your spot has been freed." });
      fetchSessions(page, filters);
    } catch (err) {
      const msg = err instanceof APIError ? err.message : "Cancellation failed";
      toast({ variant: "destructive", title: "Cancel failed", description: msg });
    } finally {
      setActionLoading(null);
    }
  };

  const handleWaitlist = async (session: ClassSession) => {
    setActionLoading(session.id);
    try {
      const res = await studios.waitlist(studioSlug, session.id) as any;
      toast({
        title: "Added to waitlist",
        description: `You're #${res.data?.position} on the waitlist.`,
      });
      fetchSessions(page, filters);
    } catch (err) {
      const msg = err instanceof APIError ? err.message : "Failed to join waitlist";
      toast({ variant: "destructive", title: "Waitlist failed", description: msg });
    } finally {
      setActionLoading(null);
    }
  };

  // Group sessions by date
  const grouped = sessions.reduce<Record<string, ClassSession[]>>((acc, s) => {
    const key = formatDate(s.start_at);
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      <Header studioSlug={studioSlug} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Page title */}
        <div className="pt-8 pb-2">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-3xl font-bold tracking-tight">Class Schedule</h1>
            <p className="text-muted-foreground mt-1">
              {total > 0 ? `${total} classes over the next 14 days` : "Next 14 days"}
            </p>
          </motion.div>
        </div>

        {/* Filter bar */}
        <FilterBar onFiltersChange={setFilters} />

        {/* Content */}
        <div className="mt-4">
          {loading ? (
            <SkeletonList count={8} />
          ) : sessions.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No classes found"
              description="Try adjusting your filters or check back later for new classes."
              action={{ label: "Clear filters", onClick: () => setFilters({}) }}
            />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={JSON.stringify(filters) + page}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {Object.entries(grouped).map(([date, dateSessions]) => (
                  <div key={date} className="mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        {date}
                      </div>
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-xs text-muted-foreground">{dateSessions.length} class{dateSessions.length !== 1 ? "es" : ""}</span>
                    </div>
                    <div className="space-y-3">
                      {dateSessions.map((session, i) => (
                        <SessionCard
                          key={session.id}
                          session={session}
                          onBook={handleBook}
                          onCancel={handleCancel}
                          onWaitlist={handleWaitlist}
                          loading={actionLoading === session.id}
                          isAuthenticated={!!user}
                          index={i}
                        />
                      ))}
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchSessions(page - 1, filters)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchSessions(page + 1, filters)}
                      disabled={page === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
}

export function ScheduleContent({ studioSlug }: ScheduleContentProps) {
  return (
    <AuthProvider>
      <ScheduleInner studioSlug={studioSlug} />
    </AuthProvider>
  );
}
