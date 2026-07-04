-- ============================================================
-- MIGRACIÓN: Chat global (con purga automática a los 2 días)
-- Ejecuta en: Supabase → SQL Editor → New query
-- ============================================================
--
-- ROLLBACK (si en algún momento quieres quitar el chat):
--   select cron.unschedule('purge_old_chat_messages');
--   drop table if exists public.chat_messages;
-- y en el código, revertir el commit que añade ChatWidget.

create table if not exists public.chat_messages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  message    text not null check (char_length(message) between 1 and 500),
  created_at timestamptz not null default now()
);

alter table public.chat_messages enable row level security;

create policy "Usuarios autenticados ven el chat"
  on public.chat_messages for select
  using (auth.uid() is not null);

create policy "Usuarios no baneados escriben en el chat"
  on public.chat_messages for insert
  with check (
    auth.uid() = user_id
    and not exists (select 1 from public.profiles where id = auth.uid() and is_banned = true)
  );

create policy "Admin borra mensajes del chat"
  on public.chat_messages for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- Habilita eventos en vivo (insert/delete) para esta tabla.
-- Si este comando falla porque la tabla ya está en la publicación, ignora el error.
alter publication supabase_realtime add table public.chat_messages;

-- Purga automática: borra mensajes con más de 2 días, todas las noches a las 03:00 UTC.
-- Si "create extension" falla por permisos, actívala primero desde
-- Supabase Dashboard → Database → Extensions → pg_cron.
create extension if not exists pg_cron;

select cron.schedule(
  'purge_old_chat_messages',
  '0 3 * * *',
  $$ delete from public.chat_messages where created_at < now() - interval '2 days' $$
);
