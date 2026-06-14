import DashboardClient from '@/components/DashboardClient'
import { createSupabaseServer } from '@/lib/supabase-server'
import type { Empresa } from '@/lib/types'

export const metadata = { title: 'Dashboard – CalendarioDIAN' }

export default async function DashboardPage() {
  let empresas: Empresa[] = []
  try {
    const supabase = await createSupabaseServer()
    const { data } = await supabase
      .from('empresas')
      .select('*')
      .order('razon_social', { ascending: true })
    empresas = data ?? []
  } catch {
    // arranca con lista vacía si Supabase no responde
  }

  return <DashboardClient initialEmpresas={empresas} />
}
