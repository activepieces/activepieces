import { z } from 'zod'
import { RoleType, SAFE_STRING_PATTERN } from '../../core/common'

export const CreateProjectRoleRequestBody = z.object({
    name: z.string().regex(new RegExp(SAFE_STRING_PATTERN)),
    permissions: z.array(z.string()),
    type: z.nativeEnum(RoleType),
})

export type CreateProjectRoleRequestBody = z.infer<typeof CreateProjectRoleRequestBody>

export const UpdateProjectRoleRequestBody = z.object({
    name: z.string().regex(new RegExp(SAFE_STRING_PATTERN)).optional(),
    permissions: z.array(z.string()).optional(),
})

export type UpdateProjectRoleRequestBody = z.infer<typeof UpdateProjectRoleRequestBody>

export const ListProjectMembersForProjectRoleRequestQuery = z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().optional(),
})

export type ListProjectMembersForProjectRoleRequestQuery = z.infer<typeof ListProjectMembersForProjectRoleRequestQuery>
