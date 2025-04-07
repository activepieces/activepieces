import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../common'

export const Cell = Type.Object({
    ...BaseModelSchema,
    recordId: Type.String(),
    fieldId: Type.String(),
    projectId: Type.String(),
    value: Type.Unknown(),
})

export type Cell = Static<typeof Cell>
