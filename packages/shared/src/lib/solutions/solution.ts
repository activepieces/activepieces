import { Static, Type } from '@sinclair/typebox'
import { AgentState, ConnectionState, FlowState, McpState, TableState } from '../project-release/project-state'

export const Solution = Type.Object({
    name: Type.String(),
    description: Type.String(),
    flows: Type.Optional(Type.Array(FlowState)),
    connections: Type.Optional(Type.Array(ConnectionState)),
    tables: Type.Optional(Type.Array(TableState)),
    mcp: Type.Optional(Type.Array(McpState)),
    agents: Type.Optional(Type.Array(AgentState)),
})

export type Solution = Static<typeof Solution>

export const ExportRequestQuery = Type.Object({
    name: Type.String(),
    description: Type.Optional(Type.String()),
})

export type ExportRequestQuery = Static<typeof ExportRequestQuery>
