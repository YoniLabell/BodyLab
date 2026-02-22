"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Dumbbell, CheckCircle2 } from "lucide-react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { AuthForm } from "@/components/auth-form";
import { toast } from "@/components/ui/use-toast";

const PERKS = [
  "Book classes instantly with real-time availability",
  "Smart waitlist — get notified when spots open",
  "Track your upcoming bookings in one place",
  "Cancel anytime, no hassle",
];

function SignupInner() {
  const { signup } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async ({ email, password, name }: { email: string; password: string; name?: string }) => {
    setLoading(true);
    try {
      await signup(email, password, name!);
      toast({ title: "Account created!", description: "Welcome to BodyLab." });
      router.push("/bodylab-demo/schedule");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left: decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-700 to-purple-800" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Dumbbell className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold">BodyLab</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-6">Join 2,400+ members</h2>
            <ul className="space-y-3">
              {PERKS.map((perk) => (
                <li key={perk} className="flex items-center gap-3 text-white/90">
                  <CheckCircle2 className="h-5 w-5 text-emerald-300 shrink-0" />
                  {perk}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600">
              <Dumbbell className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold">BodyLab</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Create your account</h1>
            <p className="text-muted-foreground mt-1.5">Free to join. Start booking in minutes.</p>
          </div>

          <AuthForm mode="signup" onSubmit={handleSubmit} isLoading={loading} />

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export function SignupContent() {
  return (
    <AuthProvider>
      <SignupInner />
    </AuthProvider>
  );
}
