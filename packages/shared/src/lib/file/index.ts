import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../common/base-model'
import { ApId } from '../common/id-generator'

export type FileId = ApId

export enum FileType {
    UNKNOWN = 'UNKNOWN',
    FLOW_RUN_LOG = 'FLOW_RUN_LOG',
    PACKAGE_ARCHIVE = 'PACKAGE_ARCHIVE',
    FLOW_STEP_FILE = 'FLOW_STEP_FILE',
    SAMPLE_DATA = 'SAMPLE_DATA',
    TRIGGER_EVENT_FILE = 'TRIGGER_EVENT_FILE',
}
export enum FileCompression {
    NONE = 'NONE',
    GZIP = 'GZIP',
}

export enum FileLocation {
    S3 = 'S3',
    DB = 'DB',
}

export const File = Type.Object({
    ...BaseModelSchema,
    projectId: Type.Optional(Type.String()),
    platformId: Type.Optional(Type.String()),
    type: Type.Enum(FileType),
    compression: Type.Enum(FileCompression),
    data: Type.Optional(Type.Unknown()),
    location: Type.Enum(FileLocation),
    size: Type.Optional(Type.Number()),
    fileName: Type.Optional(Type.String()),
    s3Key: Type.Optional(Type.String()),
    metadata: Type.Optional(Type.Record(Type.String(), Type.String())),
})

export type File = Static<typeof File> & {
    data: Buffer
}
