"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight, Dumbbell, Zap, Users, Clock, Shield, Star,
  Calendar, CheckCircle2, ChevronRight, Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { AuthProvider } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "Browse and book classes up to 2 weeks in advance with real-time availability.",
    color: "from-violet-500 to-indigo-600",
  },
  {
    icon: Zap,
    title: "Instant Waitlist",
    description: "Join the waitlist and get automatic spot offers when someone cancels.",
    color: "from-amber-400 to-orange-500",
  },
  {
    icon: Users,
    title: "Expert Instructors",
    description: "Train with certified professionals across yoga, HIIT, pilates, and more.",
    color: "from-emerald-400 to-teal-500",
  },
  {
    icon: Clock,
    title: "Flexible Cancellation",
    description: "Cancel anytime and free up your spot for the community waitlist.",
    color: "from-pink-400 to-rose-500",
  },
];

const CLASS_TYPES = [
  { name: "Vinyasa Yoga", duration: "60 min", instructor: "Sarah Chen", spots: 4, color: "from-emerald-400 to-teal-500" },
  { name: "Power HIIT", duration: "45 min", instructor: "Marcus Rivera", spots: 2, color: "from-red-400 to-rose-500" },
  { name: "Core Pilates", duration: "55 min", instructor: "Emma Walsh", spots: 8, color: "from-blue-400 to-indigo-500" },
  { name: "Spin & Burn", duration: "45 min", instructor: "Jake Thompson", spots: 0, color: "from-orange-400 to-amber-500" },
];

const STATS = [
  { label: "Active members", value: "2,400+" },
  { label: "Classes per week", value: "60+" },
  { label: "Expert instructors", value: "12" },
  { label: "Avg. rating", value: "4.9★" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export function LandingContent() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <Header studioSlug="bodylab-demo" />

        {/* Hero */}
        <section className="relative overflow-hidden pt-20 pb-32">
          {/* Background decorations */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 -left-40 h-[500px] w-[500px] rounded-full bg-violet-100/50 blur-3xl dark:bg-violet-900/20" />
            <div className="absolute bottom-0 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-100/50 blur-3xl dark:bg-indigo-900/20" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="text-center max-w-4xl mx-auto"
            >
              <motion.div variants={itemVariants} className="mb-6">
                <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-sm font-medium text-violet-700 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  Premium fitness studio booking
                </span>
              </motion.div>

              <motion.h1
                variants={itemVariants}
                className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.08] mb-6"
              >
                Train smarter,{" "}
                <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  live better
                </span>
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="text-xl text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto"
              >
                Book world-class fitness classes with expert instructors.
                Real-time availability, smart waitlisting, and a community that keeps you motivated.
              </motion.p>

              <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Button size="xl" variant="gradient" asChild>
                  <Link href="/bodylab-demo/schedule">
                    Browse schedule
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="xl" variant="outline" asChild>
                  <Link href="/signup">
                    Create free account
                  </Link>
                </Button>
              </motion.div>

              {/* Stats */}
              <motion.div
                variants={itemVariants}
                className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto"
              >
                {STATS.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>

          {/* Floating class cards preview */}
          <div className="mt-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3"
            >
              {CLASS_TYPES.map((cls, i) => (
                <motion.div
                  key={cls.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="relative rounded-2xl overflow-hidden border bg-card p-4 shadow-sm hover:shadow-lg transition-all cursor-default"
                >
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${cls.color}`} />
                  <div className="mt-1">
                    <p className="font-semibold text-sm">{cls.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{cls.instructor}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-muted-foreground">{cls.duration}</span>
                      <span className={cn(
                        "text-xs font-medium",
                        cls.spots === 0 ? "text-red-500" : cls.spots <= 3 ? "text-amber-500" : "text-emerald-600"
                      )}>
                        {cls.spots === 0 ? "Full" : `${cls.spots} left`}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Everything you need to{" "}
                <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                  stay consistent
                </span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Designed for fitness enthusiasts who take their training seriously.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {FEATURES.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className="group flex gap-5 rounded-2xl border bg-card p-6 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm",
                      feature.color
                    )}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 p-12 shadow-2xl"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to start your journey?
              </h2>
              <p className="text-violet-100 text-lg mb-8">
                Join thousands of members achieving their fitness goals with BodyLab.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="xl" className="bg-white text-violet-700 hover:bg-violet-50 shadow-lg" asChild>
                  <Link href="/signup">
                    Get started for free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="xl" variant="ghost" className="text-white hover:bg-white/10" asChild>
                  <Link href="/bodylab-demo/schedule">
                    View schedule
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Dumbbell className="h-4 w-4 text-primary" />
                BodyLab
              </div>
              <p className="text-sm text-muted-foreground">
                © 2025 BodyLab. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </AuthProvider>
  );
}
