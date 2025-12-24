"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMultipartFile = exports.ApMultipartFile = void 0;
const typebox_1 = require("@sinclair/typebox");
exports.ApMultipartFile = typebox_1.Type.Object({
    filename: typebox_1.Type.String(),
    data: typebox_1.Type.Unknown(),
    type: typebox_1.Type.Literal('file'),
    mimetype: typebox_1.Type.Optional(typebox_1.Type.String()),
});
const isMultipartFile = (value) => {
    return typeof value === 'object' && value !== null && 'type' in value && value.type === 'file' && 'filename' in value && 'data' in value && value.data instanceof Buffer;
};
exports.isMultipartFile = isMultipartFile;
//# sourceMappingURL=multipart-file.js.map