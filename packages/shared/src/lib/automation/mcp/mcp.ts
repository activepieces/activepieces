import { z } from 'zod'
import { BaseModelSchema } from '../../core/common'
import { ApId } from '../../core/common/id-generator'
import { Permission } from '../../core/common/security/permission'
import { PopulatedFlow } from '../flows/flow'

export type McpId = ApId

export const MCP_TRIGGER_PIECE_NAME = '@activepieces/piece-mcp'

export enum McpServerStatus {
    ENABLED = 'ENABLED',
    DISABLED = 'DISABLED',
}

export const McpServer = z.object({
    ...BaseModelSchema,
    projectId: ApId,
    status: z.nativeEnum(McpServerStatus),
    token: ApId,
    enabledTools: z.array(z.string()).nullable(),
})

export const PopulatedMcpServer = McpServer.extend({
    flows: z.array(PopulatedFlow),
})
export type PopulatedMcpServer = z.infer<typeof PopulatedMcpServer>

export type McpServer = z.infer<typeof McpServer>


export const UpdateMcpServerRequest = z.object({
    status: z.nativeEnum(McpServerStatus).optional(),
    enabledTools: z.array(z.string()).optional(),
})

export type UpdateMcpServerRequest = z.infer<typeof UpdateMcpServerRequest>

/** Tool definition for MCP: inputSchema is a raw Zod shape (same as MCP expects). */
export type McpToolDefinition = {
    title: string
    description: string
    inputSchema: Record<string, z.ZodTypeAny>
    annotations?: {
        readOnlyHint?: boolean
        destructiveHint?: boolean
        idempotentHint?: boolean
        openWorldHint?: boolean
    }
    permission?: Permission
    execute: (args: Record<string, unknown>) => Promise<{ content: Array<{ type: 'text', text: string }> }>
}
