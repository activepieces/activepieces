import { z } from 'zod'

export const AcceptInvitationRequest = z.object({
    token: z.string(),
})
export type AcceptInvitationRequest = z.infer<typeof AcceptInvitationRequest>

export const ListProjectMembersRequestQuery = z.object({
    projectId: z.string(),
    projectRoleId: z.string().optional(),
    cursor: z.string().optional(),
    limit: z.coerce.number().optional(),
})

export type ListProjectMembersRequestQuery = z.infer<typeof ListProjectMembersRequestQuery>

export const AcceptProjectResponse = z.object({
    registered: z.boolean(),
})

export type AcceptProjectResponse = z.infer<typeof AcceptProjectResponse>


export const UpdateProjectMemberRoleRequestBody = z.object({
    role: z.string(),
})

export type UpdateProjectMemberRoleRequestBody = z.infer<typeof UpdateProjectMemberRoleRequestBody>

export const GetCurrentProjectMemberRoleQuery = z.object({
    projectId: z.string(),
})

export type GetCurrentProjectMemberRoleQuery = z.infer<typeof GetCurrentProjectMemberRoleQuery>
