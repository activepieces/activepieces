"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectRole = void 0;
const typebox_1 = require("@sinclair/typebox");
const common_1 = require("../common");
exports.ProjectRole = typebox_1.Type.Object(Object.assign(Object.assign({}, common_1.BaseModelSchema), { name: typebox_1.Type.String(), permissions: typebox_1.Type.Array(typebox_1.Type.String()), platformId: typebox_1.Type.Optional(typebox_1.Type.String()), type: typebox_1.Type.String(), userCount: typebox_1.Type.Optional(typebox_1.Type.Number()) }));
//# sourceMappingURL=project-role.js.map