import { Static, Type } from '@sinclair/typebox'
import { STORE_KEY_MAX_LENGTH } from '../store-entry'

export const PutStoreEntryRequest = Type.Object({
    key: Type.String({
        maxLength: STORE_KEY_MAX_LENGTH,
    }),
    value: Type.Optional(Type.Any({})),
})

export type PutStoreEntryRequest = Static<typeof PutStoreEntryRequest>

export const GetStoreEntryRequest = Type.Object({
    key: Type.String({}),
})

export type GetStoreEntryRequest = Static<typeof GetStoreEntryRequest>

export const DeleteStoreEntryRequest = Type.Object({
    key: Type.String({}),
})

export type DeleteStoreEntryRequest = Static<typeof DeleteStoreEntryRequest>
