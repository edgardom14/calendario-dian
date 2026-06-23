-- =============================================================================
-- Migración 005: Eliminar duplicados en impuestos
-- Ejecutar en Supabase → SQL Editor
-- =============================================================================

-- Elimina todas las filas duplicadas conservando la de menor id (la más antigua)
DELETE FROM public.impuestos
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY lower(nombre) ORDER BY created_at ASC) AS rn
    FROM public.impuestos
  ) sub
  WHERE rn > 1
);
