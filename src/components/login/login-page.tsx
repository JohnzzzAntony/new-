'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { login as apiLogin } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { Loader2, Building2, Shield, Eye, EyeOff } from 'lucide-react'

const demoAccounts = [
  { label: 'Super Admin', email: 'admin@drec.ae', color: 'bg-emerald-600' },
  { label: 'Property Mgr', email: 'manager@drec.ae', color: 'bg-teal-600' },
  { label: 'Finance User', email: 'finance@drec.ae', color: 'bg-cyan-700' },
  { label: 'Read Only', email: 'viewer@drec.ae', color: 'bg-slate-600' },
]

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const storeLogin = useAppStore((s) => s.login)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await apiLogin(email, password)
      storeLogin(result.user as { id: string; email: string; name: string; role: string; avatar?: string | null }, result.token)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword('Admin123!')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-emerald-700 text-white shadow-lg mb-4">
            <Building2 className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-emerald-900">DREC PMS</h1>
          <p className="text-emerald-700 mt-1">Dubai Real Estate Corporation</p>
          <p className="text-sm text-muted-foreground mt-1">Property Management System</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Sign In</CardTitle>
            <CardDescription>Enter your credentials to access the system</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Email</label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Demo Accounts (password: Admin123!)
              </p>
              <div className="grid grid-cols-2 gap-2">
                {demoAccounts.map((account) => (
                  <button
                    key={account.email}
                    onClick={() => fillDemo(account.email)}
                    className="flex items-center gap-2 text-left p-2 rounded-md hover:bg-muted transition-colors text-xs"
                  >
                    <div className={`h-2 w-2 rounded-full ${account.color}`} />
                    <div>
                      <div className="font-medium text-foreground">{account.label}</div>
                      <div className="text-muted-foreground">{account.email}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
