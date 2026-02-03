'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function resetPassword(userId: string, newPassword: string) {
    if (!userId || !newPassword) {
        return { error: 'User ID and new password are required' }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })

    const { error } = await supabase.auth.admin.updateUserById(
        userId,
        { password: newPassword }
    )

    if (error) {
        console.error('Error resetting password:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard/admin/investors')
    return { success: true }
}
