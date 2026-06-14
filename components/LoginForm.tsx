'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CalendarCheck, AtSign, Lock, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { createSupabaseBrowser } from '@/lib/supabase-browser'

type Mode = 'login' | 'register' | 'recover'

export default function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const next         = searchParams.get('next') ?? '/dashboard'

  const [mode, setMode]         = useState<Mode>('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [success, setSuccess]   = useState<string | null>(null)

  const supabase = createSupabaseBrowser()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message === 'Invalid login credentials' ? 'Correo o contraseña incorrectos.' : error.message)
        setLoading(false)
        return
      }
      router.push(next)
      router.refresh()
    } else if (mode === 'register') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) { setError(error.message); setLoading(false); return }
      setSuccess('Revisa tu correo para confirmar el registro.')
      setLoading(false)
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      })
      if (error) { setError(error.message); setLoading(false); return }
      setSuccess('Te enviamos un enlace para restablecer tu contraseña. Revisa tu correo.')
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/20 ring-1 ring-blue-500/30">
          <CalendarCheck className="h-7 w-7 text-blue-400" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">CalendarioDIAN</h1>
          <p className="mt-1 text-sm text-slate-500">Control de vencimientos fiscales</p>
        </div>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-8 shadow-2xl shadow-black/40 backdrop-blur">

        {/* Tabs */}
        <div className="mb-6 flex rounded-xl border border-slate-700/60 bg-slate-800/50 p-1">
          {(['login', 'register'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); setSuccess(null) }}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                mode === m || (mode === 'recover' && m === 'login')
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {m === 'login' ? 'Ingresar' : 'Registrarse'}
            </button>
          ))}
        </div>

        {mode === 'recover' && (
          <div className="mb-4 rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-xs text-blue-400">
            Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="label" htmlFor="email">Correo electrónico</label>
            <div className="input-wrapper">
              <AtSign className="input-icon" />
              <input
                id="email"
                type="email"
                className="input"
                placeholder="tu@correo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="label" htmlFor="password">Contraseña</label>
            <div className="input-wrapper">
              <Lock className="input-icon" />
              <input
                id="password"
                type={showPwd ? 'text' : 'password'}
                className="input pr-11"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                className="absolute right-3.5 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Feedback */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 mt-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Procesando…' : mode === 'login' ? 'Ingresar al Dashboard' : mode === 'register' ? 'Crear cuenta' : 'Enviar enlace'}
          </button>

          {mode === 'login' && (
            <button
              type="button"
              onClick={() => { setMode('recover'); setError(null); setSuccess(null) }}
              className="mt-3 w-full text-center text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}
          {mode === 'recover' && (
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); setSuccess(null) }}
              className="mt-3 w-full text-center text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Volver al inicio de sesión
            </button>
          )}
        </form>
      </div>

      <p className="mt-6 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} CalendarioDIAN · Plataforma de vencimientos fiscales Colombia
      </p>
    </div>
  )
}
