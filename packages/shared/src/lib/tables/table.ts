import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../common'

export const Table = Type.Object({
    ...BaseModelSchema,
    name: Type.String(),
    projectId: Type.String(),
    externalId: Type.String(),
})

export type Table = Static<typeof Table>