"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasePieceAuthSchema = void 0;
const typebox_1 = require("@sinclair/typebox");
exports.BasePieceAuthSchema = typebox_1.Type.Object({
    displayName: typebox_1.Type.String(),
    description: typebox_1.Type.Optional(typebox_1.Type.String())
});
//# sourceMappingURL=common.js.map