-- Add technical specifications to vehicles table
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS seats INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS transmission TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS fuel_type TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS range INTEGER;

-- Add comments for clarity
COMMENT ON COLUMN vehicles.seats IS 'Number of seats in the vehicle';
COMMENT ON COLUMN vehicles.transmission IS 'Manual or Automatic';
COMMENT ON COLUMN vehicles.fuel_type IS 'Gasoil, Nafta, Electric, etc.';
COMMENT ON COLUMN vehicles.range IS 'Autonomy with a full tank/charge';
