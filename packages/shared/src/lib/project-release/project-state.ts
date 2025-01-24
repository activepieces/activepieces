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

export const FlowState = Type.Omit(PopulatedFlow, ['externalId'])
export type FlowState = Static<typeof FlowState>

export const ConnectionState = Type.Object({
    externalId: Type.String(),
    pieceName: Type.String(),
    displayName: Type.String(),
})
export type ConnectionState = Static<typeof ConnectionState>

export const ProjectState = Type.Object({
    flows: Type.Array(PopulatedFlow),
    // NOTE: This is optional because in old releases, the connections state is not present
    connections: Type.Optional(Type.Array(ConnectionState)),
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

export const DiffState = Type.Object({
    operations: Type.Array(ProjectOperation),
    connections: Type.Array(ConnectionOperation),
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
    errors: Type.Array(ProjectSyncError),
})
export type ProjectSyncPlan = Static<typeof ProjectSyncPlan>

