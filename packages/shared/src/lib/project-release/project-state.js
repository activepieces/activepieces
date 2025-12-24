"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectSyncPlan = exports.FlowProjectOperation = exports.FlowSyncError = exports.DiffState = exports.TableOperation = exports.ConnectionOperation = exports.ProjectOperation = exports.ProjectState = exports.TableState = exports.FieldState = exports.ConnectionState = exports.FlowState = exports.TableOperationType = exports.ConnectionOperationType = exports.FlowProjectOperationType = void 0;
const typebox_1 = require("@sinclair/typebox");
const common_1 = require("../common");
const flow_1 = require("../flows/flow");
const tables_1 = require("../tables");
var FlowProjectOperationType;
(function (FlowProjectOperationType) {
    FlowProjectOperationType["UPDATE_FLOW"] = "UPDATE_FLOW";
    FlowProjectOperationType["CREATE_FLOW"] = "CREATE_FLOW";
    FlowProjectOperationType["DELETE_FLOW"] = "DELETE_FLOW";
})(FlowProjectOperationType || (exports.FlowProjectOperationType = FlowProjectOperationType = {}));
var ConnectionOperationType;
(function (ConnectionOperationType) {
    ConnectionOperationType["UPDATE_CONNECTION"] = "UPDATE_CONNECTION";
    ConnectionOperationType["CREATE_CONNECTION"] = "CREATE_CONNECTION";
})(ConnectionOperationType || (exports.ConnectionOperationType = ConnectionOperationType = {}));
var TableOperationType;
(function (TableOperationType) {
    TableOperationType["UPDATE_TABLE"] = "UPDATE_TABLE";
    TableOperationType["CREATE_TABLE"] = "CREATE_TABLE";
    TableOperationType["DELETE_TABLE"] = "DELETE_TABLE";
})(TableOperationType || (exports.TableOperationType = TableOperationType = {}));
exports.FlowState = flow_1.PopulatedFlow;
exports.ConnectionState = typebox_1.Type.Object({
    externalId: typebox_1.Type.String(),
    pieceName: typebox_1.Type.String(),
    displayName: typebox_1.Type.String(),
});
exports.FieldState = typebox_1.Type.Object({
    name: typebox_1.Type.String(),
    type: typebox_1.Type.String(),
    data: (0, common_1.Nullable)(typebox_1.Type.Object({
        options: typebox_1.Type.Array(typebox_1.Type.Object({
            value: typebox_1.Type.String(),
        })),
    })),
    externalId: typebox_1.Type.String(),
});
exports.TableState = typebox_1.Type.Object({
    id: typebox_1.Type.String(),
    name: typebox_1.Type.String(),
    externalId: typebox_1.Type.String(),
    fields: typebox_1.Type.Array(exports.FieldState),
    status: (0, common_1.NullableEnum)(typebox_1.Type.Enum(tables_1.TableAutomationStatus)),
    trigger: (0, common_1.NullableEnum)(typebox_1.Type.Enum(tables_1.TableAutomationTrigger)),
});
exports.ProjectState = typebox_1.Type.Object({
    flows: typebox_1.Type.Array(flow_1.PopulatedFlow),
    // NOTE: This is optional because in old releases, the connections, tables, agents and mcp state is not present
    connections: typebox_1.Type.Optional(typebox_1.Type.Array(exports.ConnectionState)),
    tables: typebox_1.Type.Optional(typebox_1.Type.Array(exports.TableState)),
});
exports.ProjectOperation = typebox_1.Type.Union([
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal(FlowProjectOperationType.UPDATE_FLOW),
        newFlowState: exports.FlowState,
        flowState: exports.FlowState,
    }),
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal(FlowProjectOperationType.CREATE_FLOW),
        flowState: exports.FlowState,
    }),
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal(FlowProjectOperationType.DELETE_FLOW),
        flowState: exports.FlowState,
    }),
]);
exports.ConnectionOperation = typebox_1.Type.Union([
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal(ConnectionOperationType.UPDATE_CONNECTION),
        newConnectionState: exports.ConnectionState,
        connectionState: exports.ConnectionState,
    }),
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal(ConnectionOperationType.CREATE_CONNECTION),
        connectionState: exports.ConnectionState,
    }),
]);
exports.TableOperation = typebox_1.Type.Union([
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal(TableOperationType.UPDATE_TABLE),
        newTableState: exports.TableState,
        tableState: exports.TableState,
    }),
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal(TableOperationType.CREATE_TABLE),
        tableState: exports.TableState,
    }),
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal(TableOperationType.DELETE_TABLE),
        tableState: exports.TableState,
    }),
]);
exports.DiffState = typebox_1.Type.Object({
    flows: typebox_1.Type.Array(exports.ProjectOperation),
    connections: typebox_1.Type.Array(exports.ConnectionOperation),
    tables: typebox_1.Type.Array(exports.TableOperation),
});
exports.FlowSyncError = typebox_1.Type.Object({
    flowId: typebox_1.Type.String(),
    message: typebox_1.Type.String(),
});
exports.FlowProjectOperation = typebox_1.Type.Union([
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal(FlowProjectOperationType.CREATE_FLOW),
        flow: typebox_1.Type.Object({
            id: typebox_1.Type.String(),
            displayName: typebox_1.Type.String(),
        }),
    }),
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal(FlowProjectOperationType.UPDATE_FLOW),
        flow: typebox_1.Type.Object({
            id: typebox_1.Type.String(),
            displayName: typebox_1.Type.String(),
        }),
        targetFlow: typebox_1.Type.Object({
            id: typebox_1.Type.String(),
            displayName: typebox_1.Type.String(),
        }),
    }),
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal(FlowProjectOperationType.DELETE_FLOW),
        flow: typebox_1.Type.Object({
            id: typebox_1.Type.String(),
            displayName: typebox_1.Type.String(),
        }),
    }),
]);
exports.ProjectSyncPlan = typebox_1.Type.Object({
    flows: typebox_1.Type.Array(exports.FlowProjectOperation),
    connections: typebox_1.Type.Array(exports.ConnectionOperation),
    tables: typebox_1.Type.Array(exports.TableOperation),
    errors: typebox_1.Type.Array(exports.FlowSyncError),
});
//# sourceMappingURL=project-state.js.map