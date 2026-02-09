-- Add expected occupancy to vehicles table
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS expected_occupancy_days INTEGER DEFAULT 240;

-- Add comment
COMMENT ON COLUMN vehicles.expected_occupancy_days IS 'Estimated number of rental days per year (used for ROI calculation)';
