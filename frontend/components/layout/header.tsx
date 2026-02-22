"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Dumbbell, Moon, Sun, User, LogOut, LayoutDashboard, Calendar } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface HeaderProps {
  studioSlug?: string;
}

export function Header({ studioSlug }: HeaderProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    toast({ title: "Signed out", description: "See you next time!" });
    router.push("/");
  };

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm"
          : "bg-background/60 backdrop-blur-sm"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-sm group-hover:shadow-md transition-shadow">
              <Dumbbell className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">BodyLab</span>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            {studioSlug && (
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/${studioSlug}/schedule`}>
                  <Calendar className="h-4 w-4 mr-1.5" />
                  Schedule
                </Link>
              </Button>
            )}

            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-xl"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            )}

            {user ? (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/me/bookings">
                    <Calendar className="h-4 w-4 mr-1.5" />
                    Bookings
                  </Link>
                </Button>
                {user.is_admin && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/admin">
                      <LayoutDashboard className="h-4 w-4 mr-1.5" />
                      Admin
                    </Link>
                  </Button>
                )}
                <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 text-white text-xs font-bold">
                    {user.name[0].toUpperCase()}
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button size="sm" variant="gradient" asChild>
                  <Link href="/signup">Get started</Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </motion.header>
  );
}
