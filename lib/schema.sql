-- =============================================================================
-- CalendarioDIAN – Schema principal
-- Ejecutar en Supabase → SQL Editor
-- =============================================================================

-- ─── Extensiones ──────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Enums ────────────────────────────────────────────────────────────────────
-- DO $$ BLOCK permite crearlos solo si no existen (idempotente)

do $$ begin
  create type tipo_contribuyente_enum as enum (
    'gran_contribuyente',
    'persona_juridica',
    'persona_natural'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type periodicidad_enum as enum (
    'anual',
    'bimestral',
    'cuatrimestral',
    'mensual'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type estado_vencimiento_enum as enum (
    'pendiente',
    'presentado',
    'pagado',
    'vencido',
    'no_aplica'
  );
exception when duplicate_object then null;
end $$;

-- =============================================================================
-- TABLA: empresas
-- =============================================================================
create table if not exists public.empresas (
  id                   uuid primary key default uuid_generate_v4(),
  nit                  varchar(15)  not null,          -- sin guiones ni dígito verificación
  digito_verificacion  smallint     not null check (digito_verificacion between 0 and 9),
  razon_social         varchar(255) not null,
  tipo_contribuyente   tipo_contribuyente_enum not null,
  email_notificacion   varchar(255) not null,
  created_at           timestamptz  not null default now(),
  updated_at           timestamptz  not null default now(),

  constraint nit_formato check (nit ~ '^\d+$'),        -- solo dígitos
  constraint email_formato check (email_notificacion ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

-- NIT único por empresa
create unique index if not exists empresas_nit_unique on public.empresas (nit);

comment on table  public.empresas                    is 'Clientes/empresas registradas en la plataforma';
comment on column public.empresas.nit                is 'NIT sin guiones ni dígito de verificación';
comment on column public.empresas.digito_verificacion is 'Dígito de verificación del NIT (0–9)';

-- Trigger: mantiene updated_at automáticamente
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists empresas_updated_at on public.empresas;
create trigger empresas_updated_at
  before update on public.empresas
  for each row execute function public.set_updated_at();

-- =============================================================================
-- TABLA: impuestos
-- =============================================================================
create table if not exists public.impuestos (
  id            uuid primary key default uuid_generate_v4(),
  nombre        varchar(100) not null,
  periodicidad  periodicidad_enum not null,
  descripcion   text,
  activo        boolean not null default true,
  created_at    timestamptz not null default now()
);

create unique index if not exists impuestos_nombre_unique on public.impuestos (nombre);

comment on table public.impuestos is 'Catálogo de impuestos/obligaciones administrados por la DIAN';

-- Datos iniciales del catálogo
insert into public.impuestos (nombre, periodicidad, descripcion) values
  ('Renta',                    'anual',          'Declaración de renta personas jurídicas y naturales'),
  ('IVA',                      'bimestral',      'Impuesto sobre las ventas – grandes contribuyentes bimestral'),
  ('IVA Cuatrimestral',        'cuatrimestral',  'IVA para responsables del régimen general no grandes contribuyentes'),
  ('Retefuente',               'mensual',        'Retención en la fuente mensual'),
  ('Reteiva',                  'bimestral',      'Retención en la fuente a título de IVA'),
  ('Reteica',                  'bimestral',      'Retención de industria y comercio'),
  ('ICA',                      'bimestral',      'Impuesto de industria y comercio'),
  ('GMF',                      'mensual',        'Gravamen a los movimientos financieros'),
  ('Patrimonio',               'anual',          'Impuesto al patrimonio'),
  ('Normalización Tributaria', 'anual',          'Impuesto de normalización tributaria')
on conflict (nombre) do nothing;

-- =============================================================================
-- TABLA: vencimientos
-- =============================================================================
-- Una fila por cada combinación: impuesto × último dígito del NIT × año fiscal
-- Para impuestos que no dependen del dígito (ej. grandes contribuyentes con
-- fecha única) se deja ultimo_digito_nit = -1 y se maneja en la app.
-- =============================================================================
create table if not exists public.vencimientos (
  id                  uuid primary key default uuid_generate_v4(),
  impuesto_id         uuid not null references public.impuestos (id) on delete cascade,
  ultimo_digito_nit   smallint not null check (ultimo_digito_nit between 0 and 9),
  fecha_vencimiento   date not null,
  anio_fiscal         smallint not null check (anio_fiscal between 2020 and 2050),
  periodo             varchar(50),                     -- ej. "Bimestre 1", "Enero"
  created_at          timestamptz not null default now(),

  -- Evita duplicados: un impuesto no puede tener dos fechas para el mismo
  -- dígito/período/año fiscal
  constraint vencimientos_unique unique (impuesto_id, ultimo_digito_nit, anio_fiscal, periodo)
);

create index if not exists vencimientos_impuesto_idx  on public.vencimientos (impuesto_id);
create index if not exists vencimientos_fecha_idx     on public.vencimientos (fecha_vencimiento);
create index if not exists vencimientos_anio_idx      on public.vencimientos (anio_fiscal);
create index if not exists vencimientos_digito_idx    on public.vencimientos (ultimo_digito_nit);

comment on table  public.vencimientos                      is 'Fechas de vencimiento por impuesto, último dígito del NIT y año fiscal';
comment on column public.vencimientos.ultimo_digito_nit    is 'Último dígito del NIT del contribuyente (0–9)';
comment on column public.vencimientos.anio_fiscal          is 'Año fiscal al que corresponde la obligación';
comment on column public.vencimientos.periodo              is 'Descripción del período: Enero, Bimestre 1, etc.';

-- =============================================================================
-- TABLA: empresa_vencimientos  (seguimiento por empresa)
-- =============================================================================
create table if not exists public.empresa_vencimientos (
  id                  uuid primary key default uuid_generate_v4(),
  empresa_id          uuid not null references public.empresas    (id) on delete cascade,
  vencimiento_id      uuid not null references public.vencimientos(id) on delete cascade,
  estado              estado_vencimiento_enum not null default 'pendiente',
  fecha_presentacion  date,
  fecha_pago          date,
  observaciones       text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint empresa_vencimientos_unique unique (empresa_id, vencimiento_id)
);

create index if not exists ev_empresa_idx     on public.empresa_vencimientos (empresa_id);
create index if not exists ev_vencimiento_idx on public.empresa_vencimientos (vencimiento_id);
create index if not exists ev_estado_idx      on public.empresa_vencimientos (estado);

drop trigger if exists empresa_vencimientos_updated_at on public.empresa_vencimientos;
create trigger empresa_vencimientos_updated_at
  before update on public.empresa_vencimientos
  for each row execute function public.set_updated_at();

comment on table public.empresa_vencimientos is 'Seguimiento del estado de cada obligación fiscal por empresa';

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Habilitar RLS en todas las tablas
alter table public.empresas             enable row level security;
alter table public.impuestos            enable row level security;
alter table public.vencimientos         enable row level security;
alter table public.empresa_vencimientos enable row level security;

-- ─── Políticas: impuestos y vencimientos son de lectura pública ───────────────
-- (catálogo compartido, no tiene datos sensibles)

create policy "Lectura pública de impuestos"
  on public.impuestos for select
  using (true);

create policy "Lectura pública de vencimientos"
  on public.vencimientos for select
  using (true);

-- Solo usuarios autenticados (rol service_role o roles internos) pueden
-- insertar/actualizar el catálogo
create policy "Solo admins modifican impuestos"
  on public.impuestos for all
  using (auth.role() = 'service_role');

create policy "Solo admins modifican vencimientos"
  on public.vencimientos for all
  using (auth.role() = 'service_role');

-- ─── Políticas: empresas ──────────────────────────────────────────────────────
-- Usuarios autenticados ven y gestionan únicamente sus propias empresas.
-- Se asume que empresas.id coincide con auth.uid() o se usa una tabla de
-- membresía. Por ahora, cualquier usuario autenticado puede leer todas las
-- empresas (modelo multi-tenant simple; ajustar según arquitectura final).

create policy "Usuarios autenticados leen empresas"
  on public.empresas for select
  to authenticated
  using (true);

create policy "Usuarios autenticados insertan empresas"
  on public.empresas for insert
  to authenticated
  with check (true);

create policy "Usuarios autenticados actualizan empresas"
  on public.empresas for update
  to authenticated
  using (true)
  with check (true);

-- Solo service_role puede eliminar empresas (acción destructiva controlada)
create policy "Solo admins eliminan empresas"
  on public.empresas for delete
  using (auth.role() = 'service_role');

-- ─── Políticas: empresa_vencimientos ─────────────────────────────────────────

create policy "Usuarios autenticados leen seguimiento"
  on public.empresa_vencimientos for select
  to authenticated
  using (true);

create policy "Usuarios autenticados insertan seguimiento"
  on public.empresa_vencimientos for insert
  to authenticated
  with check (true);

create policy "Usuarios autenticados actualizan seguimiento"
  on public.empresa_vencimientos for update
  to authenticated
  using (true)
  with check (true);

create policy "Solo admins eliminan seguimiento"
  on public.empresa_vencimientos for delete
  using (auth.role() = 'service_role');

-- =============================================================================
-- VISTA útil: próximos vencimientos con estado por empresa
-- =============================================================================
create or replace view public.v_proximos_vencimientos as
select
  e.id            as empresa_id,
  e.razon_social,
  e.nit,
  e.digito_verificacion,
  i.nombre        as impuesto,
  i.periodicidad,
  v.periodo,
  v.fecha_vencimiento,
  v.anio_fiscal,
  coalesce(ev.estado, 'pendiente') as estado,
  ev.fecha_presentacion,
  ev.fecha_pago,
  ev.observaciones,
  (v.fecha_vencimiento - current_date) as dias_restantes
from public.empresas e
join public.vencimientos v
  on v.ultimo_digito_nit = (right(e.nit, 1))::smallint
join public.impuestos i
  on i.id = v.impuesto_id
 and i.activo = true
left join public.empresa_vencimientos ev
  on ev.empresa_id    = e.id
 and ev.vencimiento_id = v.id
order by v.fecha_vencimiento, e.razon_social;

comment on view public.v_proximos_vencimientos is
  'Vista consolidada de vencimientos por empresa según último dígito del NIT';
