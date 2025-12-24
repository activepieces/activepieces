"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportRequestBody = exports.Solution = void 0;
const typebox_1 = require("@sinclair/typebox");
const project_state_1 = require("../project-release/project-state");
exports.Solution = typebox_1.Type.Object({
    name: typebox_1.Type.String(),
    description: typebox_1.Type.String(),
    state: project_state_1.ProjectState,
});
exports.ExportRequestBody = typebox_1.Type.Object({
    name: typebox_1.Type.String(),
    description: typebox_1.Type.Optional(typebox_1.Type.String()),
});
//# sourceMappingURL=solution.js.map