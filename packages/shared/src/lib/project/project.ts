import { Static, Type } from '@sinclair/typebox'
import { SAFE_STRING_PATTERN } from '../common'
import { BaseModelSchema, Nullable } from '../common/base-model'
import { ApId } from '../common/id-generator'
import { Metadata } from '../common/metadata'

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

export const ProjectPlan = Type.Object({
    ...BaseModelSchema,
    projectId: Type.String(),
    locked: Type.Boolean({ default: false }),
    name: Type.String(),
    piecesFilterType: Type.Enum(PiecesFilterType),
    pieces: Type.Array(Type.String()),
})

export type ProjectPlan = Static<typeof ProjectPlan>

export const ProjectIcon = Type.Object({
    color: Type.Enum(ColorName),
})
export type ProjectIcon = Static<typeof ProjectIcon>

export const Project = Type.Object({
    ...BaseModelSchema,
    deleted: Nullable(Type.String()),
    ownerId: Type.String(),
    displayName: Type.String(),
    platformId: ApId,
    maxConcurrentJobs: Nullable(Type.Number()),
    type: Type.Enum(ProjectType),
    icon: ProjectIcon,
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


const ProjectColor = Type.Object({
    textColor: Type.String(),
    color: Type.String(),
})
type ProjectColor = Static<typeof ProjectColor>

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