"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListProjectMembersForProjectRoleRequestQuery = exports.UpdateProjectRoleRequestBody = exports.CreateProjectRoleRequestBody = void 0;
const typebox_1 = require("@sinclair/typebox");
const common_1 = require("../common");
exports.CreateProjectRoleRequestBody = typebox_1.Type.Object({
    name: typebox_1.Type.String({
        pattern: common_1.SAFE_STRING_PATTERN,
    }),
    permissions: typebox_1.Type.Array(typebox_1.Type.String()),
    type: typebox_1.Type.Enum(common_1.RoleType),
});
exports.UpdateProjectRoleRequestBody = typebox_1.Type.Object({
    name: typebox_1.Type.Optional(typebox_1.Type.String({
        pattern: common_1.SAFE_STRING_PATTERN,
    })),
    permissions: typebox_1.Type.Optional(typebox_1.Type.Array(typebox_1.Type.String())),
});
exports.ListProjectMembersForProjectRoleRequestQuery = typebox_1.Type.Object({
    cursor: typebox_1.Type.Optional(typebox_1.Type.String()),
    limit: typebox_1.Type.Optional(typebox_1.Type.Number()),
});
//# sourceMappingURL=project-role.request.js.map