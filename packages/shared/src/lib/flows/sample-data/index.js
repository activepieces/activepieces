"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SaveSampleDataResponse = exports.DEFAULT_SAMPLE_DATA_SETTINGS = exports.SampleDataSetting = exports.StepExecutionPath = exports.StepRunResponse = exports.CreateStepRunRequestBody = exports.GetSampleDataRequest = exports.SaveSampleDataRequest = exports.SampleDataDataType = exports.DATA_TYPE_KEY_IN_FILE_METADATA = exports.SampleDataFileType = void 0;
const typebox_1 = require("@sinclair/typebox");
const file_1 = require("../../file");
var SampleDataFileType;
(function (SampleDataFileType) {
    SampleDataFileType["INPUT"] = "INPUT";
    SampleDataFileType["OUTPUT"] = "OUTPUT";
})(SampleDataFileType || (exports.SampleDataFileType = SampleDataFileType = {}));
exports.DATA_TYPE_KEY_IN_FILE_METADATA = 'dataType';
var SampleDataDataType;
(function (SampleDataDataType) {
    SampleDataDataType["JSON"] = "JSON";
    SampleDataDataType["STRING"] = "STRING";
})(SampleDataDataType || (exports.SampleDataDataType = SampleDataDataType = {}));
exports.SaveSampleDataRequest = typebox_1.Type.Object({
    stepName: typebox_1.Type.String(),
    payload: typebox_1.Type.Unknown(),
    type: typebox_1.Type.Enum(SampleDataFileType),
    dataType: typebox_1.Type.Enum(SampleDataDataType),
});
exports.GetSampleDataRequest = typebox_1.Type.Object({
    flowId: typebox_1.Type.String(),
    flowVersionId: typebox_1.Type.String(),
    stepName: typebox_1.Type.String(),
    projectId: typebox_1.Type.String(),
    type: typebox_1.Type.Enum(SampleDataFileType),
});
exports.CreateStepRunRequestBody = typebox_1.Type.Object({
    flowVersionId: typebox_1.Type.String(),
    stepName: typebox_1.Type.String(),
});
exports.StepRunResponse = typebox_1.Type.Object({
    runId: typebox_1.Type.String(),
    success: typebox_1.Type.Boolean(),
    input: typebox_1.Type.Unknown(),
    output: typebox_1.Type.Unknown(),
    sampleDataFileId: typebox_1.Type.Optional(typebox_1.Type.String()),
    sampleDataInputFileId: typebox_1.Type.Optional(typebox_1.Type.String()),
    standardError: typebox_1.Type.String(),
    standardOutput: typebox_1.Type.String(),
});
exports.StepExecutionPath = typebox_1.Type.Array(typebox_1.Type.Tuple([typebox_1.Type.String(), typebox_1.Type.Number()]));
exports.SampleDataSetting = typebox_1.Type.Object({
    sampleDataFileId: typebox_1.Type.Optional(typebox_1.Type.String()),
    sampleDataInputFileId: typebox_1.Type.Optional(typebox_1.Type.String()),
    lastTestDate: typebox_1.Type.Optional(typebox_1.Type.String()),
}, {
    additionalProperties: true,
});
exports.DEFAULT_SAMPLE_DATA_SETTINGS = {
    sampleDataFileId: undefined,
    sampleDataInputFileId: undefined,
};
exports.SaveSampleDataResponse = (0, typebox_1.Pick)(file_1.File, ['id', 'size', 'type']);
//# sourceMappingURL=index.js.map