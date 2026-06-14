-- =============================================================================
-- Migración 001: RLS por usuario autenticado
-- Ejecutar en Supabase → SQL Editor
-- =============================================================================

-- 1. Agregar columna user_id a empresas (nullable primero para no romper filas existentes)
alter table public.empresas
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- 2. Asignar un usuario existente a las empresas sin dueño (opcional: borrarlas)
--    Si prefieres borrar las de prueba: DELETE FROM public.empresas WHERE user_id IS NULL;
--    Si quieres asignarlas a tu usuario, reemplaza <TU_USER_ID> con el UUID de tu usuario
--    (lo ves en Supabase → Authentication → Users):
-- UPDATE public.empresas SET user_id = '<TU_USER_ID>' WHERE user_id IS NULL;

-- 3. Hacer user_id obligatorio una vez limpiadas las filas sin dueño
--    (ejecuta esto DESPUÉS del UPDATE anterior)
-- ALTER TABLE public.empresas ALTER COLUMN user_id SET NOT NULL;

-- 4. Re-habilitar RLS (fue deshabilitado temporalmente)
alter table public.empresas             enable row level security;
alter table public.empresa_vencimientos enable row level security;

-- 5. Eliminar políticas permisivas anteriores
drop policy if exists "Usuarios autenticados leen empresas"      on public.empresas;
drop policy if exists "Usuarios autenticados insertan empresas"  on public.empresas;
drop policy if exists "Usuarios autenticados actualizan empresas" on public.empresas;
drop policy if exists "Solo admins eliminan empresas"            on public.empresas;

drop policy if exists "Usuarios autenticados leen seguimiento"     on public.empresa_vencimientos;
drop policy if exists "Usuarios autenticados insertan seguimiento" on public.empresa_vencimientos;
drop policy if exists "Usuarios autenticados actualizan seguimiento" on public.empresa_vencimientos;
drop policy if exists "Solo admins eliminan seguimiento"           on public.empresa_vencimientos;

-- 6. Nuevas políticas: cada usuario ve y gestiona SOLO sus empresas
create policy "Propietario lee sus empresas"
  on public.empresas for select
  to authenticated
  using (user_id = auth.uid());

create policy "Propietario inserta sus empresas"
  on public.empresas for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Propietario actualiza sus empresas"
  on public.empresas for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Propietario elimina sus empresas"
  on public.empresas for delete
  to authenticated
  using (user_id = auth.uid());

-- 7. empresa_vencimientos: acceso si la empresa pertenece al usuario
create policy "Propietario lee seguimiento de sus empresas"
  on public.empresa_vencimientos for select
  to authenticated
  using (
    exists (
      select 1 from public.empresas e
      where e.id = empresa_id and e.user_id = auth.uid()
    )
  );

create policy "Propietario inserta seguimiento de sus empresas"
  on public.empresa_vencimientos for insert
  to authenticated
  with check (
    exists (
      select 1 from public.empresas e
      where e.id = empresa_id and e.user_id = auth.uid()
    )
  );

create policy "Propietario actualiza seguimiento de sus empresas"
  on public.empresa_vencimientos for update
  to authenticated
  using (
    exists (
      select 1 from public.empresas e
      where e.id = empresa_id and e.user_id = auth.uid()
    )
  );

create policy "Propietario elimina seguimiento de sus empresas"
  on public.empresa_vencimientos for delete
  to authenticated
  using (
    exists (
      select 1 from public.empresas e
      where e.id = empresa_id and e.user_id = auth.uid()
    )
  );
