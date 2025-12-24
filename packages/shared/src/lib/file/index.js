"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.File = exports.FileLocation = exports.FileCompression = exports.FileType = void 0;
const typebox_1 = require("@sinclair/typebox");
const base_model_1 = require("../common/base-model");
var FileType;
(function (FileType) {
    FileType["UNKNOWN"] = "UNKNOWN";
    FileType["FLOW_RUN_LOG"] = "FLOW_RUN_LOG";
    FileType["PACKAGE_ARCHIVE"] = "PACKAGE_ARCHIVE";
    FileType["FLOW_STEP_FILE"] = "FLOW_STEP_FILE";
    FileType["SAMPLE_DATA"] = "SAMPLE_DATA";
    /*
    @deprecated activepieces no longer stores trigger payload
    */
    FileType["TRIGGER_PAYLOAD"] = "TRIGGER_PAYLOAD";
    FileType["SAMPLE_DATA_INPUT"] = "SAMPLE_DATA_INPUT";
    FileType["TRIGGER_EVENT_FILE"] = "TRIGGER_EVENT_FILE";
    FileType["PROJECT_RELEASE"] = "PROJECT_RELEASE";
    FileType["FLOW_VERSION_BACKUP"] = "FLOW_VERSION_BACKUP";
    FileType["PLATFORM_ASSET"] = "PLATFORM_ASSET";
})(FileType || (exports.FileType = FileType = {}));
var FileCompression;
(function (FileCompression) {
    FileCompression["NONE"] = "NONE";
    FileCompression["GZIP"] = "GZIP";
})(FileCompression || (exports.FileCompression = FileCompression = {}));
var FileLocation;
(function (FileLocation) {
    FileLocation["S3"] = "S3";
    FileLocation["DB"] = "DB";
})(FileLocation || (exports.FileLocation = FileLocation = {}));
exports.File = typebox_1.Type.Object(Object.assign(Object.assign({}, base_model_1.BaseModelSchema), { projectId: typebox_1.Type.Optional(typebox_1.Type.String()), platformId: typebox_1.Type.Optional(typebox_1.Type.String()), type: typebox_1.Type.Enum(FileType), compression: typebox_1.Type.Enum(FileCompression), data: typebox_1.Type.Optional(typebox_1.Type.Unknown()), location: typebox_1.Type.Enum(FileLocation), size: typebox_1.Type.Optional(typebox_1.Type.Number()), fileName: typebox_1.Type.Optional(typebox_1.Type.String()), s3Key: typebox_1.Type.Optional(typebox_1.Type.String()), metadata: typebox_1.Type.Optional(typebox_1.Type.Record(typebox_1.Type.String(), typebox_1.Type.String())) }));
//# sourceMappingURL=index.js.map