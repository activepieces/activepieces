"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UncategorizedFolderId = exports.Folder = void 0;
const typebox_1 = require("@sinclair/typebox");
const common_1 = require("../../common");
exports.Folder = typebox_1.Type.Object(Object.assign(Object.assign({}, common_1.BaseModelSchema), { id: typebox_1.Type.String(), projectId: typebox_1.Type.String(), displayName: typebox_1.Type.String(), displayOrder: typebox_1.Type.Number() }));
exports.UncategorizedFolderId = 'NULL';
//# sourceMappingURL=folder.js.map