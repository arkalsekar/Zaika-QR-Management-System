/**
 * Run this SQL in your Supabase SQL Editor to set up the necessary tables.
 * The 'coupons' table is assumed to exist as per your description.
 */

-- Create counters table
CREATE TABLE IF NOT EXISTS public.counters (
  counter_id text NOT NULL,
  counter_name text NOT NULL,
  counter_amount numeric NOT NULL,
  allowed_amounts text, -- CSV string like "10,20,50"
  total_sales numeric DEFAULT 0, -- Track total revenue
  counter_password text NOT NULL,
  counter_email text,
  counter_phone text,
  counter_coordinator_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT counters_pkey PRIMARY KEY (counter_id)
) TABLESPACE pg_default;

-- MIGRATION: If you already have the table, run this:
ALTER TABLE public.counters ADD COLUMN IF NOT EXISTS allowed_amounts text;
ALTER TABLE public.counters ADD COLUMN IF NOT EXISTS total_sales numeric DEFAULT 0;

-- Create admins table
CREATE TABLE IF NOT EXISTS public.admins (
  username text NOT NULL,
  password text NOT NULL, -- Stored as plain text for this simple request, use hashing in production!
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admins_pkey PRIMARY KEY (username)
);

-- Insert default admin
INSERT INTO public.admins (username, password)
VALUES ('admin', 'admin123')
ON CONFLICT (username) DO NOTHING;
