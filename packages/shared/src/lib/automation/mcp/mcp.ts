import { z } from 'zod'
import { BaseModelSchema } from '../../core/common'
import { ApId } from '../../core/common/id-generator'
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
})

export const PopulatedMcpServer = McpServer.extend({
    flows: z.array(PopulatedFlow),
})
export type PopulatedMcpServer = z.infer<typeof PopulatedMcpServer>

export type McpServer = z.infer<typeof McpServer>


export const UpdateMcpServerRequest = z.object({
    status: z.nativeEnum(McpServerStatus),
})

export type UpdateMcpServerRequest = z.infer<typeof UpdateMcpServerRequest>
