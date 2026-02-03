'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function checkUserStatus(email: string) {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Check Auth
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()
    if (authError) return { error: 'Auth Error: ' + authError.message }

    const user = users.find(u => u.email === email)

    if (!user) {
        return { status: 'not_found', message: 'User does not exist in Auth' }
    }

    // Check Profile
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    return {
        status: 'found',
        user: { ...user, phone: user.phone || '' }, // Ensure phone is string for serialization
        profile,
        profileError: profileError ? profileError.message : null
    }
}

export async function forceDeleteUser(email: string) {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Find user first
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const user = users.find(u => u.email === email)

    if (!user) {
        return { error: 'User not found' }
    }

    const { error } = await supabase.auth.admin.deleteUser(user.id)
    if (error) return { error: error.message }

    return { success: true }
}
