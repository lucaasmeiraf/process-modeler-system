-- Create a table for public profiles
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique,
  full_name text,
  role text default 'user' check (role in ('user', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table profiles enable row level security;

-- Create policies for profiles
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Create a table for boards (departments)
create table boards (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  created_by uuid references profiles(id),
  context_md text,
  glossary jsonb default '[]'::jsonb,
  integrated_systems jsonb default '[]'::jsonb,
  legislation jsonb default '[]'::jsonb,
  org_structure jsonb default '{}'::jsonb,
  documents jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table boards enable row level security;

-- Policies for boards
create policy "Boards are viewable by everyone." on boards
  for select using (true);

create policy "Only admins can create boards." on boards
  for insert with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Only admins can update boards." on boards
  for update using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Create a table for processes
create table processes (
  id uuid default uuid_generate_v4() primary key,
  board_id uuid references boards(id) on delete cascade not null,
  title text not null,
  description text,
  bpmn_xml text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for versions
alter table process_versions enable row level security;

create policy "Versions are viewable by everyone." on process_versions
  for select using (true);

create policy "Authenticated users can create versions." on process_versions
  for insert with check (auth.role() = 'authenticated');

-- Create a table for notifications
create table notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  message text,
  link text,
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for notifications
alter table notifications enable row level security;

create policy "Users can view their own notifications." on notifications
  for select using (auth.uid() = user_id);

create policy "Users can update their own notifications." on notifications
  for update using (auth.uid() = user_id);

-- Create a table for agents
create table agents (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  provider text not null check (provider in ('openai', 'anthropic', 'custom')),
  api_key text, -- In a real app, this should be encrypted or stored in a secure vault
  model text,
  is_default boolean default false,
  created_by uuid references profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table agents enable row level security;

-- Policies for agents
create policy "Agents are viewable by authenticated users." on agents
  for select using (auth.role() = 'authenticated');

create policy "Users can manage their own agents." on agents
  for all using (auth.uid() = created_by);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    case when new.email = 'lucas@dnit.gov.br' then 'admin' else 'user' end
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
