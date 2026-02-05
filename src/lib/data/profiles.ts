import { createClient } from '@/lib/supabase/server'
import { Profile } from '@/types/database'
import { cache } from 'react'

export const getProfiles = cache(async (): Promise<Profile[]> => {
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
})

export const getInvestors = cache(async (): Promise<Profile[]> => {
    const supabase = await createClient()

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
})

export const getProfileById = cache(async (id: string): Promise<Profile | null> => {
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
})
