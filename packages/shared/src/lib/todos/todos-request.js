"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTodoActivityRequestBody = exports.ListTodoActivitiesQueryParams = exports.ResolveTodoRequestQuery = exports.CreateTodoRequestBody = exports.UpdateTodoRequestBody = exports.ListTodoAssigneesRequestQuery = exports.ListTodosQueryParams = void 0;
const typebox_1 = require("@sinclair/typebox");
const id_generator_1 = require("../common/id-generator");
const _1 = require(".");
const StatusOptionsSchema = typebox_1.Type.Array(_1.StatusOption, { minItems: 1 });
exports.ListTodosQueryParams = typebox_1.Type.Object({
    platformId: id_generator_1.ApId,
    projectId: id_generator_1.ApId,
    flowId: typebox_1.Type.Optional(id_generator_1.ApId),
    cursor: typebox_1.Type.Optional(typebox_1.Type.String()),
    limit: typebox_1.Type.Optional(typebox_1.Type.Integer({ minimum: 1, maximum: 100 })),
    assigneeId: typebox_1.Type.Optional(id_generator_1.ApId),
    statusOptions: typebox_1.Type.Optional(typebox_1.Type.Array(typebox_1.Type.String())),
    title: typebox_1.Type.Optional(typebox_1.Type.String()),
    environment: typebox_1.Type.Optional(typebox_1.Type.Enum(_1.TodoEnvironment)),
});
exports.ListTodoAssigneesRequestQuery = typebox_1.Type.Object({});
exports.UpdateTodoRequestBody = typebox_1.Type.Object({
    title: typebox_1.Type.Optional(typebox_1.Type.String()),
    description: typebox_1.Type.Optional(typebox_1.Type.String()),
    status: typebox_1.Type.Optional(_1.StatusOption),
    statusOptions: typebox_1.Type.Optional(StatusOptionsSchema),
    assigneeId: typebox_1.Type.Optional(id_generator_1.ApId),
    isTest: typebox_1.Type.Optional(typebox_1.Type.Boolean()),
});
exports.CreateTodoRequestBody = typebox_1.Type.Object({
    title: typebox_1.Type.String(),
    description: typebox_1.Type.String(),
    statusOptions: StatusOptionsSchema,
    flowId: id_generator_1.ApId,
    runId: typebox_1.Type.Optional(id_generator_1.ApId),
    assigneeId: typebox_1.Type.Optional(id_generator_1.ApId),
    resolveUrl: typebox_1.Type.Optional(typebox_1.Type.String()),
    environment: typebox_1.Type.Optional(typebox_1.Type.Enum(_1.TodoEnvironment)),
});
exports.ResolveTodoRequestQuery = typebox_1.Type.Object({
    status: typebox_1.Type.String(),
    isTest: typebox_1.Type.Optional(typebox_1.Type.Boolean()),
});
exports.ListTodoActivitiesQueryParams = typebox_1.Type.Object({
    todoId: id_generator_1.ApId,
    type: typebox_1.Type.Optional(typebox_1.Type.String()),
    cursor: typebox_1.Type.Optional(typebox_1.Type.String()),
    limit: typebox_1.Type.Optional(typebox_1.Type.Integer({ minimum: 1, maximum: 100 })),
});
exports.CreateTodoActivityRequestBody = typebox_1.Type.Object({
    todoId: id_generator_1.ApId,
    content: typebox_1.Type.String(),
});
//# sourceMappingURL=todos-request.js.map