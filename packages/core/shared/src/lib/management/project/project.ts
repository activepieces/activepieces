import { ApId, BaseModelSchema, DateOrString, Metadata, Nullable } from '@activepieces/core-utils'
import { z } from 'zod'

import { swatchUtils } from '../../core/common/swatch'

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

function projectColorFor(name: ColorName): ProjectColor {
    const vars = swatchUtils.varsFor({ index: PROJECT_COLOR_SWATCH[name] })
    return {
        color: vars.mark,
        textColor: vars.on,
    }
}

export const PROJECT_COLOR_SWATCH: Record<ColorName, number> = {
    [ColorName.PURPLE]: 0,
    [ColorName.VIOLET]: 1,
    [ColorName.PINK]: 2,
    [ColorName.RED]: 3,
    [ColorName.DEEP_ORANGE]: 4,
    [ColorName.ORANGE]: 4,
    [ColorName.YELLOW]: 5,
    [ColorName.GREEN]: 7,
    [ColorName.DARK_GREEN]: 8,
    [ColorName.CYAN]: 9,
    [ColorName.BLUE]: 10,
    [ColorName.LAVENDER]: 11,
}

export const PICKABLE_COLOR_NAMES: ColorName[] = Object.values(ColorName).filter(
    (name) => name !== ColorName.DEEP_ORANGE,
)

export const PROJECT_COLOR_PALETTE: Record<ColorName, ProjectColor> = {
    [ColorName.PURPLE]: projectColorFor(ColorName.PURPLE),
    [ColorName.VIOLET]: projectColorFor(ColorName.VIOLET),
    [ColorName.PINK]: projectColorFor(ColorName.PINK),
    [ColorName.RED]: projectColorFor(ColorName.RED),
    [ColorName.DEEP_ORANGE]: projectColorFor(ColorName.DEEP_ORANGE),
    [ColorName.ORANGE]: projectColorFor(ColorName.ORANGE),
    [ColorName.YELLOW]: projectColorFor(ColorName.YELLOW),
    [ColorName.GREEN]: projectColorFor(ColorName.GREEN),
    [ColorName.DARK_GREEN]: projectColorFor(ColorName.DARK_GREEN),
    [ColorName.CYAN]: projectColorFor(ColorName.CYAN),
    [ColorName.BLUE]: projectColorFor(ColorName.BLUE),
    [ColorName.LAVENDER]: projectColorFor(ColorName.LAVENDER),
}

