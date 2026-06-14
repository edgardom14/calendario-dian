'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarCheck, Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { createSupabaseBrowser } from '@/lib/supabase-browser'

export default function ResetPasswordForm() {
  const router = useRouter()
  const [password, setPassword]   = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [showPwd, setShowPwd]     = useState(false)
  const [loading, setLoading]     = useState(false)
  const [success, setSuccess]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    if (password !== confirmar) { setError('Las contraseñas no coinciden.'); return }

    setLoading(true)
    const supabase = createSupabaseBrowser()
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }
    setSuccess(true)
    setTimeout(() => router.push('/dashboard'), 2000)
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/20 ring-1 ring-blue-500/30">
          <CalendarCheck className="h-7 w-7 text-blue-400" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Nueva contraseña</h1>
          <p className="mt-1 text-sm text-slate-500">Elige una contraseña segura para tu cuenta</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-8 shadow-2xl shadow-black/40 backdrop-blur">
        {success ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            <p className="text-sm font-semibold text-emerald-400">Contraseña actualizada correctamente.</p>
            <p className="text-xs text-slate-500">Redirigiendo al dashboard…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="password">Nueva contraseña</label>
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
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3.5 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="label" htmlFor="confirmar">Confirmar contraseña</label>
              <div className="input-wrapper">
                <Lock className="input-icon" />
                <input
                  id="confirmar"
                  type={showPwd ? 'text' : 'password'}
                  className="input"
                  placeholder="Repite la nueva contraseña"
                  value={confirmar}
                  onChange={e => setConfirmar(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 mt-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Guardando…' : 'Establecer nueva contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
