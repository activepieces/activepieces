"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListProjectReleasesRequest = exports.DiffReleaseRequest = exports.CreateProjectReleaseRequestBody = exports.CreateProjectReleaseFromProjectRequestBody = exports.CreateProjectReleaseFromRollbackRequestBody = exports.CreateProjectReleaseFromGitRequestBody = exports.ProjectReleaseType = void 0;
const typebox_1 = require("@sinclair/typebox");
const common_1 = require("../common");
var ProjectReleaseType;
(function (ProjectReleaseType) {
    ProjectReleaseType["GIT"] = "GIT";
    ProjectReleaseType["PROJECT"] = "PROJECT";
    ProjectReleaseType["ROLLBACK"] = "ROLLBACK";
})(ProjectReleaseType || (exports.ProjectReleaseType = ProjectReleaseType = {}));
const BaseProjectReleaseRequestBody = {
    name: typebox_1.Type.String(),
    description: (0, common_1.Nullable)(typebox_1.Type.String()),
    selectedFlowsIds: (0, common_1.Nullable)(typebox_1.Type.Array(typebox_1.Type.String())),
    projectId: typebox_1.Type.String(),
};
exports.CreateProjectReleaseFromGitRequestBody = typebox_1.Type.Object(Object.assign({ type: typebox_1.Type.Literal(ProjectReleaseType.GIT) }, BaseProjectReleaseRequestBody));
exports.CreateProjectReleaseFromRollbackRequestBody = typebox_1.Type.Object(Object.assign(Object.assign({ type: typebox_1.Type.Literal(ProjectReleaseType.ROLLBACK) }, BaseProjectReleaseRequestBody), { projectReleaseId: typebox_1.Type.String() }));
exports.CreateProjectReleaseFromProjectRequestBody = typebox_1.Type.Object(Object.assign(Object.assign({ type: typebox_1.Type.Literal(ProjectReleaseType.PROJECT) }, BaseProjectReleaseRequestBody), { targetProjectId: typebox_1.Type.String() }));
exports.CreateProjectReleaseRequestBody = (0, common_1.DiscriminatedUnion)('type', [
    exports.CreateProjectReleaseFromRollbackRequestBody,
    exports.CreateProjectReleaseFromProjectRequestBody,
    exports.CreateProjectReleaseFromGitRequestBody,
]);
exports.DiffReleaseRequest = typebox_1.Type.Union([
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal(ProjectReleaseType.PROJECT),
        targetProjectId: typebox_1.Type.String(),
    }),
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal(ProjectReleaseType.ROLLBACK),
        projectReleaseId: typebox_1.Type.String(),
    }),
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal(ProjectReleaseType.GIT),
    }),
]);
exports.ListProjectReleasesRequest = typebox_1.Type.Object({
    cursor: (0, common_1.Nullable)(typebox_1.Type.String()),
    limit: typebox_1.Type.Optional(typebox_1.Type.Number({ default: 10 })),
});
//# sourceMappingURL=project-release.request.js.map