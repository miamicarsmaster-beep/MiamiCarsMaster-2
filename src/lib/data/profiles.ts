import { createClient } from '@/lib/supabase/server'
import { Profile } from '@/types/database'

export async function getProfiles(): Promise<Profile[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching profiles:', error)
        return []
    }

    return data || []
}

export async function getInvestors(): Promise<Profile[]> {
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        console.error('[getInvestors] Authentication failed:', authError)
        throw new Error('Authentication required to fetch investors')
    }

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'investor')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('[getInvestors] Database error:', error)
        throw new Error(`Failed to fetch investors: ${error.message}`)
    }

    console.log('[getInvestors] Successfully loaded', data?.length || 0, 'investors')
    return data || []
}

export async function getProfileById(id: string): Promise<Profile | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching profile:', error)
        return null
    }

    return data
}
