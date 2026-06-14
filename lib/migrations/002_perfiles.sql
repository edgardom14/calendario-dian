-- =============================================================================
-- Migración 002: Tabla perfiles (datos del contador/usuario)
-- Ejecutar en Supabase → SQL Editor
-- =============================================================================

create table if not exists public.perfiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  nombre_completo varchar(255),
  nombre_empresa  varchar(255),
  telefono        varchar(30),
  updated_at      timestamptz not null default now()
);

-- Trigger updated_at (reutiliza la función ya existente)
drop trigger if exists perfiles_updated_at on public.perfiles;
create trigger perfiles_updated_at
  before update on public.perfiles
  for each row execute function public.set_updated_at();

-- RLS: cada usuario solo accede a su propio perfil
alter table public.perfiles enable row level security;

create policy "Usuario lee su perfil"
  on public.perfiles for select
  to authenticated
  using (id = auth.uid());

create policy "Usuario inserta su perfil"
  on public.perfiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "Usuario actualiza su perfil"
  on public.perfiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Función que crea un perfil vacío al registrarse un usuario nuevo
create or replace function public.crear_perfil_nuevo_usuario()
returns trigger language plpgsql security definer as $$
begin
  insert into public.perfiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.crear_perfil_nuevo_usuario();

-- Crear perfil para usuarios existentes que no tienen uno todavía
insert into public.perfiles (id)
select id from auth.users
on conflict (id) do nothing;
