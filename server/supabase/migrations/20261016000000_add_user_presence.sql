ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS is_dnd boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS last_active_at timestamptz;
