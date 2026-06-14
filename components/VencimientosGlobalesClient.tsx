'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  CalendarCheck, Building2, Clock, AlertTriangle,
  CheckCircle2, Filter, RefreshCw, ChevronLeft, Inbox,
} from 'lucide-react'
import { calcularProximosVencimientos, diasRestantes, etiquetaUrgencia, formatearFecha } from '@/lib/dianLogic'
import type { Empresa, VencimientoConImpuesto } from '@/lib/types'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface VencimientoEmpresa {
  empresa: Empresa
  vencimiento: VencimientoConImpuesto
  diasRest: number
}

type FiltroUrgencia = 'todos' | 'vencido' | 'urgente' | 'proximo' | 'ok'

const FILTROS: { value: FiltroUrgencia; label: string; color: string }[] = [
  { value: 'todos',   label: 'Todos',        color: 'text-slate-300' },
  { value: 'vencido', label: 'Vencidos',     color: 'text-red-400'   },
  { value: 'urgente', label: 'Urgente (≤5)', color: 'text-red-400'   },
  { value: 'proximo', label: 'Próximo (≤15)',color: 'text-amber-400' },
  { value: 'ok',      label: 'A tiempo',     color: 'text-emerald-400'},
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clasificar(dias: number): FiltroUrgencia {
  if (dias < 0)   return 'vencido'
  if (dias <= 5)  return 'urgente'
  if (dias <= 15) return 'proximo'
  return 'ok'
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface Props { empresas: Empresa[] }

export default function VencimientosGlobalesClient({ empresas }: Props) {
  const [items, setItems]         = useState<VencimientoEmpresa[]>([])
  const [loading, setLoading]     = useState(true)
  const [filtro, setFiltro]       = useState<FiltroUrgencia>('todos')
  const [refreshing, setRefreshing] = useState(false)

  const cargar = useCallback(async () => {
    if (!empresas.length) { setLoading(false); return }

    const resultados: VencimientoEmpresa[] = []

    await Promise.all(
      empresas.map(async (empresa) => {
        try {
          const vencimientos = await calcularProximosVencimientos(empresa.nit, empresa.tipo_contribuyente, empresa.id)
          vencimientos.forEach(v => {
            resultados.push({
              empresa,
              vencimiento: v,
              diasRest: diasRestantes(v.fecha_vencimiento),
            })
          })
        } catch {
          // empresa sin vencimientos — continúa
        }
      })
    )

    // Ordenar: vencidos primero, luego por fecha ascendente
    resultados.sort((a, b) => a.diasRest - b.diasRest)
    setItems(resultados)
    setLoading(false)
    setRefreshing(false)
  }, [empresas])

  useEffect(() => { cargar() }, [cargar])

  const handleRefresh = () => {
    setRefreshing(true)
    cargar()
  }

  const itemsFiltrados = filtro === 'todos'
    ? items
    : items.filter(i => clasificar(i.diasRest) === filtro)

  // Conteos por categoría
  const conteos = {
    vencido: items.filter(i => i.diasRest < 0).length,
    urgente: items.filter(i => i.diasRest >= 0 && i.diasRest <= 5).length,
    proximo: items.filter(i => i.diasRest > 5 && i.diasRest <= 15).length,
    ok:      items.filter(i => i.diasRest > 15).length,
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors">
            <ChevronLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <span className="text-slate-700">/</span>
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-blue-400" />
            <span className="text-sm font-semibold text-slate-100">Vista global de vencimientos</span>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">

        {/* ── Resumen ── */}
        {!loading && items.length > 0 && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Vencidos',     count: conteos.vencido, color: 'text-red-400',     bg: 'bg-red-500/10',     ring: 'ring-red-500/20',     icon: AlertTriangle },
              { label: 'Urgentes',     count: conteos.urgente, color: 'text-orange-400',  bg: 'bg-orange-500/10',  ring: 'ring-orange-500/20',  icon: Clock },
              { label: 'Próximos',     count: conteos.proximo, color: 'text-amber-400',   bg: 'bg-amber-500/10',   ring: 'ring-amber-500/20',   icon: CalendarCheck },
              { label: 'A tiempo',     count: conteos.ok,      color: 'text-emerald-400', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/20', icon: CheckCircle2 },
            ].map(({ label, count, color, bg, ring, icon: Icon }) => (
              <div key={label} className={`rounded-xl border ${ring} ring-1 ${bg} p-4`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{label}</span>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <p className={`mt-1 text-2xl font-bold ${color}`}>{count}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Filtros ── */}
        {!loading && items.length > 0 && (
          <div className="mb-5 flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-slate-500" />
            {FILTROS.map(f => (
              <button
                key={f.value}
                onClick={() => setFiltro(f.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all ring-1 ${
                  filtro === f.value
                    ? 'bg-blue-500/20 text-blue-300 ring-blue-500/40'
                    : 'bg-slate-800/60 text-slate-400 ring-slate-700/50 hover:text-slate-200'
                }`}
              >
                {f.label}
                {f.value !== 'todos' && conteos[f.value as keyof typeof conteos] > 0 && (
                  <span className="ml-1.5 font-bold">{conteos[f.value as keyof typeof conteos]}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* ── Estado de carga ── */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-24 text-slate-500">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-sm">Consultando vencimientos de {empresas.length} empresa{empresas.length !== 1 ? 's' : ''}…</p>
          </div>
        )}

        {/* ── Sin empresas ── */}
        {!loading && empresas.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-700 bg-slate-800/30 py-20 text-slate-500">
            <Inbox className="h-10 w-10" />
            <p className="text-sm font-medium">No hay empresas registradas aún.</p>
            <Link href="/dashboard" className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2">
              Ir al Dashboard para agregar una empresa
            </Link>
          </div>
        )}

        {/* ── Sin resultados con filtro ── */}
        {!loading && empresas.length > 0 && itemsFiltrados.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-700 bg-slate-800/30 py-16 text-slate-500">
            <CheckCircle2 className="h-8 w-8 text-emerald-500/50" />
            <p className="text-sm">No hay vencimientos en esta categoría.</p>
          </div>
        )}

        {/* ── Lista de vencimientos ── */}
        {!loading && itemsFiltrados.length > 0 && (
          <div className="space-y-3">
            {itemsFiltrados.map((item, idx) => {
              const { label, colorBg, colorText, colorRing } = etiquetaUrgencia(item.diasRest)
              return (
                <div
                  key={`${item.empresa.id}-${item.vencimiento.id}-${idx}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-700/50 bg-slate-800/40 px-5 py-4 hover:bg-slate-800/70 transition-colors"
                >
                  {/* Empresa + impuesto */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/15">
                      <Building2 className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-100">
                        {item.empresa.razon_social}
                      </p>
                      <p className="text-xs text-slate-500 font-mono">
                        NIT {item.empresa.nit}-{item.empresa.digito_verificacion}
                      </p>
                      <p className="mt-1 text-sm text-slate-300">
                        {item.vencimiento.impuesto.nombre}
                        {item.vencimiento.periodo && (
                          <span className="ml-1.5 text-xs text-slate-500">
                            · {item.vencimiento.periodo}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Fecha + badge */}
                  <div className="flex items-center gap-3 shrink-0 sm:text-right">
                    <div>
                      <p className="text-sm font-semibold text-slate-200">
                        {formatearFecha(item.vencimiento.fecha_vencimiento)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.diasRest < 0
                          ? `Venció hace ${Math.abs(item.diasRest)} día${Math.abs(item.diasRest) !== 1 ? 's' : ''}`
                          : item.diasRest === 0
                          ? 'Vence hoy'
                          : `En ${item.diasRest} día${item.diasRest !== 1 ? 's' : ''}`
                        }
                      </p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${colorBg} ${colorText} ${colorRing}`}>
                      {label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </main>
    </div>
  )
}
