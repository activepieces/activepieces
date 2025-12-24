"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ColorHex = void 0;
const typebox_1 = require("@sinclair/typebox");
exports.ColorHex = typebox_1.Type.String({
    pattern: '^#[0-9A-Fa-f]{6}$',
});
//# sourceMappingURL=color.js.map