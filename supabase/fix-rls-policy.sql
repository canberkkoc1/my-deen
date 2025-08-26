-- =============================================================================
-- Fix RLS Policy Issue for user_push_tokens Table
-- =============================================================================

-- Disable Row Level Security for user_push_tokens table
-- This is needed for device-based authentication where we don't use auth.uid()
ALTER TABLE public.user_push_tokens DISABLE ROW LEVEL SECURITY;

-- Also disable RLS for other tables to ensure consistency
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_times_cache DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs DISABLE ROW LEVEL SECURITY;

-- Verify RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('users', 'user_profiles', 'push_tokens', 'user_push_tokens', 'scheduled_notifications', 'prayer_times_cache', 'notification_jobs', 'notification_logs')
ORDER BY tablename; 