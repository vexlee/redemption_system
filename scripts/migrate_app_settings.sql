-- Run this in your Supabase SQL editor to enable:
--   - Admin password changes from the Settings tab
--   - Instagram link management from the Settings tab

CREATE TABLE IF NOT EXISTS app_settings (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default Instagram link values (change these to match your actual links)
INSERT INTO app_settings (key, value) VALUES
    ('admin_password',       ''),
    ('instagram_mokin_url',  'https://www.instagram.com/aukey.malaysia?igsh=eDY5ZWZ1M2ZhcHV5'),
    ('instagram_mokin_label','Mokin Malaysia'),
    ('instagram_gajeto_url', 'https://www.instagram.com/gajetomalaysia?igsh=MWVyYm9ldWppbm5raA=='),
    ('instagram_gajeto_label','Gajeto Malaysia')
ON CONFLICT (key) DO NOTHING;

-- Optional: keep updated_at fresh on every change
CREATE OR REPLACE FUNCTION update_app_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS app_settings_updated_at ON app_settings;
CREATE TRIGGER app_settings_updated_at
    BEFORE UPDATE ON app_settings
    FOR EACH ROW EXECUTE FUNCTION update_app_settings_timestamp();
