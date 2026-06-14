-- =============================================================================
-- Migración 003: Catálogo completo de impuestos + empresa_impuestos
-- Ejecutar en Supabase → SQL Editor
-- =============================================================================

-- 1. Insertar / actualizar catálogo de impuestos
INSERT INTO public.impuestos (nombre, periodicidad, descripcion, activo) VALUES
  ('Activos en el exterior (Personas jurídicas)',        'anual',          NULL, true),
  ('Cámara de Comercio',                                 'anual',          NULL, true),
  ('Carbono (Declaración y pago)',                       'bimestral',      NULL, true),
  ('Cesantías',                                          'anual',          NULL, true),
  ('Compensación Banco de la República',                 'mensual',        NULL, true),
  ('Consumo',                                            'bimestral',      NULL, true),
  ('Fondo Nacional del Ganado',                          'mensual',        NULL, true),
  ('FONTUR',                                             'bimestral',      NULL, true),
  ('Gasolina y ACPM (Declaración mensual)',              'mensual',        NULL, true),
  ('Impuesto a las bebidas ultraprocesadas y azucaradas','bimestral',      NULL, true),
  ('Impuesto al patrimonio Jurídicas',                   'anual',          NULL, true),
  ('Impuesto nacional Plásticos de un solo uso',         'bimestral',      NULL, true),
  ('Información exógena DIAN (Jurídicas)',               'anual',          NULL, true),
  ('Informe 75 – SAGRILAFT Y PTEE',                      'anual',          NULL, true),
  ('IVA bimestral',                                      'bimestral',      NULL, true),
  ('IVA cuatrimestral',                                  'cuatrimestral',  NULL, true),
  ('IVA servicios desde el exterior (bimestral)',        'bimestral',      NULL, true),
  ('Nómina electrónica',                                 'mensual',        NULL, true),
  ('Pago de seguridad social',                           'mensual',        NULL, true),
  ('Registro único de beneficiarios finales',            'anual',          NULL, true),
  ('Renta personas jurídicas',                           'anual',          NULL, true),
  ('Retención en la fuente (Declaración mensual)',       'mensual',        NULL, true),
  ('RST-Anticipo (Anticipo bimestral)',                   'bimestral',      NULL, true),
  ('RST-Declaración (Declaración anual consolidada)',    'anual',          NULL, true),
  ('RST IVA (Declaración anual consolidada)',            'anual',          NULL, true),
  ('Supersociedades estados financieros',                'anual',          NULL, true)
ON CONFLICT DO NOTHING;

-- 2. Tabla empresa_impuestos (lista blanca de obligaciones por empresa)
CREATE TABLE IF NOT EXISTS public.empresa_impuestos (
  empresa_id  UUID NOT NULL REFERENCES public.empresas(id)  ON DELETE CASCADE,
  impuesto_id UUID NOT NULL REFERENCES public.impuestos(id) ON DELETE CASCADE,
  PRIMARY KEY (empresa_id, impuesto_id)
);

-- 3. RLS
ALTER TABLE public.empresa_impuestos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Propietario gestiona empresa_impuestos"
  ON public.empresa_impuestos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.empresas e
      WHERE e.id = empresa_id AND e.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.empresas e
      WHERE e.id = empresa_id AND e.user_id = auth.uid()
    )
  );
