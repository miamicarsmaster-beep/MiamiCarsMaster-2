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

    const { error } = await supabase.auth.admin.deleteUser(userId)

    if (error) {
        console.error('Error deleting user:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard/admin/investors')
    return { success: true }
}
