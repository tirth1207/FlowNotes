-- NoteForge Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing triggers and functions if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create users table (mirrored from auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT UNIQUE,
  api_key TEXT,
  blog_enabled BOOLEAN DEFAULT FALSE,
  blog_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notes table
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  is_blog BOOLEAN DEFAULT FALSE,
  sharing_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create shared_notes table
CREATE TABLE IF NOT EXISTS public.shared_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
  shared_with UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(note_id, shared_with)
);

-- Create teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create team members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  invited_email TEXT,
  role TEXT DEFAULT 'member',
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted'
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

-- Create team notes table
CREATE TABLE IF NOT EXISTS public.team_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance (IF NOT EXISTS not supported for indexes)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notes_owner_id') THEN
    CREATE INDEX idx_notes_owner_id ON public.notes(owner_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notes_created_at') THEN
    CREATE INDEX idx_notes_created_at ON public.notes(created_at);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_shared_notes_shared_with') THEN
    CREATE INDEX idx_shared_notes_shared_with ON public.shared_notes(shared_with);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_shared_notes_note_id') THEN
    CREATE INDEX idx_shared_notes_note_id ON public.shared_notes(note_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_team_members_team_id') THEN
    CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_team_members_user_id') THEN
    CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_team_notes_team_id') THEN
    CREATE INDEX idx_team_notes_team_id ON public.team_notes(team_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_team_notes_note_id') THEN
    CREATE INDEX idx_team_notes_note_id ON public.team_notes(note_id);
  END IF;
END $$;

-- Trigger to mirror auth.users into public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email))
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create trigger for user updates
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can insert their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can view notes shared with them" ON public.shared_notes;
DROP POLICY IF EXISTS "Note owners can share notes" ON public.shared_notes;
DROP POLICY IF EXISTS "Note owners can manage shared notes" ON public.shared_notes;
DROP POLICY IF EXISTS "Team members can view their teams" ON public.teams;
DROP POLICY IF EXISTS "Team members can view their membership" ON public.team_members;
DROP POLICY IF EXISTS "Invited user can accept invite" ON public.team_members;
DROP POLICY IF EXISTS "Team members can view team notes" ON public.team_notes;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for notes table
CREATE POLICY "Users can view their own notes" ON public.notes
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own notes" ON public.notes
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own notes" ON public.notes
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own notes" ON public.notes
  FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for shared_notes table
CREATE POLICY "Users can view notes shared with them" ON public.shared_notes
  FOR SELECT USING (auth.uid() = shared_with);

CREATE POLICY "Note owners can share notes" ON public.shared_notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.notes 
      WHERE id = note_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Note owners can manage shared notes" ON public.shared_notes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.notes 
      WHERE id = note_id AND owner_id = auth.uid()
    )
  );

-- RLS Policies for teams table
CREATE POLICY "Team members can view their teams" ON public.teams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = id AND user_id = auth.uid() AND status = 'accepted'
    )
  );

-- RLS Policies for team members table
CREATE POLICY "Team members can view their membership" ON public.team_members
  FOR SELECT USING (
    user_id = auth.uid() OR invited_email = (SELECT email FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Invited user can accept invite" ON public.team_members
  FOR UPDATE USING (
    invited_email = (SELECT email FROM public.users WHERE id = auth.uid())
  );

-- RLS Policies for team notes table
CREATE POLICY "Team members can view team notes" ON public.team_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = team_notes.team_id AND user_id = auth.uid() AND status = 'accepted'
    )
  );

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_user_notes(UUID);
DROP FUNCTION IF EXISTS share_note(UUID, TEXT);

-- Function to get notes (including shared ones)
CREATE OR REPLACE FUNCTION get_user_notes(user_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content JSONB,
  is_blog BOOLEAN,
  sharing_link TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  owner_id UUID,
  is_shared BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  -- User's own notes
  SELECT 
    n.id,
    n.title,
    n.content,
    n.is_blog,
    n.sharing_link,
    n.created_at,
    n.updated_at,
    n.owner_id,
    FALSE as is_shared
  FROM public.notes n
  WHERE n.owner_id = user_id
  
  UNION ALL
  
  -- Notes shared with user
  SELECT 
    n.id,
    n.title,
    n.content,
    n.is_blog,
    n.sharing_link,
    n.created_at,
    n.updated_at,
    n.owner_id,
    TRUE as is_shared
  FROM public.notes n
  INNER JOIN public.shared_notes sn ON n.id = sn.note_id
  WHERE sn.shared_with = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to share a note
CREATE OR REPLACE FUNCTION share_note(note_uuid UUID, user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Get the target user's ID
  SELECT id INTO target_user_id 
  FROM public.users 
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if the current user owns the note
  IF NOT EXISTS (
    SELECT 1 FROM public.notes 
    WHERE id = note_uuid AND owner_id = auth.uid()
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Share the note
  INSERT INTO public.shared_notes (note_id, shared_with)
  VALUES (note_uuid, target_user_id)
  ON CONFLICT (note_id, shared_with) DO NOTHING;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add new policy for public access to notes with a sharing_link
CREATE POLICY "Public can view shared notes"
ON public.notes
FOR SELECT
USING (
  sharing_link is not null
); 