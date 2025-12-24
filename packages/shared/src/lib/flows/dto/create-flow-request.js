"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateFlowRequest = void 0;
const typebox_1 = require("@sinclair/typebox");
const metadata_1 = require("../../common/metadata");
exports.CreateFlowRequest = typebox_1.Type.Object({
    displayName: typebox_1.Type.String({}),
    /**If folderId is provided, folderName is ignored */
    folderId: typebox_1.Type.Optional(typebox_1.Type.String({})),
    folderName: typebox_1.Type.Optional(typebox_1.Type.String({})),
    projectId: typebox_1.Type.String({}),
    metadata: typebox_1.Type.Optional(metadata_1.Metadata),
});
//# sourceMappingURL=create-flow-request.js.map