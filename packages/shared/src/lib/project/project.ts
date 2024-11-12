import { Static, Type } from '@sinclair/typebox'
import { SAFE_STRING_PATTERN } from '../common'
import { BaseModelSchema, Nullable } from '../common/base-model'
import { ApId } from '../common/id-generator'
import { ProjectMemberRole } from './project-member'

export const ListProjectRequestForUserQueryParams = Type.Object({
    cursor: Type.Optional(Type.String()),
    limit: Type.Optional(Type.Number()),
})

export type ListProjectRequestForUserQueryParams = Static<typeof ListProjectRequestForUserQueryParams>

export type ProjectId = ApId

export enum PiecesFilterType {
    NONE = 'NONE',
    ALLOWED = 'ALLOWED',
}

export enum NotificationStatus {
    NEVER = 'NEVER',
    ALWAYS = 'ALWAYS',
    NEW_ISSUE = 'NEW_ISSUE',
}

export const ProjectUsage = Type.Object({
    tasks: Type.Number(),
    teamMembers: Type.Number(),
    aiTokens: Type.Number(),
})

export const SwitchProjectResponse = Type.Object({
    token: Type.String(),
    projectRole: Type.Union([Type.Enum(ProjectMemberRole), Type.Null()]),
})

export type SwitchProjectResponse = Static<typeof SwitchProjectResponse>

export type ProjectUsage = Static<typeof ProjectUsage>

export type ProjectPlanId = string

export const ProjectPlan = Type.Object({
    ...BaseModelSchema,
    projectId: Type.String(),
    name: Type.String(),
    minimumPollingInterval: Type.Number(),
    piecesFilterType: Type.Enum(PiecesFilterType),
    pieces: Type.Array(Type.String()),
    connections: Type.Number(),
    teamMembers: Type.Number(),
    tasks: Type.Number(),
    aiTokens: Type.Number(),
})

export type ProjectPlan = Static<typeof ProjectPlan>


export const Project = Type.Object({
    ...BaseModelSchema,
    deleted: Nullable(Type.String()),
    ownerId: Type.String(),
    displayName: Type.String(),
    notifyStatus: Type.Enum(NotificationStatus),
    platformId: ApId,
    externalId: Type.Optional(Type.String()),
})

export type Project = Static<typeof Project>

export const ProjectWithLimits = Type.Composite([
    Type.Omit(Project, ['deleted']),
    Type.Object({
        usage: ProjectUsage,
        plan: ProjectPlan,
    }),

])

export const UpdateProjectRequestInCommunity = Type.Object({
    notifyStatus: Type.Optional(Type.Enum(NotificationStatus)),
    displayName: Type.Optional(Type.String({
        pattern: SAFE_STRING_PATTERN,
    })),
})

export type UpdateProjectRequestInCommunity = Static<typeof UpdateProjectRequestInCommunity>

export type ProjectWithLimits = Static<typeof ProjectWithLimits>
