import { Static, Type } from '@sinclair/typebox'
import { SAFE_STRING_PATTERN } from '../common'
import { ApId } from '../common/id-generator'

export const CreateRbacRequestBody = Type.Object({
    name: Type.String({
        pattern: SAFE_STRING_PATTERN,
    }),
    permissions: Type.Array(Type.String()),
    platformId: ApId,
})

export type CreateRbacRequestBody = Static<typeof CreateRbacRequestBody>

export const UpdateRbacRequestBody = Type.Object({
    name: Type.Optional(Type.String({
        pattern: SAFE_STRING_PATTERN,
    })),
    permissions: Type.Optional(Type.Array(Type.String())),
})

export type UpdateRbacRequestBody = Static<typeof UpdateRbacRequestBody>
