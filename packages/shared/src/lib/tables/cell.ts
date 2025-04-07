import { Static, Type } from '@sinclair/typebox'

export const Cell = Type.Object({
    created: Type.String(),
    updated: Type.String(),
    recordId: Type.String(),
    fieldId: Type.String(),
    projectId: Type.String(),
    value: Type.String(),
})

export type Cell = Static<typeof Cell>
