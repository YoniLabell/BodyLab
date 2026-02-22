"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CLASS_TYPES = ["All", "Yoga", "HIIT", "Pilates", "Cycling", "Strength", "Barre"];

interface FilterBarProps {
  onFiltersChange: (filters: {
    q?: string;
    type?: string;
    instructor?: string;
  }) => void;
  sticky?: boolean;
}

export function FilterBar({ onFiltersChange, sticky = true }: FilterBarProps) {
  const [q, setQ] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [debouncedQ, setDebouncedQ] = useState("");

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    onFiltersChange({
      q: debouncedQ || undefined,
      type: selectedType !== "All" ? selectedType : undefined,
    });
  }, [debouncedQ, selectedType, onFiltersChange]);

  const hasFilters = q || selectedType !== "All";

  const reset = () => {
    setQ("");
    setSelectedType("All");
  };

  return (
    <div className={cn(
      "w-full",
      sticky && "sticky top-16 z-40 pt-4 pb-3"
    )}>
      <div className={cn(
        "rounded-2xl border bg-background/80 backdrop-blur-xl p-4 shadow-sm",
        sticky && "shadow-md"
      )}>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search classes, instructors..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className={cn(
                "h-10 w-full rounded-xl border border-input bg-transparent pl-9 pr-4 text-sm",
                "focus:outline-none focus:ring-2 focus:ring-ring transition-shadow duration-200",
                "placeholder:text-muted-foreground"
              )}
            />
            {q && (
              <button
                onClick={() => setQ("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Type filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {CLASS_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={cn(
                  "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150",
                  selectedType === type
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {type}
              </button>
            ))}
          </div>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={reset} className="shrink-0">
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
