const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export class APIError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = "APIError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new APIError(
      res.status,
      json?.detail || json?.message || "Request failed",
      json
    );
  }

  return json;
}

// ── Auth ──────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
  created_at: string;
}

export interface AuthResponse {
  success: boolean;
  data: User;
}

export const auth = {
  signup: (email: string, password: string, name: string) =>
    request<AuthResponse>("/api/v1/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    }),

  login: (email: string, password: string) =>
    request<AuthResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    request("/api/v1/auth/logout", { method: "POST" }),

  me: () =>
    request<AuthResponse>("/api/v1/auth/me"),
};

// ── Studios ──────────────────────────────────────────────────────────────

export interface Studio {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  description?: string;
  created_at: string;
}

export interface ClassSession {
  id: string;
  studio_id: string;
  title: string;
  type: string;
  instructor: string;
  capacity: number;
  spots_left: number;
  is_full: boolean;
  start_at: string;
  end_at: string;
  user_booking_status?: "booked" | "waitlist" | null;
  waitlist_position?: number | null;
}

export interface ScheduleResponse {
  success: boolean;
  data: {
    sessions: ClassSession[];
    total: number;
    page: number;
    page_size: number;
    pages: number;
  };
}

export interface ScheduleFilters {
  from?: string;
  to?: string;
  q?: string;
  instructor?: string;
  type?: string;
  page?: number;
  page_size?: number;
}

export const studios = {
  get: (slug: string) =>
    request<{ success: boolean; data: Studio }>(`/api/v1/studios/${slug}`),

  schedule: (slug: string, filters: ScheduleFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    if (filters.q) params.set("q", filters.q);
    if (filters.instructor) params.set("instructor", filters.instructor);
    if (filters.type) params.set("type", filters.type);
    if (filters.page) params.set("page", String(filters.page));
    if (filters.page_size) params.set("page_size", String(filters.page_size));
    return request<ScheduleResponse>(`/api/v1/studios/${slug}/schedule/auth?${params}`);
  },

  schedulePublic: (slug: string, filters: ScheduleFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    if (filters.q) params.set("q", filters.q);
    if (filters.instructor) params.set("instructor", filters.instructor);
    if (filters.type) params.set("type", filters.type);
    if (filters.page) params.set("page", String(filters.page));
    if (filters.page_size) params.set("page_size", String(filters.page_size));
    return request<ScheduleResponse>(`/api/v1/studios/${slug}/schedule?${params}`);
  },

  book: (slug: string, sessionId: string) =>
    request(`/api/v1/studios/${slug}/sessions/${sessionId}/book`, { method: "POST" }),

  cancel: (slug: string, sessionId: string) =>
    request(`/api/v1/studios/${slug}/sessions/${sessionId}/cancel`, { method: "POST" }),

  waitlist: (slug: string, sessionId: string) =>
    request(`/api/v1/studios/${slug}/sessions/${sessionId}/waitlist`, { method: "POST" }),
};

// ── Me ───────────────────────────────────────────────────────────────────

export interface Booking {
  id: string;
  status: string;
  created_at: string;
  session: ClassSession;
}

export const me = {
  bookings: () =>
    request<{ success: boolean; data: Booking[] }>("/api/v1/me/bookings"),
};

// ── Admin ─────────────────────────────────────────────────────────────────

export interface ClassTemplate {
  id: string;
  studio_id: string;
  title: string;
  type: string;
  instructor: string;
  capacity: number;
  weekday: number;
  start_time: string;
  duration_minutes: number;
  active: boolean;
  created_at: string;
}

export const admin = {
  listStudios: () =>
    request<{ success: boolean; data: Studio[] }>("/api/v1/admin/studios"),

  createStudio: (data: { name: string; slug: string; timezone: string; description?: string }) =>
    request<{ success: boolean; data: Studio }>("/api/v1/admin/studios", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  listTemplates: (studioId: string) =>
    request<{ success: boolean; data: ClassTemplate[] }>(`/api/v1/admin/studios/${studioId}/class-templates`),

  createTemplate: (studioId: string, data: Omit<ClassTemplate, "id" | "studio_id" | "active" | "created_at">) =>
    request<{ success: boolean; data: ClassTemplate }>(`/api/v1/admin/studios/${studioId}/class-templates`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  generateSessions: (studioId: string, days: number = 14) =>
    request(`/api/v1/admin/studios/${studioId}/generate-sessions?days=${days}`, { method: "POST" }),
};
