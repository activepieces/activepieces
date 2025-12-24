"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListFolderRequest = exports.DeleteFolderRequest = exports.UpdateFolderRequest = exports.CreateFolderRequest = void 0;
const typebox_1 = require("@sinclair/typebox");
exports.CreateFolderRequest = typebox_1.Type.Object({
    displayName: typebox_1.Type.String(),
    projectId: typebox_1.Type.String(),
});
exports.UpdateFolderRequest = typebox_1.Type.Object({
    displayName: typebox_1.Type.String(),
});
exports.DeleteFolderRequest = typebox_1.Type.Object({
    id: typebox_1.Type.String(),
});
exports.ListFolderRequest = typebox_1.Type.Object({
    limit: typebox_1.Type.Optional(typebox_1.Type.Number({})),
    cursor: typebox_1.Type.Optional(typebox_1.Type.String({})),
    projectId: typebox_1.Type.String(),
});
//# sourceMappingURL=folder-requests.js.map