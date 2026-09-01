import { ApId, BaseModelSchema, OptionalArrayFromQuery } from '@activepieces/core-utils'
import { z } from 'zod'
import { UserWithMetaInformation } from '../../core/user/user'
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

export const PopulatedMcpActivity = z.object({
    id: z.string(),
    created: z.string(),
    status: McpActivityStatus,
    toolName: z.string(),
    clientKey: McpOAuthClientKey.nullable(),
    member: UserWithMetaInformation.nullable(),
    projectId: z.string().nullable(),
    projectName: z.string().nullable(),
    pieceName: z.string().nullable(),
    actionName: z.string().nullable(),
    connectionExternalId: z.string().nullable(),
    connectionDisplayName: z.string().nullable(),
    errorMessage: z.string().nullable(),
    durationMs: z.number(),
    hasPayload: z.boolean(),
})

export type PopulatedMcpActivity = z.infer<typeof PopulatedMcpActivity>

export const ListMcpActivityRequestQuery = z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    projectIds: OptionalArrayFromQuery(z.string()),
    memberIds: OptionalArrayFromQuery(ApId),
    clientKeys: OptionalArrayFromQuery(McpOAuthClientKey),
    statuses: OptionalArrayFromQuery(McpActivityStatus),
    createdAfter: z.string().optional(),
    createdBefore: z.string().optional(),
})

export type ListMcpActivityRequestQuery = z.infer<typeof ListMcpActivityRequestQuery>

export const McpActivityPayload = z.object({
    input: z.unknown(),
    output: z.unknown(),
    truncated: z.boolean(),
})

export type McpActivityPayload = z.infer<typeof McpActivityPayload>

export const GetMcpActivityPayloadParams = z.object({
    id: ApId,
})

export type GetMcpActivityPayloadParams = z.infer<typeof GetMcpActivityPayloadParams>

export const MCP_ACTIVITY_PAYLOAD_MAX_BYTES = 128 * 1024
