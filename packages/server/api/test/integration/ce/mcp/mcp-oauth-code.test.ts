import { randomBytes } from 'node:crypto'
import { FastifyInstance } from 'fastify'
import { beforeAll, describe, expect, it } from 'vitest'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { MCP_OAUTH_REDIRECT_URI, mcpOAuthTestHelpers } from '../../../helpers/mcp-oauth'
import { setupTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

const OTHER_REDIRECT_URI = 'https://example.com/other/callback'

async function registerPublicClient(redirectUris: string[] = [MCP_OAUTH_REDIRECT_URI]): Promise<string> {
    const client = await mcpOAuthTestHelpers.registerClient({ app, tokenEndpointAuthMethod: 'none', redirectUris })
    return client.client_id
}

function redeem({ clientId, code, verifier, redirectUri = MCP_OAUTH_REDIRECT_URI }: {
    clientId: string
    code: string
    verifier: string
    redirectUri?: string
}): ReturnType<FastifyInstance['inject']> {
    return app.inject({
        method: 'POST',
        url: '/token',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        payload: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            client_id: clientId,
            code_verifier: verifier,
            redirect_uri: redirectUri,
        }).toString(),
    })
}

describe('MCP OAuth authorization code redemption', () => {
    beforeAll(async () => {
        app = await setupTestEnvironment({ fresh: true })
    })

    it('redeems a code exactly once', async () => {
        const clientId = await registerPublicClient()
        const { verifier, challenge } = mcpOAuthTestHelpers.generatePkce()
        const code = await mcpOAuthTestHelpers.issueCode({ clientId, codeChallenge: challenge })

        const first = await redeem({ clientId, code, verifier })
        const second = await redeem({ clientId, code, verifier })

        expect(first.statusCode).toBe(200)
        expect(second.statusCode).toBe(400)
        expect(second.json().error).toBe('invalid_grant')
    })

    it('redeems a code exactly once under concurrent redemption', async () => {
        const clientId = await registerPublicClient()
        const { verifier, challenge } = mcpOAuthTestHelpers.generatePkce()
        const code = await mcpOAuthTestHelpers.issueCode({ clientId, codeChallenge: challenge })

        const results = await Promise.all(
            Array.from({ length: 4 }, () => redeem({ clientId, code, verifier })),
        )

        expect(results.filter((res) => res.statusCode === 200)).toHaveLength(1)
    })

    it('refuses a code presented by a different client', async () => {
        const owner = await registerPublicClient()
        const attacker = await registerPublicClient()
        const { verifier, challenge } = mcpOAuthTestHelpers.generatePkce()
        const code = await mcpOAuthTestHelpers.issueCode({ clientId: owner, codeChallenge: challenge })

        const res = await redeem({ clientId: attacker, code, verifier })

        expect(res.statusCode).toBe(400)
        expect(res.json().error).toBe('invalid_grant')
    })

    it('refuses a code presented with a different redirect_uri', async () => {
        const clientId = await registerPublicClient([MCP_OAUTH_REDIRECT_URI, OTHER_REDIRECT_URI])
        const { verifier, challenge } = mcpOAuthTestHelpers.generatePkce()
        const code = await mcpOAuthTestHelpers.issueCode({ clientId, codeChallenge: challenge })

        const res = await redeem({ clientId, code, verifier, redirectUri: OTHER_REDIRECT_URI })

        expect(res.statusCode).toBe(400)
        expect(res.json().error).toBe('invalid_grant')
    })

    it('refuses an expired code', async () => {
        const clientId = await registerPublicClient()
        const { verifier, challenge } = mcpOAuthTestHelpers.generatePkce()
        const code = await mcpOAuthTestHelpers.issueCode({ clientId, codeChallenge: challenge })
        await databaseConnection().query(
            'UPDATE mcp_oauth_authorization_code SET "expiresAt" = NOW() - INTERVAL \'1 hour\' WHERE "code" = $1',
            [code],
        )

        const res = await redeem({ clientId, code, verifier })

        expect(res.statusCode).toBe(400)
        expect(res.json().error).toBe('invalid_grant')
    })

    it('refuses a code presented with the wrong PKCE verifier', async () => {
        const clientId = await registerPublicClient()
        const { challenge } = mcpOAuthTestHelpers.generatePkce()
        const code = await mcpOAuthTestHelpers.issueCode({ clientId, codeChallenge: challenge })

        const res = await redeem({ clientId, code, verifier: randomBytes(32).toString('base64url') })

        expect(res.statusCode).toBe(400)
        expect(res.json().error).toBe('invalid_grant')
    })
})
