import { createSupabaseServer } from '@/lib/supabase-server'
import CalendarioClient from '@/components/CalendarioClient'
import type { Empresa } from '@/lib/types'

export const metadata = { title: 'Calendario – CalendarioDIAN' }

export interface VencimientoCalendario {
  id: string
  fecha: string
  impuesto_nombre: string
  ultimo_digito_nit: number
  periodo: string | null
}

export interface EstadoCalendario {
  vencimiento_id: string
  empresa_id: string
  estado: string
}

export default async function CalendarioPage() {
  const supabase = await createSupabaseServer()
  const anio = new Date().getFullYear()

  const [{ data: empresas }, { data: vencimientos }, { data: estados }] = await Promise.all([
    supabase.from('empresas').select('id, nit, razon_social, tipo_contribuyente').order('razon_social'),
    supabase
      .from('vencimientos')
      .select('id, fecha_vencimiento, ultimo_digito_nit, periodo, impuesto:impuestos(nombre)')
      .gte('fecha_vencimiento', `${anio}-01-01`)
      .lte('fecha_vencimiento', `${anio + 1}-12-31`)
      .order('fecha_vencimiento'),
    supabase.from('empresa_vencimientos').select('vencimiento_id, empresa_id, estado'),
  ])

  const venc: VencimientoCalendario[] = (vencimientos ?? []).map((v: any) => ({
    id: v.id,
    fecha: v.fecha_vencimiento,
    impuesto_nombre: v.impuesto?.nombre ?? '',
    ultimo_digito_nit: v.ultimo_digito_nit,
    periodo: v.periodo,
  }))

  return (
    <CalendarioClient
      empresas={(empresas ?? []) as Pick<Empresa, 'id' | 'nit' | 'razon_social' | 'tipo_contribuyente'>[]}
      vencimientos={venc}
      estadosIniciales={(estados ?? []) as EstadoCalendario[]}
    />
  )
}
