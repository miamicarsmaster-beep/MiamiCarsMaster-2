'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function createInvestor(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const country = formData.get('country') as string

    if (!email || !password || !firstName || !lastName || !country) {
        return { error: 'Please fill in all fields' }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })

    const { data: user, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            full_name: `${firstName} ${lastName}`,
            country: country,
            role: 'investor'
        }
    })

    if (error) {
        console.error('Error creating user:', error)
        return { error: error.message }
    }

    // If the trigger fails or isn't set up yet, we might want to manually insert into profiles
    // However, usually triggers handle this. If not, we can do it here.
    // But since we can't be sure about the trigger state, let's try to upsert profile just in case 
    // (though if trigger runs, this might be redundant or conflict if not handled carefully).
    // The trigger I wrote handles insert. If the column exists, it works.
    // If the column doesn't exist, the trigger will fail IF I updated the function.
    // If the function is old, it ignores country.
    // So let's try to update the profile with country manually after creation.

    if (user.user) {
        // Wait a small moment for trigger, but forces upsert to ensure consistency
        // This handles cases where trigger fails or trigger is slow
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: user.user.id,
                email: email,
                full_name: `${firstName} ${lastName}`,
                country: country,
                role: 'investor',
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' })

        if (profileError) {
            console.error('Error upserting profile:', profileError)
            return { error: 'User created but profile creation failed: ' + profileError.message }
        }
    }

    revalidatePath('/dashboard/admin/investors')
    return { success: true }
}
