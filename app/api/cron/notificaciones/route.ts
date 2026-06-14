/**
 * GET /api/cron/notificaciones
 *
 * Endpoint diseñado para ser invocado una vez al día por un servicio externo
 * de cron (Vercel Cron Jobs, GitHub Actions, cron-job.org, etc.).
 *
 * ── Lógica ──────────────────────────────────────────────────────────────────
 * 1. Valida el header "x-cron-secret" contra la variable CRON_SECRET.
 * 2. Calcula las fechas objetivo: hoy + 5 días y hoy + 1 día.
 * 3. Busca en Supabase todos los vencimientos que caigan en esas dos fechas,
 *    haciendo join con impuestos.
 * 4. Para cada vencimiento, busca las empresas cuyo último dígito del NIT
 *    coincida con el campo ultimo_digito_nit del vencimiento.
 * 5. Construye y envía un correo HTML personalizado por cada par
 *    (empresa × vencimiento) usando Resend.
 * 6. Devuelve un resumen JSON con los correos enviados y los errores.
 *
 * ── Variables de entorno necesarias (ver .env.local) ────────────────────────
 *   RESEND_API_KEY          Clave de API de Resend  (re_xxxx...)
 *   RESEND_FROM_EMAIL       Dirección verificada de origen
 *   CRON_SECRET             Secreto compartido con el scheduler
 *   NEXT_PUBLIC_APP_URL     URL pública de la app (para el link del email)
 *
 * ── Cómo programar la ejecución diaria ──────────────────────────────────────
 *   Opción A – Vercel Cron Jobs (vercel.json):
 *     { "crons": [{ "path": "/api/cron/notificaciones", "schedule": "0 8 * * *" }] }
 *     Vercel inyecta automáticamente el header Authorization, no CRON_SECRET.
 *
 *   Opción B – cron-job.org / GitHub Actions:
 *     Llama al endpoint con:
 *       curl -H "x-cron-secret: TU_SECRETO" https://tuapp.com/api/cron/notificaciones
 */

import { NextResponse }               from 'next/server'
import { createClient }               from '@supabase/supabase-js'
import { resend, FROM_EMAIL }         from '@/lib/resend'
import { buildAlertaHtml, buildAlertaSubject } from '@/lib/emailTemplates'

// Cliente Supabase con service_role para saltarse RLS en procesos de servidor
// (las políticas RLS están pensadas para usuarios finales, no para cron jobs)
function getSupabaseAdmin() {
  const url     = process.env.NEXT_PUBLIC_SUPABASE_URL
  const svcKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !svcKey) {
    throw new Error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno.'
    )
  }
  return createClient(url, svcKey, { auth: { persistSession: false } })
}

// ─── Helpers de fecha ─────────────────────────────────────────────────────────

/** Devuelve "YYYY-MM-DD" para hoy + N días (UTC). */
function fechaEnNDias(n: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().split('T')[0]
}

/**
 * Días de anticipación para los cuales se envían alertas.
 * Se puede sobreescribir con la variable DIAS_ALERTA (ej: "1,3,5,7,15").
 */
const DIAS_ALERTA: number[] = (() => {
  const env = process.env.DIAS_ALERTA
  if (env) {
    const parsed = env.split(',').map(Number).filter(n => !isNaN(n) && n > 0)
    if (parsed.length) return parsed
  }
  return [1, 3, 5, 7, 15]
})()

// ─── Tipos internos ───────────────────────────────────────────────────────────

interface VencimientoRow {
  id: string
  ultimo_digito_nit: number
  fecha_vencimiento: string
  anio_fiscal: number
  periodo: string | null
  impuesto: { nombre: string; periodicidad: string }
}

interface EmpresaRow {
  id: string
  nit: string
  digito_verificacion: number
  razon_social: string
  email_notificacion: string
}

interface ResultadoEnvio {
  empresa: string
  impuesto: string
  email: string
  estado: 'enviado' | 'error'
  detalle?: string
}

// ─── Handler principal ────────────────────────────────────────────────────────

export async function GET(request: Request): Promise<NextResponse> {
  // ── 1. Autenticación del cron ────────────────────────────────────────────
  // Vercel Cron Jobs envía automáticamente:
  //   Authorization: Bearer <CRON_SECRET>
  // En desarrollo se omite la validación para probar desde el navegador.
  const isDev = process.env.NODE_ENV === 'development'

  if (!isDev) {
    const authHeader = request.headers.get('authorization')
    const cronSecret = request.headers.get('x-cron-secret')
    const vercelToken = authHeader?.replace('Bearer ', '')

    const valid =
      vercelToken === process.env.CRON_SECRET ||
      cronSecret  === process.env.CRON_SECRET

    if (!valid) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
    }
  }

  const supabaseAdmin = getSupabaseAdmin()
  const resultados: ResultadoEnvio[] = []

  try {
    // ── 2. Fechas objetivo (según DIAS_ALERTA) ─────────────────────────────
    const fechas = DIAS_ALERTA.map(n => fechaEnNDias(n))

    // ── 3. Consultar vencimientos en esas fechas ───────────────────────────
    const { data: vencimientos, error: errVenc } = await supabaseAdmin
      .from('vencimientos')
      .select(`
        id,
        ultimo_digito_nit,
        fecha_vencimiento,
        anio_fiscal,
        periodo,
        impuesto:impuestos ( nombre, periodicidad )
      `)
      .in('fecha_vencimiento', fechas)
      .order('fecha_vencimiento', { ascending: true })

    if (errVenc) {
      return NextResponse.json(
        { error: 'Error al consultar vencimientos.', detalle: errVenc.message },
        { status: 500 }
      )
    }

    if (!vencimientos || vencimientos.length === 0) {
      return NextResponse.json({
        mensaje: 'No hay vencimientos en los próximos 1 o 5 días. No se enviaron correos.',
        enviados: 0,
      })
    }

    const rows = vencimientos as unknown as VencimientoRow[]

    // Agrupar por dígito para hacer una sola consulta de empresas por dígito
    const digitosUnicos = [...new Set(rows.map(v => v.ultimo_digito_nit))]

    // ── 4. Obtener empresas cuyos NIT terminan en esos dígitos ────────────
    // Supabase no tiene una función "last char" en filtros, así que traemos
    // todas las empresas y filtramos en memoria (colección pequeña en la mayoría
    // de casos de uso; si crece mucho, añade una columna computada en la BD).
    const { data: empresas, error: errEmp } = await supabaseAdmin
      .from('empresas')
      .select('id, nit, digito_verificacion, razon_social, email_notificacion')

    if (errEmp) {
      return NextResponse.json(
        { error: 'Error al consultar empresas.', detalle: errEmp.message },
        { status: 500 }
      )
    }

    const todasEmpresas = (empresas ?? []) as EmpresaRow[]

    // Mapa: dígito → lista de empresas
    const empresasPorDigito = new Map<number, EmpresaRow[]>()
    for (const digito of digitosUnicos) {
      empresasPorDigito.set(
        digito,
        todasEmpresas.filter(e => Number(e.nit.at(-1)) === digito)
      )
    }

    // ── 5. Enviar correos ──────────────────────────────────────────────────
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0)

    for (const venc of rows) {
      const empresasDelDigito = empresasPorDigito.get(venc.ultimo_digito_nit) ?? []

      for (const empresa of empresasDelDigito) {
        const fechaDate  = new Date(venc.fecha_vencimiento + 'T00:00:00')
        const diasRest   = Math.round((fechaDate.getTime() - hoy.getTime()) / 86_400_000)

        const alertaData = {
          razonSocial:        empresa.razon_social,
          nit:                empresa.nit,
          digitoVerificacion: empresa.digito_verificacion,
          impuesto:           venc.impuesto.nombre,
          periodo:            venc.periodo,
          fechaVencimiento:   venc.fecha_vencimiento,
          diasRestantes:      diasRest,
        }

        try {
          await resend.emails.send({
            from:    FROM_EMAIL,
            to:      empresa.email_notificacion,
            subject: buildAlertaSubject(alertaData),
            html:    buildAlertaHtml(alertaData),
          })

          resultados.push({
            empresa: empresa.razon_social,
            impuesto: venc.impuesto.nombre,
            email: empresa.email_notificacion,
            estado: 'enviado',
          })
        } catch (sendError) {
          resultados.push({
            empresa:  empresa.razon_social,
            impuesto: venc.impuesto.nombre,
            email:    empresa.email_notificacion,
            estado:   'error',
            detalle:  sendError instanceof Error ? sendError.message : String(sendError),
          })
        }
      }
    }

    // ── 6. Resumen ─────────────────────────────────────────────────────────
    const enviados = resultados.filter(r => r.estado === 'enviado').length
    const errores  = resultados.filter(r => r.estado === 'error').length

    return NextResponse.json({
      ejecutado:       new Date().toISOString(),
      fechasObjetivo:  fechas,
      vencimientosEncontrados: rows.length,
      correosEnviados: enviados,
      errores,
      detalle: resultados,
    })

  } catch (err) {
    console.error('[cron/notificaciones] Error inesperado:', err)
    return NextResponse.json(
      { error: 'Error interno del servidor.', detalle: String(err) },
      { status: 500 }
    )
  }
}
