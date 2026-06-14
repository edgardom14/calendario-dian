'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  CalendarCheck, LayoutDashboard, ListChecks, User, LogOut,
  ChevronLeft, ChevronRight, X, Calendar,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import type { Empresa } from '@/lib/types'
import type { VencimientoCalendario, EstadoCalendario } from '@/app/calendario/page'

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

interface ObligacionDia {
  vencimientoId: string
  impuesto: string
  periodo: string | null
  empresas: { id: string; nombre: string; estado: string }[]
}

interface Props {
  empresas: Pick<Empresa, 'id' | 'nit' | 'razon_social' | 'tipo_contribuyente'>[]
  vencimientos: VencimientoCalendario[]
  estadosIniciales: EstadoCalendario[]
}

export default function CalendarioClient({ empresas, vencimientos, estadosIniciales }: Props) {
  const router = useRouter()
  const hoy = new Date()
  const [año, setAño]     = useState(hoy.getFullYear())
  const [mes, setMes]     = useState(hoy.getMonth())
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null)

  async function handleSignOut() {
    await createSupabaseBrowser().auth.signOut()
    router.push('/login')
  }

  // Mapa digito → empresas que tienen ese último dígito
  const empresasPorDigito = useMemo(() => {
    const map = new Map<number, typeof empresas>()
    for (const e of empresas) {
      const d = Number(e.nit.at(-1))
      if (!map.has(d)) map.set(d, [])
      map.get(d)!.push(e)
    }
    return map
  }, [empresas])

  // Mapa vencimientoId+empresaId → estado
  const estadoMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const e of estadosIniciales) map.set(`${e.vencimiento_id}:${e.empresa_id}`, e.estado)
    return map
  }, [estadosIniciales])

  // Mapa fecha → obligaciones del día
  const obligacionesPorFecha = useMemo(() => {
    const map = new Map<string, ObligacionDia[]>()
    for (const v of vencimientos) {
      const emps = empresasPorDigito.get(v.ultimo_digito_nit) ?? []
      if (emps.length === 0) continue
      const obs: ObligacionDia = {
        vencimientoId: v.id,
        impuesto: v.impuesto_nombre,
        periodo: v.periodo,
        empresas: emps.map(e => ({
          id: e.id,
          nombre: e.razon_social,
          estado: estadoMap.get(`${v.id}:${e.id}`) ?? 'pendiente',
        })),
      }
      if (!map.has(v.fecha)) map.set(v.fecha, [])
      map.get(v.fecha)!.push(obs)
    }
    return map
  }, [vencimientos, empresasPorDigito, estadoMap])

  // Días del mes actual en la grilla
  const diasGrilla = useMemo(() => {
    const primerDia = new Date(año, mes, 1).getDay()
    const diasEnMes = new Date(año, mes + 1, 0).getDate()
    const celdas: (number | null)[] = Array(primerDia).fill(null)
    for (let d = 1; d <= diasEnMes; d++) celdas.push(d)
    while (celdas.length % 7 !== 0) celdas.push(null)
    return celdas
  }, [año, mes])

  function navMes(delta: number) {
    setDiaSeleccionado(null)
    const d = new Date(año, mes + delta, 1)
    setAño(d.getFullYear())
    setMes(d.getMonth())
  }

  function fechaStr(dia: number) {
    return `${año}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
  }

  function colorEstado(estado: string) {
    if (estado === 'pagado')     return 'bg-emerald-500'
    if (estado === 'presentado') return 'bg-blue-500'
    return 'bg-amber-500'
  }

  const obligacionesDiaSeleccionado = diaSeleccionado ? (obligacionesPorFecha.get(diaSeleccionado) ?? []) : []

  const todosEstadosDia = (fecha: string) => {
    const obs = obligacionesPorFecha.get(fecha) ?? []
    const todos = obs.flatMap(o => o.empresas.map(e => e.estado))
    if (todos.length === 0) return null
    if (todos.every(s => s === 'pagado'))     return 'pagado'
    if (todos.some(s => s === 'pendiente'))   return 'pendiente'
    return 'presentado'
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
            <LayoutDashboard className="h-4 w-4" />Dashboard
          </Link>
          <Link href="/vencimientos" className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition hover:bg-slate-800 hover:text-slate-200">
            <ListChecks className="h-4 w-4" />Vencimientos
          </Link>
          <span className="flex items-center gap-1.5 rounded-lg bg-blue-500/10 px-3 py-1.5 text-blue-400">
            <Calendar className="h-4 w-4" />Calendario
          </span>
          <Link href="/perfil" className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition hover:bg-slate-800 hover:text-slate-200">
            <User className="h-4 w-4" />Mi Perfil
          </Link>
          <button onClick={handleSignOut} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition hover:bg-slate-800 hover:text-slate-200">
            <LogOut className="h-4 w-4" />Cerrar sesión
          </button>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-8">

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Calendario Fiscal</h1>
            <p className="mt-0.5 text-sm text-slate-500">Días con obligaciones DIAN para tus {empresas.length} empresa{empresas.length !== 1 ? 's' : ''}.</p>
          </div>
          {/* Leyenda */}
          <div className="hidden sm:flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" />Pendiente</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" />Presentado</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Pagado</span>
          </div>
        </div>

        <div className={`grid gap-6 ${diaSeleccionado ? 'lg:grid-cols-[1fr_320px]' : ''}`}>

          {/* Calendario */}
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6 shadow-xl shadow-black/20">

            {/* Navegación mes */}
            <div className="mb-6 flex items-center justify-between">
              <button onClick={() => navMes(-1)} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-semibold text-slate-100">
                {MESES[mes]} {año}
              </h2>
              <button onClick={() => navMes(1)} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Cabecera días */}
            <div className="mb-2 grid grid-cols-7 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
              {DIAS.map(d => <div key={d}>{d}</div>)}
            </div>

            {/* Grilla de días */}
            <div className="grid grid-cols-7 gap-1">
              {diasGrilla.map((dia, i) => {
                if (!dia) return <div key={i} />
                const fecha = fechaStr(dia)
                const tieneObs = obligacionesPorFecha.has(fecha)
                const estado = todosEstadosDia(fecha)
                const esHoy = fecha === hoy.toISOString().split('T')[0]
                const seleccionado = fecha === diaSeleccionado

                return (
                  <button
                    key={i}
                    onClick={() => setDiaSeleccionado(seleccionado ? null : fecha)}
                    className={`relative flex flex-col items-center justify-start rounded-xl p-2 pt-2 transition-all min-h-[52px] ${
                      seleccionado
                        ? 'bg-blue-600 text-white'
                        : tieneObs
                        ? 'bg-slate-800/80 text-slate-100 hover:bg-slate-700/80'
                        : 'text-slate-500 hover:bg-slate-800/40 hover:text-slate-300'
                    }`}
                  >
                    <span className={`text-sm font-medium leading-none ${esHoy && !seleccionado ? 'text-blue-400' : ''}`}>
                      {dia}
                    </span>
                    {esHoy && !seleccionado && (
                      <span className="mt-0.5 h-1 w-1 rounded-full bg-blue-400" />
                    )}
                    {tieneObs && !seleccionado && estado && (
                      <span className={`mt-1 h-2 w-2 rounded-full ${colorEstado(estado)}`} />
                    )}
                    {tieneObs && (
                      <span className={`mt-0.5 text-[10px] leading-none ${seleccionado ? 'text-blue-200' : 'text-slate-500'}`}>
                        {obligacionesPorFecha.get(fecha)!.length} oblg.
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Panel lateral: detalle del día */}
          {diaSeleccionado && (
            <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-5 shadow-xl shadow-black/20">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Obligaciones</p>
                  <p className="text-base font-semibold text-slate-100">
                    {new Date(diaSeleccionado + 'T00:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                </div>
                <button onClick={() => setDiaSeleccionado(null)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {obligacionesDiaSeleccionado.length === 0 ? (
                <p className="text-sm text-slate-500">No hay obligaciones este día.</p>
              ) : (
                <ul className="space-y-3">
                  {obligacionesDiaSeleccionado.map(ob => (
                    <li key={ob.vencimientoId} className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
                      <p className="text-sm font-semibold text-slate-100">{ob.impuesto}</p>
                      {ob.periodo && <p className="mt-0.5 text-xs text-slate-500">{ob.periodo}</p>}
                      <ul className="mt-3 space-y-1.5">
                        {ob.empresas.map(e => (
                          <li key={e.id} className="flex items-center justify-between gap-2">
                            <span className="text-xs text-slate-400 truncate">{e.nombre}</span>
                            <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                              e.estado === 'pagado'     ? 'bg-emerald-500/15 text-emerald-400' :
                              e.estado === 'presentado' ? 'bg-blue-500/15 text-blue-400' :
                              'bg-amber-500/15 text-amber-400'
                            }`}>
                              {e.estado}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="mt-16 border-t border-slate-800 px-8 py-5 text-center text-xs text-slate-600">
        CalendarioDIAN · {new Date().getFullYear()}
      </footer>
    </div>
  )
}
