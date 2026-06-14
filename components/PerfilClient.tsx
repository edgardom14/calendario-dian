'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CalendarCheck, LayoutDashboard, ListChecks, LogOut,
  User, Building2, Phone, AtSign, Loader2, CheckCircle2, AlertCircle,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase-browser'

interface Perfil {
  id: string
  nombre_completo: string | null
  nombre_empresa: string | null
  telefono: string | null
}

interface Props {
  email: string
  perfil: Perfil
}

export default function PerfilClient({ email, perfil }: Props) {
  const router = useRouter()
  const [form, setForm] = useState({
    nombre_completo: perfil.nombre_completo ?? '',
    nombre_empresa:  perfil.nombre_empresa  ?? '',
    telefono:        perfil.telefono        ?? '',
  })
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError(null)
    setSuccess(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const supabase = createSupabaseBrowser()
    const { error: err } = await supabase
      .from('perfiles')
      .upsert({ id: perfil.id, ...form }, { onConflict: 'id' })

    if (err) {
      setError(err.message)
    } else {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      router.refresh()
    }
    setLoading(false)
  }

  async function handleSignOut() {
    const supabase = createSupabaseBrowser()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Navbar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-6 py-4 backdrop-blur">
        <Link href="/" className="flex items-center gap-2.5">
          <CalendarCheck className="h-6 w-6 text-blue-400" />
          <span className="text-base font-bold tracking-tight">CalendarioDIAN</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm text-slate-400">
          <Link href="/dashboard" className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition hover:bg-slate-800 hover:text-slate-200">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link href="/vencimientos" className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition hover:bg-slate-800 hover:text-slate-200">
            <ListChecks className="h-4 w-4" />
            Vencimientos
          </Link>
          <span className="flex items-center gap-1.5 rounded-lg bg-blue-500/10 px-3 py-1.5 text-blue-400">
            <User className="h-4 w-4" />
            Mi Perfil
          </span>
          <button onClick={handleSignOut} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition hover:bg-slate-800 hover:text-slate-200">
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </nav>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-8">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-100">Mi Perfil</h1>
          <p className="mt-0.5 text-sm text-slate-500">Configura tus datos de contador o firma contable.</p>
        </div>

        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-8 shadow-xl shadow-black/20">

          {/* Email (solo lectura) */}
          <div className="mb-6">
            <label className="label">Correo electrónico</label>
            <div className="input-wrapper">
              <AtSign className="input-icon" />
              <input
                type="email"
                className="input opacity-60 cursor-not-allowed"
                value={email}
                disabled
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-600">El correo no se puede cambiar desde aquí.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label" htmlFor="nombre_completo">Nombre completo</label>
              <div className="input-wrapper">
                <User className="input-icon" />
                <input
                  id="nombre_completo"
                  name="nombre_completo"
                  type="text"
                  className="input"
                  placeholder="Ana García López"
                  value={form.nombre_completo}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="nombre_empresa">Firma / empresa contable</label>
              <div className="input-wrapper">
                <Building2 className="input-icon" />
                <input
                  id="nombre_empresa"
                  name="nombre_empresa"
                  type="text"
                  className="input"
                  placeholder="García & Asociados S.A.S."
                  value={form.nombre_empresa}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="telefono">Teléfono de contacto</label>
              <div className="input-wrapper">
                <Phone className="input-icon" />
                <input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  className="input"
                  placeholder="+57 300 123 4567"
                  value={form.telefono}
                  onChange={handleChange}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Perfil actualizado correctamente.
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <footer className="mt-16 border-t border-slate-800 px-8 py-5 text-center text-xs text-slate-600">
        CalendarioDIAN · {new Date().getFullYear()}
      </footer>
    </div>
  )
}
