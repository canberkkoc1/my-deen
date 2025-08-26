-- =============================================================================
-- Supabase Database Setup for My Deen App
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. USERS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    device_id VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for device_id lookups
CREATE INDEX IF NOT EXISTS idx_users_device_id ON public.users(device_id);

-- =============================================================================
-- 2. USER_PROFILES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) DEFAULT NULL,
    longitude DECIMAL(11, 8) DEFAULT NULL,
    timezone VARCHAR(100) DEFAULT NULL,
    calculation_method INTEGER DEFAULT 1,
    language VARCHAR(10) DEFAULT 'en',
    notification_enabled BOOLEAN DEFAULT true,
    notification_sound BOOLEAN DEFAULT true,
    notification_offset_minutes INTEGER DEFAULT 15,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);

-- =============================================================================
-- 3. PUSH_TOKENS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.push_tokens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    token VARCHAR(512) NOT NULL,
    device_type VARCHAR(50) DEFAULT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON public.push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_token ON public.push_tokens(token);
CREATE INDEX IF NOT EXISTS idx_push_tokens_active ON public.push_tokens(is_active);

-- =============================================================================
-- 4. USER_PUSH_TOKENS TABLE (For Functions)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.user_push_tokens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    token VARCHAR(512) NOT NULL UNIQUE,
    latitude DECIMAL(10, 8) DEFAULT NULL,
    longitude DECIMAL(11, 8) DEFAULT NULL,
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(100) DEFAULT 'Europe/Istanbul',
    calculation_method INTEGER DEFAULT 2,
    notification_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for token lookups
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_token ON public.user_push_tokens(token);
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_enabled ON public.user_push_tokens(notification_enabled);

-- =============================================================================
-- 5. SCHEDULED_NOTIFICATIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.scheduled_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    token VARCHAR(512) NOT NULL,
    prayer_name VARCHAR(50) NOT NULL,
    scheduled_for_date DATE NOT NULL,
    send_at TIMESTAMP WITH TIME ZONE NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_token ON public.scheduled_notifications(token);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_sent ON public.scheduled_notifications(sent);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_send_at ON public.scheduled_notifications(send_at);

-- =============================================================================
-- 6. PRAYER_TIMES_CACHE TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.prayer_times_cache (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    calculation_method INTEGER NOT NULL,
    fajr TIME NOT NULL,
    sunrise TIME NOT NULL,
    dhuhr TIME NOT NULL,
    asr TIME NOT NULL,
    maghrib TIME NOT NULL,
    isha TIME NOT NULL,
    timezone VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create composite index for cache lookups
CREATE INDEX IF NOT EXISTS idx_prayer_times_cache_lookup 
ON public.prayer_times_cache(date, latitude, longitude, calculation_method);

-- =============================================================================
-- 7. NOTIFICATION_JOBS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.notification_jobs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    prayer_name VARCHAR(50) NOT NULL,
    prayer_time TIMESTAMP WITH TIME ZONE NOT NULL,
    notification_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    error_message TEXT DEFAULT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notification_jobs_user_id ON public.notification_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_jobs_status ON public.notification_jobs(status);
CREATE INDEX IF NOT EXISTS idx_notification_jobs_notification_time ON public.notification_jobs(notification_time);

-- =============================================================================
-- 8. NOTIFICATION_LOGS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID DEFAULT NULL REFERENCES public.users(id) ON DELETE SET NULL,
    push_token VARCHAR(512) DEFAULT NULL,
    prayer_name VARCHAR(50) DEFAULT NULL,
    message TEXT DEFAULT NULL,
    status VARCHAR(20) DEFAULT NULL,
    response_data JSONB DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON public.notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON public.notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON public.notification_logs(created_at);

-- =============================================================================
-- 9. TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =============================================================================

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON public.user_profiles 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_push_tokens_updated_at 
    BEFORE UPDATE ON public.push_tokens 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_push_tokens_updated_at 
    BEFORE UPDATE ON public.user_push_tokens 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Note: RLS is disabled for device-based authentication
-- Tables are set to public access for this implementation

-- =============================================================================
-- 11. INITIAL DATA CONSTRAINTS
-- =============================================================================

-- Add check constraints
ALTER TABLE public.user_profiles 
ADD CONSTRAINT check_latitude_range CHECK (latitude >= -90 AND latitude <= 90);

ALTER TABLE public.user_profiles 
ADD CONSTRAINT check_longitude_range CHECK (longitude >= -180 AND longitude <= 180);

ALTER TABLE public.user_profiles 
ADD CONSTRAINT check_calculation_method_range CHECK (calculation_method >= 0 AND calculation_method <= 15);

ALTER TABLE public.user_profiles 
ADD CONSTRAINT check_notification_offset_range CHECK (notification_offset_minutes >= 0 AND notification_offset_minutes <= 60);

ALTER TABLE public.notification_jobs 
ADD CONSTRAINT check_status_values CHECK (status IN ('pending', 'sent', 'failed', 'cancelled'));

ALTER TABLE public.notification_logs 
ADD CONSTRAINT check_log_status_values CHECK (status IN ('success', 'failed', 'retry'));

-- =============================================================================
-- SETUP COMPLETE
-- =============================================================================

-- Verify tables were created
SELECT 
    schemaname,
    tablename,
    hasindexes,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('users', 'user_profiles', 'push_tokens', 'user_push_tokens', 'scheduled_notifications', 'prayer_times_cache', 'notification_jobs', 'notification_logs')
ORDER BY tablename; 