import { create } from 'zustand'

export type UserRole = 'SUPER_ADMIN' | 'PROPERTY_MANAGER' | 'FINANCE_USER' | 'READ_ONLY'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  isActive: boolean
}

interface AppState {
  user: User | null
  token: string | null
  activeTab: string
  sidebarOpen: boolean
  detailId: string | null
  detailType: string | null
  searchQuery: string
  setSearchQuery: (query: string) => void
  globalFilters: Record<string, any> | null
  setGlobalFilters: (filters: Record<string, any> | null) => void
  propertiesTab: 'properties' | 'units'
  setPropertiesTab: (tab: 'properties' | 'units') => void
  login: (user: User, token: string) => void
  logout: () => void
  setActiveTab: (tab: string) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setDetail: (type: string, id: string) => void
  clearDetail: () => void
}

export const useAppStore = create<AppState>((set) => ({
  user: typeof window !== 'undefined' ? (() => {
    try {
      const u = localStorage.getItem('pms_user')
      return u ? JSON.parse(u) : null
    } catch {
      return null
    }
  })() : null,
  token: typeof window !== 'undefined' ? localStorage.getItem('pms_token') : null,
  activeTab: 'dashboard',
  sidebarOpen: true,
  detailId: null,
  detailType: null,
  searchQuery: '',
  globalFilters: null,
  setGlobalFilters: (filters) => set({ globalFilters: filters }),
  propertiesTab: 'properties',
  setPropertiesTab: (tab) => set({ propertiesTab: tab }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  login: (user, token) => {
    localStorage.setItem('pms_token', token)
    localStorage.setItem('pms_user', JSON.stringify(user))
    set({ user, token, activeTab: 'dashboard', searchQuery: '' })
  },
  logout: () => {
    localStorage.removeItem('pms_token')
    localStorage.removeItem('pms_user')
    set({ user: null, token: null, detailId: null, detailType: null, searchQuery: '', globalFilters: null, propertiesTab: 'properties' })
  },
  setActiveTab: (tab) => set({ activeTab: tab, searchQuery: '' }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setDetail: (type, id) => set({ detailType: type, detailId: id, activeTab: `${type}-detail`, searchQuery: '' }),
  clearDetail: () => set({ detailType: null, detailId: null }),
}))

