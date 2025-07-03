import { Static, Type } from '@sinclair/typebox'
import { PopulatedFlow } from '../flows/flow'

export enum ProjectOperationType {
    UPDATE_FLOW = 'UPDATE_FLOW',
    CREATE_FLOW = 'CREATE_FLOW',
    DELETE_FLOW = 'DELETE_FLOW',
}
export enum ConnectionOperationType {
    UPDATE_CONNECTION = 'UPDATE_CONNECTION',
    CREATE_CONNECTION = 'CREATE_CONNECTION',
}

export const FlowState = PopulatedFlow
export enum TableOperationType {
    UPDATE_TABLE = 'UPDATE_TABLE',
    CREATE_TABLE = 'CREATE_TABLE',
}

export type FlowState = Static<typeof FlowState>

export const ConnectionState = Type.Object({
    externalId: Type.String(),
    pieceName: Type.String(),
    displayName: Type.String(),
})
export type ConnectionState = Static<typeof ConnectionState>

export const FieldState = Type.Object({
    name: Type.String(),
    type: Type.String(),
    data: Type.Optional(Type.Object({
        options: Type.Array(Type.Object({
            value: Type.String(),
        })),
    })),
    externalId: Type.String(),
})
export type FieldState = Static<typeof FieldState>

export const TableState = Type.Object({
    id: Type.String(),
    name: Type.String(),
    externalId: Type.String(),
    fields: Type.Array(FieldState),
})
export type TableState = Static<typeof TableState>

export const ProjectState = Type.Object({
    flows: Type.Array(PopulatedFlow),
    // NOTE: This is optional because in old releases, the connections and tables state is not present
    connections: Type.Optional(Type.Array(ConnectionState)),
    tables: Type.Optional(Type.Array(TableState)),
})
export type ProjectState = Static<typeof ProjectState>

export const ProjectOperation = Type.Union([
    Type.Object({
        type: Type.Literal(ProjectOperationType.UPDATE_FLOW),
        newFlowState: FlowState,
        flowState: FlowState,
    }),
    Type.Object({
        type: Type.Literal(ProjectOperationType.CREATE_FLOW),
        flowState: FlowState,
    }),
    Type.Object({
        type: Type.Literal(ProjectOperationType.DELETE_FLOW),
        flowState: FlowState,
    }),
])
export type ProjectOperation = Static<typeof ProjectOperation>

export const ConnectionOperation = Type.Union([
    Type.Object({
        type: Type.Literal(ConnectionOperationType.UPDATE_CONNECTION),
        newConnectionState: ConnectionState,
        connectionState: ConnectionState,
    }),
    Type.Object({
        type: Type.Literal(ConnectionOperationType.CREATE_CONNECTION),
        connectionState: ConnectionState,
    }),
])
export type ConnectionOperation = Static<typeof ConnectionOperation>

export const TableOperation = Type.Union([
    Type.Object({
        type: Type.Literal(TableOperationType.UPDATE_TABLE),
        newTableState: TableState,
        tableState: TableState,
    }),
    Type.Object({
        type: Type.Literal(TableOperationType.CREATE_TABLE),
        tableState: TableState,
    }),
])
export type TableOperation = Static<typeof TableOperation>

export const DiffState = Type.Object({
    operations: Type.Array(ProjectOperation),
    connections: Type.Array(ConnectionOperation),
    tables: Type.Array(TableOperation),
})
export type DiffState = Static<typeof DiffState>


export const ProjectSyncError = Type.Object({
    flowId: Type.String(),
    message: Type.String(),
})
export type ProjectSyncError = Static<typeof ProjectSyncError>

export const ProjectSyncPlanOperation = Type.Union([
    Type.Object({
        type: Type.Literal(ProjectOperationType.CREATE_FLOW),
        flow: Type.Object({
            id: Type.String(),
            displayName: Type.String(),
        }),
    }),
    Type.Object({
        type: Type.Literal(ProjectOperationType.UPDATE_FLOW),
        flow: Type.Object({
            id: Type.String(),
            displayName: Type.String(),
        }),
        targetFlow: Type.Object({
            id: Type.String(),
            displayName: Type.String(),
        }),
    }),
    Type.Object({
        type: Type.Literal(ProjectOperationType.DELETE_FLOW),
        flow: Type.Object({
            id: Type.String(),
            displayName: Type.String(),
        }),
    }),
])
export type ProjectSyncPlanOperation = Static<typeof ProjectSyncPlanOperation>

export const ProjectSyncPlan = Type.Object({
    operations: Type.Array(ProjectSyncPlanOperation),
    connections: Type.Array(ConnectionOperation),
    tables: Type.Array(TableOperation),
    errors: Type.Array(ProjectSyncError),
})
export type ProjectSyncPlan = Static<typeof ProjectSyncPlan>

