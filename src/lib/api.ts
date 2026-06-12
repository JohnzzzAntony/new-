import { useAppStore } from './store'

const API_BASE = '/api'

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('pms_token') : null
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || `HTTP ${res.status}`)
  }
  return res.json()
}

// Paginated response type
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{ user: any; token: string }>('/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'login', email, password }),
    }),
  me: () => apiFetch<{ user: any }>('/auth?action=me'),
}

// Generic CRUD
function createCrudApi<T>(basePath: string) {
  return {
    list: (params?: Record<string, string | number | boolean | undefined>) => {
      const searchParams = new URLSearchParams()
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== '') searchParams.set(k, String(v))
        })
      }
      const qs = searchParams.toString()
      return apiFetch<PaginatedResponse<T>>(`${basePath}${qs ? `?${qs}` : ''}`)
    },
    get: (id: string) => apiFetch<T>(`${basePath}?id=${id}`),
    create: (data: Partial<T>) =>
      apiFetch<T>(basePath, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<T>) =>
      apiFetch<T>(basePath, { method: 'PUT', body: JSON.stringify({ id, ...data }) }),
    delete: (id: string) =>
      apiFetch<T>(`${basePath}?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),
  }
}

export const companiesApi = createCrudApi<any>('/companies')
export const propertiesApi = createCrudApi<any>('/properties')
export const unitsApi = createCrudApi<any>('/units')
export const mainLeasesApi = createCrudApi<any>('/main-leases')
export const subtenantsApi = createCrudApi<any>('/subtenants')
export const subleasesApi = createCrudApi<any>('/subleases')
export const ejariApi = createCrudApi<any>('/ejari')
export const invoicesApi = createCrudApi<any>('/invoices')
export const plotsApi = createCrudApi<any>('/plots')

export const receiptsApi = {
  list: (params?: Record<string, string | number | undefined>) => {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') searchParams.set(k, String(v))
      })
    }
    const qs = searchParams.toString()
    return apiFetch<PaginatedResponse<any>>(`/receipts${qs ? `?${qs}` : ''}`)
  },
  create: (data: any) =>
    apiFetch<any>('/receipts', { method: 'POST', body: JSON.stringify(data) }),
}

export const complianceApi = {
  list: (params?: Record<string, string | undefined>) => {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') searchParams.set(k, v)
      })
    }
    const qs = searchParams.toString()
    return apiFetch<PaginatedResponse<any>>(`/compliance${qs ? `?${qs}` : ''}`)
  },
  update: (id: string, data: any) =>
    apiFetch<any>('/compliance', { method: 'PUT', body: JSON.stringify({ id, ...data }) }),
}

export const dashboardApi = {
  get: () => apiFetch<any>('/dashboard'),
}

export const reportsApi = {
  get: (type: string, format: string = 'json') =>
    apiFetch<any>(`/reports?type=${type}&format=${format}`),
}

export const notificationsApi = {
  list: () => apiFetch<PaginatedResponse<any>>('/notifications'),
  markRead: (id: string) =>
    apiFetch<any>('/notifications', { method: 'PUT', body: JSON.stringify({ id, isRead: true }) }),
}
