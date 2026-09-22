import { ApId, BaseModelSchema, DateOrString, Metadata, Nullable } from '@activepieces/core-utils'
import { z } from 'zod'

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

export enum PiecesFilterType {
    NONE = 'NONE',
    ALLOWED = 'ALLOWED',
}

export enum ProjectType {
    TEAM = 'TEAM',
    PERSONAL = 'PERSONAL',
}

export const ProjectPlan = z.object({
    ...BaseModelSchema,
    projectId: z.string(),
    locked: z.boolean().default(false),
    name: z.string(),
    piecesFilterType: z.nativeEnum(PiecesFilterType),
    pieces: z.array(z.string()),
    activeFlowsLimit: Nullable(z.number()),
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
    notifyFlowOwnerOnFailure: z.boolean(),
    metadata: Nullable(Metadata),
    poolId: Nullable(ApId),
    pieceSetId: Nullable(ApId),
    workerGroupId: Nullable(z.string()),
    executionDataRetentionDays: Nullable(z.number()),
    sensitive: z.boolean(),
})

const projectAnalytics = z.object({
    totalUsers: z.number(),
    activeUsers: z.number(),
    totalFlows: z.number(),
    activeFlows: z.number(),
    lastFlowUpdated: Nullable(DateOrString),
})
export type Project = z.infer<typeof Project>

export const ProjectWithLimits = Project.omit({ deleted: true }).extend({
    plan: ProjectPlan,
    analytics: projectAnalytics,
})

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
        textColor: 'var(--swatch-4-on)',
        color: 'var(--swatch-4-mark)',
    },
    [ColorName.BLUE]: {
        textColor: 'var(--swatch-11-on)',
        color: 'var(--swatch-11-mark)',
    },
    [ColorName.YELLOW]: {
        textColor: 'var(--swatch-7-on)',
        color: 'var(--swatch-7-mark)',
    },
    [ColorName.PURPLE]: {
        textColor: 'var(--swatch-1-on)',
        color: 'var(--swatch-1-mark)',
    },
    [ColorName.GREEN]: {
        textColor: 'var(--swatch-8-on)',
        color: 'var(--swatch-8-mark)',
    },
    [ColorName.PINK]: {
        textColor: 'var(--swatch-3-on)',
        color: 'var(--swatch-3-mark)',
    },
    [ColorName.VIOLET]: {
        textColor: 'var(--swatch-2-on)',
        color: 'var(--swatch-2-mark)',
    },
    [ColorName.ORANGE]: {
        textColor: 'var(--swatch-6-on)',
        color: 'var(--swatch-6-mark)',
    },
    [ColorName.DARK_GREEN]: {
        textColor: 'var(--swatch-9-on)',
        color: 'var(--swatch-9-mark)',
    },
    [ColorName.CYAN]: {
        textColor: 'var(--swatch-10-on)',
        color: 'var(--swatch-10-mark)',
    },
    [ColorName.LAVENDER]: {
        textColor: 'var(--swatch-12-on)',
        color: 'var(--swatch-12-mark)',
    },
    [ColorName.DEEP_ORANGE]: {
        textColor: 'var(--swatch-5-on)',
        color: 'var(--swatch-5-mark)',
    },
}
