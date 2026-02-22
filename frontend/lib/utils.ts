import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(dateStr: string): string {
  return `${formatDate(dateStr)} at ${formatTime(dateStr)}`;
}

export function getDurationLabel(startStr: string, endStr: string): string {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const minutes = Math.round((end.getTime() - start.getTime()) / 60000);
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export const CLASS_TYPE_COLORS: Record<string, string> = {
  Yoga: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  HIIT: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  Pilates: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Cycling: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  Strength: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  Barre: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  default: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

export function getTypeColor(type: string): string {
  return CLASS_TYPE_COLORS[type] || CLASS_TYPE_COLORS.default;
}
