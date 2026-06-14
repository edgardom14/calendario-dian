'use client'

import { CalendarCheck, ShieldCheck, User, Users, Inbox, Pencil, ChevronRight } from 'lucide-react'
import type { Empresa, TipoContribuyente } from '@/lib/types'
import type { EstadosPorEmpresa } from '@/app/dashboard/page'

const TIPO_LABEL: Record<TipoContribuyente, { label: string; Icon: React.ElementType; dot: string; badge: string }> = {
  gran_contribuyente: { label: 'Gran Contribuyente', Icon: ShieldCheck, dot: 'bg-amber-400',  badge: 'text-amber-400  bg-amber-400/10  ring-amber-400/20'  },
  persona_juridica:   { label: 'Persona Jurídica',   Icon: Users,       dot: 'bg-blue-400',   badge: 'text-blue-400   bg-blue-400/10   ring-blue-400/20'   },
  persona_natural:    { label: 'Persona Natural',     Icon: User,        dot: 'bg-violet-400', badge: 'text-violet-400 bg-violet-400/10 ring-violet-400/20' },
}

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/)
  const letters = parts.length >= 2
    ? parts[0][0] + parts[1][0]
    : name.slice(0, 2)
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600/30 to-violet-600/30 ring-1 ring-white/10 text-xs font-bold text-slate-200 uppercase">
      {letters}
    </div>
  )
}

function BadgesEstado({ empresaId, estadosPorEmpresa }: { empresaId: string; estadosPorEmpresa: EstadosPorEmpresa }) {
  const c = estadosPorEmpresa[empresaId]
  if (!c || (c.pendiente + c.presentado + c.pagado) === 0)
    return <span className="text-xs text-slate-700">—</span>

  return (
    <div className="flex flex-wrap items-center gap-1">
      {c.pendiente > 0 && (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/8 px-2 py-0.5 text-xs font-medium text-amber-400">
          {c.pendiente}P
        </span>
      )}
      {c.presentado > 0 && (
        <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/20 bg-blue-500/8 px-2 py-0.5 text-xs font-medium text-blue-400">
          {c.presentado}D
        </span>
      )}
      {c.pagado > 0 && (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/8 px-2 py-0.5 text-xs font-medium text-emerald-400">
          {c.pagado}✓
        </span>
      )}
    </div>
  )
}

interface Props {
  empresas: Empresa[]
  estadosPorEmpresa: EstadosPorEmpresa
  onVerObligaciones: (empresa: Empresa) => void
  onEditar: (empresa: Empresa) => void
}

export default function EmpresasTable({ empresas, estadosPorEmpresa, onVerObligaciones, onEditar }: Props) {
  if (empresas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-slate-600">
        <Inbox className="h-10 w-10 opacity-40" />
        <p className="text-sm font-medium">Sin clientes registrados</p>
        <p className="text-xs text-slate-700">Usa el formulario de arriba para agregar el primero.</p>
      </div>
    )
  }

  return (
    <>
      {/* Desktop */}
      <table className="hidden w-full text-sm md:table">
        <thead>
          <tr className="border-b border-white/5 text-xs font-medium uppercase tracking-wider text-slate-600">
            <th className="px-6 py-3 text-left">Cliente</th>
            <th className="px-4 py-3 text-left">NIT</th>
            <th className="px-4 py-3 text-left">Tipo</th>
            <th className="px-4 py-3 text-left">Seguimiento</th>
            <th className="px-6 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {empresas.map(empresa => {
            const tipo = TIPO_LABEL[empresa.tipo_contribuyente]
            return (
              <tr key={empresa.id} className="group transition-colors hover:bg-white/[0.02]">
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <Initials name={empresa.razon_social} />
                    <div>
                      <p className="font-semibold text-slate-100 leading-tight">{empresa.razon_social}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{empresa.email_notificacion}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className="font-mono text-xs text-slate-400 bg-white/5 rounded-md px-2 py-1">
                    {empresa.nit}-{empresa.digito_verificacion}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${tipo.badge}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${tipo.dot}`} />
                    {tipo.label}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <BadgesEstado empresaId={empresa.id} estadosPorEmpresa={estadosPorEmpresa} />
                </td>
                <td className="px-6 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEditar(empresa)}
                      className="rounded-lg border border-white/8 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-white/[0.08] hover:text-slate-200"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => onVerObligaciones(empresa)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/25 bg-blue-500/10 px-3.5 py-1.5 text-xs font-semibold text-blue-400 transition hover:bg-blue-500/20"
                    >
                      <CalendarCheck className="h-3.5 w-3.5" />
                      Vencimientos
                      <ChevronRight className="h-3 w-3 opacity-60" />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Mobile */}
      <ul className="divide-y divide-white/[0.04] md:hidden">
        {empresas.map(empresa => {
          const tipo = TIPO_LABEL[empresa.tipo_contribuyente]
          return (
            <li key={empresa.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <Initials name={empresa.razon_social} />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-100 text-sm truncate">{empresa.razon_social}</p>
                    <p className="font-mono text-xs text-slate-600 mt-0.5">{empresa.nit}-{empresa.digito_verificacion}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${tipo.badge}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${tipo.dot}`} />
                        {tipo.label}
                      </span>
                      <BadgesEstado empresaId={empresa.id} estadosPorEmpresa={estadosPorEmpresa} />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button onClick={() => onEditar(empresa)}
                    className="rounded-lg border border-white/8 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-white/[0.08]">
                    Editar
                  </button>
                  <button onClick={() => onVerObligaciones(empresa)}
                    className="inline-flex items-center gap-1 rounded-lg border border-blue-500/25 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-400 hover:bg-blue-500/20">
                    <CalendarCheck className="h-3.5 w-3.5" />Venc.
                  </button>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )
}
