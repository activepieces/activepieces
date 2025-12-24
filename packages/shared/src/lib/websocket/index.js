"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsocketServerEvent = exports.TodoActivityCreated = exports.TodoActivityChanged = exports.TodoChanged = exports.WebsocketClientEvent = void 0;
const tslib_1 = require("tslib");
const typebox_1 = require("@sinclair/typebox");
var WebsocketClientEvent;
(function (WebsocketClientEvent) {
    WebsocketClientEvent["TEST_FLOW_RUN_STARTED"] = "TEST_FLOW_RUN_STARTED";
    WebsocketClientEvent["TEST_STEP_FINISHED"] = "TEST_STEP_FINISHED";
    WebsocketClientEvent["TEST_STEP_PROGRESS"] = "TEST_STEP_PROGRESS";
    WebsocketClientEvent["REFRESH_PIECE"] = "REFRESH_PIECE";
    WebsocketClientEvent["FLOW_RUN_PROGRESS"] = "FLOW_RUN_PROGRESS";
    WebsocketClientEvent["TODO_CHANGED"] = "TODO_CHANGED";
    WebsocketClientEvent["TODO_ACTIVITY_CHANGED"] = "TODO_ACTIVITY_CHANGED";
    WebsocketClientEvent["TODO_ACTIVITY_CREATED"] = "TODO_ACTIVITY_CREATED";
    WebsocketClientEvent["FLOW_STATUS_UPDATED"] = "FLOW_STATUS_UPDATED";
})(WebsocketClientEvent || (exports.WebsocketClientEvent = WebsocketClientEvent = {}));
exports.TodoChanged = typebox_1.Type.Object({
    todoId: typebox_1.Type.String(),
});
exports.TodoActivityChanged = typebox_1.Type.Object({
    activityId: typebox_1.Type.String(),
    todoId: typebox_1.Type.String(),
    content: typebox_1.Type.String(),
});
exports.TodoActivityCreated = typebox_1.Type.Object({
    todoId: typebox_1.Type.String(),
});
var WebsocketServerEvent;
(function (WebsocketServerEvent) {
    WebsocketServerEvent["TEST_FLOW_RUN"] = "TEST_FLOW_RUN";
    WebsocketServerEvent["CONNECT"] = "CONNECT";
    WebsocketServerEvent["FETCH_WORKER_SETTINGS"] = "FETCH_WORKER_SETTINGS";
    WebsocketServerEvent["DISCONNECT"] = "DISCONNECT";
    WebsocketServerEvent["WORKER_HEALTHCHECK"] = "WORKER_HEALTHCHECK";
    WebsocketServerEvent["EMIT_TEST_STEP_PROGRESS"] = "EMIT_TEST_STEP_PROGRESS";
    WebsocketServerEvent["EMIT_TEST_STEP_FINISHED"] = "EMIT_TEST_STEP_FINISHED";
})(WebsocketServerEvent || (exports.WebsocketServerEvent = WebsocketServerEvent = {}));
tslib_1.__exportStar(require("./socket-utils"), exports);
//# sourceMappingURL=index.js.map