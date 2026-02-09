// Type definitions for database models

export type UserRole = 'admin' | 'investor'
export type VehicleStatus = 'available' | 'rented' | 'maintenance' | 'inactive'
export type TransactionType = 'expense' | 'income'
export type DocumentType = 'llc' | 'vehicle_title' | 'insurance' | 'contract' | 'other'
export type MaintenanceStatus = 'pending' | 'completed'

export interface Profile {
    id: string
    email: string
    full_name: string | null
    role: UserRole
    phone: string | null
    avatar_url: string | null
    created_at: string
    updated_at: string
    country: string | null
}

export interface Vehicle {
    id: string
    make: string
    model: string
    year: number
    license_plate: string | null
    vin: string | null
    status: VehicleStatus
    assigned_investor_id: string | null
    image_url: string | null
    purchase_date: string | null
    purchase_price: number | null
    mileage: number
    location: string | null
    daily_rental_price: number | null
    // New vehicle specifications
    seats?: number | null
    transmission?: string | null
    fuel_type?: string | null
    range?: number | null
    expected_occupancy_days?: number | null
    management_fee_percent?: number | null
    management_fee_type?: 'percentage' | 'fixed' | null
    management_fee_fixed_amount?: number | null
    apply_management_fee?: boolean | null
    created_at: string
    updated_at: string
    // Relations
    assigned_investor?: Profile
}

export interface FinancialRecord {
    id: string
    vehicle_id: string
    type: TransactionType
    category: string
    amount: number
    date: string
    description: string | null
    proof_image_url: string | null
    mileage_at_operation: number | null
    created_by: string | null
    created_at: string
    updated_at: string
    // Relations
    vehicle?: Vehicle
}

export interface Maintenance {
    id: string
    vehicle_id: string
    service_type: string
    cost: number | null
    date: string
    notes: string | null
    next_service_date: string | null
    next_service_mileage: number | null
    status: MaintenanceStatus
    created_at: string
    updated_at: string
    // Relations
    vehicle?: Vehicle
}

export interface Document {
    id: string
    owner_id: string | null
    vehicle_id: string | null
    title: string
    file_url: string
    type: DocumentType
    uploaded_by: string | null
    category: string | null
    expiry_date: string | null
    created_at: string
    updated_at: string
    // Relations
    owner?: Profile
    vehicle?: Vehicle
}
