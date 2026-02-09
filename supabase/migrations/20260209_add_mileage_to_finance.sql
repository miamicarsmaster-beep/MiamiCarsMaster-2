-- Add mileage_at_operation to financial_records
ALTER TABLE financial_records ADD COLUMN IF NOT EXISTS mileage_at_operation INTEGER;

-- Comment for clarity
COMMENT ON COLUMN financial_records.mileage_at_operation IS 'Vehicle mileage at the time of the financial operation';
