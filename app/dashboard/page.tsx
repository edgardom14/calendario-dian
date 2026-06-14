import DashboardClient from '@/components/DashboardClient'
import { createSupabaseServer } from '@/lib/supabase-server'
import type { Empresa, EstadoVencimiento } from '@/lib/types'

export const metadata = { title: 'Dashboard – CalendarioDIAN' }

export type ConteoEstados = Record<EstadoVencimiento, number>
export type EstadosPorEmpresa = Record<string, ConteoEstados>

export default async function DashboardPage() {
  let empresas: Empresa[] = []
  let estadosPorEmpresa: EstadosPorEmpresa = {}

  try {
    const supabase = await createSupabaseServer()
    const [{ data: emp }, { data: ev }] = await Promise.all([
      supabase.from('empresas').select('*').order('razon_social', { ascending: true }),
      supabase.from('empresa_vencimientos').select('empresa_id, estado'),
    ])
    empresas = emp ?? []

    for (const row of ev ?? []) {
      if (!estadosPorEmpresa[row.empresa_id]) {
        estadosPorEmpresa[row.empresa_id] = { pendiente: 0, presentado: 0, pagado: 0, vencido: 0, no_aplica: 0 }
      }
      estadosPorEmpresa[row.empresa_id][row.estado as EstadoVencimiento]++
    }
  } catch {
    // arranca con lista vacía si Supabase no responde
  }

  return <DashboardClient initialEmpresas={empresas} estadosPorEmpresa={estadosPorEmpresa} />
}
