"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateROISettings(settings: {
    default_occupancy_days: number,
    default_management_fee: number,
    apply_default_fee: boolean,
    default_fee_type: 'percentage' | 'fixed',
    default_fixed_amount: number
}) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('system_settings')
        .upsert({
            id: 'roi_settings',
            value: settings,
            updated_at: new Date().toISOString()
        })

    if (error) {
        console.error('Error updating ROI settings:', error)
        return { error: 'No se pudieron actualizar los ajustes.' }
    }

    revalidatePath('/dashboard/admin/roi-control')
    return { success: true }
}

export async function getROISettings() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('id', 'roi_settings')
        .single()

    if (error) {
        return {
            default_occupancy_days: 240,
            default_management_fee: 20,
            apply_default_fee: true,
            default_fee_type: 'percentage' as const,
            default_fixed_amount: 0
        }
    }

    const value = data.value as any
    return {
        default_occupancy_days: value.default_occupancy_days ?? 240,
        default_management_fee: value.default_management_fee ?? 20,
        apply_default_fee: value.apply_default_fee ?? true,
        default_fee_type: (value.default_fee_type as 'percentage' | 'fixed') ?? 'percentage',
        default_fixed_amount: value.default_fixed_amount ?? 0
    }
}
