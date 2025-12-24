"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetSystemHealthChecksResponse = void 0;
const typebox_1 = require("@sinclair/typebox");
exports.GetSystemHealthChecksResponse = typebox_1.Type.Object({
    cpu: typebox_1.Type.Boolean(),
    disk: typebox_1.Type.Boolean(),
    ram: typebox_1.Type.Boolean(),
});
//# sourceMappingURL=index.js.map