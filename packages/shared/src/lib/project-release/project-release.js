"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectRelease = void 0;
const typebox_1 = require("@sinclair/typebox");
const common_1 = require("../common");
const user_1 = require("../user");
const project_release_request_1 = require("./project-release.request");
exports.ProjectRelease = typebox_1.Type.Object(Object.assign(Object.assign({}, common_1.BaseModelSchema), { projectId: typebox_1.Type.String(), name: typebox_1.Type.String(), description: (0, common_1.Nullable)(typebox_1.Type.String()), importedBy: (0, common_1.Nullable)(typebox_1.Type.String()), fileId: typebox_1.Type.String(), type: typebox_1.Type.Enum(project_release_request_1.ProjectReleaseType), importedByUser: typebox_1.Type.Optional(user_1.UserWithMetaInformation) }));
//# sourceMappingURL=project-release.js.map