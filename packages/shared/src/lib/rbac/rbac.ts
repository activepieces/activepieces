import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../common'

export const Rbac = Type.Object({
    ...BaseModelSchema,
    name: Type.String(),
    permissions: Type.Array(Type.String()),
    platformId: Type.String(),
})

export type Rbac = Static<typeof Rbac>
