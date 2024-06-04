import { randomUUID } from 'crypto'
import { PostgrestSingleResponse } from '@supabase/supabase-js'
import { emailSender } from '../helper/email/email-sender/email-sender'
import { getSupabaseClient, initialiseSupabaseClient } from './supabase-client'
import { logger, system, SystemProp } from '@activepieces/server-shared'
import { ActivationKeyEntity, ActivepiecesError,  ErrorCode } from '@activepieces/shared'


export const activationKeysService = {
    async init(): Promise<void> {
        system.get(SystemProp.SUPABASE_API_KEY)
        
        const supabaseUrl = system.get(SystemProp.SUPABASE_URL)
        const supabaseKey = system.get(SystemProp.SUPABASE_API_KEY)
        logger.debug(supabaseKey)
        logger.debug(supabaseUrl)
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase client failed to initialise')
        }
        initialiseSupabaseClient({
            url: supabaseUrl,
            key: supabaseKey,
        })
       
    },
    async activateKey(key: string): Promise<ActivationKeyEntity> {
        const keyRow = await getKeyRow(key)
        if (keyRow.activated_at) {
            throw new ActivepiecesError({
                code: ErrorCode.ACTIVATION_KEY_ALREADY_ACTIVATED,
                params: {
                    key,
                },
            })
        }
        const { data, error } = await getSupabaseClient()
            .from('keys')
            .update({ activated_at: new Date(), expires_at: getExpirationDate() })
            .eq('key', key)
            .select()

        if (error) {
            logger.error(error)
            throw new Error(JSON.stringify(error))
        }
        if (data.length < 1) {
            throw new Error(JSON.stringify( {
                message: 'No key was updated when trying to activate key',
                key,
            }))
        }
        return data[0]
    },

    async createKey(email: string): Promise<ActivationKeyEntity> {
        const emailPreviousKey = await getKeyByEmail(email)
        if (emailPreviousKey) {
            throw new ActivepiecesError({
                code: ErrorCode.EMAIL_ALREADY_HAS_ACTIVATION_KEY,
                params: {
                    email,
                },
            })
        }
        const key =  randomUUID().toString()
        const { data, error } = await getSupabaseClient()
            .from('keys')
            .insert([
                { email, key },
            ])
            .select()
        if (error) {
            logger.error(error)
            throw new Error(JSON.stringify(error))
        }
        if (!data) {
            logger.error(error)
            throw new Error(JSON.stringify({
                message: 'No data was returned when trying to create key',
            }))
        }
        await emailSender.send({
            emails: [email],
            platformId: undefined,
            templateData: {
                name: 'activation-key-email',
                vars: {
                    key: data[0].key,
                },
            },
        })
        return data[0]
    },
    async getKeyRow(key: string): Promise<ActivationKeyEntity> {
        const keyRow = await getKeyRow(key)
        return keyRow
    },
}

const getExpirationDate: () => Date = () =>{
    const now = new Date()
    now.setDate(now.getDate() + 14)
    return now
}
const getKeyRow: (key: string) => Promise<ActivationKeyEntity> = async (key: string) => {
    const res: PostgrestSingleResponse<ActivationKeyEntity[]> = await getSupabaseClient()
        .from('keys')
        .select('*')
        .eq('key', key)
    if (res.error) {
        logger.error(res.error)
        throw new Error(JSON.stringify(res.error))
    }

    if (!res.data || res.data.length < 1) {
        throw new ActivepiecesError({
            code: ErrorCode.ACTIVATION_KEY_NOT_FOUND,
            params: {
                key,
            },
        })
    }
    return res.data[0]
  
}

const getKeyByEmail: (email: string) => Promise<ActivationKeyEntity | null> = async (email: string) => {
    const res: PostgrestSingleResponse<ActivationKeyEntity[]> = await getSupabaseClient()
        .from('keys')
        .select('*')
        .eq('email', email)
    if (res.error) {
        logger.error(res.error)
        throw new Error(JSON.stringify(res.error))
    }   
    if (res.data && res.data.length > 0) {
        return res.data[0]
    }
    return null
  
}