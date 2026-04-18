-- ============================================================
-- Copropriété Governance – Supabase Schema
-- Run this in: Supabase → SQL Editor → New query
-- ============================================================

-- Profiles (extends Supabase auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Auto-create profile on new user signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Lots (stable legal entity – never changes)
create table lots (
  lot_id text primary key,          -- e.g. 'A1', 'B1'
  share numeric(6,3) not null,      -- tantièmes / ownership percentage
  description text
);

-- Contacts (owners/tenants linked to lots)
create table contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  name text not null,
  email text not null,
  lot_id text not null references lots(lot_id),
  role text not null check (role in ('owner', 'tenant', 'proxy')),
  postal_address text,
  created_at timestamptz not null default now()
);

-- Proposals (non-binding discussion layer)
create table proposals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  created_by uuid not null references profiles(id),
  status text not null default 'discussion'
    check (status in ('discussion', 'consensus_reached', 'rejected', 'escalated_to_ag')),
  tags text[] default '{}',
  compliance_notes text,
  compliance_assessed_by uuid references profiles(id),
  compliance_assessed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Proposal votes (intent only – non-binding)
create table proposal_votes (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references proposals(id) on delete cascade,
  user_id uuid not null references profiles(id),
  status text not null check (status in ('agree', 'disagree', 'neutral')),
  created_at timestamptz not null default now(),
  unique(proposal_id, user_id)
);

-- Decisions (immutable legal layer)
create table decisions (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('AG', 'unanimous_written', 'AGE')),
  proposal_id uuid references proposals(id) on delete set null,
  title text not null,
  final_text text not null,
  decided_at date not null,
  status text not null default 'active'
    check (status in ('active', 'completed', 'archived')),
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

-- Decision signatures (Yousign)
create table decision_signatures (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references decisions(id) on delete cascade,
  user_id uuid not null references profiles(id),
  signed_at timestamptz,
  signature_provider text default 'yousign',
  signature_reference_id text,
  created_at timestamptz not null default now()
);

-- Documents (stored in Supabase Storage)
create table documents (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid references decisions(id) on delete cascade,
  proposal_id uuid references proposals(id) on delete cascade,
  file_url text not null,
  type text not null check (type in ('draft', 'signed', 'certificate', 'reglement')),
  version int default 1,
  is_current boolean default true,
  uploaded_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- Comments (on proposals or decisions)
create table comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  proposal_id uuid references proposals(id) on delete cascade,
  decision_id uuid references decisions(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  check (
    (proposal_id is not null and decision_id is null) or
    (decision_id is not null and proposal_id is null)
  )
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

alter table profiles enable row level security;
alter table lots enable row level security;
alter table contacts enable row level security;
alter table proposals enable row level security;
alter table proposal_votes enable row level security;
alter table decisions enable row level security;
alter table decision_signatures enable row level security;
alter table documents enable row level security;
alter table comments enable row level security;

-- Helper: is the current user admin?
create or replace function is_admin()
returns boolean language sql security definer as $$
  select coalesce(
    (select is_admin from profiles where id = auth.uid()),
    false
  );
$$;

-- profiles: users see their own; admin sees all
create policy "profiles_select" on profiles for select
  using (id = auth.uid() or is_admin());
create policy "profiles_update_own" on profiles for update
  using (id = auth.uid());

-- lots: all authenticated users can read; only admin can write
create policy "lots_select" on lots for select using (auth.uid() is not null);
create policy "lots_write" on lots for all using (is_admin());

-- contacts: all authenticated users can read; only admin can write
create policy "contacts_select" on contacts for select using (auth.uid() is not null);
create policy "contacts_write" on contacts for all using (is_admin());

-- proposals: all can read; authenticated can insert; only creator or admin can update
create policy "proposals_select" on proposals for select using (auth.uid() is not null);
create policy "proposals_insert" on proposals for insert with check (auth.uid() = created_by);
create policy "proposals_update" on proposals for update
  using (auth.uid() = created_by or is_admin());

-- compliance notes: admin only
create policy "compliance_notes_update" on proposals for update
  using (is_admin())
  with check (is_admin());

-- proposal_votes: users manage their own votes
create policy "votes_select" on proposal_votes for select using (auth.uid() is not null);
create policy "votes_insert" on proposal_votes for insert with check (auth.uid() = user_id);
create policy "votes_update" on proposal_votes for update using (auth.uid() = user_id);

-- decisions: all can read; only admin can create/update
create policy "decisions_select" on decisions for select using (auth.uid() is not null);
create policy "decisions_write" on decisions for all using (is_admin());

-- decision_signatures: all can read; admin manages
create policy "sigs_select" on decision_signatures for select using (auth.uid() is not null);
create policy "sigs_write" on decision_signatures for all using (is_admin());

-- documents: all can read; admin manages
create policy "docs_select" on documents for select using (auth.uid() is not null);
create policy "docs_write" on documents for all using (is_admin());

-- comments: all can read; authenticated can insert their own; admin can delete
create policy "comments_select" on comments for select using (auth.uid() is not null);
create policy "comments_insert" on comments for insert with check (auth.uid() = user_id);
create policy "comments_delete" on comments for delete using (auth.uid() = user_id or is_admin());

-- ============================================================
-- Seed: the 5 lots
-- ============================================================
insert into lots (lot_id, share, description) values
  ('L1', 20.000, 'Lot 1'),
  ('L2', 20.000, 'Lot 2'),
  ('L3', 20.000, 'Lot 3'),
  ('L4', 20.000, 'Lot 4'),
  ('L5', 20.000, 'Lot 5');

-- Note: update lot_id names and shares to match your actual tantièmes.
-- After running this schema, manually set is_admin = true for your user:
--   update profiles set is_admin = true where id = '<your-user-uuid>';
