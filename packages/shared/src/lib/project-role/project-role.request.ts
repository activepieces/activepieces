import { Static, Type } from '@sinclair/typebox'
import { RoleType, SAFE_STRING_PATTERN } from '../common'
import { ApId } from '../common/id-generator'

export const CreateProjectRoleRequestBody = Type.Object({
    name: Type.String({
        pattern: SAFE_STRING_PATTERN,
    }),
    permissions: Type.Array(Type.String()),
    platformId: ApId,
    type: Type.Enum(RoleType),
})

export type CreateProjectRoleRequestBody = Static<typeof CreateProjectRoleRequestBody>

export const UpdateProjectRoleRequestBody = Type.Object({
    name: Type.Optional(Type.String({
        pattern: SAFE_STRING_PATTERN,
    })),
    permissions: Type.Optional(Type.Array(Type.String())),
})

export type UpdateProjectRoleRequestBody = Static<typeof UpdateProjectRoleRequestBody>

export const ChangeProjectRoleRequestBody = Type.Object({
    memberId: ApId,
    platformId: ApId,
    role: Type.String(),
})

export type ChangeProjectRoleRequestBody = Static<typeof ChangeProjectRoleRequestBody>
