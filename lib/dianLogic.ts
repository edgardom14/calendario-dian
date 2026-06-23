import { createSupabaseBrowser } from '@/lib/supabase-browser'
import type { TipoContribuyente, VencimientoConEstado } from '@/lib/types'

export async function calcularProximosVencimientos(
  nit: string,
  _tipo_contribuyente: TipoContribuyente,
  empresa_id: string,
): Promise<VencimientoConEstado[]> {
  const ultimoDigito = Number(nit.at(-1))
  if (isNaN(ultimoDigito)) throw new Error(`NIT inválido: "${nit}" no termina en un dígito.`)

  const hoy = new Date().toISOString().split('T')[0]
  const supabase = createSupabaseBrowser()

  const [{ data: venc, error: errVenc }, { data: ev }, { data: ei }] = await Promise.all([
    supabase
      .from('vencimientos')
      .select('id, impuesto_id, ultimo_digito_nit, fecha_vencimiento, anio_fiscal, periodo, created_at, impuesto:impuestos ( nombre, periodicidad )')
      .eq('ultimo_digito_nit', ultimoDigito)
      .gte('fecha_vencimiento', hoy)
      .order('fecha_vencimiento', { ascending: true }),
    supabase
      .from('empresa_vencimientos')
      .select('id, vencimiento_id, estado')
      .eq('empresa_id', empresa_id),
    supabase
      .from('empresa_impuestos')
      .select('impuesto_id')
      .eq('empresa_id', empresa_id),
  ])

  if (errVenc) throw new Error(errVenc.message)

  const impuestosActivos = new Set((ei ?? []).map(r => r.impuesto_id))
  const estadoMap = new Map((ev ?? []).map(r => [r.vencimiento_id, { id: r.id, estado: r.estado }]))

  return (venc ?? [])
    .filter((v: any) => impuestosActivos.size === 0 || impuestosActivos.has(v.impuesto_id))
    .slice(0, 3)
    .map((v: any) => ({
      ...v,
      empresa_vencimiento_id: estadoMap.get(v.id)?.id ?? null,
      estado: estadoMap.get(v.id)?.estado ?? 'pendiente',
    })) as VencimientoConEstado[]
}

// ─── Utilidades de presentación ───────────────────────────────────────────────

/** Días entre hoy y la fecha de vencimiento (negativo = ya venció). */
export function diasRestantes(fechaVencimiento: string): number {
  const hoy   = new Date(); hoy.setHours(0, 0, 0, 0)
  const fecha = new Date(fechaVencimiento + 'T00:00:00')
  return Math.round((fecha.getTime() - hoy.getTime()) / 86_400_000)
}

/** Etiqueta de urgencia según días restantes. */
export function etiquetaUrgencia(dias: number): {
  label: string
  colorBg: string
  colorText: string
  colorRing: string
} {
  if (dias < 0)   return { label: 'Vencido',    colorBg: 'bg-red-500/15',    colorText: 'text-red-400',    colorRing: 'ring-red-500/30'    }
  if (dias <= 5)  return { label: 'Urgente',    colorBg: 'bg-red-500/10',    colorText: 'text-red-400',    colorRing: 'ring-red-500/25'    }
  if (dias <= 15) return { label: 'Próximo',    colorBg: 'bg-amber-500/10',  colorText: 'text-amber-400',  colorRing: 'ring-amber-500/25'  }
  if (dias <= 30) return { label: 'En 30 días', colorBg: 'bg-blue-500/10',   colorText: 'text-blue-400',   colorRing: 'ring-blue-500/25'   }
  return              { label: 'A tiempo',   colorBg: 'bg-emerald-500/10', colorText: 'text-emerald-400', colorRing: 'ring-emerald-500/25' }
}

/** Formatea "2025-04-10" → "10 abr. 2025" */
export function formatearFecha(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-CO', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  })
}
