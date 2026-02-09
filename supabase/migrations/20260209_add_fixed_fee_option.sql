-- Update vehicles table with fee type and fixed amount
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS management_fee_type TEXT DEFAULT 'percentage' CHECK (management_fee_type IN ('percentage', 'fixed'));
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS management_fee_fixed_amount DECIMAL(10,2) DEFAULT 0;

-- Update system settings with default type
UPDATE system_settings 
SET value = value || '{"default_fee_type": "percentage", "default_fixed_amount": 0}'::jsonb 
WHERE id = 'roi_settings';

-- Comments
COMMENT ON COLUMN vehicles.management_fee_type IS 'Type of fee: percentage or fixed';
COMMENT ON COLUMN vehicles.management_fee_fixed_amount IS 'Fixed dollar amount for management fee if type is fixed';
