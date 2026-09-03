import { BaseModelSchema } from '@activepieces/core-utils'
import { z } from 'zod'
import { McpOAuthClientKey } from './mcp-oauth'

export const McpActivityStatus = z.enum(['SUCCEEDED', 'FAILED'])

export type McpActivityStatus = z.infer<typeof McpActivityStatus>

export const McpActivity = z.object({
    ...BaseModelSchema,
    platformId: z.string(),
    projectId: z.string().nullable(),
    userId: z.string(),
    clientKey: McpOAuthClientKey.nullable(),
    toolName: z.string(),
    status: McpActivityStatus,
    pieceName: z.string().nullable(),
    actionName: z.string().nullable(),
    connectionExternalId: z.string().nullable(),
    errorMessage: z.string().nullable(),
    durationMs: z.number(),
    payloadFileId: z.string().nullable(),
    payloadTruncated: z.boolean(),
})

export type McpActivity = z.infer<typeof McpActivity>

export const MCP_ACTIVITY_PAYLOAD_MAX_BYTES = 128 * 1024
