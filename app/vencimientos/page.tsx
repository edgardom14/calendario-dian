import VencimientosGlobalesClient from '@/components/VencimientosGlobalesClient'
import { getEmpresas } from '@/lib/empresas'
import type { Empresa } from '@/lib/types'

export const metadata = { title: 'Vencimientos – CalendarioDIAN' }
export const revalidate = 300 // refresca cada 5 min en producción

export default async function VencimientosPage() {
  let empresas: Empresa[] = []
  try {
    empresas = await getEmpresas()
  } catch {
    // Supabase no configurado: arranca vacío
  }
  return <VencimientosGlobalesClient empresas={empresas} />
}
