'use client'

import { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  CalendarCheck,
  Building2,
  Plus,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  ListChecks,
  User,
  Search,
  FileDown,
} from 'lucide-react'
import EmpresaForm from '@/components/EmpresaForm'
import EmpresasTable from '@/components/EmpresasTable'
import ObligacionesModal from '@/components/ObligacionesModal'
import { calcularProximosVencimientos } from '@/lib/dianLogic'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import type { Empresa, VencimientoConEstado } from '@/lib/types'

interface Props {
  initialEmpresas: Empresa[]
}

interface ModalState {
  empresa: Empresa | null
  vencimientos: VencimientoConEstado[]
  loading: boolean
  error: string | null
}

const MODAL_CLOSED: ModalState = {
  empresa: null, vencimientos: [], loading: false, error: null,
}

export default function DashboardClient({ initialEmpresas }: Props) {
  const router = useRouter()
  const [empresas, setEmpresas] = useState<Empresa[]>(initialEmpresas)
  const [formOpen, setFormOpen] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  const empresasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return empresas
    return empresas.filter(e =>
      e.razon_social.toLowerCase().includes(q) || e.nit.includes(q)
    )
  }, [empresas, busqueda])

  function exportarExcel() {
    import('xlsx').then(XLSX => {
      const filas = empresas.map(e => ({
        'Razón Social':        e.razon_social,
        'NIT':                 `${e.nit}-${e.digito_verificacion}`,
        'Tipo Contribuyente':  e.tipo_contribuyente,
        'Correo Notificación': e.email_notificacion,
        'Registrada':          new Date(e.created_at).toLocaleDateString('es-CO'),
      }))
      const ws = XLSX.utils.json_to_sheet(filas)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Empresas')
      XLSX.writeFile(wb, `empresas-calendariodian-${new Date().toISOString().slice(0, 10)}.xlsx`)
    })
  }

  async function handleSignOut() {
    const supabase = createSupabaseBrowser()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }
  const [modal, setModal]       = useState<ModalState>(MODAL_CLOSED)

  function handleCreated(nueva: Empresa) {
    setEmpresas(prev =>
      [nueva, ...prev].sort((a, b) => a.razon_social.localeCompare(b.razon_social))
    )
    setFormOpen(false)
  }

  const handleVerObligaciones = useCallback(async (empresa: Empresa) => {
    // Abre el modal inmediatamente con estado de carga
    setModal({ empresa, vencimientos: [], loading: true, error: null })

    try {
      const vencimientos = await calcularProximosVencimientos(
        empresa.nit,
        empresa.tipo_contribuyente,
        empresa.id,
      )
      setModal(prev => ({ ...prev, vencimientos, loading: false }))
    } catch (err) {
      setModal(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Error al consultar vencimientos.',
      }))
    }
  }, [])

  const handleCloseModal = useCallback(() => setModal(MODAL_CLOSED), [])

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-6 py-4 backdrop-blur">
        <Link href="/" className="flex items-center gap-2.5">
          <CalendarCheck className="h-6 w-6 text-blue-400" />
          <span className="text-base font-bold tracking-tight">CalendarioDIAN</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm text-slate-400">
          <span className="flex items-center gap-1.5 rounded-lg bg-blue-500/10 px-3 py-1.5 text-blue-400">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </span>
          <Link
            href="/vencimientos"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition hover:bg-slate-800 hover:text-slate-200"
          >
            <ListChecks className="h-4 w-4" />
            Vencimientos
          </Link>
          <Link
            href="/perfil"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition hover:bg-slate-800 hover:text-slate-200"
          >
            <User className="h-4 w-4" />
            Mi Perfil
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition hover:bg-slate-800 hover:text-slate-200"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </nav>
      </header>

      {/* ── Contenido principal ── */}
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-8">

        {/* Page header */}
        <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Empresas Registradas</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Gestiona tus clientes y consulta sus obligaciones fiscales DIAN.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-2.5 text-center">
              <p className="text-xl font-bold text-blue-400">{empresas.length}</p>
              <p className="text-xs text-slate-500">Empresas</p>
            </div>
          </div>
        </div>

        {/* ── Sección: Registrar empresa ── */}
        <section className="mb-8 overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/60 shadow-xl shadow-black/20">
          <button
            onClick={() => setFormOpen(o => !o)}
            className="flex w-full items-center justify-between px-6 py-4 text-left transition hover:bg-slate-800/40"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15">
                <Plus className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-100">Registrar Nueva Empresa</p>
                <p className="text-xs text-slate-500">Completa el formulario para agregar un cliente</p>
              </div>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${formOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {formOpen && (
            <div className="border-t border-slate-700/60 px-6 py-6">
              <EmpresaForm onCreated={handleCreated} />
            </div>
          )}
        </section>

        {/* ── Sección: Tabla de empresas ── */}
        <section>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <Building2 className="h-4 w-4 text-slate-400" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                Listado de Empresas
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {/* Búsqueda */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o NIT…"
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  className="w-56 rounded-xl border border-slate-700 bg-slate-800/60 py-2 pl-9 pr-4 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30"
                />
              </div>
              {/* Exportar Excel */}
              <button
                onClick={exportarExcel}
                disabled={empresas.length === 0}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-400 transition-all hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FileDown className="h-3.5 w-3.5" />
                Excel
              </button>
            </div>
          </div>

          {busqueda && (
            <p className="mb-3 text-xs text-slate-500">
              {empresasFiltradas.length} resultado{empresasFiltradas.length !== 1 ? 's' : ''} para &ldquo;{busqueda}&rdquo;
            </p>
          )}

          <EmpresasTable
            empresas={empresasFiltradas}
            onVerObligaciones={handleVerObligaciones}
          />
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="mt-16 border-t border-slate-800 px-8 py-5 text-center text-xs text-slate-600">
        CalendarioDIAN · Panel de Control · {new Date().getFullYear()}
      </footer>

      {/* ── Modal de obligaciones ── */}
      {modal.empresa && (
        <ObligacionesModal
          empresa={modal.empresa}
          vencimientos={modal.vencimientos}
          loading={modal.loading}
          error={modal.error}
          onClose={handleCloseModal}
          onUpdateVencimiento={(vencimientoId, ev_id, nuevoEstado) => {
            setModal(prev => ({
              ...prev,
              vencimientos: prev.vencimientos.map(v =>
                v.id === vencimientoId
                  ? { ...v, estado: nuevoEstado, empresa_vencimiento_id: ev_id }
                  : v
              ),
            }))
          }}
        />
      )}
    </div>
  )
}
