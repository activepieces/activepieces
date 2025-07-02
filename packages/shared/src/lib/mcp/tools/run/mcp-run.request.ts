import { Static, Type } from '@sinclair/typebox'
import { ApId } from '../../../common/id-generator'
import { McpRunStatus } from './mcp-run'

export const ListMcpRunRequest = Type.Object({
    projectId: ApId,
    mcpId: ApId,
    cursorRequest: Type.Optional(Type.String()),
    limit: Type.Optional(Type.Number()),
    status: Type.Optional(Type.Array(Type.Enum(McpRunStatus))),
    metadata: Type.Optional(Type.String()),
})

export type ListMcpRunRequest = Static<typeof ListMcpRunRequest>