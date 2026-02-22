"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus, RefreshCw, Building2, Users, Calendar, ChevronDown,
  ChevronRight, Zap, Clock, Layers
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { admin, Studio, ClassTemplate, APIError } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function AdminInner() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [studios, setStudios] = useState<Studio[]>([]);
  const [selectedStudio, setSelectedStudio] = useState<Studio | null>(null);
  const [templates, setTemplates] = useState<ClassTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  // New studio form
  const [newStudio, setNewStudio] = useState({ name: "", slug: "", timezone: "UTC", description: "" });
  const [showStudioForm, setShowStudioForm] = useState(false);

  // New template form
  const [newTemplate, setNewTemplate] = useState({
    title: "", type: "", instructor: "", capacity: 20,
    weekday: 0, start_time: "09:00", duration_minutes: 60,
  });
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [generatingDays, setGeneratingDays] = useState(14);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!authLoading && user && !user.is_admin) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const loadStudios = useCallback(async () => {
    if (!user?.is_admin) return;
    setLoading(true);
    try {
      const res = await admin.listStudios();
      setStudios(res.data);
      if (!selectedStudio && res.data.length > 0) {
        setSelectedStudio(res.data[0]);
      }
    } catch {
      toast({ variant: "destructive", title: "Failed to load studios" });
    } finally {
      setLoading(false);
    }
  }, [user, selectedStudio]);

  const loadTemplates = useCallback(async () => {
    if (!selectedStudio) return;
    try {
      const res = await admin.listTemplates(selectedStudio.id);
      setTemplates(res.data);
    } catch {
      toast({ variant: "destructive", title: "Failed to load templates" });
    }
  }, [selectedStudio]);

  useEffect(() => { loadStudios(); }, [loadStudios]);
  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const handleCreateStudio = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await admin.createStudio(newStudio);
      setStudios((prev) => [res.data, ...prev]);
      setSelectedStudio(res.data);
      setNewStudio({ name: "", slug: "", timezone: "UTC", description: "" });
      setShowStudioForm(false);
      toast({ title: "Studio created!", description: `/${res.data.slug}` });
    } catch (err) {
      const msg = err instanceof APIError ? err.message : "Failed to create studio";
      toast({ variant: "destructive", title: "Error", description: msg });
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudio) return;
    try {
      const res = await admin.createTemplate(selectedStudio.id, newTemplate);
      setTemplates((prev) => [...prev, res.data]);
      setNewTemplate({ title: "", type: "", instructor: "", capacity: 20, weekday: 0, start_time: "09:00", duration_minutes: 60 });
      setShowTemplateForm(false);
      toast({ title: "Template created!" });
    } catch (err) {
      const msg = err instanceof APIError ? err.message : "Failed to create template";
      toast({ variant: "destructive", title: "Error", description: msg });
    }
  };

  const handleGenerateSessions = async () => {
    if (!selectedStudio) return;
    try {
      const res = await admin.generateSessions(selectedStudio.id, generatingDays) as any;
      toast({
        title: "Sessions generated!",
        description: res.message || `Generated sessions for ${generatingDays} days.`,
      });
    } catch (err) {
      const msg = err instanceof APIError ? err.message : "Failed to generate sessions";
      toast({ variant: "destructive", title: "Error", description: msg });
    }
  };

  if (authLoading || !user?.is_admin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="pt-8 pb-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage studios, templates, and sessions</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Studios panel */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Studios
              </h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowStudioForm(!showStudioForm)}
              >
                <Plus className="h-4 w-4 mr-1" />
                New
              </Button>
            </div>

            {showStudioForm && (
              <Card>
                <CardContent className="pt-4">
                  <form onSubmit={handleCreateStudio} className="space-y-3">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={newStudio.name}
                        onChange={(e) => setNewStudio({ ...newStudio, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") })}
                        placeholder="My Studio"
                        required
                      />
                    </div>
                    <div>
                      <Label>Slug</Label>
                      <Input
                        value={newStudio.slug}
                        onChange={(e) => setNewStudio({ ...newStudio, slug: e.target.value })}
                        placeholder="my-studio"
                        required
                      />
                    </div>
                    <div>
                      <Label>Timezone</Label>
                      <Input
                        value={newStudio.timezone}
                        onChange={(e) => setNewStudio({ ...newStudio, timezone: e.target.value })}
                        placeholder="America/New_York"
                      />
                    </div>
                    <Button type="submit" size="sm" variant="gradient" className="w-full">
                      Create studio
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              {studios.map((studio) => (
                <button
                  key={studio.id}
                  onClick={() => setSelectedStudio(studio)}
                  className={cn(
                    "w-full text-left rounded-xl border p-3.5 transition-all",
                    selectedStudio?.id === studio.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border bg-card hover:bg-accent"
                  )}
                >
                  <div className="font-medium text-sm">{studio.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">/{studio.slug}</div>
                </button>
              ))}
              {studios.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No studios yet</p>
              )}
            </div>
          </div>

          {/* Studio detail */}
          <div className="lg:col-span-2 space-y-6">
            {selectedStudio ? (
              <>
                {/* Studio header */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{selectedStudio.name}</CardTitle>
                        <CardDescription>/{selectedStudio.slug} · {selectedStudio.timezone}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/${selectedStudio.slug}/schedule`} target="_blank">
                            View schedule
                            <ChevronRight className="h-3.5 w-3.5 ml-1" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Generate sessions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-500" />
                      Generate Sessions
                    </CardTitle>
                    <CardDescription>Create sessions from active templates for the next N days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Label className="whitespace-nowrap">Days ahead:</Label>
                        <Input
                          type="number"
                          value={generatingDays}
                          onChange={(e) => setGeneratingDays(Number(e.target.value))}
                          min={1}
                          max={90}
                          className="w-24"
                        />
                      </div>
                      <Button onClick={handleGenerateSessions} variant="gradient">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Generate
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Templates */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Layers className="h-4 w-4 text-primary" />
                          Class Templates
                        </CardTitle>
                        <CardDescription>Recurring class patterns</CardDescription>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowTemplateForm(!showTemplateForm)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add template
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {showTemplateForm && (
                      <form onSubmit={handleCreateTemplate} className="space-y-4 mb-6 p-4 rounded-xl border bg-muted/30">
                        <h4 className="font-medium text-sm">New class template</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Title</Label>
                            <Input
                              value={newTemplate.title}
                              onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                              placeholder="Morning Yoga"
                              required
                            />
                          </div>
                          <div>
                            <Label>Type</Label>
                            <Input
                              value={newTemplate.type}
                              onChange={(e) => setNewTemplate({ ...newTemplate, type: e.target.value })}
                              placeholder="Yoga"
                              required
                            />
                          </div>
                          <div>
                            <Label>Instructor</Label>
                            <Input
                              value={newTemplate.instructor}
                              onChange={(e) => setNewTemplate({ ...newTemplate, instructor: e.target.value })}
                              placeholder="Sarah Chen"
                              required
                            />
                          </div>
                          <div>
                            <Label>Capacity</Label>
                            <Input
                              type="number"
                              value={newTemplate.capacity}
                              onChange={(e) => setNewTemplate({ ...newTemplate, capacity: Number(e.target.value) })}
                              min={1}
                              required
                            />
                          </div>
                          <div>
                            <Label>Weekday</Label>
                            <select
                              value={newTemplate.weekday}
                              onChange={(e) => setNewTemplate({ ...newTemplate, weekday: Number(e.target.value) })}
                              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                              {WEEKDAYS.map((day, i) => (
                                <option key={day} value={i}>{day}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <Label>Start time</Label>
                            <Input
                              type="time"
                              value={newTemplate.start_time}
                              onChange={(e) => setNewTemplate({ ...newTemplate, start_time: e.target.value })}
                              required
                            />
                          </div>
                          <div className="col-span-2">
                            <Label>Duration (minutes)</Label>
                            <Input
                              type="number"
                              value={newTemplate.duration_minutes}
                              onChange={(e) => setNewTemplate({ ...newTemplate, duration_minutes: Number(e.target.value) })}
                              min={15}
                              step={5}
                              required
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" variant="gradient" size="sm">
                            Create template
                          </Button>
                          <Button type="button" variant="ghost" size="sm" onClick={() => setShowTemplateForm(false)}>
                            Cancel
                          </Button>
                        </div>
                      </form>
                    )}

                    {templates.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        No templates yet. Add a template to start generating sessions.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {templates.map((t) => (
                          <div
                            key={t.id}
                            className="flex items-center justify-between rounded-xl border bg-background p-3"
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold text-white",
                                "bg-gradient-to-br from-violet-500 to-indigo-600"
                              )}>
                                {WEEKDAYS[t.weekday]?.[0]}
                              </div>
                              <div>
                                <div className="text-sm font-medium">{t.title}</div>
                                <div className="text-xs text-muted-foreground">
                                  {WEEKDAYS[t.weekday]} at {t.start_time} · {t.instructor} · {t.capacity} spots
                                </div>
                              </div>
                            </div>
                            <span className={cn(
                              "text-xs font-medium rounded-full px-2 py-0.5",
                              t.active ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
                            )}>
                              {t.active ? "Active" : "Inactive"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="flex items-center justify-center h-64 rounded-2xl border border-dashed">
                <p className="text-muted-foreground">Select or create a studio to get started</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export function AdminContent() {
  return (
    <AuthProvider>
      <AdminInner />
    </AuthProvider>
  );
}
