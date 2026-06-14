'use client'

import { useEffect, useRef, useState } from 'react'
import {
  X, CalendarCheck, Loader2, AlertCircle,
  Clock, FileText, RefreshCw, Inbox, CheckCircle2, CircleDollarSign, Circle,
} from 'lucide-react'
import { diasRestantes, etiquetaUrgencia, formatearFecha } from '@/lib/dianLogic'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import type { Empresa, VencimientoConEstado, EstadoVencimiento } from '@/lib/types'

const PERIODICIDAD_LABEL: Record<string, string> = {
  anual: 'Anual', bimestral: 'Bimestral', cuatrimestral: 'Cuatrimestral', mensual: 'Mensual',
}

const ESTADOS: { value: EstadoVencimiento; label: string; color: string; Icon: React.ElementType }[] = [
  { value: 'pendiente',   label: 'Pendiente',   color: 'text-slate-400   border-slate-600    bg-slate-700/40   hover:bg-slate-700',       Icon: Circle           },
  { value: 'presentado',  label: 'Presentado',  color: 'text-blue-400    border-blue-500/40  bg-blue-500/10    hover:bg-blue-500/20',      Icon: CheckCircle2     },
  { value: 'pagado',      label: 'Pagado',      color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20', Icon: CircleDollarSign },
]

interface Props {
  empresa: Empresa
  vencimientos: VencimientoConEstado[]
  loading: boolean
  error: string | null
  onClose: () => void
  onUpdateVencimiento: (vencimientoId: string, ev_id: string | null, estado: EstadoVencimiento) => void
}

export default function ObligacionesModal({
  empresa, vencimientos, loading, error, onClose, onUpdateVencimiento,
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  async function cambiarEstado(v: VencimientoConEstado, nuevoEstado: EstadoVencimiento) {
    if (saving) return
    setSaving(v.id)
    const supabase = createSupabaseBrowser()
    if (v.empresa_vencimiento_id) {
      await supabase.from('empresa_vencimientos').update({ estado: nuevoEstado }).eq('id', v.empresa_vencimiento_id)
      onUpdateVencimiento(v.id, v.empresa_vencimiento_id, nuevoEstado)
    } else {
      const { data } = await supabase
        .from('empresa_vencimientos')
        .insert({ empresa_id: empresa.id, vencimiento_id: v.id, estado: nuevoEstado })
        .select('id').single()
      onUpdateVencimiento(v.id, data?.id ?? null, nuevoEstado)
    }
    setSaving(null)
  }

  return (
    <div
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl shadow-black/50">

        <div className="flex items-start justify-between border-b border-slate-700/60 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/15">
              <CalendarCheck className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100 leading-tight">Proximas Obligaciones</h2>
              <p className="mt-0.5 text-xs text-slate-500 leading-tight">
                {empresa.razon_social}
                <span className="ml-1.5 font-mono text-slate-600">NIT {empresa.nit}-{empresa.digito_verificacion}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-slate-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5">
          {loading && (
            <div className="flex flex-col items-center gap-3 py-12 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
              <p className="text-sm">Consultando calendario DIAN...</p>
            </div>
          )}
          {!loading && error && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <AlertCircle className="h-8 w-8 text-red-400" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
          {!loading && !error && vencimientos.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-12 text-slate-500">
              <Inbox className="h-8 w-8" />
              <p className="text-sm">No hay vencimientos proximos registrados</p>
              <p className="text-xs">para el digito <span className="font-mono text-slate-400">{empresa.nit.at(-1)}</span>.</p>
            </div>
          )}
          {!loading && !error && vencimientos.length > 0 && (
            <ul className="space-y-3">
              {vencimientos.map((v, i) => {
                const dias = diasRestantes(v.fecha_vencimiento)
                const urgencia = etiquetaUrgencia(dias)
                const isSaving = saving === v.id
                return (
                  <li key={v.id} className="relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
                    <div className={`absolute left-0 top-0 h-full w-1 rounded-l-xl ${urgencia.colorBg.replace('/10', '/60').replace('/15', '/80')}`} />
                    <div className="pl-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-slate-300">{i + 1}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <FileText className="h-3.5 w-3.5 text-slate-400" />
                              <span className="text-sm font-semibold text-slate-100">{v.impuesto.nombre}</span>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              {v.periodo && <span className="text-xs text-slate-400">{v.periodo}</span>}
                              <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 px-2 py-0.5 text-xs text-slate-500">
                                <RefreshCw className="h-2.5 w-2.5" />
                                {PERIODICIDAD_LABEL[v.impuesto.periodicidad]}
                              </span>
                            </div>
                            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                              <Clock className="h-3 w-3" />
                              <span>{formatearFecha(v.fecha_vencimiento)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${urgencia.colorBg} ${urgencia.colorText} ${urgencia.colorRing}`}>
                            {urgencia.label}
                          </span>
                          <span className="text-xs text-slate-500">
                            {dias < 0 ? `Hace ${Math.abs(dias)} dias` : dias === 0 ? 'Hoy' : `${dias} dia${dias !== 1 ? 's' : ''}`}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-1.5">
                        <span className="mr-1 text-xs text-slate-600">Estado:</span>
                        {ESTADOS.map(({ value, label, color, Icon }) => (
                          <button
                            key={value}
                            disabled={isSaving}
                            onClick={() => cambiarEstado(v, value)}
                            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                              v.estado === value
                                ? color + ' ring-1'
                                : 'border-slate-700 bg-transparent text-slate-500 hover:text-slate-300 hover:border-slate-600'
                            }`}
                          >
                            {isSaving && v.estado !== value ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Icon className="h-3 w-3" />
                            )}
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-700/60 px-6 py-4">
          <p className="text-xs text-slate-600">
            Digito NIT: <span className="font-mono text-slate-400">{empresa.nit.at(-1)}</span>
          </p>
          <button onClick={onClose} className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-medium text-slate-400 transition hover:bg-slate-800 hover:text-slate-200">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
