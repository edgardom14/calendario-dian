'use client'

import { useRef, useState } from 'react'
import {
  X, FileDown, Upload, AlertCircle, CheckCircle2,
  Loader2, FileSpreadsheet, Trash2,
} from 'lucide-react'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import type { Empresa, TipoContribuyente } from '@/lib/types'

const TIPO_VALORES: Record<string, TipoContribuyente> = {
  'gran contribuyente': 'gran_contribuyente',
  'gran_contribuyente': 'gran_contribuyente',
  'persona juridica':   'persona_juridica',
  'persona_juridica':   'persona_juridica',
  'persona natural':    'persona_natural',
  'persona_natural':    'persona_natural',
}

interface FilaValida {
  razon_social: string
  nit: string
  digito_verificacion: number
  tipo_contribuyente: TipoContribuyente
  email_notificacion: string
}

interface FilaError {
  fila: number
  datos: string
  error: string
}

interface Props {
  onClose: () => void
  onImported: (nuevas: Empresa[]) => void
}

export default function ImportarEmpresasModal({ onClose, onImported }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [validas,   setValidas]   = useState<FilaValida[]>([])
  const [errores,   setErrores]   = useState<FilaError[]>([])
  const [archivo,   setArchivo]   = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [resultado, setResultado] = useState<{ ok: number; fail: number } | null>(null)

  /* ── Descargar plantilla ── */
  function descargarPlantilla() {
    import('xlsx').then(XLSX => {
      const wb = XLSX.utils.book_new()

      /* Hoja de datos */
      const datos = [
        ['Razón Social', 'NIT', 'Dígito Verificación', 'Tipo Contribuyente', 'Correo Notificación'],
        ['Empresa Ejemplo S.A.S.', '900123456', '7', 'Persona Jurídica', 'contabilidad@ejemplo.com'],
        ['Comercio Natural', '12345678', '3', 'Persona Natural', 'natural@ejemplo.com'],
      ]
      const ws = XLSX.utils.aoa_to_sheet(datos)

      /* Anchos de columna */
      ws['!cols'] = [{ wch: 35 }, { wch: 15 }, { wch: 20 }, { wch: 25 }, { wch: 35 }]

      XLSX.utils.book_append_sheet(wb, ws, 'Empresas')

      /* Hoja de instrucciones */
      const inst = [
        ['INSTRUCCIONES DE DILIGENCIAMIENTO'],
        [],
        ['Columna', 'Descripción', 'Valores válidos'],
        ['Razón Social', 'Nombre completo de la empresa o persona', 'Texto libre'],
        ['NIT', 'NIT sin guiones ni dígito de verificación', 'Solo dígitos (6 a 15 caracteres)'],
        ['Dígito Verificación', 'Dígito de verificación del NIT', 'Un solo número del 0 al 9'],
        ['Tipo Contribuyente', 'Clasificación tributaria', 'Gran Contribuyente | Persona Jurídica | Persona Natural'],
        ['Correo Notificación', 'Correo para recibir alertas de vencimientos', 'Correo válido (ej. info@empresa.com)'],
        [],
        ['NOTAS IMPORTANTES'],
        ['- No elimine la fila de encabezados (primera fila).'],
        ['- El NIT debe contener solo números, sin guiones ni puntos.'],
        ['- El tipo de contribuyente debe ser exactamente uno de los tres valores indicados.'],
        ['- Los NITs duplicados con empresas ya registradas serán ignorados.'],
      ]
      const wsInst = XLSX.utils.aoa_to_sheet(inst)
      wsInst['!cols'] = [{ wch: 25 }, { wch: 50 }, { wch: 55 }]
      XLSX.utils.book_append_sheet(wb, wsInst, 'Instrucciones')

      XLSX.writeFile(wb, 'plantilla-calendariodian.xlsx')
    })
  }

  /* ── Parsear archivo ── */
  async function handleArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setArchivo(file.name)
    setResultado(null)

    const XLSX = await import('xlsx')
    const buffer = await file.arrayBuffer()
    const wb = XLSX.read(buffer)
    const ws = wb.Sheets[wb.SheetNames[0]]
    const filas: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

    const nuevasValidas: FilaValida[] = []
    const nuevosErrores: FilaError[] = []

    for (let i = 1; i < filas.length; i++) {
      const fila = filas[i]
      if (!fila || fila.every((c: any) => String(c).trim() === '')) continue

      const [razon, nit, digito, tipo, email] = fila.map((c: any) => String(c ?? '').trim())
      const num = i + 1
      const errFila: string[] = []

      if (!razon) errFila.push('Razón social vacía')
      if (!/^\d{6,15}$/.test(nit)) errFila.push('NIT inválido (solo dígitos, 6-15 caracteres)')
      const dig = Number(digito)
      if (!/^\d$/.test(digito)) errFila.push('Dígito verificación inválido (0-9)')
      const tipoNorm = TIPO_VALORES[tipo.toLowerCase()]
      if (!tipoNorm) errFila.push(`Tipo contribuyente inválido: "${tipo}"`)
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errFila.push('Correo inválido')

      if (errFila.length > 0) {
        nuevosErrores.push({ fila: num, datos: razon || `Fila ${num}`, error: errFila.join(' · ') })
      } else {
        nuevasValidas.push({
          razon_social: razon,
          nit,
          digito_verificacion: dig,
          tipo_contribuyente: tipoNorm,
          email_notificacion: email,
        })
      }
    }

    setValidas(nuevasValidas)
    setErrores(nuevosErrores)
    if (inputRef.current) inputRef.current.value = ''
  }

  /* ── Importar ── */
  async function handleImportar() {
    if (validas.length === 0) return
    setImporting(true)
    const sb = createSupabaseBrowser()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { setImporting(false); return }

    /* Precarga IDs de impuestos de renta */
    const [{ data: rentaNatural }, { data: rentaJuridica }] = await Promise.all([
      sb.from('impuestos').select('id').eq('nombre', 'Renta personas naturales').single(),
      sb.from('impuestos').select('id').eq('nombre', 'Renta personas jurídicas').single(),
    ])

    let ok = 0, fail = 0
    const insertadas: Empresa[] = []

    for (const fila of validas) {
      const { data, error } = await sb
        .from('empresas')
        .insert({ ...fila, user_id: user.id })
        .select()
        .single()
      if (error) { fail++; continue }

      const empresa = data as Empresa
      insertadas.push(empresa)
      ok++

      const impId = fila.tipo_contribuyente === 'persona_natural'
        ? rentaNatural?.id
        : rentaJuridica?.id
      if (impId) {
        await sb.from('empresa_impuestos')
          .insert({ empresa_id: empresa.id, impuesto_id: impId })
          .maybeSingle()
      }
    }

    setResultado({ ok, fail })
    setValidas([])
    setImporting(false)
    if (insertadas.length > 0) onImported(insertadas)
  }

  function limpiar() {
    setValidas([]); setErrores([]); setArchivo(null); setResultado(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/8 bg-[#0d1525] shadow-2xl shadow-black/60 flex flex-col max-h-[90vh]">

        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-white/6 px-6 py-5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/25">
              <FileSpreadsheet className="h-4.5 w-4.5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">Importar empresas desde Excel</h2>
              <p className="text-xs text-slate-500">Descarga la plantilla, diligénciala y súbela aquí</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-slate-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Paso 1 */}
          <div className="rounded-xl border border-white/6 bg-white/[0.02] p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Paso 1 — Descarga la plantilla</p>
            <p className="mb-4 text-sm text-slate-400">
              El archivo incluye una hoja de datos lista para diligenciar y una hoja de instrucciones con los valores válidos para cada campo.
            </p>
            <button
              onClick={descargarPlantilla}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-5 py-2.5 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/20"
            >
              <FileDown className="h-4 w-4" />
              Descargar plantilla Excel
            </button>
          </div>

          {/* Paso 2 */}
          <div className="rounded-xl border border-white/6 bg-white/[0.02] p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Paso 2 — Sube el archivo diligenciado</p>

            {!archivo ? (
              <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-white/10 py-10 transition hover:border-blue-500/40 hover:bg-blue-500/5">
                <Upload className="h-8 w-8 text-slate-600" />
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-400">Haz clic para seleccionar el archivo</p>
                  <p className="mt-0.5 text-xs text-slate-600">Formato .xlsx o .xls</p>
                </div>
                <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleArchivo} />
              </label>
            ) : (
              <div className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-200">{archivo}</p>
                    <p className="text-xs text-slate-500">
                      {validas.length} fila{validas.length !== 1 ? 's' : ''} válida{validas.length !== 1 ? 's' : ''}
                      {errores.length > 0 && ` · ${errores.length} con error`}
                    </p>
                  </div>
                </div>
                <button onClick={limpiar} className="rounded-lg p-1.5 text-slate-600 hover:text-red-400 transition">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Preview válidas */}
          {validas.length > 0 && (
            <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-4">
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {validas.length} empresa{validas.length !== 1 ? 's' : ''} listas para importar
              </p>
              <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {validas.map((f, i) => (
                  <li key={i} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-xs">
                    <span className="font-medium text-slate-200 truncate max-w-[55%]">{f.razon_social}</span>
                    <span className="font-mono text-slate-500">{f.nit}-{f.digito_verificacion}</span>
                    <span className="text-slate-600 truncate max-w-[25%] text-right">{f.email_notificacion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Errores */}
          {errores.length > 0 && (
            <div className="rounded-xl border border-red-500/15 bg-red-500/5 p-4">
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-red-400">
                <AlertCircle className="h-3.5 w-3.5" />
                {errores.length} fila{errores.length !== 1 ? 's' : ''} con errores (serán omitidas)
              </p>
              <ul className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {errores.map((e, i) => (
                  <li key={i} className="rounded-lg bg-white/[0.02] px-3 py-2 text-xs">
                    <span className="text-slate-400 font-medium">Fila {e.fila} — {e.datos}: </span>
                    <span className="text-red-400">{e.error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Resultado */}
          {resultado && (
            <div className="rounded-xl border border-blue-500/15 bg-blue-500/5 p-4 text-sm text-slate-300">
              <CheckCircle2 className="mb-2 h-5 w-5 text-blue-400" />
              <p><span className="font-semibold text-emerald-400">{resultado.ok}</span> empresa{resultado.ok !== 1 ? 's' : ''} importada{resultado.ok !== 1 ? 's' : ''} correctamente.</p>
              {resultado.fail > 0 && (
                <p className="mt-1 text-xs text-slate-500">{resultado.fail} omitida{resultado.fail !== 1 ? 's' : ''} (NIT duplicado u otro error).</p>
              )}
            </div>
          )}
        </div>

        {/* Pie */}
        <div className="flex items-center justify-between border-t border-white/6 px-6 py-4 shrink-0">
          <button onClick={onClose} className="rounded-xl border border-white/8 px-4 py-2 text-xs font-medium text-slate-400 transition hover:bg-white/5 hover:text-slate-200">
            Cerrar
          </button>
          <button
            onClick={handleImportar}
            disabled={validas.length === 0 || importing}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {importing && <Loader2 className="h-4 w-4 animate-spin" />}
            {importing ? 'Importando…' : `Importar ${validas.length > 0 ? validas.length : ''} empresa${validas.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}
