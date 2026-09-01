import { ApId, BaseModelSchema, OptionalArrayFromQuery } from '@activepieces/core-utils'
import { z } from 'zod'
import { UserWithMetaInformation } from '../../core/user/user'

export const McpOAuthClientKey = z.enum(['claude', 'claude-code', 'chatgpt', 'cursor', 'vscode', 'codex', 'gemini-cli', 'opencode', 'windsurf', 'unknown'])

export type McpOAuthClientKey = z.infer<typeof McpOAuthClientKey>

export const McpOAuthClient = z.object({
    ...BaseModelSchema,
    clientId: z.string(),
    clientSecret: z.string().nullable(),
    clientSecretExpiresAt: z.coerce.number(),
    clientIdIssuedAt: z.coerce.number(),
    redirectUris: z.array(z.string()),
    clientName: z.string().nullable(),
    grantTypes: z.array(z.string()),
    tokenEndpointAuthMethod: z.string(),
})

export type McpOAuthClient = z.infer<typeof McpOAuthClient>

export const McpOAuthToken = z.object({
    ...BaseModelSchema,
    refreshToken: z.string(),
    clientId: z.string(),
    clientKey: McpOAuthClientKey.nullable(),
    userId: z.string(),
    projectId: z.string().nullable(),
    platformId: z.string(),
    scopes: z.array(z.string()).nullable(),
    expiresAt: z.string(),
    revoked: z.boolean(),
    lastUsedAt: z.string().nullable(),
})

export type McpOAuthToken = z.infer<typeof McpOAuthToken>

export const McpOAuthAuthorizationCode = z.object({
    ...BaseModelSchema,
    code: z.string(),
    clientId: z.string(),
    userId: z.string(),
    projectId: z.string().nullable(),
    platformId: z.string(),
    redirectUri: z.string(),
    codeChallenge: z.string(),
    codeChallengeMethod: z.string(),
    scopes: z.array(z.string()).nullable(),
    state: z.string().nullable(),
    expiresAt: z.string(),
    used: z.boolean(),
})

export type McpOAuthAuthorizationCode = z.infer<typeof McpOAuthAuthorizationCode>

export const McpOAuthGrant = z.object({
    id: z.string(),
    clientKey: McpOAuthClientKey,
    clientName: z.string().nullable(),
    projectId: z.string().nullable(),
    projectName: z.string().nullable(),
    member: UserWithMetaInformation.nullable(),
    created: z.string(),
    lastUsedAt: z.string().nullable(),
})

export type McpOAuthGrant = z.infer<typeof McpOAuthGrant>

export const ListMcpOAuthGrantsRequestQuery = z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    projectIds: OptionalArrayFromQuery(z.string()),
    memberIds: OptionalArrayFromQuery(ApId),
    clientKeys: OptionalArrayFromQuery(McpOAuthClientKey),
})

export type ListMcpOAuthGrantsRequestQuery = z.infer<typeof ListMcpOAuthGrantsRequestQuery>

export const RevokeMcpOAuthGrantsRequestBody = z.object({
    ids: z.array(ApId).min(1).max(100),
})

export type RevokeMcpOAuthGrantsRequestBody = z.infer<typeof RevokeMcpOAuthGrantsRequestBody>

export const PLATFORM_WIDE_PROJECT_FILTER_VALUE = 'platform-wide'
