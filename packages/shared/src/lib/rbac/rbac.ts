import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../common'

export const Rbac = Type.Object({
    ...BaseModelSchema,
    name: Type.String(),
    permissions: Type.Array(Type.String()),
    platformId: Type.Optional(Type.String()),
    type: Type.String(),
    userCount: Type.Optional(Type.Number()),
})

export type Rbac = Static<typeof Rbac>
