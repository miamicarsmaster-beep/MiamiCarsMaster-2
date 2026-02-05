import { createClient } from '@/lib/supabase/server'
import { FinancialRecord } from '@/types/database'
import { cache } from 'react'

export const getFinancialRecords = cache(async (): Promise<FinancialRecord[]> => {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('financial_records')
        .select(`
      *,
      vehicle:vehicles(id, make, model, year, license_plate)
    `)
        .order('date', { ascending: false })

    if (error) {
        console.error('Error fetching financial records:', error)
        return []
    }

    return data || []
})

export const getFinancialRecordsByVehicle = cache(async (vehicleId: string): Promise<FinancialRecord[]> => {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('financial_records')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('date', { ascending: false })

    if (error) {
        console.error('Error fetching vehicle financial records:', error)
        return []
    }

    return data || []
})
