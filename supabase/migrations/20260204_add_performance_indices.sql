-- Performance Optimization: Add database indices for frequently queried columns
-- This migration adds indices to improve query performance across the platform

-- Index for vehicles by assigned investor
-- Used in: investor dashboard, investor financial summary, vehicle lists
CREATE INDEX IF NOT EXISTS idx_vehicles_assigned_investor 
ON vehicles(assigned_investor_id) 
WHERE assigned_investor_id IS NOT NULL;

-- Index for financial records by vehicle
-- Used in: vehicle detail pages, financial calculations
CREATE INDEX IF NOT EXISTS idx_financial_records_vehicle 
ON financial_records(vehicle_id);

-- Index for financial records by date (descending)
-- Used in: recent activity, monthly reports, date-based filtering
CREATE INDEX IF NOT EXISTS idx_financial_records_date 
ON financial_records(date DESC);

-- Composite index for financial records by vehicle and date
-- Used in: vehicle financial history, investor summaries
CREATE INDEX IF NOT EXISTS idx_financial_records_vehicle_date 
ON financial_records(vehicle_id, date DESC);

-- Index for financial records by type
-- Used in: income/expense calculations, filtering
CREATE INDEX IF NOT EXISTS idx_financial_records_type 
ON financial_records(type);

-- Composite index for faster aggregations
-- Used in: dashboard statistics, monthly summaries
CREATE INDEX IF NOT EXISTS idx_financial_records_vehicle_type_date 
ON financial_records(vehicle_id, type, date DESC);

-- Index for profiles by role
-- Used in: investor lists, admin lists, role-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_role 
ON profiles(role);

-- Index for vehicles by status
-- Used in: available vehicles, maintenance tracking
CREATE INDEX IF NOT EXISTS idx_vehicles_status 
ON vehicles(status);

-- Analyze tables to update statistics for query planner
ANALYZE vehicles;
ANALYZE financial_records;
ANALYZE profiles;
