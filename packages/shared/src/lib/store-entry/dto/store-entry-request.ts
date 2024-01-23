import { Static, Type } from '@sinclair/typebox'

export const PutStoreEntryRequest = Type.Object({
    key: Type.String({}),
    value: Type.Any({}),
})

export type PutStoreEntryRequest = Static<typeof PutStoreEntryRequest>

export const GetStoreEntryRequest = Type.Object({
    key: Type.String({}),
})

export type GetStoreEntryRequest = Static<typeof GetStoreEntryRequest>

export const DeletStoreEntryRequest = Type.Object({
    key: Type.String({}),
})

export type DeletStoreEntryRequest = Static<typeof DeletStoreEntryRequest>
