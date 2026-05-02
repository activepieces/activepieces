import { z } from 'zod'
import { Nullable, NullableEnum } from '../../core/common'
import { PopulatedFlow } from '../flows/flow'
import { TableAutomationStatus, TableAutomationTrigger } from '../tables/table'

export enum FlowProjectOperationType {
    UPDATE_FLOW = 'UPDATE_FLOW',
    CREATE_FLOW = 'CREATE_FLOW',
    DELETE_FLOW = 'DELETE_FLOW',
}
export enum ConnectionOperationType {
    UPDATE_CONNECTION = 'UPDATE_CONNECTION',
    CREATE_CONNECTION = 'CREATE_CONNECTION',
}

export enum TableOperationType {
    UPDATE_TABLE = 'UPDATE_TABLE',
    CREATE_TABLE = 'CREATE_TABLE',
    DELETE_TABLE = 'DELETE_TABLE',
}

export const FlowState = PopulatedFlow
export type FlowState = z.infer<typeof FlowState>

export const ConnectionState = z.object({
    externalId: z.string(),
    pieceName: Nullable(z.string()),
    displayName: z.string(),
})
export type ConnectionState = z.infer<typeof ConnectionState>

export const FieldState = z.object({
    name: z.string(),
    type: z.string(),
    data: Nullable(z.object({
        options: z.array(z.object({
            value: z.string(),
        })),
    })),
    externalId: z.string(),
})
export type FieldState = z.infer<typeof FieldState>

export const TableState = z.object({
    id: z.string(),
    name: z.string(),
    externalId: z.string(),
    fields: z.array(FieldState),
    status: NullableEnum(TableAutomationStatus),
    trigger: NullableEnum(TableAutomationTrigger),
})
export type TableState = z.infer<typeof TableState>

export const ProjectState = z.object({
    flows: z.array(PopulatedFlow),
    // NOTE: This is optional because in old releases, the connections, tables, agents and mcp state is not present
    connections: z.array(ConnectionState).optional(),
    tables: z.array(TableState).optional(),
})
export type ProjectState = z.infer<typeof ProjectState>

export const ProjectOperation = z.union([
    z.object({
        type: z.literal(FlowProjectOperationType.UPDATE_FLOW),
        newFlowState: FlowState,
        flowState: FlowState,
    }),
    z.object({
        type: z.literal(FlowProjectOperationType.CREATE_FLOW),
        flowState: FlowState,
    }),
    z.object({
        type: z.literal(FlowProjectOperationType.DELETE_FLOW),
        flowState: FlowState,
    }),
])
export type ProjectOperation = z.infer<typeof ProjectOperation>

export const ConnectionOperation = z.union([
    z.object({
        type: z.literal(ConnectionOperationType.UPDATE_CONNECTION),
        newConnectionState: ConnectionState,
        connectionState: ConnectionState,
    }),
    z.object({
        type: z.literal(ConnectionOperationType.CREATE_CONNECTION),
        connectionState: ConnectionState,
    }),
])
export type ConnectionOperation = z.infer<typeof ConnectionOperation>

export const TableOperation = z.union([
    z.object({
        type: z.literal(TableOperationType.UPDATE_TABLE),
        newTableState: TableState,
        tableState: TableState,
    }),
    z.object({
        type: z.literal(TableOperationType.CREATE_TABLE),
        tableState: TableState,
    }),
    z.object({
        type: z.literal(TableOperationType.DELETE_TABLE),
        tableState: TableState,
    }),
])
export type TableOperation = z.infer<typeof TableOperation>

export const DiffState = z.object({
    flows: z.array(ProjectOperation),
    connections: z.array(ConnectionOperation),
    tables: z.array(TableOperation),
})
export type DiffState = z.infer<typeof DiffState>


export const FlowSyncError = z.object({
    flowId: z.string(),
    message: z.string(),
})
export type FlowSyncError = z.infer<typeof FlowSyncError>

export const FlowProjectOperation = z.union([
    z.object({
        type: z.literal(FlowProjectOperationType.CREATE_FLOW),
        flow: z.object({
            id: z.string(),
            displayName: z.string(),
        }),
    }),
    z.object({
        type: z.literal(FlowProjectOperationType.UPDATE_FLOW),
        flow: z.object({
            id: z.string(),
            displayName: z.string(),
        }),
        targetFlow: z.object({
            id: z.string(),
            displayName: z.string(),
        }),
    }),
    z.object({
        type: z.literal(FlowProjectOperationType.DELETE_FLOW),
        flow: z.object({
            id: z.string(),
            displayName: z.string(),
        }),
    }),
])
export type FlowProjectOperation = z.infer<typeof FlowProjectOperation>

export const ProjectSyncPlan = z.object({
    flows: z.array(FlowProjectOperation),
    connections: z.array(ConnectionOperation),
    tables: z.array(TableOperation),
    errors: z.array(FlowSyncError),
})
export type ProjectSyncPlan = z.infer<typeof ProjectSyncPlan>

