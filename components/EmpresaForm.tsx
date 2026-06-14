'use client'

import { useState } from 'react'
import { Building2, Hash, AtSign, UserCheck, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { insertEmpresa } from '@/lib/empresas'
import type { Empresa, EmpresaInsert, TipoContribuyente } from '@/lib/types'

const TIPO_OPTIONS: { value: TipoContribuyente; label: string }[] = [
  { value: 'gran_contribuyente', label: 'Gran Contribuyente' },
  { value: 'persona_juridica',   label: 'Persona Jurídica' },
  { value: 'persona_natural',    label: 'Persona Natural' },
]

const EMPTY_FORM: EmpresaInsert = {
  razon_social:       '',
  nit:                '',
  digito_verificacion: 0,
  tipo_contribuyente: 'persona_juridica',
  email_notificacion: '',
}

interface Props {
  onCreated: (empresa: Empresa) => void
}

export default function EmpresaForm({ onCreated }: Props) {
  const [form, setForm]       = useState<EmpresaInsert>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: name === 'digito_verificacion' ? Number(value) : value,
    }))
    setError(null)
    setSuccess(false)
  }

  function validate(): string | null {
    if (!form.razon_social.trim())                       return 'La razón social es obligatoria.'
    if (!/^\d{6,15}$/.test(form.nit))                   return 'El NIT debe contener entre 6 y 15 dígitos, sin guiones.'
    if (form.digito_verificacion < 0 || form.digito_verificacion > 9) return 'El dígito de verificación debe estar entre 0 y 9.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email_notificacion))  return 'Ingresa un correo electrónico válido.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setLoading(true)
    setError(null)
    try {
      const nueva = await insertEmpresa(form)
      onCreated(nueva)
      setForm(EMPTY_FORM)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la empresa.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid gap-5 sm:grid-cols-2">

        {/* Razón Social */}
        <div className="sm:col-span-2">
          <label className="label" htmlFor="razon_social">Razón Social</label>
          <div className="input-wrapper">
            <Building2 className="input-icon" />
            <input
              id="razon_social"
              name="razon_social"
              type="text"
              className="input"
              placeholder="Empresa S.A.S."
              value={form.razon_social}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* NIT */}
        <div>
          <label className="label" htmlFor="nit">NIT</label>
          <div className="input-wrapper">
            <Hash className="input-icon" />
            <input
              id="nit"
              name="nit"
              type="text"
              inputMode="numeric"
              className="input"
              placeholder="900123456"
              value={form.nit}
              onChange={handleChange}
              maxLength={15}
              required
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-500">Sin guiones ni dígito de verificación</p>
        </div>

        {/* Dígito de Verificación */}
        <div>
          <label className="label" htmlFor="digito_verificacion">Dígito de Verificación</label>
          <div className="input-wrapper">
            <Hash className="input-icon" />
            <input
              id="digito_verificacion"
              name="digito_verificacion"
              type="number"
              min={0}
              max={9}
              className="input"
              placeholder="7"
              value={form.digito_verificacion}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Tipo de Contribuyente */}
        <div>
          <label className="label" htmlFor="tipo_contribuyente">Tipo de Contribuyente</label>
          <div className="input-wrapper">
            <UserCheck className="input-icon" />
            <select
              id="tipo_contribuyente"
              name="tipo_contribuyente"
              className="input appearance-none"
              value={form.tipo_contribuyente}
              onChange={handleChange}
            >
              {TIPO_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="label" htmlFor="email_notificacion">Correo de Notificación</label>
          <div className="input-wrapper">
            <AtSign className="input-icon" />
            <input
              id="email_notificacion"
              name="email_notificacion"
              type="email"
              className="input"
              placeholder="contabilidad@empresa.com"
              value={form.email_notificacion}
              onChange={handleChange}
              required
            />
          </div>
        </div>
      </div>

      {/* Feedback */}
      {error && (
        <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 flex items-center gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Empresa registrada exitosamente.
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Guardando…' : 'Registrar Empresa'}
        </button>
      </div>
    </form>
  )
}
