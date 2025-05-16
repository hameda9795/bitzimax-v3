-- Add isVisible column to videos table if it doesn't exist
ALTER TABLE videos ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE;