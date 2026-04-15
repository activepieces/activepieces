import { z } from 'zod'
import { SAFE_STRING_PATTERN } from '../../core/common'
import { BaseModelSchema, DateOrString, Nullable } from '../../core/common/base-model'
import { ApId } from '../../core/common/id-generator'
import { Metadata } from '../../core/common/metadata'

export enum ColorName {
    RED = 'RED',
    BLUE = 'BLUE',
    YELLOW = 'YELLOW',
    PURPLE = 'PURPLE',
    GREEN = 'GREEN',
    PINK = 'PINK',
    VIOLET = 'VIOLET',
    ORANGE = 'ORANGE',
    DARK_GREEN = 'DARK_GREEN',
    CYAN = 'CYAN',
    LAVENDER = 'LAVENDER',
    DEEP_ORANGE = 'DEEP_ORANGE',
}

export type ProjectId = ApId

export enum PiecesFilterType {
    NONE = 'NONE',
    ALLOWED = 'ALLOWED',
}

export enum ProjectType {
    TEAM = 'TEAM',
    PERSONAL = 'PERSONAL',
}



export type ProjectPlanId = string

export const ProjectPlan = z.object({
    ...BaseModelSchema,
    projectId: z.string(),
    locked: z.boolean().default(false),
    name: z.string(),
    piecesFilterType: z.nativeEnum(PiecesFilterType),
    pieces: z.array(z.string()),
})

export type ProjectPlan = z.infer<typeof ProjectPlan>

export const ProjectIcon = z.object({
    color: z.nativeEnum(ColorName),
})
export type ProjectIcon = z.infer<typeof ProjectIcon>

export const Project = z.object({
    ...BaseModelSchema,
    deleted: Nullable(DateOrString),
    ownerId: z.string(),
    displayName: z.string(),
    platformId: ApId,
    maxConcurrentJobs: Nullable(z.number()),
    type: z.nativeEnum(ProjectType),
    icon: ProjectIcon,
    externalId: Nullable(z.string()),
    releasesEnabled: z.boolean(),
    metadata: Nullable(Metadata),
    poolId: Nullable(ApId),
})

const projectAnalytics = z.object({
    totalUsers: z.number(),
    activeUsers: z.number(),
    totalFlows: z.number(),
    activeFlows: z.number(),
})
export type Project = z.infer<typeof Project>

export const ProjectWithLimits = Project.omit({ deleted: true }).extend({
    plan: ProjectPlan,
    analytics: projectAnalytics,
})

export const UpdateProjectRequestInCommunity = z.object({
    displayName: z.string().regex(new RegExp(SAFE_STRING_PATTERN)).optional(),
    metadata: Metadata.optional(),
})

export type UpdateProjectRequestInCommunity = z.infer<typeof UpdateProjectRequestInCommunity>

export type ProjectWithLimits = z.infer<typeof ProjectWithLimits>

export const ProjectMetaData = z.object({
    id: z.string(),
    displayName: z.string(),
})

export type ProjectMetaData = z.infer<typeof ProjectMetaData>

export const ProjectWithLimitsWithPlatform = z.object({
    platformName: z.string(),
    projects: z.array(ProjectWithLimits),
})

export type ProjectWithLimitsWithPlatform = z.infer<typeof ProjectWithLimitsWithPlatform>


const ProjectColor = z.object({
    textColor: z.string(),
    color: z.string(),
})
type ProjectColor = z.infer<typeof ProjectColor>

export const PROJECT_COLOR_PALETTE: Record<ColorName, ProjectColor> = {
    [ColorName.RED]: {
        textColor: '#ffffff',
        color: '#ef4444',
    },
    [ColorName.BLUE]: {
        textColor: '#ffffff',
        color: '#3b82f6',
    },
    [ColorName.YELLOW]: {
        textColor: '#ffffff',
        color: '#eab308',
    },
    [ColorName.PURPLE]: {
        textColor: '#ffffff',
        color: '#a855f7',
    },
    [ColorName.GREEN]: {
        textColor: '#ffffff',
        color: '#22c55e',
    },
    [ColorName.PINK]: {
        textColor: '#ffffff',
        color: '#f472b6',
    },
    [ColorName.VIOLET]: {
        textColor: '#ffffff',
        color: '#9333ea',
    },
    [ColorName.ORANGE]: {
        textColor: '#ffffff',
        color: '#f97316',
    },
    [ColorName.DARK_GREEN]: {
        textColor: '#ffffff',
        color: '#15803d',
    },
    [ColorName.CYAN]: {
        textColor: '#ffffff',
        color: '#06b6d4',
    },
    [ColorName.LAVENDER]: {
        textColor: '#ffffff',
        color: '#8b5cf6',
    },
    [ColorName.DEEP_ORANGE]: {
        textColor: '#ffffff',
        color: '#ea580c',
    },
}
