import { Static, Type } from '@sinclair/typebox'
import { SAFE_STRING_PATTERN } from '../common'
import { BaseModelSchema, Nullable } from '../common/base-model'
import { ApId } from '../common/id-generator'
import { Metadata } from '../common/metadata'

export const ListProjectRequestForUserQueryParams = Type.Object({
    cursor: Type.Optional(Type.String()),
    limit: Type.Optional(Type.Number()),
    displayName: Type.Optional(Type.String()),
})

export type ListProjectRequestForUserQueryParams = Static<typeof ListProjectRequestForUserQueryParams>

export type ProjectId = ApId

export enum PiecesFilterType {
    NONE = 'NONE',
    ALLOWED = 'ALLOWED',
}

export const ProjectUsage = Type.Object({
    tasks: Type.Number(),
    aiCredits: Type.Number(),
    nextLimitResetDate: Type.Number(),
})

export const SwitchProjectResponse = Type.Object({
    token: Type.String(),
})

export type SwitchProjectResponse = Static<typeof SwitchProjectResponse>

export type ProjectUsage = Static<typeof ProjectUsage>

export type ProjectPlanId = string

export const ProjectPlan = Type.Object({
    ...BaseModelSchema,
    projectId: Type.String(),
    locked: Type.Boolean({ default: false }),
    name: Type.String(),
    piecesFilterType: Type.Enum(PiecesFilterType),
    pieces: Type.Array(Type.String()),
    tasks: Nullable(Type.Number()),
    aiCredits: Nullable(Type.Number()),
})

export type ProjectPlan = Static<typeof ProjectPlan>

export const Project = Type.Object({
    ...BaseModelSchema,
    deleted: Nullable(Type.String()),
    ownerId: Type.String(),
    displayName: Type.String(),
    platformId: ApId,
    externalId: Type.Optional(Type.String()),
    releasesEnabled: Type.Boolean(),
    metadata: Nullable(Metadata),
})

const projectAnalytics = Type.Object(
    {
        totalUsers: Type.Number(),
        activeUsers: Type.Number(),
        totalFlows: Type.Number(),
        activeFlows: Type.Number(),
    },
)
export type Project = Static<typeof Project>

export const ProjectWithLimits = Type.Composite([
    Type.Omit(Project, ['deleted']),
    Type.Object({
        usage: ProjectUsage,
        plan: ProjectPlan,
        analytics: projectAnalytics,
    }),

])

export const UpdateProjectRequestInCommunity = Type.Object({
    displayName: Type.Optional(Type.String({
        pattern: SAFE_STRING_PATTERN,
    })),
    metadata: Type.Optional(Metadata),
})

export type UpdateProjectRequestInCommunity = Static<typeof UpdateProjectRequestInCommunity>

export type ProjectWithLimits = Static<typeof ProjectWithLimits>

export const ProjectMetaData = Type.Object({
    id: Type.String(),
    displayName: Type.String(),
})

export type ProjectMetaData = Static<typeof ProjectMetaData>

export const ProjectWithLimitsWithPlatform = Type.Object({
    platformName: Type.String(),
    projects: Type.Array(ProjectWithLimits),
})

export type ProjectWithLimitsWithPlatform = Static<typeof ProjectWithLimitsWithPlatform>
