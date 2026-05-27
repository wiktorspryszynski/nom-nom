/**
 * Thin fetch wrapper that attaches the Bearer token and handles common errors.
 */

const TOKEN_KEY = 'nom_token'

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

function authHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export class ApiError extends Error {
  constructor(public status: number, public detail: string) {
    super(detail)
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  extraHeaders?: Record<string, string>,
): Promise<T> {
  const headers: Record<string, string> = {
    ...authHeaders(),
    ...extraHeaders,
  }
  if (body !== undefined && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(path, {
    method,
    headers,
    body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const json = await res.json()
      detail = json.detail ?? detail
    } catch { /* ignore */ }
    throw new ApiError(res.status, detail)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
  postForm: <T>(path: string, form: FormData) => request<T>('POST', path, form),
}

// ── Typed endpoint helpers ──────────────────────────────────────────────────

export interface DailyData {
  kcal_consumed: number
  kcal_burned: number
  kcal_goal: number
  macros: {
    protein: { eaten: number; goal: number }
    fat: { eaten: number; goal: number }
    carbs: { eaten: number; goal: number }
  }
  water_glasses: number
  water_goal: number
  entries: DailyEntry[]
}

export interface DailyEntry {
  id: number
  type: 'food' | 'exercise'
  name: string
  time: string
  kcal: number
  protein?: number
  fat?: number
  carbs?: number
  source_type?: string
  duration_min?: number
}

export interface Measurement {
  id: number
  metric_type: string
  value: number
  unit: string
  measured_at: string
}

export interface UserProfile {
  id: number
  name: string
  email: string
  tdee_kcal: number | null
  calorie_target: number | null
  weight_target: number | null
  goal_type: string | null
  protein_target: number | null
  sex: string | null
  height_cm: number | null
  weight_kg: number | null
  birth_date: string | null
  language: string | null
}

export interface MealPlanItem {
  id: number
  day_number: number
  meal_name: string
  description: string | null
  kcal: number | null
  protein: number | null
  fat: number | null
  carbs: number | null
}

export interface MealPlan {
  id: number
  start_date: string
  days_count: number
  created_at: string
  items: MealPlanItem[]
}

export interface FoodSearchResult {
  fdcId: number
  name: string
  kcal: number
  protein: number
  fat: number
  carbs: number
}

export const tracker = {
  getDaily: () => api.get<DailyData>('/api/tracker/daily'),
  getLogs: () => api.get<DailyEntry[]>('/api/tracker/logs'),
  logText: (text: string) => api.post<{ name: string; description: string; kcal: number; protein: number; fat: number; carbs: number; confidence: number; is_exercise?: boolean }>('/api/tracker/log/text', { text }),
  logPhoto: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.postForm<{ name: string; description: string; kcal: number; protein: number; fat: number; carbs: number; confidence: number }>('/api/tracker/log/photo', form)
  },
  saveLog: (entry: { description: string; kcal: number; protein?: number; fat?: number; carbs?: number; source_type?: string; ai_confidence?: number; activity_type?: string; duration_min?: number; kcal_burned?: number }) =>
    api.post<{ id: number; ok: boolean }>('/api/tracker/log', entry),
  deleteLog: (id: number) => api.delete<{ ok: boolean }>(`/api/tracker/log/${id}`),
  logWater: (glasses: number) => api.post<{ ok: boolean; glasses: number }>('/api/tracker/water', { glasses }),
  search: (q: string) => api.get<FoodSearchResult[]>(`/api/tracker/search?q=${encodeURIComponent(q)}`),
}

export const measurements = {
  getAll: () => api.get<Measurement[]>('/api/measurements/'),
  save: (metrics: Record<string, number>, measured_at?: string) =>
    api.post<{ ok: boolean; saved: string[] }>('/api/measurements/', { metrics, measured_at }),
}

export const profile = {
  me: () => api.get<UserProfile>('/api/auth/me'),
  update: (fields: Partial<UserProfile>) => api.put<{ ok: boolean }>('/api/auth/me', fields),
}

export const mealPlanner = {
  list: () => api.get<MealPlan[]>('/api/meal-planner/plans'),
  generate: (params: { days?: number; meals_per_day?: number; preferences?: string }) =>
    api.post<MealPlan>('/api/meal-planner/generate', params),
}

export const health = {
  check: () => api.get<{ status: string; ai_available: boolean }>('/api/health'),
}
