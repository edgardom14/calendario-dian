-- =============================================================================
-- SEED: Vencimientos de prueba 2026
-- Ejecutar en: Supabase → SQL Editor
--
-- Cubre:
--   • Retefuente  – mensual  – dígitos 0 al 9 (6 períodos: Enero → Junio)
--   • IVA         – bimestral – dígitos 0 al 9 (3 bimestres: 1, 2, 3)
--
-- Fechas calculadas a partir de los plazos reales de la DIAN 2026.
-- Las fechas del período más reciente se ajustan para caer en los próximos
-- 1–5 días desde hoy (2026-06-12) y así poder probar el sistema de alertas.
--
-- Estrategia de fechas por dígito (escalonamiento DIAN):
--   dígito 0 → día base
--   dígito 1 → día base + 1
--   ...
--   dígito 9 → día base + 9
-- =============================================================================

-- ─── Paso 1: obtener los IDs de los impuestos ────────────────────────────────
-- Usamos una CTE para no hardcodear UUIDs (que cambian por entorno).

with
  imp as (
    select id, nombre from public.impuestos
    where nombre in ('Retefuente', 'IVA')
  ),

  retefuente_id as (select id from imp where nombre = 'Retefuente'),
  iva_id        as (select id from imp where nombre = 'IVA'),

-- =============================================================================
-- RETEFUENTE MENSUAL 2026
-- Plazos oficiales DIAN: se declara y paga entre los días 8 y 21 del mes
-- siguiente según el último dígito del NIT.
-- Aquí usamos el día 8 como base + escalonamiento por dígito.
-- =============================================================================

  retefuente_rows (digito, fecha, periodo) as (
    values
      -- ── Enero 2026 (vence en febrero) ──────────────────────────────────
      (0, date '2026-02-08', 'Enero'),   (1, date '2026-02-09', 'Enero'),
      (2, date '2026-02-10', 'Enero'),   (3, date '2026-02-11', 'Enero'),
      (4, date '2026-02-12', 'Enero'),   (5, date '2026-02-13', 'Enero'),
      (6, date '2026-02-16', 'Enero'),   (7, date '2026-02-17', 'Enero'),
      (8, date '2026-02-18', 'Enero'),   (9, date '2026-02-19', 'Enero'),

      -- ── Febrero 2026 (vence en marzo) ──────────────────────────────────
      (0, date '2026-03-09', 'Febrero'), (1, date '2026-03-10', 'Febrero'),
      (2, date '2026-03-11', 'Febrero'), (3, date '2026-03-12', 'Febrero'),
      (4, date '2026-03-13', 'Febrero'), (5, date '2026-03-16', 'Febrero'),
      (6, date '2026-03-17', 'Febrero'), (7, date '2026-03-18', 'Febrero'),
      (8, date '2026-03-19', 'Febrero'), (9, date '2026-03-20', 'Febrero'),

      -- ── Marzo 2026 (vence en abril) ────────────────────────────────────
      (0, date '2026-04-08', 'Marzo'),   (1, date '2026-04-09', 'Marzo'),
      (2, date '2026-04-14', 'Marzo'),   (3, date '2026-04-15', 'Marzo'),
      (4, date '2026-04-16', 'Marzo'),   (5, date '2026-04-17', 'Marzo'),
      (6, date '2026-04-20', 'Marzo'),   (7, date '2026-04-21', 'Marzo'),
      (8, date '2026-04-22', 'Marzo'),   (9, date '2026-04-23', 'Marzo'),

      -- ── Abril 2026 (vence en mayo) ─────────────────────────────────────
      (0, date '2026-05-11', 'Abril'),   (1, date '2026-05-12', 'Abril'),
      (2, date '2026-05-13', 'Abril'),   (3, date '2026-05-14', 'Abril'),
      (4, date '2026-05-15', 'Abril'),   (5, date '2026-05-18', 'Abril'),
      (6, date '2026-05-19', 'Abril'),   (7, date '2026-05-20', 'Abril'),
      (8, date '2026-05-21', 'Abril'),   (9, date '2026-05-22', 'Abril'),

      -- ── Mayo 2026 (vence en junio) – ⚠️ FECHAS ALERTA (próximos 5 días desde 2026-06-12) ──
      (0, date '2026-06-10', 'Mayo'),   (1, date '2026-06-11', 'Mayo'),
      (2, date '2026-06-12', 'Mayo'),   (3, date '2026-06-13', 'Mayo'),   -- HOY
      (4, date '2026-06-14', 'Mayo'),   (5, date '2026-06-15', 'Mayo'),   -- +1, +2
      (6, date '2026-06-16', 'Mayo'),   (7, date '2026-06-17', 'Mayo'),   -- +3, +4
      (8, date '2026-06-18', 'Mayo'),   (9, date '2026-06-19', 'Mayo'),   -- +5, +6

      -- ── Junio 2026 (vence en julio) ────────────────────────────────────
      (0, date '2026-07-08', 'Junio'),   (1, date '2026-07-09', 'Junio'),
      (2, date '2026-07-10', 'Junio'),   (3, date '2026-07-13', 'Junio'),
      (4, date '2026-07-14', 'Junio'),   (5, date '2026-07-15', 'Junio'),
      (6, date '2026-07-16', 'Junio'),   (7, date '2026-07-17', 'Junio'),
      (8, date '2026-07-20', 'Junio'),   (9, date '2026-07-21', 'Junio')
  ),

-- =============================================================================
-- IVA BIMESTRAL 2026
-- Plazos oficiales DIAN: se presenta y paga entre los días 8 y 21 del mes
-- siguiente al cierre del bimestre.
-- =============================================================================

  iva_rows (digito, fecha, periodo) as (
    values
      -- ── Bimestre 1 (Ene–Feb), vence en marzo ───────────────────────────
      (0, date '2026-03-09',  'Bimestre 1'), (1, date '2026-03-10',  'Bimestre 1'),
      (2, date '2026-03-11',  'Bimestre 1'), (3, date '2026-03-12',  'Bimestre 1'),
      (4, date '2026-03-13',  'Bimestre 1'), (5, date '2026-03-16',  'Bimestre 1'),
      (6, date '2026-03-17',  'Bimestre 1'), (7, date '2026-03-18',  'Bimestre 1'),
      (8, date '2026-03-19',  'Bimestre 1'), (9, date '2026-03-20',  'Bimestre 1'),

      -- ── Bimestre 2 (Mar–Abr), vence en mayo ────────────────────────────
      (0, date '2026-05-11',  'Bimestre 2'), (1, date '2026-05-12',  'Bimestre 2'),
      (2, date '2026-05-13',  'Bimestre 2'), (3, date '2026-05-14',  'Bimestre 2'),
      (4, date '2026-05-15',  'Bimestre 2'), (5, date '2026-05-18',  'Bimestre 2'),
      (6, date '2026-05-19',  'Bimestre 2'), (7, date '2026-05-20',  'Bimestre 2'),
      (8, date '2026-05-21',  'Bimestre 2'), (9, date '2026-05-22',  'Bimestre 2'),

      -- ── Bimestre 3 (May–Jun), vence en julio – ⚠️ FECHAS ALERTA ────────
      (0, date '2026-07-08',  'Bimestre 3'), (1, date '2026-07-09',  'Bimestre 3'),
      (2, date '2026-07-10',  'Bimestre 3'), (3, date '2026-07-13',  'Bimestre 3'),
      (4, date '2026-07-14',  'Bimestre 3'), (5, date '2026-07-15',  'Bimestre 3'),
      (6, date '2026-07-16',  'Bimestre 3'), (7, date '2026-07-17',  'Bimestre 3'),
      (8, date '2026-07-20',  'Bimestre 3'), (9, date '2026-07-21',  'Bimestre 3'),

      -- ── Bimestre 4 (Jul–Ago), vence en septiembre ──────────────────────
      (0, date '2026-09-08',  'Bimestre 4'), (1, date '2026-09-09',  'Bimestre 4'),
      (2, date '2026-09-10',  'Bimestre 4'), (3, date '2026-09-11',  'Bimestre 4'),
      (4, date '2026-09-14',  'Bimestre 4'), (5, date '2026-09-15',  'Bimestre 4'),
      (6, date '2026-09-16',  'Bimestre 4'), (7, date '2026-09-17',  'Bimestre 4'),
      (8, date '2026-09-18',  'Bimestre 4'), (9, date '2026-09-19',  'Bimestre 4'),

      -- ── Bimestre 5 (Sep–Oct), vence en noviembre ───────────────────────
      (0, date '2026-11-09',  'Bimestre 5'), (1, date '2026-11-10',  'Bimestre 5'),
      (2, date '2026-11-11',  'Bimestre 5'), (3, date '2026-11-12',  'Bimestre 5'),
      (4, date '2026-11-13',  'Bimestre 5'), (5, date '2026-11-16',  'Bimestre 5'),
      (6, date '2026-11-17',  'Bimestre 5'), (7, date '2026-11-18',  'Bimestre 5'),
      (8, date '2026-11-19',  'Bimestre 5'), (9, date '2026-11-20',  'Bimestre 5'),

      -- ── Bimestre 6 (Nov–Dic), vence en enero 2027 ──────────────────────
      (0, date '2027-01-11',  'Bimestre 6'), (1, date '2027-01-12',  'Bimestre 6'),
      (2, date '2027-01-13',  'Bimestre 6'), (3, date '2027-01-14',  'Bimestre 6'),
      (4, date '2027-01-15',  'Bimestre 6'), (5, date '2027-01-18',  'Bimestre 6'),
      (6, date '2027-01-19',  'Bimestre 6'), (7, date '2027-01-20',  'Bimestre 6'),
      (8, date '2027-01-21',  'Bimestre 6'), (9, date '2027-01-22',  'Bimestre 6')
  )

-- =============================================================================
-- INSERT final – ON CONFLICT DO NOTHING protege contra doble ejecución
-- =============================================================================
insert into public.vencimientos
  (impuesto_id, ultimo_digito_nit, fecha_vencimiento, anio_fiscal, periodo)

select
  (select id from retefuente_id),
  r.digito,
  r.fecha,
  extract(year from r.fecha)::smallint,
  r.periodo
from retefuente_rows r

union all

select
  (select id from iva_id),
  i.digito,
  i.fecha,
  extract(year from i.fecha)::smallint,
  i.periodo
from iva_rows i

on conflict (impuesto_id, ultimo_digito_nit, anio_fiscal, periodo) do nothing;

-- ─── Verificación rápida ──────────────────────────────────────────────────────
select
  imp.nombre          as impuesto,
  v.periodo,
  v.ultimo_digito_nit as digito,
  v.fecha_vencimiento,
  (v.fecha_vencimiento - current_date) as dias_restantes
from public.vencimientos v
join public.impuestos imp on imp.id = v.impuesto_id
where imp.nombre in ('Retefuente', 'IVA')
order by v.fecha_vencimiento, imp.nombre, v.ultimo_digito_nit;
