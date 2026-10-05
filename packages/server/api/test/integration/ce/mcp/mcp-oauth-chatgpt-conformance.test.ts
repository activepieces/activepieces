import { FastifyInstance } from 'fastify'
import { beforeAll, describe, expect, it } from 'vitest'
import { MCP_OAUTH_REDIRECT_URI, mcpOAuthTestHelpers } from '../../../helpers/mcp-oauth'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance
let ctx: TestContext

const CHATGPT_RELAY_STATE = 'openai_platform_oauth_relay__eyJvYXV0aF9pZCI6Im9hdXRoX3NfMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAiLCJhcHBfaWQiOiJhc2RrX2FwcF8xMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMSIsInZlcnNpb25faWQiOiJhc2RrX2FwcF92XzIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyIiwib3JnX2lkIjoib3JnLTMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMyIsInRhcmdldF91cmkiOiJodHRwczovL3BsYXRmb3JtLm9wZW5haS5jb20vcGx1Z2lucy9lZGl0L2FzZGtfYXBwXzExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExL2FzZGtfYXBwX3ZfMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI/c2VjdGlvbj1NQ1ArU2VydmVyIn0='

const STATE_LIMIT = 2048

async function authorize({ state }: { state: string }): ReturnType<FastifyInstance['inject']> {
    const client = await mcpOAuthTestHelpers.registerClient({ app, tokenEndpointAuthMethod: 'none' })
    const { challenge } = mcpOAuthTestHelpers.generatePkce()

    return app.inject({
        method: 'GET',
        url: '/authorize?' + new URLSearchParams({
            client_id: client.client_id,
            redirect_uri: MCP_OAUTH_REDIRECT_URI,
            response_type: 'code',
            code_challenge: challenge,
            code_challenge_method: 'S256',
            scope: 'mcp',
            resource: 'https://cloud.activepieces.com/mcp/platform',
            state,
        }).toString(),
    })
}

function authRequestIdFrom(location: string): string {
    return new URL(location, MCP_OAUTH_REDIRECT_URI).searchParams.get('authRequestId') ?? ''
}

async function consentThenApprove({ state }: { state: string }): Promise<URL> {
    const consent = await authorize({ state })
    expect(consent.statusCode).toBe(302)

    const approved = await ctx.post('/v1/mcp-oauth/approve', {
        authRequestId: authRequestIdFrom(String(consent.headers.location)),
        projectId: ctx.project.id,
    })
    expect(approved.statusCode).toBe(200)

    return new URL(approved.json().redirectUrl)
}

describe('ChatGPT platform connector conformance', () => {
    beforeAll(async () => {
        app = await setupTestEnvironment({ fresh: true })
        ctx = await createTestContext(app)
    })

    it('returns the relay state to the connector unchanged after consent', async () => {
        expect(CHATGPT_RELAY_STATE.length).toBeGreaterThan(512)

        const redirect = await consentThenApprove({ state: CHATGPT_RELAY_STATE })
        expect(redirect.searchParams.get('state')).toBe(CHATGPT_RELAY_STATE)
        expect(redirect.searchParams.get('code')).toEqual(expect.any(String))
    })

    it('stores and returns a relay state at the length limit', async () => {
        const state = 'a'.repeat(STATE_LIMIT)

        const redirect = await consentThenApprove({ state })

        expect(redirect.searchParams.get('state')).toBe(state)
        expect(redirect.searchParams.get('code')).toEqual(expect.any(String))
    })

    it('refuses a relay state beyond the length limit without a 5xx', async () => {
        const consent = await authorize({ state: 'a'.repeat(STATE_LIMIT + 1) })

        expect(consent.statusCode).toBe(400)
    })
})
