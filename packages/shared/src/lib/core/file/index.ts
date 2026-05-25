import { z } from 'zod'
import { BaseModelSchema, Nullable } from '../common/base-model'
import { ApId } from '../common/id-generator'

export type FileId = ApId

export enum FileType {
    /**
     * Default; not written by any caller. Lets consumers fall back when a file's
     * type isn't recognized.
     */
    UNKNOWN = 'UNKNOWN',
    /**
     * Compressed (ZSTD) execution-log manifest for a single flow run.
     * Expires on the file-cleanup schedule.
     */
    FLOW_RUN_LOG = 'FLOW_RUN_LOG',
    /**
     * One step output (or loop-iteration bundle) sliced out of a flow-run-log manifest
     * when it exceeds AP_FLOW_RUN_LOG_SLICE_THRESHOLD_KB.
     */
    FLOW_RUN_LOG_SLICE = 'FLOW_RUN_LOG_SLICE',
    /**
     * Tarball of a custom piece's source, downloaded and extracted by the worker
     * to load piece code. Stored in DB, kept indefinitely.
     */
    PACKAGE_ARCHIVE = 'PACKAGE_ARCHIVE',
    /**
     * File produced or referenced by a flow step at runtime (e.g. a step's
     * attachment output). Expires on the file-cleanup schedule.
     */
    FLOW_STEP_FILE = 'FLOW_STEP_FILE',
    /**
     * Saved sample output for a step, captured during test runs and reused in
     * the builder. Kept indefinitely.
     */
    SAMPLE_DATA = 'SAMPLE_DATA',
    /*
    @deprecated activepieces no longer stores trigger payload
    */
    TRIGGER_PAYLOAD = 'TRIGGER_PAYLOAD',
    /**
     * Saved sample input for a step, paired with SAMPLE_DATA so a step can be
     * re-tested in isolation. Kept indefinitely.
     */
    SAMPLE_DATA_INPUT = 'SAMPLE_DATA_INPUT',
    /**
     * Serialized payload of a captured trigger event used to populate the
     * trigger sample-data UI. Expires on the file-cleanup schedule.
     */
    TRIGGER_EVENT_FILE = 'TRIGGER_EVENT_FILE',
    /**
     * Snapshot of a project's flows/connections/tables for release versioning
     * and rollback. Kept indefinitely.
     */
    PROJECT_RELEASE = 'PROJECT_RELEASE',
    /**
     * Snapshot of a single flow version's schema for migration/rollback.
     * Kept indefinitely.
     */
    FLOW_VERSION_BACKUP = 'FLOW_VERSION_BACKUP',

    /**
     * Platform public assets, like logos, should be stored in the database.
     */
    PLATFORM_ASSET = 'PLATFORM_ASSET',
    /**
     * User profile pictures, should be stored in the database.
     */
    USER_PROFILE_PICTURE = 'USER_PROFILE_PICTURE',
    /**
     * Large webhook payloads offloaded from Redis to file storage.
     */
    WEBHOOK_PAYLOAD = 'WEBHOOK_PAYLOAD',
    /**
     * Files uploaded for knowledge base ingestion.
     */
    KNOWLEDGE_BASE = 'KNOWLEDGE_BASE',
}
export enum FileCompression {
    NONE = 'NONE',
    ZSTD = 'ZSTD',
}

export const CONTENT_ENCODING_ZSTD = 'zstd'

const ZSTD_MAGIC = 0xFD2FB528
const ZSTD_SKIPPABLE_START = 0x184D2A50
const ZSTD_SKIPPABLE_END = 0x184D2A5F

// @TODO: remove after 30 days
export const isZstdCompressed = (data: Buffer | Uint8Array): boolean => {
    if (data.length < 4) return false
    const magic = (data[0] | (data[1] << 8) | (data[2] << 16) | (data[3] << 24)) >>> 0
    return magic === ZSTD_MAGIC || (magic >= ZSTD_SKIPPABLE_START && magic <= ZSTD_SKIPPABLE_END)
}

export enum FileLocation {
    S3 = 'S3',
    DB = 'DB',
}

export const File = z.object({
    ...BaseModelSchema,
    projectId: Nullable(z.string()),
    platformId: Nullable(z.string()),
    type: z.nativeEnum(FileType),
    compression: z.nativeEnum(FileCompression),
    data: z.unknown().optional(),
    location: z.nativeEnum(FileLocation),
    size: Nullable(z.number()),
    fileName: Nullable(z.string()),
    s3Key: Nullable(z.string()),
    metadata: Nullable(z.record(z.string(), z.string())),
})

export type File = z.infer<typeof File> & {
    data: Buffer
}
