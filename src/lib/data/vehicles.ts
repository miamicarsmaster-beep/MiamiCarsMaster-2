import { createClient } from '@/lib/supabase/server'
import { Vehicle } from '@/types/database'
import { cache } from 'react'

export const getVehicles = cache(async (): Promise<Vehicle[]> => {
    const supabase = await createClient()

    // Auth is handled by middleware - this function is only called from protected routes
    const { data, error } = await supabase
        .from('vehicles')
        .select(`
      *,
      assigned_investor:profiles!assigned_investor_id(id, full_name, email)
    `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('[getVehicles] Database error:', error)
        throw new Error(`Failed to fetch vehicles: ${error.message}`)
    }

    console.log('[getVehicles] Successfully loaded', data?.length || 0, 'vehicles')
    return data || []
})

export const getVehicleById = cache(async (id: string): Promise<Vehicle | null> => {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('vehicles')
        .select(`
      *,
      assigned_investor:profiles!assigned_investor_id(id, full_name, email)
    `)
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching vehicle:', error)
        return null
    }

    return data
})

export const getVehiclesByInvestor = cache(async (investorId: string): Promise<Vehicle[]> => {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('assigned_investor_id', investorId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching investor vehicles:', error)
        return []
    }

    return data || []
})
