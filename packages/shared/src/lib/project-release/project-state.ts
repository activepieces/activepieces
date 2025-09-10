import { Static, Type } from '@sinclair/typebox'
import { AgentOutputField, AgentOutputType } from '../agents'
import { Nullable, NullableEnum } from '../common'
import { PopulatedFlow } from '../flows/flow'
import { McpTool } from '../mcp'
import { TableAutomationStatus, TableAutomationTrigger } from '../tables'

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


export enum AgentOperationType {
    UPDATE_AGENT = 'UPDATE_AGENT',
    CREATE_AGENT = 'CREATE_AGENT',
    DELETE_AGENT = 'DELETE_AGENT',
}

export const FlowState = PopulatedFlow
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
    data: Nullable(Type.Object({
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
    status: NullableEnum(Type.Enum(TableAutomationStatus)),
    trigger: NullableEnum(Type.Enum(TableAutomationTrigger)),
})
export type TableState = Static<typeof TableState>

export const McpState = Type.Object({
    name: Type.String(),
    externalId: Type.String(),
    token: Type.String(),
    tools: Type.Array(McpTool),
})
export type McpState = Static<typeof McpState>

export const AgentState = Type.Object({
    externalId: Type.String(),
    displayName: Type.String(),
    description: Type.String(),
    systemPrompt: Type.String(),
    profilePictureUrl: Type.String(),
    maxSteps: Type.Number(),
    outputType: Type.Optional(Type.Enum(AgentOutputType)),
    outputFields: Type.Optional(Type.Array(AgentOutputField)),
    runCompleted: Type.Number(),
    mcp: McpState,
})

export type AgentState = Static<typeof AgentState>

export const ProjectState = Type.Object({
    flows: Type.Array(PopulatedFlow),
    // NOTE: This is optional because in old releases, the connections, tables, agents and mcp state is not present
    connections: Type.Optional(Type.Array(ConnectionState)),
    tables: Type.Optional(Type.Array(TableState)),
    agents: Type.Optional(Type.Array(AgentState)),
})
export type ProjectState = Static<typeof ProjectState>

export const ProjectOperation = Type.Union([
    Type.Object({
        type: Type.Literal(FlowProjectOperationType.UPDATE_FLOW),
        newFlowState: FlowState,
        flowState: FlowState,
    }),
    Type.Object({
        type: Type.Literal(FlowProjectOperationType.CREATE_FLOW),
        flowState: FlowState,
    }),
    Type.Object({
        type: Type.Literal(FlowProjectOperationType.DELETE_FLOW),
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
    Type.Object({
        type: Type.Literal(TableOperationType.DELETE_TABLE),
        tableState: TableState,
    }),
])
export type TableOperation = Static<typeof TableOperation>

export const AgentOperation = Type.Union([
    Type.Object({
        type: Type.Literal(AgentOperationType.UPDATE_AGENT),
        newAgentState: AgentState,
        agentState: AgentState,
    }),
    Type.Object({
        type: Type.Literal(AgentOperationType.CREATE_AGENT),
        agentState: AgentState,
    }),
    Type.Object({
        type: Type.Literal(AgentOperationType.DELETE_AGENT),
        agentState: AgentState,
    }),
])
export type AgentOperation = Static<typeof AgentOperation>

export const DiffState = Type.Object({
    flows: Type.Array(ProjectOperation),
    connections: Type.Array(ConnectionOperation),
    tables: Type.Array(TableOperation),
    agents: Type.Array(AgentOperation),
})
export type DiffState = Static<typeof DiffState>


export const FlowSyncError = Type.Object({
    flowId: Type.String(),
    message: Type.String(),
})
export type FlowSyncError = Static<typeof FlowSyncError>

export const FlowProjectOperation = Type.Union([
    Type.Object({
        type: Type.Literal(FlowProjectOperationType.CREATE_FLOW),
        flow: Type.Object({
            id: Type.String(),
            displayName: Type.String(),
        }),
    }),
    Type.Object({
        type: Type.Literal(FlowProjectOperationType.UPDATE_FLOW),
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
        type: Type.Literal(FlowProjectOperationType.DELETE_FLOW),
        flow: Type.Object({
            id: Type.String(),
            displayName: Type.String(),
        }),
    }),
])
export type FlowProjectOperation = Static<typeof FlowProjectOperation>

export const ProjectSyncPlan = Type.Object({
    flows: Type.Array(FlowProjectOperation),
    connections: Type.Array(ConnectionOperation),
    tables: Type.Array(TableOperation),
    agents: Type.Array(AgentOperation),
    errors: Type.Array(FlowSyncError),
})
export type ProjectSyncPlan = Static<typeof ProjectSyncPlan>

