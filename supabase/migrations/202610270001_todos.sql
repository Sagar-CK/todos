begin;
create table public.todos (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 2000),
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index todos_user_created on public.todos (user_id, created_at, id);
alter table public.todos enable row level security;
create policy "Own todos only" on public.todos for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
revoke all on public.todos from anon;
grant select, insert, update, delete on public.todos to authenticated;
create function public.stamp_todo_update() returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  new.user_id = old.user_id;
  new.created_at = old.created_at;
  return new;
end;
$$;
create trigger stamp_todo_update before update on public.todos for each row execute function public.stamp_todo_update();
alter publication supabase_realtime add table public.todos;
commit;
