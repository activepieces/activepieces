import { z } from 'zod'
import { STORE_KEY_MAX_LENGTH } from '../store-entry'

export const PutStoreEntryRequest = z.object({
    key: z.string().max(STORE_KEY_MAX_LENGTH),
    value: z.any().optional(),
})

export type PutStoreEntryRequest = z.infer<typeof PutStoreEntryRequest>

export const GetStoreEntryRequest = z.object({
    key: z.string(),
})

export type GetStoreEntryRequest = z.infer<typeof GetStoreEntryRequest>

export const DeleteStoreEntryRequest = z.object({
    key: z.string(),
})

export type DeleteStoreEntryRequest = z.infer<typeof DeleteStoreEntryRequest>
