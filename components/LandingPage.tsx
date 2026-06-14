'use client'

import Link from 'next/link'
import {
  CalendarCheck,
  ShieldCheck,
  Bell,
  FileText,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'

const features = [
  {
    icon: <CalendarCheck className="h-7 w-7 text-blue-500" />,
    title: 'Calendario Tributario',
    description:
      'Visualiza todas las fechas clave de la DIAN organizadas por impuesto y tipo de contribuyente.',
  },
  {
    icon: <Bell className="h-7 w-7 text-blue-500" />,
    title: 'Alertas de Vencimiento',
    description:
      'Recibe notificaciones anticipadas antes de cada obligación fiscal para evitar sanciones.',
  },
  {
    icon: <ShieldCheck className="h-7 w-7 text-blue-500" />,
    title: 'Control de Cumplimiento',
    description:
      'Registra el estado de cada declaración y lleva un historial de cumplimiento organizado.',
  },
  {
    icon: <FileText className="h-7 w-7 text-blue-500" />,
    title: 'Documentación Centralizada',
    description:
      'Adjunta soportes, formularios y comprobantes directamente a cada obligación fiscal.',
  },
  {
    icon: <TrendingUp className="h-7 w-7 text-blue-500" />,
    title: 'Reportes e Indicadores',
    description:
      'Analiza tu historial tributario con reportes claros sobre cumplimiento y tendencias.',
  },
]

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <CalendarCheck className="h-8 w-8 text-blue-400" />
          <span className="text-xl font-bold tracking-tight">CalendarioDIAN</span>
        </div>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-blue-300 hover:text-white transition-colors"
        >
          Ingresar al Dashboard
        </Link>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-28">
        <span className="mb-4 inline-block rounded-full bg-blue-500/15 px-4 py-1.5 text-sm font-medium text-blue-300 ring-1 ring-blue-500/30">
          Plataforma de Gestión Tributaria
        </span>

        <h1 className="max-w-3xl text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl">
          Controla tus{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            vencimientos fiscales
          </span>{' '}
          DIAN sin esfuerzo
        </h1>

        <p className="mt-6 max-w-xl text-lg text-slate-300 leading-relaxed">
          La plataforma inteligente para contadores y empresas colombianas que centraliza
          obligaciones tributarias, envía alertas a tiempo y garantiza el cumplimiento ante la DIAN.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-400 transition-all duration-200"
          >
            Ingresar al Dashboard
            <ArrowRight className="h-5 w-5" />
          </Link>
          <a
            href="#features"
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-8 py-3.5 text-base font-medium text-slate-200 hover:bg-white/5 transition-all duration-200"
          >
            Ver funcionalidades
          </a>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-8 text-center">
          {[
            { value: '12+', label: 'Tipos de impuestos' },
            { value: '100%', label: 'Actualizado DIAN 2025' },
            { value: '0', label: 'Sanciones por olvido' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-bold text-blue-400">{stat.value}</p>
              <p className="mt-1 text-sm text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-3 text-center text-3xl font-bold">Todo lo que necesitas</h2>
          <p className="mb-12 text-center text-slate-400">
            Diseñado para el régimen tributario colombiano y las exigencias de la DIAN.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm hover:border-blue-500/40 hover:bg-white/8 transition-all duration-200"
              >
                <div className="mb-4 inline-flex rounded-xl bg-blue-500/10 p-2">{f.icon}</div>
                <h3 className="mb-2 text-base font-semibold">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center">
        <div className="mx-auto max-w-2xl rounded-3xl border border-blue-500/20 bg-blue-500/10 p-12 backdrop-blur-sm">
          <h2 className="text-3xl font-bold">¿Listo para tener el control?</h2>
          <p className="mt-3 text-slate-300">
            Empieza hoy y nunca más pierdas una fecha de la DIAN.
          </p>
          <Link
            href="/dashboard"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-500 px-10 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-400 transition-all duration-200"
          >
            Ingresar al Dashboard
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-8 py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} CalendarioDIAN · Plataforma de control de vencimientos fiscales
        para Colombia
      </footer>
    </main>
  )
}
