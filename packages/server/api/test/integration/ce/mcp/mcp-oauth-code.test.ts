import { createHash, randomBytes } from 'node:crypto'
import { apId } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { beforeAll, describe, expect, it } from 'vitest'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { mcpOAuthCodeService } from '../../../../src/app/mcp/oauth/code/mcp-oauth-code.service'
import { setupTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

const REDIRECT_URI = 'https://example.com/oauth/callback'
const OTHER_REDIRECT_URI = 'https://example.com/other/callback'

async function registerPublicClient(redirectUris: string[] = [REDIRECT_URI]): Promise<string> {
    const res = await app.inject({
        method: 'POST',
        url: '/register',
        payload: { redirect_uris: redirectUris, token_endpoint_auth_method: 'none' },
    })
    return res.json().client_id
}

function generatePkce(): { verifier: string, challenge: string } {
    const verifier = randomBytes(32).toString('base64url')
    return { verifier, challenge: createHash('sha256').update(verifier).digest('base64url') }
}

async function issueCode(clientId: string, codeChallenge: string, redirectUri = REDIRECT_URI): Promise<string> {
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

function redeem({ clientId, code, verifier, redirectUri = REDIRECT_URI }: {
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
        const { verifier, challenge } = generatePkce()
        const code = await issueCode(clientId, challenge)

        const first = await redeem({ clientId, code, verifier })
        const second = await redeem({ clientId, code, verifier })

        expect(first.statusCode).toBe(200)
        expect(second.statusCode).toBe(400)
        expect(second.json().error).toBe('invalid_grant')
    })

    it('redeems a code exactly once under concurrent redemption', async () => {
        const clientId = await registerPublicClient()
        const { verifier, challenge } = generatePkce()
        const code = await issueCode(clientId, challenge)

        const results = await Promise.all(
            Array.from({ length: 4 }, () => redeem({ clientId, code, verifier })),
        )

        expect(results.filter((res) => res.statusCode === 200)).toHaveLength(1)
    })

    it('refuses a code presented by a different client', async () => {
        const owner = await registerPublicClient()
        const attacker = await registerPublicClient()
        const { verifier, challenge } = generatePkce()
        const code = await issueCode(owner, challenge)

        const res = await redeem({ clientId: attacker, code, verifier })

        expect(res.statusCode).toBe(400)
        expect(res.json().error).toBe('invalid_grant')
    })

    it('refuses a code presented with a different redirect_uri', async () => {
        const clientId = await registerPublicClient([REDIRECT_URI, OTHER_REDIRECT_URI])
        const { verifier, challenge } = generatePkce()
        const code = await issueCode(clientId, challenge)

        const res = await redeem({ clientId, code, verifier, redirectUri: OTHER_REDIRECT_URI })

        expect(res.statusCode).toBe(400)
        expect(res.json().error).toBe('invalid_grant')
    })

    it('refuses an expired code', async () => {
        const clientId = await registerPublicClient()
        const { verifier, challenge } = generatePkce()
        const code = await issueCode(clientId, challenge)
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
        const { challenge } = generatePkce()
        const code = await issueCode(clientId, challenge)

        const res = await redeem({ clientId, code, verifier: randomBytes(32).toString('base64url') })

        expect(res.statusCode).toBe(400)
        expect(res.json().error).toBe('invalid_grant')
    })
})
