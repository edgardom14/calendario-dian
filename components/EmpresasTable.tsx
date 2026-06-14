'use client'

import {
  Building2,
  CalendarCheck,
  ChevronRight,
  ShieldCheck,
  User,
  Users,
  Inbox,
} from 'lucide-react'
import type { Empresa, TipoContribuyente } from '@/lib/types'

const TIPO_LABEL: Record<TipoContribuyente, { label: string; Icon: React.ElementType; color: string }> = {
  gran_contribuyente: { label: 'Gran Contribuyente', Icon: ShieldCheck, color: 'text-amber-400  bg-amber-400/10  ring-amber-400/25' },
  persona_juridica:   { label: 'Persona Jurídica',   Icon: Users,       color: 'text-blue-400   bg-blue-400/10   ring-blue-400/25'  },
  persona_natural:    { label: 'Persona Natural',     Icon: User,        color: 'text-violet-400 bg-violet-400/10 ring-violet-400/25' },
}

interface Props {
  empresas: Empresa[]
  onVerObligaciones: (empresa: Empresa) => void
}

export default function EmpresasTable({ empresas, onVerObligaciones }: Props) {
  if (empresas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-700 bg-slate-800/40 py-16 text-slate-500">
        <Inbox className="h-10 w-10" />
        <p className="text-sm">Aún no hay empresas registradas.</p>
        <p className="text-xs">Usa el formulario de arriba para agregar la primera.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-700/60">
      {/* Desktop table */}
      <table className="hidden w-full text-sm md:table">
        <thead>
          <tr className="border-b border-slate-700/60 bg-slate-800/70 text-xs uppercase tracking-wider text-slate-400">
            <th className="px-5 py-3.5 text-left">Razón Social</th>
            <th className="px-5 py-3.5 text-left">NIT</th>
            <th className="px-5 py-3.5 text-left">Tipo</th>
            <th className="px-5 py-3.5 text-left">Correo</th>
            <th className="px-5 py-3.5 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/40">
          {empresas.map(empresa => {
            const tipo = TIPO_LABEL[empresa.tipo_contribuyente]
            return (
              <tr
                key={empresa.id}
                className="bg-slate-800/30 transition-colors hover:bg-slate-800/60"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/15">
                      <Building2 className="h-4 w-4 text-blue-400" />
                    </div>
                    <span className="font-medium text-slate-100">{empresa.razon_social}</span>
                  </div>
                </td>
                <td className="px-5 py-4 font-mono text-slate-300">
                  {empresa.nit}
                  <span className="text-slate-500">-{empresa.digito_verificacion}</span>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${tipo.color}`}>
                    <tipo.Icon className="h-3.5 w-3.5" />
                    {tipo.label}
                  </span>
                </td>
                <td className="px-5 py-4 text-slate-400">{empresa.email_notificacion}</td>
                <td className="px-5 py-4 text-right">
                  <button
                    onClick={() => onVerObligaciones(empresa)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3.5 py-1.5 text-xs font-semibold text-blue-400 transition-all hover:bg-blue-500/20 hover:text-blue-300"
                  >
                    <CalendarCheck className="h-3.5 w-3.5" />
                    Ver Obligaciones
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Mobile cards */}
      <ul className="divide-y divide-slate-700/40 md:hidden">
        {empresas.map(empresa => {
          const tipo = TIPO_LABEL[empresa.tipo_contribuyente]
          return (
            <li key={empresa.id} className="bg-slate-800/30 px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-100">{empresa.razon_social}</p>
                  <p className="mt-0.5 font-mono text-sm text-slate-400">
                    {empresa.nit}-{empresa.digito_verificacion}
                  </p>
                  <span className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${tipo.color}`}>
                    <tipo.Icon className="h-3.5 w-3.5" />
                    {tipo.label}
                  </span>
                  <p className="mt-2 text-xs text-slate-500">{empresa.email_notificacion}</p>
                </div>
                <button
                  onClick={() => onVerObligaciones(empresa)}
                  className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-400 hover:bg-blue-500/20"
                >
                  <CalendarCheck className="h-3.5 w-3.5" />
                  Obligaciones
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
