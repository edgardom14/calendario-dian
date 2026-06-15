-- =============================================================================
-- Migración 004: Agregar impuesto "Renta personas naturales"
-- Ejecutar en Supabase → SQL Editor
-- =============================================================================

INSERT INTO public.impuestos (nombre, periodicidad, descripcion, activo)
VALUES ('Renta personas naturales', 'anual', NULL, true)
ON CONFLICT DO NOTHING;
