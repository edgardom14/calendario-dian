'use client'

import { useState, useEffect } from 'react'
import {
  X, Building2, Hash, AtSign, UserCheck,
  Loader2, CheckCircle2, AlertCircle, Settings, ListChecks,
} from 'lucide-react'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import type { Empresa, TipoContribuyente } from '@/lib/types'

const TIPO_OPTIONS: { value: TipoContribuyente; label: string }[] = [
  { value: 'gran_contribuyente', label: 'Gran Contribuyente' },
  { value: 'persona_juridica',   label: 'Persona Jurídica'   },
  { value: 'persona_natural',    label: 'Persona Natural'    },
]

interface Impuesto { id: string; nombre: string; periodicidad: string }

interface Props {
  empresa: Empresa
  onClose: () => void
  onUpdated: (e: Empresa) => void
}

type Tab = 'datos' | 'obligaciones'

export default function EditarEmpresaModal({ empresa, onClose, onUpdated }: Props) {
  const [tab, setTab] = useState<Tab>('datos')

  /* ── Datos básicos ── */
  const [form, setForm] = useState({
    razon_social:        empresa.razon_social,
    digito_verificacion: String(empresa.digito_verificacion),
    tipo_contribuyente:  empresa.tipo_contribuyente,
    email_notificacion:  empresa.email_notificacion,
  })
  const [saving,   setSaving]   = useState(false)
  const [success,  setSuccess]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  /* ── Obligaciones ── */
  const [impuestos,         setImpuestos]         = useState<Impuesto[]>([])
  const [activos,           setActivos]           = useState<Set<string>>(new Set())
  const [loadingObl,        setLoadingObl]        = useState(false)
  const [savingObl,         setSavingObl]         = useState(false)
  const [successObl,        setSuccessObl]        = useState(false)

  /* Cierra con Escape */
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  /* Cargar impuestos y activos cuando se abre la pestaña */
  useEffect(() => {
    if (tab !== 'obligaciones' || impuestos.length > 0) return
    async function cargar() {
      setLoadingObl(true)
      const sb = createSupabaseBrowser()
      const [{ data: imp }, { data: ei }] = await Promise.all([
        sb.from('impuestos').select('id, nombre, periodicidad').eq('activo', true).order('nombre'),
        sb.from('empresa_impuestos').select('impuesto_id').eq('empresa_id', empresa.id),
      ])
      setImpuestos(imp ?? [])
      setActivos(new Set((ei ?? []).map(r => r.impuesto_id)))
      setLoadingObl(false)
    }
    cargar()
  }, [tab, empresa.id, impuestos.length])

  /* ── Guardar datos ── */
  async function handleSaveDatos(e: React.FormEvent) {
    e.preventDefault()
    const digito = Number(form.digito_verificacion)
    if (!/^\d$/.test(form.digito_verificacion)) { setError('El dígito de verificación debe ser un solo número (0–9).'); return }
    if (!form.razon_social.trim()) { setError('La razón social es obligatoria.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email_notificacion)) { setError('Correo inválido.'); return }

    setSaving(true); setError(null); setSuccess(false)
    const sb = createSupabaseBrowser()
    const { data, error: err } = await sb
      .from('empresas')
      .update({
        razon_social:        form.razon_social.trim(),
        digito_verificacion: digito,
        tipo_contribuyente:  form.tipo_contribuyente,
        email_notificacion:  form.email_notificacion.trim(),
      })
      .eq('id', empresa.id)
      .select()
      .single()

    if (err) { setError(err.message) }
    else { setSuccess(true); onUpdated(data as Empresa); setTimeout(() => setSuccess(false), 3000) }
    setSaving(false)
  }

  /* ── Toggle obligación ── */
  async function toggleObligacion(impuestoId: string, checked: boolean) {
    const sb = createSupabaseBrowser()
    const nuevoSet = new Set(activos)
    if (checked) {
      await sb.from('empresa_impuestos').insert({ empresa_id: empresa.id, impuesto_id: impuestoId })
      nuevoSet.add(impuestoId)
    } else {
      await sb.from('empresa_impuestos').delete().eq('empresa_id', empresa.id).eq('impuesto_id', impuestoId)
      nuevoSet.delete(impuestoId)
    }
    setActivos(nuevoSet)
  }

  /* ── Guardar todas las obligaciones de una vez ── */
  async function handleSaveObligaciones() {
    setSavingObl(true)
    const sb = createSupabaseBrowser()
    await sb.from('empresa_impuestos').delete().eq('empresa_id', empresa.id)
    if (activos.size > 0) {
      await sb.from('empresa_impuestos').insert(
        [...activos].map(impuesto_id => ({ empresa_id: empresa.id, impuesto_id }))
      )
    }
    setSuccessObl(true)
    setTimeout(() => setSuccessObl(false), 3000)
    setSavingObl(false)
  }

  const PERIODO_LABEL: Record<string, string> = {
    anual: 'Anual', bimestral: 'Bimestral', cuatrimestral: 'Cuatrimestral', mensual: 'Mensual',
  }

  return (
    <div
      onClick={e => { if (e.currentTarget === e.target) onClose() }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl shadow-black/50 flex flex-col max-h-[90vh]">

        {/* Cabecera */}
        <div className="flex items-start justify-between border-b border-slate-700/60 px-6 py-5 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-100">Editar empresa</h2>
            <p className="mt-0.5 text-xs text-slate-500 font-mono">{empresa.razon_social} · NIT {empresa.nit}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-slate-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700/60 shrink-0">
          {([['datos', Settings, 'Datos básicos'], ['obligaciones', ListChecks, 'Obligaciones']] as const).map(([t, Icon, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition border-b-2 -mb-px ${
                tab === t
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </div>

        {/* Cuerpo scrollable */}
        <div className="overflow-y-auto flex-1 px-6 py-5">

          {/* ── Pestaña datos ── */}
          {tab === 'datos' && (
            <form onSubmit={handleSaveDatos} className="space-y-4">
              <div>
                <label className="label" htmlFor="e_razon">Razón Social</label>
                <div className="input-wrapper">
                  <Building2 className="input-icon" />
                  <input id="e_razon" type="text" className="input"
                    value={form.razon_social}
                    onChange={e => setForm(p => ({ ...p, razon_social: e.target.value }))}
                    required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label" htmlFor="e_digito">Dígito verificación</label>
                  <div className="input-wrapper">
                    <Hash className="input-icon" />
                    <input id="e_digito" type="text" inputMode="numeric" maxLength={1} className="input"
                      value={form.digito_verificacion}
                      onChange={e => {
                        const v = e.target.value.replace(/\D/g, '').slice(0, 1)
                        setForm(p => ({ ...p, digito_verificacion: v }))
                      }}
                      required />
                  </div>
                </div>

                <div>
                  <label className="label" htmlFor="e_tipo">Tipo contribuyente</label>
                  <div className="input-wrapper">
                    <UserCheck className="input-icon" />
                    <select id="e_tipo" className="input appearance-none"
                      value={form.tipo_contribuyente}
                      onChange={e => setForm(p => ({ ...p, tipo_contribuyente: e.target.value as TipoContribuyente }))}>
                      {TIPO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="label" htmlFor="e_email">Correo de notificación</label>
                <div className="input-wrapper">
                  <AtSign className="input-icon" />
                  <input id="e_email" type="email" className="input"
                    value={form.email_notificacion}
                    onChange={e => setForm(p => ({ ...p, email_notificacion: e.target.value }))}
                    required />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />Empresa actualizada correctamente.
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button type="submit" disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          )}

          {/* ── Pestaña obligaciones ── */}
          {tab === 'obligaciones' && (
            <div>
              <p className="mb-4 text-xs text-slate-500">
                Selecciona las obligaciones tributarias que aplican a esta empresa. Solo se mostrarán vencimientos de los impuestos marcados.
              </p>

              {loadingObl ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                </div>
              ) : (
                <>
                  <ul className="space-y-1.5">
                    {impuestos.map(imp => (
                      <li key={imp.id}>
                        <label className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 transition-all ${
                          activos.has(imp.id)
                            ? 'border-blue-500/40 bg-blue-500/10'
                            : 'border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/60'
                        }`}>
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded accent-blue-500"
                              checked={activos.has(imp.id)}
                              onChange={e => toggleObligacion(imp.id, e.target.checked)}
                            />
                            <span className={`text-sm ${activos.has(imp.id) ? 'text-slate-100' : 'text-slate-400'}`}>
                              {imp.nombre}
                            </span>
                          </div>
                          <span className="text-xs text-slate-600">{PERIODO_LABEL[imp.periodicidad]}</span>
                        </label>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 flex items-center justify-between">
                    <p className="text-xs text-slate-500">{activos.size} obligación{activos.size !== 1 ? 'es' : ''} seleccionada{activos.size !== 1 ? 's' : ''}</p>
                    <div className="flex items-center gap-3">
                      {successObl && (
                        <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />Guardado
                        </span>
                      )}
                      <button
                        onClick={handleSaveObligaciones}
                        disabled={savingObl}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
                      >
                        {savingObl && <Loader2 className="h-4 w-4 animate-spin" />}
                        {savingObl ? 'Guardando…' : 'Guardar obligaciones'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
