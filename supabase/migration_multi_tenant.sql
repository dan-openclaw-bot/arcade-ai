-- ============================================================
-- MULTI-TENANT MIGRATION
-- Run this in Supabase SQL Editor AFTER creating your admin account.
-- Replace 'YOUR-ADMIN-UUID-HERE' with the actual admin user UUID.
-- ============================================================

-- Step 1: Add user_id columns (nullable first)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE generations ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE actors ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE preprompts ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE folders ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Step 2: Migrate ALL existing data to admin user
-- ⚠️ REPLACE THIS UUID with your actual admin user_id from Supabase Auth
UPDATE projects SET user_id = 'YOUR-ADMIN-UUID-HERE' WHERE user_id IS NULL;
UPDATE generations SET user_id = 'YOUR-ADMIN-UUID-HERE' WHERE user_id IS NULL;
UPDATE actors SET user_id = 'YOUR-ADMIN-UUID-HERE' WHERE user_id IS NULL;
UPDATE preprompts SET user_id = 'YOUR-ADMIN-UUID-HERE' WHERE user_id IS NULL;
UPDATE folders SET user_id = 'YOUR-ADMIN-UUID-HERE' WHERE user_id IS NULL;

-- Step 3: Make user_id NOT NULL (now that all rows have a value)
ALTER TABLE projects ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE generations ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE actors ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE preprompts ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE folders ALTER COLUMN user_id SET NOT NULL;

-- Step 4: Set default for new rows = authenticated user
ALTER TABLE projects ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE generations ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE actors ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE preprompts ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE folders ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Step 5: Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE actors ENABLE ROW LEVEL SECURITY;
ALTER TABLE preprompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies (users can only see/edit their own data)
-- Projects
CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (auth.uid() = user_id);

-- Generations
CREATE POLICY "Users can view own generations" ON generations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own generations" ON generations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own generations" ON generations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own generations" ON generations FOR DELETE USING (auth.uid() = user_id);

-- Actors
CREATE POLICY "Users can view own actors" ON actors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own actors" ON actors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own actors" ON actors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own actors" ON actors FOR DELETE USING (auth.uid() = user_id);

-- Preprompts
CREATE POLICY "Users can view own preprompts" ON preprompts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preprompts" ON preprompts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preprompts" ON preprompts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own preprompts" ON preprompts FOR DELETE USING (auth.uid() = user_id);

-- Folders
CREATE POLICY "Users can view own folders" ON folders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own folders" ON folders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own folders" ON folders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own folders" ON folders FOR DELETE USING (auth.uid() = user_id);

-- Step 7: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_user_id ON generations(user_id);
CREATE INDEX IF NOT EXISTS idx_actors_user_id ON actors(user_id);
CREATE INDEX IF NOT EXISTS idx_preprompts_user_id ON preprompts(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
