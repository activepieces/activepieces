"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListAppConnectionOwnersRequestQuery = exports.ListGlobalConnectionsRequestQuery = exports.GetAppConnectionForWorkerRequestQuery = exports.ListAppConnectionsRequestQuery = void 0;
const typebox_1 = require("@sinclair/typebox");
const app_connection_1 = require("../app-connection");
exports.ListAppConnectionsRequestQuery = typebox_1.Type.Object({
    cursor: typebox_1.Type.Optional(typebox_1.Type.String({})),
    projectId: typebox_1.Type.String(),
    scope: typebox_1.Type.Optional(typebox_1.Type.Enum(app_connection_1.AppConnectionScope)),
    pieceName: typebox_1.Type.Optional(typebox_1.Type.String({})),
    displayName: typebox_1.Type.Optional(typebox_1.Type.String({})),
    status: typebox_1.Type.Optional(typebox_1.Type.Array(typebox_1.Type.Enum(app_connection_1.AppConnectionStatus))),
    limit: typebox_1.Type.Optional(typebox_1.Type.Number({})),
});
exports.GetAppConnectionForWorkerRequestQuery = typebox_1.Type.Object({
    externalId: typebox_1.Type.String(),
});
exports.ListGlobalConnectionsRequestQuery = typebox_1.Type.Omit(exports.ListAppConnectionsRequestQuery, ['projectId']);
exports.ListAppConnectionOwnersRequestQuery = typebox_1.Type.Object({
    projectId: typebox_1.Type.String(),
});
//# sourceMappingURL=read-app-connection-request.js.map