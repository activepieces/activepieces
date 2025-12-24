"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StepFileUpsertResponse = exports.StepFileUpsertRequest = void 0;
const typebox_1 = require("@sinclair/typebox");
const common_1 = require("../../common");
exports.StepFileUpsertRequest = typebox_1.Type.Object({
    flowId: typebox_1.Type.String(),
    stepName: typebox_1.Type.String(),
    file: typebox_1.Type.Optional(typebox_1.Type.Pick(common_1.ApMultipartFile, ['data'])),
    contentLength: typebox_1.Type.Number(),
    fileName: typebox_1.Type.String(),
});
exports.StepFileUpsertResponse = typebox_1.Type.Object({
    uploadUrl: typebox_1.Type.Optional(typebox_1.Type.String()),
    url: typebox_1.Type.String(),
});
//# sourceMappingURL=step-file.js.map