import { ApId, BaseModelSchema, OptionalArrayFromQuery } from '@activepieces/core-utils'
import { z } from 'zod'
import { UserWithMetaInformation } from '../../core/user/user'

export const McpActivityKind = z.enum(['ACTION', 'FLOW', 'PLATFORM_TOOL'])

export type McpActivityKind = z.infer<typeof McpActivityKind>

export const McpActivityStatus = z.enum(['SUCCEEDED', 'FAILED'])

export type McpActivityStatus = z.infer<typeof McpActivityStatus>

export const McpActivity = z.object({
    ...BaseModelSchema,
    platformId: z.string(),
    projectId: z.string().nullable(),
    userId: z.string(),
    toolName: z.string(),
    kind: McpActivityKind,
    status: McpActivityStatus,
    pieceName: z.string().nullable(),
    actionName: z.string().nullable(),
    flowId: z.string().nullable(),
    flowRunId: z.string().nullable(),
    errorMessage: z.string().nullable(),
    durationMs: z.number(),
    payloadFileId: z.string().nullable(),
    payloadTruncated: z.boolean(),
})

export type McpActivity = z.infer<typeof McpActivity>

export const McpActivityEntry = z.object({
    id: z.string(),
    created: z.string(),
    kind: McpActivityKind,
    status: McpActivityStatus,
    toolName: z.string(),
    member: UserWithMetaInformation.nullable(),
    projectId: z.string().nullable(),
    projectName: z.string().nullable(),
    pieceName: z.string().nullable(),
    actionName: z.string().nullable(),
    flowId: z.string().nullable(),
    flowRunId: z.string().nullable(),
    errorMessage: z.string().nullable(),
    durationMs: z.number(),
    hasPayload: z.boolean(),
})

export type McpActivityEntry = z.infer<typeof McpActivityEntry>

export const ListMcpActivityResponse = z.object({
    data: z.array(McpActivityEntry),
    next: z.string().nullable(),
    previous: z.string().nullable(),
})

export type ListMcpActivityResponse = z.infer<typeof ListMcpActivityResponse>

export const ListMcpActivityRequestQuery = z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    projectIds: OptionalArrayFromQuery(z.string()),
    memberIds: OptionalArrayFromQuery(ApId),
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

export const PLATFORM_WIDE_PROJECT_FILTER_VALUE = 'platform-wide'
