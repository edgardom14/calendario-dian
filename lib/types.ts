// ─── Enums ────────────────────────────────────────────────────────────────────

export type TipoContribuyente =
  | 'gran_contribuyente'
  | 'persona_juridica'
  | 'persona_natural'

export type Periodicidad =
  | 'anual'
  | 'bimestral'
  | 'cuatrimestral'
  | 'mensual'

export type EstadoVencimiento =
  | 'pendiente'
  | 'presentado'
  | 'pagado'
  | 'vencido'
  | 'no_aplica'

// ─── Tablas base ──────────────────────────────────────────────────────────────

export interface Empresa {
  id: string                          // uuid
  nit: string                         // sin guiones ni dígito de verificación
  digito_verificacion: number         // 0–9
  razon_social: string
  tipo_contribuyente: TipoContribuyente
  email_notificacion: string
  created_at: string                  // ISO 8601
  updated_at: string
}

export interface Impuesto {
  id: string                          // uuid
  nombre: string                      // ej. "Renta", "IVA", "Retefuente"
  periodicidad: Periodicidad
  descripcion: string | null
  activo: boolean
  created_at: string
}

export interface Vencimiento {
  id: string                          // uuid
  impuesto_id: string                 // fk → impuestos.id
  ultimo_digito_nit: number           // 0–9 (un dígito por fila)
  fecha_vencimiento: string           // DATE: "YYYY-MM-DD"
  anio_fiscal: number                 // ej. 2025
  periodo: string | null              // ej. "Bimestre 1", "Enero", "Primer cuatrimestre"
  created_at: string
}

// ─── Tabla de seguimiento por empresa ─────────────────────────────────────────

export interface EmpresaVencimiento {
  id: string                          // uuid
  empresa_id: string                  // fk → empresas.id
  vencimiento_id: string              // fk → vencimientos.id
  estado: EstadoVencimiento
  fecha_presentacion: string | null   // DATE cuando se presentó
  fecha_pago: string | null           // DATE cuando se pagó
  observaciones: string | null
  created_at: string
  updated_at: string
}

// ─── Tipos enriquecidos (joins frecuentes) ────────────────────────────────────

export interface VencimientoConImpuesto extends Vencimiento {
  impuesto: Pick<Impuesto, 'nombre' | 'periodicidad'>
}

export interface EmpresaVencimientoCompleto extends EmpresaVencimiento {
  empresa: Pick<Empresa, 'razon_social' | 'nit' | 'digito_verificacion' | 'tipo_contribuyente'>
  vencimiento: VencimientoConImpuesto
}

// ─── Tipos para formularios (omite campos autogenerados) ──────────────────────

export type EmpresaInsert = Omit<Empresa, 'id' | 'created_at' | 'updated_at'>
export type EmpresaUpdate = Partial<EmpresaInsert>

export type ImpuestoInsert = Omit<Impuesto, 'id' | 'created_at'>
export type ImpuestoUpdate = Partial<ImpuestoInsert>

export type VencimientoInsert = Omit<Vencimiento, 'id' | 'created_at'>
export type VencimientoUpdate = Partial<VencimientoInsert>

export type EmpresaVencimientoInsert = Omit<EmpresaVencimiento, 'id' | 'created_at' | 'updated_at'>
export type EmpresaVencimientoUpdate = Partial<EmpresaVencimientoInsert>
