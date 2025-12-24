import { Static } from '@sinclair/typebox';
import { ApId } from '../common/id-generator';
export type FileId = ApId;
export declare enum FileType {
    UNKNOWN = "UNKNOWN",
    FLOW_RUN_LOG = "FLOW_RUN_LOG",
    PACKAGE_ARCHIVE = "PACKAGE_ARCHIVE",
    FLOW_STEP_FILE = "FLOW_STEP_FILE",
    SAMPLE_DATA = "SAMPLE_DATA",
    TRIGGER_PAYLOAD = "TRIGGER_PAYLOAD",
    SAMPLE_DATA_INPUT = "SAMPLE_DATA_INPUT",
    TRIGGER_EVENT_FILE = "TRIGGER_EVENT_FILE",
    PROJECT_RELEASE = "PROJECT_RELEASE",
    FLOW_VERSION_BACKUP = "FLOW_VERSION_BACKUP",
    PLATFORM_ASSET = "PLATFORM_ASSET"
}
export declare enum FileCompression {
    NONE = "NONE",
    GZIP = "GZIP"
}
export declare enum FileLocation {
    S3 = "S3",
    DB = "DB"
}
export declare const File: import("@sinclair/typebox").TObject<{
    projectId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    platformId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    type: import("@sinclair/typebox").TEnum<typeof FileType>;
    compression: import("@sinclair/typebox").TEnum<typeof FileCompression>;
    data: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnknown>;
    location: import("@sinclair/typebox").TEnum<typeof FileLocation>;
    size: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    fileName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    s3Key: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    metadata: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
    id: import("@sinclair/typebox").TString;
    created: import("@sinclair/typebox").TString;
    updated: import("@sinclair/typebox").TString;
}>;
export type File = Static<typeof File> & {
    data: Buffer;
};
