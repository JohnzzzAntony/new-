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
  login: (user: User, token: string) => void
  logout: () => void
  setActiveTab: (tab: string) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setDetail: (type: string, id: string) => void
  clearDetail: () => void
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('pms_token') : null,
  activeTab: 'dashboard',
  sidebarOpen: true,
  detailId: null,
  detailType: null,
  login: (user, token) => {
    localStorage.setItem('pms_token', token)
    localStorage.setItem('pms_user', JSON.stringify(user))
    set({ user, token, activeTab: 'dashboard' })
  },
  logout: () => {
    localStorage.removeItem('pms_token')
    localStorage.removeItem('pms_user')
    set({ user: null, token: null, detailId: null, detailType: null })
  },
  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setDetail: (type, id) => set({ detailType: type, detailId: id, activeTab: `${type}-detail` }),
  clearDetail: () => set({ detailType: null, detailId: null }),
}))
