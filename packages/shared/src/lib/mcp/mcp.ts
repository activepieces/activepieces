import { Static, Type } from '@sinclair/typebox'
import { z } from 'zod'
import { BaseModelSchema } from '../common'
import { ApId } from '../common/id-generator'
import { PopulatedFlow } from '../flows/flow'

export type McpId = ApId

export const MCP_TRIGGER_PIECE_NAME = '@activepieces/piece-mcp'

export enum McpServerStatus {
    ENABLED = 'ENABLED',
    DISABLED = 'DISABLED',
}

export const McpServer = Type.Object({
    ...BaseModelSchema,
    projectId: ApId,
    status: Type.Enum(McpServerStatus),
    token: ApId,
})

export const PopulatedMcpServer = Type.Composite([McpServer, Type.Object({
    flows: Type.Array(PopulatedFlow),
})])
export type PopulatedMcpServer = Static<typeof PopulatedMcpServer>

export type McpServer = Static<typeof McpServer>


export const UpdateMcpServerRequest = Type.Object({
    status: Type.Enum(McpServerStatus),
})

export type UpdateMcpServerRequest = Static<typeof UpdateMcpServerRequest>

/** Tool definition for MCP: inputSchema is a raw Zod shape (same as MCP expects). */
export type McpToolDefinition = {
    title: string
    description: string
    inputSchema: Record<string, z.ZodTypeAny>
    execute: (args: Record<string, unknown>) => Promise<{ content: Array<{ type: 'text', text: string }> }>
}