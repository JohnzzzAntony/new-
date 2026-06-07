'use client'

import React, { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { authApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Eye, EyeOff, AlertCircle } from 'lucide-react'

export function LoginPage() {
  const { login } = useAppStore()
  const [email, setEmail] = useState('admin@drec.ae')
  const [password, setPassword] = useState('Admin123!')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const result = await authApi.login(email, password)
      login(result.user, result.token)
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">DREC PMS</h1>
          <p className="text-gray-500 mt-1">Dubai Real Estate Corporation Property Management System</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Sign In</CardTitle>
            <CardDescription>Enter your credentials to access the system</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t">
              <p className="text-xs text-gray-400 text-center mb-3">Demo Accounts</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button onClick={() => { setEmail('admin@drec.ae'); setPassword('Admin123!') }} className="p-2 bg-gray-50 rounded-lg hover:bg-emerald-50 text-left transition-colors">
                  <div className="font-medium text-gray-700">Super Admin</div>
                  <div className="text-gray-400 truncate">admin@drec.ae</div>
                </button>
                <button onClick={() => { setEmail('manager@drec.ae'); setPassword('Admin123!') }} className="p-2 bg-gray-50 rounded-lg hover:bg-emerald-50 text-left transition-colors">
                  <div className="font-medium text-gray-700">Property Mgr</div>
                  <div className="text-gray-400 truncate">manager@drec.ae</div>
                </button>
                <button onClick={() => { setEmail('finance@drec.ae'); setPassword('Admin123!') }} className="p-2 bg-gray-50 rounded-lg hover:bg-emerald-50 text-left transition-colors">
                  <div className="font-medium text-gray-700">Finance User</div>
                  <div className="text-gray-400 truncate">finance@drec.ae</div>
                </button>
                <button onClick={() => { setEmail('viewer@drec.ae'); setPassword('Admin123!') }} className="p-2 bg-gray-50 rounded-lg hover:bg-emerald-50 text-left transition-colors">
                  <div className="font-medium text-gray-700">Read Only</div>
                  <div className="text-gray-400 truncate">viewer@drec.ae</div>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
