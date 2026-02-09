-- Add apply_management_fee toggle to vehicles
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS apply_management_fee BOOLEAN DEFAULT TRUE;

-- Update system settings to include fee activation
UPDATE system_settings 
SET value = value || '{"apply_default_fee": true}'::jsonb 
WHERE id = 'roi_settings';

-- Add comment
COMMENT ON COLUMN vehicles.apply_management_fee IS 'Toggle to apply or skip management fee for this specific vehicle';
