-- Enable RLS on public.profiles
alter table public.profiles enable row level security;

-- Policy to allow users to view their own profile
create policy "Users can view own profile"
on public.profiles for select
to authenticated
using ( auth.uid() = id );

-- Policy to allow users to update their own profile
create policy "Users can update own profile"
on public.profiles for update
to authenticated
using ( auth.uid() = id );

-- Policy to allow users to insert their own profile (if not handled by trigger)
create policy "Users can insert own profile"
on public.profiles for insert
to authenticated
with check ( auth.uid() = id );
