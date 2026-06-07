'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { LoginPage } from '@/components/login-page'
import { AppShell } from '@/components/app-shell'

export default function HomePage() {
  const { user, token, login, logout } = useAppStore()
  const [loading, setLoading] = useState(true)

  const restoreSession = useCallback(() => {
    const savedToken = localStorage.getItem('pms_token')
    const savedUser = localStorage.getItem('pms_user')
    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        login(parsedUser, savedToken)
      } catch {
        logout()
      }
    }
  }, [login, logout])

  useEffect(() => {
    restoreSession()
    // Use a microtask to avoid calling setState synchronously in the effect
    const timer = setTimeout(() => setLoading(false), 0)
    return () => clearTimeout(timer)
  }, [restoreSession])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading DREC PMS...</p>
        </div>
      </div>
    )
  }

  if (!user || !token) {
    return <LoginPage />
  }

  return <AppShell />
}
