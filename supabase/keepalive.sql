create table if not exists public.keepalive (
  id smallint primary key default 1,
  last_ping timestamptz default now()
);
insert into public.keepalive (id) values (1) on conflict (id) do nothing;
alter table public.keepalive enable row level security;
create policy "Allow anon read for keepalive"
  on public.keepalive for select to anon using (true);
