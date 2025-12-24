"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListProjectRequestForUserQueryParams = void 0;
const typebox_1 = require("@sinclair/typebox");
const project_1 = require("./project");
exports.ListProjectRequestForUserQueryParams = typebox_1.Type.Object({
    cursor: typebox_1.Type.Optional(typebox_1.Type.String()),
    limit: typebox_1.Type.Optional(typebox_1.Type.Number()),
    displayName: typebox_1.Type.Optional(typebox_1.Type.String()),
    types: typebox_1.Type.Optional(typebox_1.Type.Array(typebox_1.Type.Enum(project_1.ProjectType))),
});
//# sourceMappingURL=project.requests.js.map