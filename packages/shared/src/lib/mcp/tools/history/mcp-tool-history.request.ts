import { Static, Type } from '@sinclair/typebox'
import { ApId } from '../../../common/id-generator'
import { McpToolHistoryStatus } from './mcp-tool-history'

export const ListMcpToolHistoryRequest = Type.Object({
    mcpId: ApId,
    cursorRequest: Type.Optional(Type.String()),
    limit: Type.Optional(Type.Number()),
    status: Type.Optional(Type.Array(Type.Enum(McpToolHistoryStatus))),
    metadata: Type.Optional(Type.String()),
})

export type ListMcpToolHistoryRequest = Static<typeof ListMcpToolHistoryRequest>