"use client";

import { motion } from "framer-motion";
import { Clock, Users, User, MapPin, CheckCircle2, Clock3, ListOrdered } from "lucide-react";
import { formatTime, formatDate, getDurationLabel, getTypeColor, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ClassSession } from "@/lib/api";

interface SessionCardProps {
  session: ClassSession;
  onBook?: (session: ClassSession) => void;
  onCancel?: (session: ClassSession) => void;
  onWaitlist?: (session: ClassSession) => void;
  loading?: boolean;
  isAuthenticated?: boolean;
  index?: number;
}

export function SessionCard({
  session,
  onBook,
  onCancel,
  onWaitlist,
  loading,
  isAuthenticated,
  index = 0,
}: SessionCardProps) {
  const spotsPercent = session.capacity > 0
    ? Math.round(((session.capacity - session.spots_left) / session.capacity) * 100)
    : 100;

  const isBooked = session.user_booking_status === "booked";
  const isWaitlisted = session.user_booking_status === "waitlist";
  const isAlmostFull = session.spots_left > 0 && session.spots_left <= 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className="group"
    >
      <div className={cn(
        "relative flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border bg-card p-5 shadow-sm transition-all duration-200",
        "hover:shadow-md hover:border-primary/20",
        isBooked && "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800/50 dark:bg-emerald-950/20",
        isWaitlisted && "border-amber-200 bg-amber-50/50 dark:border-amber-800/50 dark:bg-amber-950/20",
      )}>
        {/* Date/Time column */}
        <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-1 min-w-[100px]">
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

        {/* Divider */}
        <div className="hidden sm:block w-px h-14 bg-border" />

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
              getTypeColor(session.type)
            )}>
              {session.type}
            </span>
            {isBooked && (
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                Booked
              </span>
            )}
            {isWaitlisted && (
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                <ListOrdered className="h-3 w-3" />
                Waitlist #{session.waitlist_position}
              </span>
            )}
          </div>

          <h3 className="text-base font-semibold truncate">{session.title}</h3>

          <div className="flex flex-wrap items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              {session.instructor}
            </span>
          </div>
        </div>

        {/* Availability + CTA */}
        <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 min-w-[120px]">
          {/* Spot meter */}
          <div className="flex-1 sm:flex-none w-full sm:w-28">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className={cn(
                "font-medium",
                session.is_full ? "text-red-500" : isAlmostFull ? "text-amber-500" : "text-emerald-600"
              )}>
                {session.is_full ? "Full" : `${session.spots_left} left`}
              </span>
              <span className="text-muted-foreground flex items-center gap-0.5">
                <Users className="h-3 w-3" />
                {session.capacity}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${spotsPercent}%` }}
                transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.05 + 0.2 }}
                className={cn(
                  "h-full rounded-full",
                  spotsPercent >= 90 ? "bg-red-500" :
                  spotsPercent >= 70 ? "bg-amber-500" : "bg-emerald-500"
                )}
              />
            </div>
          </div>

          {/* CTA */}
          {isBooked ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCancel?.(session)}
              disabled={loading}
              className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:text-red-400"
            >
              Cancel
            </Button>
          ) : isWaitlisted ? (
            <Button size="sm" variant="outline" disabled className="opacity-60">
              <Clock3 className="h-3.5 w-3.5 mr-1.5" />
              Waitlisted
            </Button>
          ) : session.is_full ? (
            isAuthenticated ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onWaitlist?.(session)}
                disabled={loading}
                className="border-amber-200 text-amber-700 hover:bg-amber-50"
              >
                Join waitlist
              </Button>
            ) : (
              <Button size="sm" variant="outline" disabled>Full</Button>
            )
          ) : (
            isAuthenticated ? (
              <Button
                size="sm"
                variant="gradient"
                onClick={() => onBook?.(session)}
                disabled={loading}
                loading={loading}
              >
                Book now
              </Button>
            ) : (
              <Button size="sm" variant="outline" asChild>
                <a href="/login">Sign in to book</a>
              </Button>
            )
          )}
        </div>
      </div>
    </motion.div>
  );
}
