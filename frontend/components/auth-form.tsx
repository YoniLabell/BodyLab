"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APIError } from "@/lib/api";
import { cn } from "@/lib/utils";

interface AuthFormProps {
  mode: "login" | "signup";
  onSubmit: (data: { email: string; password: string; name?: string }) => Promise<void>;
  isLoading?: boolean;
}

export function AuthForm({ mode, onSubmit, isLoading }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Invalid email";
    if (!password) e.password = "Password is required";
    else if (mode === "signup" && password.length < 8) e.password = "Min 8 characters";
    if (mode === "signup" && !name) e.name = "Name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    try {
      await onSubmit({ email, password, name: mode === "signup" ? name : undefined });
    } catch (err) {
      if (err instanceof APIError) {
        setServerError(err.message);
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      {serverError && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive"
        >
          {serverError}
        </motion.div>
      )}

      {mode === "signup" && (
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Alex Johnson"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
              }}
              className={cn(
                "flex h-11 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm",
                "focus:outline-none focus:ring-2 focus:ring-ring transition-shadow duration-200",
                "placeholder:text-muted-foreground",
                errors.name && "border-destructive"
              )}
            />
          </div>
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="email">Email address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
            }}
            className={cn(
              "flex h-11 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm",
              "focus:outline-none focus:ring-2 focus:ring-ring transition-shadow duration-200",
              "placeholder:text-muted-foreground",
              errors.email && "border-destructive"
            )}
          />
        </div>
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
            }}
            className={cn(
              "flex h-11 w-full rounded-xl border border-input bg-background pl-10 pr-10 text-sm",
              "focus:outline-none focus:ring-2 focus:ring-ring transition-shadow duration-200",
              "placeholder:text-muted-foreground",
              errors.password && "border-destructive"
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
      </div>

      <Button
        type="submit"
        variant="gradient"
        size="lg"
        className="w-full"
        loading={isLoading}
        disabled={isLoading}
      >
        {mode === "login" ? "Sign in" : "Create account"}
      </Button>
    </motion.form>
  );
}
