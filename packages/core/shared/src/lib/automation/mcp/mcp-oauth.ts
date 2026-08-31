import { BaseModelSchema } from '@activepieces/core-utils'
import { z } from 'zod'

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
