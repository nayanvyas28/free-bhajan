-- Bhajans Table
CREATE TABLE IF NOT EXISTS bhajans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'youtube',
    url TEXT NOT NULL,
    thumbnail TEXT,
    category TEXT DEFAULT 'Krishna',
    sub_type TEXT DEFAULT 'Bhajan',
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    image_url TEXT,
    type TEXT DEFAULT 'deity',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    full_name TEXT,
    phone_number TEXT UNIQUE,
    avatar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Favorites Table
CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    video_id TEXT NOT NULL,
    video_data JSONB NOT NULL, -- Full video object for easy rendering
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, video_id)
);

-- RLS
ALTER TABLE bhajans ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on bhajans" ON bhajans FOR SELECT USING (true);
CREATE POLICY "Allow public read access on categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can manage their own favorites" ON user_favorites FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_video ON user_favorites(video_id);

-- System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- OTP Logs Table
CREATE TABLE IF NOT EXISTS otp_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    template_used TEXT NOT NULL,
    status TEXT NOT NULL,
    response_gateway TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS for new tables
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on system_settings" ON system_settings FOR SELECT USING (true);
CREATE POLICY "Allow authenticated update on system_settings" ON system_settings FOR UPDATE USING (true);
CREATE POLICY "Allow authenticated insert on system_settings" ON system_settings FOR INSERT USING (true);

CREATE POLICY "Allow public insert on otp_logs" ON otp_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read on otp_logs" ON otp_logs FOR SELECT USING (true);

-- Default Settings
INSERT INTO system_settings (key, value, description)
VALUES ('whatsapp_otp_template', 'service_rejected_hindi', 'The active BhashSMS WhatsApp OTP template name')
ON CONFLICT (key) DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_otp_logs_phone ON otp_logs(phone_number);
CREATE INDEX IF NOT EXISTS idx_otp_logs_created ON otp_logs(created_at DESC);
