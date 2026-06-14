import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

function escalonar(impuesto: string, fechaBase: string, periodo: string) {
  const rows = []
  const base = new Date(fechaBase + 'T12:00:00Z')
  for (let digito = 0; digito <= 9; digito++) {
    const d = new Date(base)
    d.setUTCDate(d.getUTCDate() + digito)
    while (d.getUTCDay() === 0 || d.getUTCDay() === 6) {
      d.setUTCDate(d.getUTCDate() + 1)
    }
    rows.push({ impuesto, digito, fecha: d.toISOString().split('T')[0], periodo })
  }
  return rows
}

function fechaEnNDias(n: number) {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().split('T')[0]
}

const SEEDS = [
  ...escalonar('Retefuente', '2026-02-09', 'Enero'),
  ...escalonar('Retefuente', '2026-03-09', 'Febrero'),
  ...escalonar('Retefuente', '2026-04-08', 'Marzo'),
  ...escalonar('Retefuente', '2026-05-11', 'Abril'),
  ...escalonar('Retefuente', fechaEnNDias(1), 'Mayo'),
  ...escalonar('Retefuente', '2026-07-08', 'Junio'),
  ...escalonar('Retefuente', '2026-08-10', 'Julio'),
  ...escalonar('Retefuente', '2026-09-08', 'Agosto'),
  ...escalonar('Retefuente', '2026-10-08', 'Septiembre'),
  ...escalonar('Retefuente', '2026-11-09', 'Octubre'),
  ...escalonar('Retefuente', '2026-12-08', 'Noviembre'),
  ...escalonar('Retefuente', '2027-02-08', 'Diciembre'),
  ...escalonar('IVA', '2026-03-09', 'Bimestre 1'),
  ...escalonar('IVA', '2026-05-11', 'Bimestre 2'),
  ...escalonar('IVA', fechaEnNDias(1), 'Bimestre 3'),
  ...escalonar('IVA', '2026-09-08', 'Bimestre 4'),
  ...escalonar('IVA', '2026-11-09', 'Bimestre 5'),
  ...escalonar('IVA', '2027-01-11', 'Bimestre 6'),
  ...escalonar('IVA Cuatrimestral', '2026-06-01', 'Primer cuatrimestre'),
  ...escalonar('IVA Cuatrimestral', '2026-10-01', 'Segundo cuatrimestre'),
  ...escalonar('IVA Cuatrimestral', '2027-02-01', 'Tercer cuatrimestre'),
  ...escalonar('Renta Personas Juridicas', '2026-04-14', 'Anio gravable 2025 - GC'),
  ...escalonar('Renta Personas Juridicas', '2026-05-12', 'Anio gravable 2025'),
  ...escalonar('Renta Personas Naturales', '2026-08-11', 'Anio gravable 2025'),
  ...escalonar('Informacion Exogena', '2026-04-20', 'Anio gravable 2025 - GC'),
  ...escalonar('Informacion Exogena', '2026-05-04', 'Anio gravable 2025'),
  ...escalonar('SIMPLE', '2026-03-09', 'Bimestre 1'),
  ...escalonar('SIMPLE', '2026-05-11', 'Bimestre 2'),
  ...escalonar('SIMPLE', fechaEnNDias(1), 'Bimestre 3'),
  ...escalonar('SIMPLE', '2026-09-08', 'Bimestre 4'),
  ...escalonar('SIMPLE', '2026-11-09', 'Bimestre 5'),
  ...escalonar('SIMPLE', '2027-01-11', 'Declaracion anual'),
  ...escalonar('ICA', '2026-02-20', 'Bimestre 1'),
  ...escalonar('ICA', '2026-04-20', 'Bimestre 2'),
  ...escalonar('ICA', '2026-06-22', 'Bimestre 3'),
  ...escalonar('ICA', '2026-08-20', 'Bimestre 4'),
  ...escalonar('ICA', '2026-10-20', 'Bimestre 5'),
  ...escalonar('ICA', '2026-12-18', 'Bimestre 6'),
]

async function main() {
  const NOMBRES = ['Retefuente','IVA','IVA Cuatrimestral','Renta Personas Juridicas','Renta Personas Naturales','Informacion Exogena','SIMPLE','ICA']

  const upsertPayload = [
    { nombre: 'Retefuente',              periodicidad: 'mensual',       descripcion: 'Retencion en la Fuente mensual',     activo: true },
    { nombre: 'IVA',                      periodicidad: 'bimestral',     descripcion: 'IVA Regimen Comun bimestral',        activo: true },
    { nombre: 'IVA Cuatrimestral',        periodicidad: 'cuatrimestral', descripcion: 'IVA pequenos contribuyentes',        activo: true },
    { nombre: 'Renta Personas Juridicas', periodicidad: 'anual',         descripcion: 'Renta Personas Juridicas',           activo: true },
    { nombre: 'Renta Personas Naturales', periodicidad: 'anual',         descripcion: 'Renta Personas Naturales',           activo: true },
    { nombre: 'Informacion Exogena',      periodicidad: 'anual',         descripcion: 'Medios magneticos / exogena',        activo: true },
    { nombre: 'SIMPLE',                   periodicidad: 'bimestral',     descripcion: 'Regimen SIMPLE anticipo bimestral',  activo: true },
    { nombre: 'ICA',                      periodicidad: 'bimestral',     descripcion: 'Industria y Comercio Bogota',        activo: true },
  ]

  console.log('Registrando impuestos...')
  const { error: errUpsert } = await supabase.from('impuestos').upsert(upsertPayload, { onConflict: 'nombre', ignoreDuplicates: true })
  if (errUpsert) { console.error('Error impuestos:', errUpsert.message); process.exit(1) }

  const { data: impuestos, error: errImp } = await supabase.from('impuestos').select('id, nombre').in('nombre', NOMBRES)
  if (errImp || !impuestos?.length) { console.error('No se encontraron impuestos:', errImp?.message); process.exit(1) }

  const idPorNombre = Object.fromEntries(impuestos.map(i => [i.nombre, i.id]))
  console.log('Impuestos OK:', Object.keys(idPorNombre).join(', '))

  const payload = SEEDS.map(s => ({
    impuesto_id:       idPorNombre[s.impuesto],
    ultimo_digito_nit: s.digito,
    fecha_vencimiento: s.fecha,
    anio_fiscal:       Number(s.fecha.slice(0, 4)),
    periodo:           s.periodo,
  })).filter(p => p.impuesto_id)

  console.log('Insertando ' + payload.length + ' registros...')

  const LOTE = 50
  let insertados = 0, omitidos = 0

  for (let i = 0; i < payload.length; i += LOTE) {
    const lote = payload.slice(i, i + LOTE)
    const { data, error } = await supabase.from('vencimientos')
      .upsert(lote, { onConflict: 'impuesto_id,ultimo_digito_nit,anio_fiscal,periodo', ignoreDuplicates: true })
      .select('id')
    if (error) {
      console.error('Error en lote ' + (Math.floor(i / LOTE) + 1) + ':', error.message)
    } else {
      insertados += data?.length ?? 0
      omitidos += lote.length - (data?.length ?? 0)
    }
  }

  console.log('─────────────────────────────────')
  console.log('Insertados:       ' + insertados)
  console.log('Ya existian:      ' + omitidos)
  console.log('Total procesados: ' + payload.length)
  console.log('─────────────────────────────────')
  console.log('Seed completado.')
}

main().catch(err => { console.error('Error:', err); process.exit(1) })
