"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Dumbbell } from "lucide-react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { AuthForm } from "@/components/auth-form";
import { toast } from "@/components/ui/use-toast";

function LoginInner() {
  const { login } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async ({ email, password }: { email: string; password: string }) => {
    setLoading(true);
    try {
      await login(email, password);
      toast({ title: "Welcome back!", description: "You're now signed in." });
      router.push("/bodylab-demo/schedule");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left: decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-indigo-700 to-purple-800" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Dumbbell className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold">BodyLab</span>
          </div>
          <div>
            <blockquote className="text-2xl font-medium leading-relaxed mb-6">
              "The best investment you can make is in yourself."
            </blockquote>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center font-bold">
                S
              </div>
              <div>
                <div className="font-semibold">Sarah Chen</div>
                <div className="text-sm text-white/70">Lead Yoga Instructor</div>
              </div>
            </div>
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
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600">
              <Dumbbell className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold">BodyLab</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground mt-1.5">Sign in to your account to continue</p>
          </div>

          <AuthForm mode="login" onSubmit={handleSubmit} isLoading={loading} />

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-medium text-primary hover:underline">
                Sign up for free
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Demo: <code className="bg-muted px-1 py-0.5 rounded text-xs">demo@bodylab.com</code> / <code className="bg-muted px-1 py-0.5 rounded text-xs">demo1234</code>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export function LoginContent() {
  return (
    <AuthProvider>
      <LoginInner />
    </AuthProvider>
  );
}
