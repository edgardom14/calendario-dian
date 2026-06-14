'use client'

import { useEffect, useRef } from 'react'
import {
  X,
  CalendarCheck,
  Loader2,
  AlertCircle,
  Clock,
  FileText,
  RefreshCw,
  Inbox,
} from 'lucide-react'
import { diasRestantes, etiquetaUrgencia, formatearFecha } from '@/lib/dianLogic'
import type { Empresa, VencimientoConImpuesto } from '@/lib/types'

const PERIODICIDAD_LABEL: Record<string, string> = {
  anual:          'Anual',
  bimestral:      'Bimestral',
  cuatrimestral:  'Cuatrimestral',
  mensual:        'Mensual',
}

interface Props {
  empresa: Empresa | null
  vencimientos: VencimientoConImpuesto[]
  loading: boolean
  error: string | null
  onClose: () => void
}

export default function ObligacionesModal({
  empresa,
  vencimientos,
  loading,
  error,
  onClose,
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)

  // Cierra con Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Bloquea scroll del body mientras el modal está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  if (!empresa) return null

  return (
    /* Overlay */
    <div
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
    >
      {/* Panel */}
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl shadow-black/50">

        {/* ── Cabecera ── */}
        <div className="flex items-start justify-between border-b border-slate-700/60 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/15">
              <CalendarCheck className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100 leading-tight">
                Próximas Obligaciones
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 leading-tight">
                {empresa.razon_social}
                <span className="ml-1.5 font-mono text-slate-600">
                  NIT {empresa.nit}-{empresa.digito_verificacion}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-slate-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Cuerpo ── */}
        <div className="px-6 py-5">

          {/* Estado: cargando */}
          {loading && (
            <div className="flex flex-col items-center gap-3 py-12 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
              <p className="text-sm">Consultando calendario DIAN…</p>
            </div>
          )}

          {/* Estado: error */}
          {!loading && error && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <AlertCircle className="h-8 w-8 text-red-400" />
              <p className="text-sm text-red-400">{error}</p>
              <p className="text-xs text-slate-500">Verifica que Supabase esté configurado y haya datos en la tabla vencimientos.</p>
            </div>
          )}

          {/* Estado: sin resultados */}
          {!loading && !error && vencimientos.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-12 text-slate-500">
              <Inbox className="h-8 w-8" />
              <p className="text-sm">No hay vencimientos próximos registrados</p>
              <p className="text-xs">para el dígito <span className="font-mono text-slate-400">{empresa.nit.at(-1)}</span> en la base de datos.</p>
            </div>
          )}

          {/* Estado: resultados */}
          {!loading && !error && vencimientos.length > 0 && (
            <ul className="space-y-3">
              {vencimientos.map((v, i) => {
                const dias    = diasRestantes(v.fecha_vencimiento)
                const urgencia = etiquetaUrgencia(dias)

                return (
                  <li
                    key={v.id}
                    className="relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/50 p-4"
                  >
                    {/* Acento lateral de color */}
                    <div className={`absolute left-0 top-0 h-full w-1 rounded-l-xl ${urgencia.colorBg.replace('/10', '/60').replace('/15', '/80')}`} />

                    <div className="flex items-start justify-between gap-3 pl-2">
                      {/* Info izquierda */}
                      <div className="flex items-start gap-3">
                        {/* Número de posición */}
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-slate-300">
                          {i + 1}
                        </span>
                        <div>
                          {/* Nombre del impuesto */}
                          <div className="flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-sm font-semibold text-slate-100">
                              {v.impuesto.nombre}
                            </span>
                          </div>
                          {/* Período y periodicidad */}
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            {v.periodo && (
                              <span className="text-xs text-slate-400">{v.periodo}</span>
                            )}
                            <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 px-2 py-0.5 text-xs text-slate-500">
                              <RefreshCw className="h-2.5 w-2.5" />
                              {PERIODICIDAD_LABEL[v.impuesto.periodicidad]}
                            </span>
                          </div>
                          {/* Fecha */}
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                            <Clock className="h-3 w-3" />
                            <span>{formatearFecha(v.fecha_vencimiento)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Badge de urgencia + días */}
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${urgencia.colorBg} ${urgencia.colorText} ${urgencia.colorRing}`}
                        >
                          {urgencia.label}
                        </span>
                        <span className="text-xs text-slate-500">
                          {dias < 0
                            ? `Hace ${Math.abs(dias)} días`
                            : dias === 0
                            ? 'Hoy'
                            : `${dias} día${dias !== 1 ? 's' : ''}`}
                        </span>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* ── Pie ── */}
        <div className="flex items-center justify-between border-t border-slate-700/60 px-6 py-4">
          <p className="text-xs text-slate-600">
            Filtrado por último dígito NIT:{' '}
            <span className="font-mono text-slate-400">{empresa.nit.at(-1)}</span>
          </p>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-medium text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
