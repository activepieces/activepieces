import { ApId, BaseModelSchema, DateOrString, Nullable } from '@activepieces/core-utils'
import * as z from 'zod/mini'
import { PackageType, PieceType } from './piece'
import { TriggerStrategy } from './trigger'

// Contracts that the execution layer (@activepieces/core-execution) and the engine
// need from @activepieces/shared. Hosted here (the piece-types contract package) so
// the engine can name them without importing shared. See SRE-163.

// ── store-entry ────────────────────────────────────────────────────────────
export const STORE_KEY_MAX_LENGTH = 128

// ── piece version patterns ─────────────────────────────────────────────────
export const EXACT_VERSION_PATTERN = '^[0-9]+\\.[0-9]+\\.[0-9]+$'
export const EXACT_VERSION_REGEX = new RegExp(EXACT_VERSION_PATTERN)
const VERSION_PATTERN = '^([~^])?[0-9]+\\.[0-9]+\\.[0-9]+$'

export const ExactVersionType = z.string().check(z.regex(new RegExp(EXACT_VERSION_PATTERN)))
export const VersionType = z.string().check(z.regex(new RegExp(VERSION_PATTERN)))

// ── piece package ──────────────────────────────────────────────────────────
export const PrivatePiecePackage = z.object({
    packageType: z.literal(PackageType.ARCHIVE),
    pieceType: z.enum(PieceType),
    pieceName: z.string(),
    pieceVersion: z.string(),
    archiveId: z.string(),
    platformId: z.string(),
})
export type PrivatePiecePackage = z.infer<typeof PrivatePiecePackage>

export const OfficialPiecePackage = z.object({
    packageType: z.literal(PackageType.REGISTRY),
    pieceType: z.literal(PieceType.OFFICIAL),
    pieceName: z.string(),
    pieceVersion: z.string(),
})
export type OfficialPiecePackage = z.infer<typeof OfficialPiecePackage>

export const CustomNpmPiecePackage = z.object({
    packageType: z.literal(PackageType.REGISTRY),
    pieceType: z.literal(PieceType.CUSTOM),
    pieceName: z.string(),
    pieceVersion: z.string(),
    platformId: z.string(),
})
export type CustomNpmPiecePackage = z.infer<typeof CustomNpmPiecePackage>

export const PublicPiecePackage = z.union([OfficialPiecePackage, CustomNpmPiecePackage])
export type PublicPiecePackage = OfficialPiecePackage | CustomNpmPiecePackage

export const PiecePackage = z.union([PrivatePiecePackage, OfficialPiecePackage, CustomNpmPiecePackage])
export type PiecePackage = PrivatePiecePackage | OfficialPiecePackage | CustomNpmPiecePackage

// ── trigger source / schedule ──────────────────────────────────────────────
export enum TriggerSourceScheduleType {
    CRON_EXPRESSION = 'CRON_EXPRESSION',
}

export const ScheduleOptions = z.object({
    type: z.enum(TriggerSourceScheduleType),
    cronExpression: z.string(),
    timezone: z.string(),
})
export type ScheduleOptions = z.infer<typeof ScheduleOptions>

export const TriggerSource = z.object({
    ...BaseModelSchema,
    type: z.enum(TriggerStrategy),
    projectId: z.string(),
    flowId: z.string(),
    triggerName: z.string(),
    schedule: Nullable(ScheduleOptions),
    flowVersionId: z.string(),
    pieceName: z.string(),
    pieceVersion: z.string(),
    deleted: Nullable(z.string()),
    simulate: z.boolean(),
})
export type TriggerSource = z.infer<typeof TriggerSource>

// ── file ───────────────────────────────────────────────────────────────────
export type FileId = ApId

export enum FileType {
    UNKNOWN = 'UNKNOWN',
    FLOW_RUN_LOG = 'FLOW_RUN_LOG',
    FLOW_RUN_LOG_SLICE = 'FLOW_RUN_LOG_SLICE',
    PACKAGE_ARCHIVE = 'PACKAGE_ARCHIVE',
    FLOW_STEP_FILE = 'FLOW_STEP_FILE',
    SAMPLE_DATA = 'SAMPLE_DATA',
    TRIGGER_PAYLOAD = 'TRIGGER_PAYLOAD',
    SAMPLE_DATA_INPUT = 'SAMPLE_DATA_INPUT',
    TRIGGER_EVENT_FILE = 'TRIGGER_EVENT_FILE',
    PROJECT_RELEASE = 'PROJECT_RELEASE',
    FLOW_VERSION_BACKUP = 'FLOW_VERSION_BACKUP',
    PLATFORM_ASSET = 'PLATFORM_ASSET',
    USER_PROFILE_PICTURE = 'USER_PROFILE_PICTURE',
    WEBHOOK_PAYLOAD = 'WEBHOOK_PAYLOAD',
    KNOWLEDGE_BASE = 'KNOWLEDGE_BASE',
}

export enum FileCompression {
    NONE = 'NONE',
    ZSTD = 'ZSTD',
}

export enum FileLocation {
    S3 = 'S3',
    DB = 'DB',
}

export const File = z.object({
    ...BaseModelSchema,
    projectId: Nullable(z.string()),
    platformId: Nullable(z.string()),
    type: z.enum(FileType),
    compression: z.enum(FileCompression),
    data: z.optional(z.unknown()),
    location: z.enum(FileLocation),
    size: Nullable(z.number()),
    fileName: Nullable(z.string()),
    s3Key: Nullable(z.string()),
    metadata: Nullable(z.record(z.string(), z.string())),
})
export type File = z.infer<typeof File> & {
    data: Buffer
}

// ── user (meta) ────────────────────────────────────────────────────────────
export enum PlatformRole {
    ADMIN = 'ADMIN',
    MEMBER = 'MEMBER',
    OPERATOR = 'OPERATOR',
}

export enum UserStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
}

export const UserWithMetaInformation = z.object({
    id: z.string(),
    email: z.string(),
    firstName: z.string(),
    status: z.enum(UserStatus),
    externalId: Nullable(z.string()),
    platformId: Nullable(z.string()),
    platformRole: z.enum(PlatformRole),
    lastName: z.string(),
    created: DateOrString,
    updated: DateOrString,
    lastActiveDate: Nullable(DateOrString),
    imageUrl: Nullable(z.string()),
})
export type UserWithMetaInformation = z.infer<typeof UserWithMetaInformation>
