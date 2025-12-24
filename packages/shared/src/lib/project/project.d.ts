import { Static } from '@sinclair/typebox';
import { ApId } from '../common/id-generator';
export declare enum ColorName {
    RED = "RED",
    BLUE = "BLUE",
    YELLOW = "YELLOW",
    PURPLE = "PURPLE",
    GREEN = "GREEN",
    PINK = "PINK",
    VIOLET = "VIOLET",
    ORANGE = "ORANGE",
    DARK_GREEN = "DARK_GREEN",
    CYAN = "CYAN",
    LAVENDER = "LAVENDER",
    DEEP_ORANGE = "DEEP_ORANGE"
}
export type ProjectId = ApId;
export declare enum PiecesFilterType {
    NONE = "NONE",
    ALLOWED = "ALLOWED"
}
export declare enum ProjectType {
    TEAM = "TEAM",
    PERSONAL = "PERSONAL"
}
export declare const SwitchProjectResponse: import("@sinclair/typebox").TObject<{
    token: import("@sinclair/typebox").TString;
}>;
export type SwitchProjectResponse = Static<typeof SwitchProjectResponse>;
export type ProjectPlanId = string;
export declare const ProjectPlan: import("@sinclair/typebox").TObject<{
    projectId: import("@sinclair/typebox").TString;
    locked: import("@sinclair/typebox").TBoolean;
    name: import("@sinclair/typebox").TString;
    piecesFilterType: import("@sinclair/typebox").TEnum<typeof PiecesFilterType>;
    pieces: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
    id: import("@sinclair/typebox").TString;
    created: import("@sinclair/typebox").TString;
    updated: import("@sinclair/typebox").TString;
}>;
export type ProjectPlan = Static<typeof ProjectPlan>;
export declare const ProjectIcon: import("@sinclair/typebox").TObject<{
    color: import("@sinclair/typebox").TEnum<typeof ColorName>;
}>;
export type ProjectIcon = Static<typeof ProjectIcon>;
export declare const Project: import("@sinclair/typebox").TObject<{
    deleted: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    ownerId: import("@sinclair/typebox").TString;
    displayName: import("@sinclair/typebox").TString;
    platformId: import("@sinclair/typebox").TString;
    maxConcurrentJobs: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<number>>;
    type: import("@sinclair/typebox").TEnum<typeof ProjectType>;
    icon: import("@sinclair/typebox").TObject<{
        color: import("@sinclair/typebox").TEnum<typeof ColorName>;
    }>;
    externalId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    releasesEnabled: import("@sinclair/typebox").TBoolean;
    metadata: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
        [x: string]: unknown;
    }>>;
    id: import("@sinclair/typebox").TString;
    created: import("@sinclair/typebox").TString;
    updated: import("@sinclair/typebox").TString;
}>;
export type Project = Static<typeof Project>;
export declare const ProjectWithLimits: import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TEnum<typeof ProjectType>;
    metadata: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
        [x: string]: unknown;
    }>>;
    displayName: import("@sinclair/typebox").TString;
    externalId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    id: import("@sinclair/typebox").TString;
    created: import("@sinclair/typebox").TString;
    updated: import("@sinclair/typebox").TString;
    ownerId: import("@sinclair/typebox").TString;
    platformId: import("@sinclair/typebox").TString;
    maxConcurrentJobs: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<number>>;
    icon: import("@sinclair/typebox").TObject<{
        color: import("@sinclair/typebox").TEnum<typeof ColorName>;
    }>;
    releasesEnabled: import("@sinclair/typebox").TBoolean;
    plan: import("@sinclair/typebox").TObject<{
        projectId: import("@sinclair/typebox").TString;
        locked: import("@sinclair/typebox").TBoolean;
        name: import("@sinclair/typebox").TString;
        piecesFilterType: import("@sinclair/typebox").TEnum<typeof PiecesFilterType>;
        pieces: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
        id: import("@sinclair/typebox").TString;
        created: import("@sinclair/typebox").TString;
        updated: import("@sinclair/typebox").TString;
    }>;
    analytics: import("@sinclair/typebox").TObject<{
        totalUsers: import("@sinclair/typebox").TNumber;
        activeUsers: import("@sinclair/typebox").TNumber;
        totalFlows: import("@sinclair/typebox").TNumber;
        activeFlows: import("@sinclair/typebox").TNumber;
    }>;
}>;
export declare const UpdateProjectRequestInCommunity: import("@sinclair/typebox").TObject<{
    displayName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    metadata: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>>;
}>;
export type UpdateProjectRequestInCommunity = Static<typeof UpdateProjectRequestInCommunity>;
export type ProjectWithLimits = Static<typeof ProjectWithLimits>;
export declare const ProjectMetaData: import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
    displayName: import("@sinclair/typebox").TString;
}>;
export type ProjectMetaData = Static<typeof ProjectMetaData>;
export declare const ProjectWithLimitsWithPlatform: import("@sinclair/typebox").TObject<{
    platformName: import("@sinclair/typebox").TString;
    projects: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TEnum<typeof ProjectType>;
        metadata: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
            [x: string]: unknown;
        }>>;
        displayName: import("@sinclair/typebox").TString;
        externalId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        id: import("@sinclair/typebox").TString;
        created: import("@sinclair/typebox").TString;
        updated: import("@sinclair/typebox").TString;
        ownerId: import("@sinclair/typebox").TString;
        platformId: import("@sinclair/typebox").TString;
        maxConcurrentJobs: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<number>>;
        icon: import("@sinclair/typebox").TObject<{
            color: import("@sinclair/typebox").TEnum<typeof ColorName>;
        }>;
        releasesEnabled: import("@sinclair/typebox").TBoolean;
        plan: import("@sinclair/typebox").TObject<{
            projectId: import("@sinclair/typebox").TString;
            locked: import("@sinclair/typebox").TBoolean;
            name: import("@sinclair/typebox").TString;
            piecesFilterType: import("@sinclair/typebox").TEnum<typeof PiecesFilterType>;
            pieces: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
            id: import("@sinclair/typebox").TString;
            created: import("@sinclair/typebox").TString;
            updated: import("@sinclair/typebox").TString;
        }>;
        analytics: import("@sinclair/typebox").TObject<{
            totalUsers: import("@sinclair/typebox").TNumber;
            activeUsers: import("@sinclair/typebox").TNumber;
            totalFlows: import("@sinclair/typebox").TNumber;
            activeFlows: import("@sinclair/typebox").TNumber;
        }>;
    }>>;
}>;
export type ProjectWithLimitsWithPlatform = Static<typeof ProjectWithLimitsWithPlatform>;
declare const ProjectColor: import("@sinclair/typebox").TObject<{
    textColor: import("@sinclair/typebox").TString;
    color: import("@sinclair/typebox").TString;
}>;
type ProjectColor = Static<typeof ProjectColor>;
export declare const PROJECT_COLOR_PALETTE: Record<ColorName, ProjectColor>;
export {};
