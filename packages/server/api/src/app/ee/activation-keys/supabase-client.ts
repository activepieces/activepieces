import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null
export const initialiseSupabaseClient = ({ url, key }: { url: string, key: string }): SupabaseClient => {
    if (!supabaseClient) {
        supabaseClient = createClient(url, key)
    }
    else {
        throw new Error('Supabase client already initialised')
    }
    return supabaseClient
}

export const getSupabaseClient = (): SupabaseClient => {
    if (!supabaseClient) {
        throw new Error('Trying to acces Supabase client when it was not initialised')
    }
    return supabaseClient
}

