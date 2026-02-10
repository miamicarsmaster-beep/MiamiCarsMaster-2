'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Initialize supabase with service role to bypass RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

export async function createVehicleAction(payload: any) {
    try {
        console.log('[createVehicleAction] Starting creation with payload:', payload)

        // Filter out fields that don't exist in the database schema
        const {
            expected_occupancy_days,
            management_fee_percent,
            management_fee_type,
            management_fee_fixed_amount,
            apply_management_fee,
            ...validPayload
        } = payload

        console.log('[createVehicleAction] Filtered payload:', validPayload)

        const { data, error } = await supabaseAdmin
            .from("vehicles")
            .insert([validPayload])
            .select(`
                *,
                assigned_investor:profiles!assigned_investor_id(id, full_name, email)
            `)
            .single()

        if (error) {
            console.error('[createVehicleAction] Supabase error:', error)
            return { error: error.message }
        }

        revalidatePath('/dashboard/admin/vehicles')
        return { success: true, data }
    } catch (error: any) {
        console.error('[createVehicleAction] Unexpected error:', error)
        return { error: error.message || 'An unexpected error occurred' }
    }
}

export async function uploadVehicleImageAction(formData: FormData) {
    try {
        const file = formData.get('file') as File
        if (!file) return { error: 'No file provided' }

        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `vehicles/${fileName}`

        const buffer = await file.arrayBuffer()

        const { data, error } = await supabaseAdmin.storage
            .from('vehicle-images')
            .upload(filePath, buffer, {
                contentType: file.type,
                cacheControl: '3600',
                upsert: false
            })

        if (error) {
            console.error('[uploadVehicleImageAction] Storage error:', error)
            return { error: error.message }
        }

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('vehicle-images')
            .getPublicUrl(filePath)

        return { success: true, publicUrl }
    } catch (error: any) {
        console.error('[uploadVehicleImageAction] Unexpected error:', error)
        return { error: error.message || 'An unexpected error occurred' }
    }
}

export async function deleteVehicleAction(id: string) {
    try {
        const { error } = await supabaseAdmin
            .from("vehicles")
            .delete()
            .eq("id", id)

        if (error) {
            console.error('[deleteVehicleAction] Supabase error:', error)
            return { error: error.message }
        }

        revalidatePath('/dashboard/admin/vehicles')
        return { success: true }
    } catch (error: any) {
        console.error('[deleteVehicleAction] Unexpected error:', error)
        return { error: error.message || 'An unexpected error occurred' }
    }
}

export async function updateVehicleAction(id: string, payload: any) {
    try {
        const { data, error } = await supabaseAdmin
            .from("vehicles")
            .update(payload)
            .eq("id", id)
            .select()
            .single()

        if (error) {
            console.error('[updateVehicleAction] Supabase error:', error)
            return { error: error.message }
        }

        revalidatePath('/dashboard/admin/vehicles')
        return { success: true, data }
    } catch (error: any) {
        console.error('[updateVehicleAction] Unexpected error:', error)
        return { error: error.message || 'An unexpected error occurred' }
    }
}

export async function createVehiclePhotoAction(payload: any) {
    try {
        const { data, error } = await supabaseAdmin
            .from("vehicle_photos")
            .insert([payload])
            .select()
            .single()

        if (error) {
            console.error('[createVehiclePhotoAction] Supabase error:', error)
            return { error: error.message }
        }

        return { success: true, data }
    } catch (error: any) {
        console.error('[createVehiclePhotoAction] Unexpected error:', error)
        return { error: error.message || 'An unexpected error occurred' }
    }
}

export async function createMaintenanceAction(payload: any) {
    try {
        const { data, error } = await supabaseAdmin
            .from("maintenances")
            .insert([payload])
            .select()
            .single()

        if (error) {
            console.error('[createMaintenanceAction] Supabase error:', error)
            return { error: error.message }
        }

        return { success: true, data }
    } catch (error: any) {
        console.error('[createMaintenanceAction] Unexpected error:', error)
        return { error: error.message || 'An unexpected error occurred' }
    }
}

export async function createRentalAction(payload: any) {
    try {
        const { data, error } = await supabaseAdmin
            .from("rentals")
            .insert([payload])
            .select()
            .single()

        if (error) {
            console.error('[createRentalAction] Supabase error:', error)
            return { error: error.message }
        }

        return { success: true, data }
    } catch (error: any) {
        console.error('[createRentalAction] Unexpected error:', error)
        return { error: error.message || 'An unexpected error occurred' }
    }
}

export async function createDocumentAction(payload: any) {
    try {
        const { data, error } = await supabaseAdmin
            .from("documents")
            .insert([payload])
            .select()
            .single()

        if (error) {
            console.error('[createDocumentAction] Supabase error:', error)
            return { error: error.message }
        }

        return { success: true, data }
    } catch (error: any) {
        console.error('[createDocumentAction] Unexpected error:', error)
        return { error: error.message || 'An unexpected error occurred' }
    }
}

export async function deleteGeneralAction(table: string, id: string) {
    try {
        const { error } = await supabaseAdmin
            .from(table)
            .delete()
            .eq("id", id)

        if (error) {
            console.error(`[deleteGeneralAction] Error deleting from ${table}:`, error)
            return { error: error.message }
        }

        return { success: true }
    } catch (error: any) {
        console.error(`[deleteGeneralAction] Unexpected error deleting from ${table}:`, error)
        return { error: error.message || 'An unexpected error occurred' }
    }
}

export async function createMileageLogAction(payload: any) {
    try {
        const { data, error } = await supabaseAdmin
            .from("mileage_history")
            .insert([payload])
            .select()
            .single()

        if (error) {
            console.error('[createMileageLogAction] Supabase error:', error)
            return { error: error.message }
        }

        return { success: true, data }
    } catch (error: any) {
        console.error('[createMileageLogAction] Unexpected error:', error)
        return { error: error.message || 'An unexpected error occurred' }
    }
}
