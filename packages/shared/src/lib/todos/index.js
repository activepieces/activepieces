"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TodoActivityWithUser = exports.TodoActivity = exports.TodoType = exports.PopulatedTodo = exports.Todo = exports.TodoEnvironment = exports.StatusOption = exports.CreateTodoResult = exports.CreateAndWaitTodoResult = exports.STATUS_COLORS = exports.RESOLVED_STATUS = exports.UNRESOLVED_STATUS = exports.STATUS_VARIANT = void 0;
const typebox_1 = require("@sinclair/typebox");
const common_1 = require("../common");
const flows_1 = require("../flows");
const user_1 = require("../user");
var STATUS_VARIANT;
(function (STATUS_VARIANT) {
    STATUS_VARIANT["POSITIVE"] = "Positive (Green)";
    STATUS_VARIANT["NEGATIVE"] = "Negative (Red)";
    STATUS_VARIANT["NEUTRAL"] = "Neutral (Gray)";
})(STATUS_VARIANT || (exports.STATUS_VARIANT = STATUS_VARIANT = {}));
exports.UNRESOLVED_STATUS = {
    name: 'Unresolved',
    description: 'Unresolved',
    variant: STATUS_VARIANT.NEUTRAL,
};
exports.RESOLVED_STATUS = {
    name: 'Resolved',
    description: 'Resolved',
    variant: STATUS_VARIANT.POSITIVE,
};
exports.STATUS_COLORS = {
    [STATUS_VARIANT.POSITIVE]: {
        color: '#e5efe7',
        textColor: '#28813e',
    },
    [STATUS_VARIANT.NEGATIVE]: {
        color: '#fbe2e3',
        textColor: '#dd111b',
    },
    [STATUS_VARIANT.NEUTRAL]: {
        color: '#fef3c7',
        textColor: '#b45309',
    },
};
exports.CreateAndWaitTodoResult = typebox_1.Type.Object({
    status: typebox_1.Type.String(),
    message: (0, common_1.Nullable)(typebox_1.Type.String()),
});
exports.CreateTodoResult = typebox_1.Type.Object({
    id: typebox_1.Type.String(),
    links: typebox_1.Type.Array(typebox_1.Type.Object({
        name: typebox_1.Type.String(),
        url: typebox_1.Type.String(),
    })),
});
exports.StatusOption = typebox_1.Type.Object({
    name: typebox_1.Type.String(),
    description: (0, common_1.Nullable)(typebox_1.Type.String()),
    variant: typebox_1.Type.Union([typebox_1.Type.Literal(STATUS_VARIANT.POSITIVE), typebox_1.Type.Literal(STATUS_VARIANT.NEGATIVE), typebox_1.Type.Literal(STATUS_VARIANT.NEUTRAL)]),
    continueFlow: typebox_1.Type.Boolean(),
});
var TodoEnvironment;
(function (TodoEnvironment) {
    TodoEnvironment["TEST"] = "test";
    TodoEnvironment["PRODUCTION"] = "production";
})(TodoEnvironment || (exports.TodoEnvironment = TodoEnvironment = {}));
exports.Todo = typebox_1.Type.Object(Object.assign(Object.assign({}, common_1.BaseModelSchema), { title: typebox_1.Type.String(), description: typebox_1.Type.String(), status: exports.StatusOption, createdByUserId: (0, common_1.Nullable)(typebox_1.Type.String()), statusOptions: typebox_1.Type.Array(exports.StatusOption), platformId: typebox_1.Type.String(), projectId: typebox_1.Type.String(), flowId: typebox_1.Type.String(), runId: typebox_1.Type.String(), assigneeId: (0, common_1.Nullable)(typebox_1.Type.String()), locked: typebox_1.Type.Boolean(), resolveUrl: (0, common_1.Nullable)(typebox_1.Type.String()), environment: typebox_1.Type.Enum(TodoEnvironment) }));
exports.PopulatedTodo = typebox_1.Type.Composite([exports.Todo, typebox_1.Type.Object({
        assignee: (0, common_1.Nullable)(user_1.UserWithMetaInformation),
        createdByUser: (0, common_1.Nullable)(user_1.UserWithMetaInformation),
        flow: (0, common_1.Nullable)(flows_1.PopulatedFlow),
    })]);
var TodoType;
(function (TodoType) {
    TodoType["INTERNAL"] = "internal";
    TodoType["EXTERNAL"] = "external";
})(TodoType || (exports.TodoType = TodoType = {}));
exports.TodoActivity = typebox_1.Type.Object(Object.assign(Object.assign({}, common_1.BaseModelSchema), { todoId: typebox_1.Type.String(), userId: (0, common_1.Nullable)(typebox_1.Type.String()), content: typebox_1.Type.String() }));
exports.TodoActivityWithUser = typebox_1.Type.Composite([exports.TodoActivity, typebox_1.Type.Object({
        user: (0, common_1.Nullable)(user_1.UserWithMetaInformation),
    })]);
//# sourceMappingURL=index.js.map