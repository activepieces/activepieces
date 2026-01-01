import { Static, Type } from '@sinclair/typebox'

export const GetSystemHealthChecksResponse = Type.Object({
    cpu: Type.Boolean(),
    disk: Type.Boolean(),
    ram: Type.Boolean(),
})

export type GetSystemHealthChecksResponse = Static<typeof GetSystemHealthChecksResponse>