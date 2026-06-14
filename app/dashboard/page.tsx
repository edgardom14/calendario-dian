import DashboardClient from '@/components/DashboardClient'
import { getEmpresas } from '@/lib/empresas'
import type { Empresa } from '@/lib/types'

export const metadata = { title: 'Dashboard – CalendarioDIAN' }

export default async function DashboardPage() {
  let empresas: Empresa[] = []
  try {
    empresas = await getEmpresas()
  } catch {
    // Supabase no configurado aún: arranca con lista vacía
  }

  return <DashboardClient initialEmpresas={empresas} />
}
