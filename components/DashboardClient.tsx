'use client'

import { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  CalendarCheck, Building2, Plus, ChevronDown, LayoutDashboard,
  LogOut, ListChecks, User, Search, FileDown, Calendar,
  CheckCircle2, Clock, CircleDollarSign, TrendingUp, FileUp,
} from 'lucide-react'
import EmpresaForm from '@/components/EmpresaForm'
import EmpresasTable from '@/components/EmpresasTable'
import ObligacionesModal from '@/components/ObligacionesModal'
import EditarEmpresaModal from '@/components/EditarEmpresaModal'
import ImportarEmpresasModal from '@/components/ImportarEmpresasModal'
import { calcularProximosVencimientos } from '@/lib/dianLogic'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import type { Empresa, VencimientoConEstado } from '@/lib/types'
import type { EstadosPorEmpresa } from '@/app/dashboard/page'

interface Props {
  initialEmpresas: Empresa[]
  estadosPorEmpresa: EstadosPorEmpresa
}

interface ModalState {
  empresa: Empresa | null
  vencimientos: VencimientoConEstado[]
  loading: boolean
  error: string | null
}

const MODAL_CLOSED: ModalState = { empresa: null, vencimientos: [], loading: false, error: null }

const NAV_LINKS = [
  { href: '/dashboard',    label: 'Dashboard',    Icon: LayoutDashboard },
  { href: '/vencimientos', label: 'Vencimientos', Icon: ListChecks      },
  { href: '/calendario',   label: 'Calendario',   Icon: Calendar        },
  { href: '/perfil',       label: 'Mi Perfil',    Icon: User            },
]

export default function DashboardClient({ initialEmpresas, estadosPorEmpresa }: Props) {
  const router = useRouter()
  const [empresas, setEmpresas]               = useState<Empresa[]>(initialEmpresas)
  const [formOpen, setFormOpen]               = useState(false)
  const [busqueda, setBusqueda]               = useState('')
  const [empresaEditando,  setEmpresaEditando]  = useState<Empresa | null>(null)
  const [importarOpen,    setImportarOpen]    = useState(false)
  const [modal, setModal]                     = useState<ModalState>(MODAL_CLOSED)

  /* ── KPIs globales ── */
  const kpis = useMemo(() => {
    let pendiente = 0, presentado = 0, pagado = 0
    for (const c of Object.values(estadosPorEmpresa)) {
      pendiente  += c.pendiente
      presentado += c.presentado
      pagado     += c.pagado
    }
    return { total: empresas.length, pendiente, presentado, pagado }
  }, [empresas, estadosPorEmpresa])

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
        'Razón Social': e.razon_social,
        'NIT': `${e.nit}-${e.digito_verificacion}`,
        'Tipo Contribuyente': e.tipo_contribuyente,
        'Correo Notificación': e.email_notificacion,
        'Registrada': new Date(e.created_at).toLocaleDateString('es-CO'),
      }))
      const ws = XLSX.utils.json_to_sheet(filas)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Empresas')
      XLSX.writeFile(wb, `empresas-calendariodian-${new Date().toISOString().slice(0, 10)}.xlsx`)
    })
  }

  async function handleSignOut() {
    await createSupabaseBrowser().auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function handleCreated(nueva: Empresa) {
    setEmpresas(prev => [nueva, ...prev].sort((a, b) => a.razon_social.localeCompare(b.razon_social)))
    setFormOpen(false)
  }

  const handleVerObligaciones = useCallback(async (empresa: Empresa) => {
    setModal({ empresa, vencimientos: [], loading: true, error: null })
    try {
      const vencimientos = await calcularProximosVencimientos(empresa.nit, empresa.tipo_contribuyente, empresa.id)
      setModal(prev => ({ ...prev, vencimientos, loading: false }))
    } catch (err) {
      setModal(prev => ({ ...prev, loading: false, error: err instanceof Error ? err.message : 'Error al consultar vencimientos.' }))
    }
  }, [])

  const handleCloseModal = useCallback(() => setModal(MODAL_CLOSED), [])

  const fechaHoy = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-20 border-b border-white/5 bg-[#0a0f1e]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-lg shadow-blue-600/30">
              <CalendarCheck className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-bold tracking-tight text-white">CalendarioDIAN</span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map(({ href, label, Icon }) => {
              const active = href === '/dashboard'
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-all ${
                    active
                      ? 'bg-blue-600/15 text-blue-400'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-white/5 hover:text-slate-300"
            >
              <LogOut className="h-3.5 w-3.5" />
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* ── Contenido ── */}
      <main className="mx-auto max-w-7xl px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <p className="mb-1 text-xs font-medium text-slate-600 capitalize">{fechaHoy}</p>
          <h1 className="text-2xl font-bold tracking-tight text-white">Panel de Control</h1>
          <p className="mt-1 text-sm text-slate-500">Gestiona tus clientes y sus obligaciones fiscales DIAN.</p>
        </div>

        {/* ── KPI Cards ── */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            {
              label: 'Total clientes',
              value: kpis.total,
              Icon: Building2,
              color: 'text-blue-400',
              bg: 'bg-blue-500/10',
              ring: 'ring-blue-500/20',
              trend: `${kpis.total} registrado${kpis.total !== 1 ? 's' : ''}`,
            },
            {
              label: 'Pendientes',
              value: kpis.pendiente,
              Icon: Clock,
              color: 'text-amber-400',
              bg: 'bg-amber-500/10',
              ring: 'ring-amber-500/20',
              trend: 'por atender',
            },
            {
              label: 'Presentadas',
              value: kpis.presentado,
              Icon: CheckCircle2,
              color: 'text-blue-400',
              bg: 'bg-blue-500/10',
              ring: 'ring-blue-500/20',
              trend: 'declaraciones',
            },
            {
              label: 'Pagadas',
              value: kpis.pagado,
              Icon: CircleDollarSign,
              color: 'text-emerald-400',
              bg: 'bg-emerald-500/10',
              ring: 'ring-emerald-500/20',
              trend: 'completadas',
            },
          ].map(({ label, value, Icon, color, bg, ring, trend }) => (
            <div key={label} className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 ring-1 ring-inset ring-white/5 transition hover:bg-white/[0.05]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">{label}</p>
                  <p className={`mt-2 text-3xl font-bold tracking-tight ${color}`}>{value}</p>
                  <p className="mt-1 text-xs text-slate-600">{trend}</p>
                </div>
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${bg} ring-1 ${ring}`}>
                  <Icon className={`h-4.5 w-4.5 ${color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Registrar empresa ── */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02]">
          <button
            onClick={() => setFormOpen(o => !o)}
            className="flex w-full items-center justify-between px-6 py-4 text-left transition hover:bg-white/[0.03]"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/15 ring-1 ring-blue-500/25">
                <Plus className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-100">Registrar nuevo cliente</p>
                <p className="text-xs text-slate-500">Agrega una empresa o persona natural</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full transition-all ${formOpen ? 'bg-blue-600/20 text-blue-400' : 'bg-white/5 text-slate-500'}`}>
                {formOpen ? 'Ocultar' : 'Nuevo'}
              </span>
              <ChevronDown className={`h-4 w-4 text-slate-600 transition-transform duration-200 ${formOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {formOpen && (
            <div className="border-t border-white/5 px-6 py-6">
              <EmpresaForm onCreated={handleCreated} />
            </div>
          )}
        </div>

        {/* ── Tabla de empresas ── */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02]">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 border-b border-white/5 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <TrendingUp className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-300">
                Clientes
                {empresasFiltradas.length !== empresas.length && (
                  <span className="ml-2 text-xs font-normal text-slate-600">
                    ({empresasFiltradas.length} de {empresas.length})
                  </span>
                )}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o NIT…"
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  className="w-52 rounded-xl border border-white/8 bg-white/5 py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-600 outline-none transition focus:border-blue-500/40 focus:bg-white/8 focus:ring-1 focus:ring-blue-500/20"
                />
              </div>
              <button
                onClick={exportarExcel}
                disabled={empresas.length === 0}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-3.5 py-2 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FileDown className="h-3.5 w-3.5" />
                Exportar
              </button>
              <button
                onClick={() => setImportarOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/25 bg-blue-500/8 px-3.5 py-2 text-xs font-semibold text-blue-400 transition hover:bg-blue-500/15"
              >
                <FileUp className="h-3.5 w-3.5" />
                Importar
              </button>
            </div>
          </div>

          <EmpresasTable
            empresas={empresasFiltradas}
            estadosPorEmpresa={estadosPorEmpresa}
            onVerObligaciones={handleVerObligaciones}
            onEditar={setEmpresaEditando}
          />
        </div>
      </main>

      <footer className="mt-12 border-t border-white/5 px-8 py-4 text-center text-xs text-slate-700">
        CalendarioDIAN · {new Date().getFullYear()} · Panel de Control
      </footer>

      {/* Modales */}
      {importarOpen && (
        <ImportarEmpresasModal
          onClose={() => setImportarOpen(false)}
          onImported={nuevas => {
            setEmpresas(prev =>
              [...prev, ...nuevas].sort((a, b) => a.razon_social.localeCompare(b.razon_social))
            )
          }}
        />
      )}

      {empresaEditando && (
        <EditarEmpresaModal
          empresa={empresaEditando}
          onClose={() => setEmpresaEditando(null)}
          onUpdated={updated => {
            setEmpresas(prev => prev.map(e => e.id === updated.id ? updated : e))
            setEmpresaEditando(null)
          }}
        />
      )}

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
                v.id === vencimientoId ? { ...v, estado: nuevoEstado, empresa_vencimiento_id: ev_id } : v
              ),
            }))
          }}
        />
      )}
    </div>
  )
}
