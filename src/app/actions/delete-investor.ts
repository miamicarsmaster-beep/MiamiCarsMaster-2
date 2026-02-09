'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function deleteInvestor(userId: string) {
    if (!userId) {
        return { error: 'User ID is required' }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })

    // 1. Unassign vehicles first to avoid FK issues
    try {
        const { error: updateError } = await supabase
            .from('vehicles')
            .update({ assigned_investor_id: null })
            .eq('assigned_investor_id', userId)

        if (updateError) {
            console.error('Error unassigning vehicles:', updateError)
        }
    } catch (e) {
        console.error('Exception unassigning vehicles:', e)
    }

    // 2. Delete user from auth (this should trigger profile deletion if cascade is set)
    const { error } = await supabase.auth.admin.deleteUser(userId)

    if (error) {
        console.error('Error deleting user:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard/admin/investors')
    return { success: true }
}
