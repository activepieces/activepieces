import { createHash, randomBytes } from 'node:crypto'
import { spreadIfDefined } from '@activepieces/core-utils'
import { McpOAuthToken } from '@activepieces/shared'
import { FastifyInstance, LightMyRequestResponse } from 'fastify'
import { mcpOAuthClientService } from '../../src/app/mcp/oauth/client/mcp-oauth-client.service'
import { mcpOAuthCodeService } from '../../src/app/mcp/oauth/code/mcp-oauth-code.service'
import { mcpOAuthTokenService } from '../../src/app/mcp/oauth/token/mcp-oauth-token.service'
import { db } from './db'

function generatePkce(): PkcePair {
    const verifier = randomBytes(32).toString('base64url')
    return { verifier, challenge: createHash('sha256').update(verifier).digest('base64url') }
}

async function registerClient({ app, tokenEndpointAuthMethod, redirectUris = [MCP_OAUTH_REDIRECT_URI] }: RegisterClientParams): Promise<RegisteredClient> {
    const payload: Record<string, unknown> = { redirect_uris: redirectUris }
    if (tokenEndpointAuthMethod !== undefined) {
        payload.token_endpoint_auth_method = tokenEndpointAuthMethod
    }
    const res = await app.inject({ method: 'POST', url: '/register', payload })
    return res.json()
}

async function issueCode({ clientId, codeChallenge, redirectUri = MCP_OAUTH_REDIRECT_URI, userId, projectId, platformId }: IssueCodeParams): Promise<string> {
    return mcpOAuthCodeService.create({
        clientId,
        userId,
        projectId,
        platformId,
        redirectUri,
        codeChallenge,
        codeChallengeMethod: 'S256',
        scopes: ['mcp'],
    })
}

async function exchangeGrant({ userId, projectId, platformId }: McpGrantee): Promise<ExchangedGrant> {
    const { client_id: clientId } = await mcpOAuthClientService.register({ redirectUris: [MCP_OAUTH_REDIRECT_URI], tokenEndpointAuthMethod: 'none' })
    const { verifier, challenge } = generatePkce()
    const tokens = await mcpOAuthTokenService.exchangeCode({
        redirectUris: [MCP_OAUTH_REDIRECT_URI],
        codeVerifier: verifier,
        codeChallenge: challenge,
        codeChallengeMethod: 'S256',
        clientId,
        userId,
        projectId,
        platformId,
        scopes: ['mcp'],
    })
    const grant = await db.findOneBy<McpOAuthToken>('mcp_oauth_token', { clientId })
    if (grant === null || tokens.refresh_token === undefined) {
        throw new Error('expected exchangeCode to persist a grant and return a refresh token')
    }
    return { grantId: grant.id, clientId, accessToken: tokens.access_token, refreshToken: tokens.refresh_token }
}

async function authorize({ app, resource, redirectUri = MCP_OAUTH_REDIRECT_URI, redirectUris = [redirectUri] }: AuthorizeParams): Promise<string> {
    const client = await registerClient({ app, tokenEndpointAuthMethod: 'none', redirectUris })
    const { challenge } = generatePkce()
    const res = await app.inject({
        method: 'GET',
        url: '/authorize?' + new URLSearchParams({
            client_id: client.client_id,
            redirect_uri: redirectUri,
            response_type: 'code',
            code_challenge: challenge,
            code_challenge_method: 'S256',
            ...spreadIfDefined('resource', resource),
        }).toString(),
    })
    return new URL(String(res.headers.location), redirectUri).searchParams.get('authRequestId') ?? ''
}

function callMcp({ app, accessToken }: { app: FastifyInstance, accessToken: string }): Promise<LightMyRequestResponse> {
    return app.inject({
        method: 'POST',
        url: '/mcp',
        headers: {
            authorization: `Bearer ${accessToken}`,
            accept: 'application/json, text/event-stream',
            'content-type': 'application/json',
        },
        payload: {
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'mcp-test', version: '1.0.0' } },
        },
    })
}

function basicHeader({ clientId, clientSecret }: { clientId: string, clientSecret: string }): string {
    return 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
}

export const mcpOAuthTestHelpers = {
    generatePkce,
    registerClient,
    issueCode,
    exchangeGrant,
    authorize,
    callMcp,
    basicHeader,
}

export const MCP_OAUTH_REDIRECT_URI = 'https://example.com/oauth/callback'

export type McpGrantee = {
    userId: string
    projectId: string | null
    platformId: string
}

export type RegisteredClient = {
    client_id: string
    client_secret?: string
    token_endpoint_auth_method: string
}

type PkcePair = {
    verifier: string
    challenge: string
}

type RegisterClientParams = {
    app: FastifyInstance
    tokenEndpointAuthMethod?: string
    redirectUris?: string[]
}

type ExchangedGrant = {
    grantId: string
    clientId: string
    accessToken: string
    refreshToken: string
}

type AuthorizeParams = {
    app: FastifyInstance
    resource?: string
    redirectUri?: string
    redirectUris?: string[]
}

type IssueCodeParams = McpGrantee & {
    clientId: string
    codeChallenge: string
    redirectUri?: string
}
