"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatFormResponse = exports.HumanInputFormResult = exports.HumanInputFormResultTypes = exports.FileResponseInterface = void 0;
exports.createKeyForFormInput = createKeyForFormInput;
const typebox_1 = require("@sinclair/typebox");
const FileResponseInterfaceV1 = typebox_1.Type.Object({
    base64Url: typebox_1.Type.String(),
    fileName: typebox_1.Type.String(),
    extension: typebox_1.Type.Optional(typebox_1.Type.String()),
});
const FileResponseInterfaceV2 = typebox_1.Type.Object({
    mimeType: typebox_1.Type.String(),
    url: typebox_1.Type.String(),
    fileName: typebox_1.Type.Optional(typebox_1.Type.String()),
});
exports.FileResponseInterface = typebox_1.Type.Union([FileResponseInterfaceV1, FileResponseInterfaceV2]);
var HumanInputFormResultTypes;
(function (HumanInputFormResultTypes) {
    HumanInputFormResultTypes["FILE"] = "file";
    HumanInputFormResultTypes["MARKDOWN"] = "markdown";
})(HumanInputFormResultTypes || (exports.HumanInputFormResultTypes = HumanInputFormResultTypes = {}));
function createKeyForFormInput(displayName) {
    const inputKey = displayName
        .toLowerCase()
        .replace(/\s+(\w)/g, (_, letter) => letter.toUpperCase())
        .replace(/^(.)/, letter => letter.toLowerCase());
    /**We do this because react form inputs must not contain quotes */
    return inputKey.replaceAll(/[\\"''\n\r\t]/g, '');
}
exports.HumanInputFormResult = typebox_1.Type.Union([
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal(HumanInputFormResultTypes.FILE),
        value: exports.FileResponseInterface,
    }),
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal(HumanInputFormResultTypes.MARKDOWN),
        value: typebox_1.Type.String(),
        files: typebox_1.Type.Optional(typebox_1.Type.Array(exports.FileResponseInterface)),
    }),
]);
exports.ChatFormResponse = typebox_1.Type.Object({
    sessionId: typebox_1.Type.String(),
    message: typebox_1.Type.String(),
    files: typebox_1.Type.Optional(typebox_1.Type.Array(typebox_1.Type.String())),
});
//# sourceMappingURL=index.js.map