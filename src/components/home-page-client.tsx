'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { AppShell } from '@/components/app-shell'
import { LoginPage } from '@/components/login-page'

export function HomePageClient() {
  const { token, user } = useAppStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch by only rendering after mount
  if (!mounted) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Loading DREC PMS...</p>
        </div>
      </main>
    )
  }

  if (!token || !user) {
    return <LoginPage />
  }

  return <AppShell />
}
