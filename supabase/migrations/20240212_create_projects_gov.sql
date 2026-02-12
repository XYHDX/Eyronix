-- Create projects table
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  image_url text,
  stats text[] default '{}',
  status text not null default 'Operational', -- 'Operational', 'Completed', 'In Progress'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create gov_items table
create table if not exists public.gov_items (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  image_url text,
  type text not null, -- 'traffic', 'security'
  features text[] default '{}', -- For bullet points like "Automated Fine Collection"
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.projects enable row level security;
alter table public.gov_items enable row level security;

-- Create policies for projects
create policy "Public projects are viewable by everyone."
  on public.projects for select
  using ( true );

create policy "Admins can insert projects."
  on public.projects for insert
  with check ( exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  ) );

create policy "Admins can update projects."
  on public.projects for update
  using ( exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  ) );

create policy "Admins can delete projects."
  on public.projects for delete
  using ( exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  ) );

-- Create policies for gov_items
create policy "Public gov_items are viewable by everyone."
  on public.gov_items for select
  using ( true );

create policy "Admins can insert gov_items."
  on public.gov_items for insert
  with check ( exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  ) );

create policy "Admins can update gov_items."
  on public.gov_items for update
  using ( exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  ) );

create policy "Admins can delete gov_items."
  on public.gov_items for delete
  using ( exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  ) );

-- Storage Buckets (Execute via dashboard if this fails, but attempting SQL creation)
insert into storage.buckets (id, name, public)
values ('projects', 'projects', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('gov', 'gov', true)
on conflict (id) do nothing;

-- Storage Policies
-- Projects Bucket
create policy "Public Access Projects"
  on storage.objects for select
  using ( bucket_id = 'projects' );

create policy "Admin Upload Projects"
  on storage.objects for insert
  with check ( bucket_id = 'projects' and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  ) );

create policy "Admin Update Projects"
  on storage.objects for update
  using ( bucket_id = 'projects' and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  ) );

create policy "Admin Delete Projects"
  on storage.objects for delete
  using ( bucket_id = 'projects' and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  ) );

-- Gov Bucket
create policy "Public Access Gov"
  on storage.objects for select
  using ( bucket_id = 'gov' );

create policy "Admin Upload Gov"
  on storage.objects for insert
  with check ( bucket_id = 'gov' and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  ) );

create policy "Admin Update Gov"
  on storage.objects for update
  using ( bucket_id = 'gov' and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  ) );

create policy "Admin Delete Gov"
  on storage.objects for delete
  using ( bucket_id = 'gov' and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  ) );
