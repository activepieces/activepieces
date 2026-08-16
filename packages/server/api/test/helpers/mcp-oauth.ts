import { createHash, randomBytes } from 'node:crypto'
import { apId } from '@activepieces/core-utils'
import { FastifyInstance } from 'fastify'
import { mcpOAuthCodeService } from '../../src/app/mcp/oauth/code/mcp-oauth-code.service'

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

async function issueCode({ clientId, codeChallenge, redirectUri = MCP_OAUTH_REDIRECT_URI }: IssueCodeParams): Promise<string> {
    return mcpOAuthCodeService.create({
        clientId,
        userId: apId(),
        projectId: apId(),
        platformId: apId(),
        redirectUri,
        codeChallenge,
        codeChallengeMethod: 'S256',
        scopes: ['mcp'],
    })
}

function basicHeader({ clientId, clientSecret }: { clientId: string, clientSecret: string }): string {
    return 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
}

export const mcpOAuthTestHelpers = {
    generatePkce,
    registerClient,
    issueCode,
    basicHeader,
}

export const MCP_OAUTH_REDIRECT_URI = 'https://example.com/oauth/callback'

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

type IssueCodeParams = {
    clientId: string
    codeChallenge: string
    redirectUri?: string
}
