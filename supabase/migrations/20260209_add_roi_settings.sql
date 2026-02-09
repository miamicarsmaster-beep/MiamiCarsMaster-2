-- Add management fee to vehicles
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS management_fee_percent NUMERIC DEFAULT 20;

-- Create system settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default ROI settings
INSERT INTO system_settings (id, value)
VALUES ('roi_settings', '{"default_occupancy_days": 240, "default_management_fee": 20}')
ON CONFLICT (id) DO NOTHING;

-- Add comment
COMMENT ON COLUMN vehicles.management_fee_percent IS 'Percentage cut for management fees (0-100)';
