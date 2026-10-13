import { FastifyInstance } from 'fastify'
import { beforeAll, describe, expect, it } from 'vitest'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { mcpOAuthClientService } from '../../../../src/app/mcp/oauth/client/mcp-oauth-client.service'
import { MCP_OAUTH_REDIRECT_URI, mcpOAuthTestHelpers, RegisteredClient } from '../../../helpers/mcp-oauth'
import { setupTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

async function registerClient(tokenEndpointAuthMethod?: string): Promise<RegisteredClient> {
    return mcpOAuthTestHelpers.registerClient({ app, tokenEndpointAuthMethod })
}

async function exchange({ client, headers, body }: {
    client: RegisteredClient
    headers?: Record<string, string>
    body?: Record<string, string>
}): Promise<ReturnType<FastifyInstance['inject']>> {
    const { verifier, challenge } = mcpOAuthTestHelpers.generatePkce()
    const code = await mcpOAuthTestHelpers.issueCode({ clientId: client.client_id, codeChallenge: challenge })
    return app.inject({
        method: 'POST',
        url: '/token',
        headers: { 'content-type': 'application/x-www-form-urlencoded', ...headers },
        payload: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            code_verifier: verifier,
            redirect_uri: MCP_OAUTH_REDIRECT_URI,
            ...body,
        }).toString(),
    })
}

describe('MCP OAuth client authentication', () => {
    beforeAll(async () => {
        app = await setupTestEnvironment({ fresh: true })
    })

    describe('dynamic client registration', () => {
        it('defaults an omitted token_endpoint_auth_method to client_secret_basic and issues a secret (RFC 7591 section 2)', async () => {
            const client = await registerClient()

            expect(client.token_endpoint_auth_method).toBe('client_secret_basic')
            expect(typeof client.client_secret).toBe('string')
        })

        it('issues no secret when the client explicitly registers as public', async () => {
            const client = await registerClient('none')

            expect(client.token_endpoint_auth_method).toBe('none')
            expect(client.client_secret).toBeUndefined()
        })

        it('issues a secret for an explicit client_secret_basic registration', async () => {
            const client = await registerClient('client_secret_basic')

            expect(client.token_endpoint_auth_method).toBe('client_secret_basic')
            expect(typeof client.client_secret).toBe('string')
        })

        it('rejects an auth method outside the supported set', async () => {
            const res = await app.inject({
                method: 'POST',
                url: '/register',
                payload: { redirect_uris: [MCP_OAUTH_REDIRECT_URI], token_endpoint_auth_method: 'private_key_jwt' },
            })

            expect(res.statusCode).toBe(400)
        })

        it.each([
            ['client_name', { redirect_uris: [MCP_OAUTH_REDIRECT_URI], client_name: 'a\u0000b' }],
            ['a redirect_uri', { redirect_uris: ['https://example.com/cb\u0000x'] }],
            ['every redirect_uri', { redirect_uris: [MCP_OAUTH_REDIRECT_URI, 'https://example.com/cb\u0000x'] }],
        ])('refuses to persist a control character in %s', async (_name, payload) => {
            const res = await app.inject({ method: 'POST', url: '/register', payload })

            expect(res.statusCode).toBe(400)
            expect(res.body).not.toContain('22021')
            expect(res.body).not.toContain('invalid byte sequence')
        })

        it('keeps the issued client secret out of caches (RFC 7591 section 3.2.1)', async () => {
            const res = await app.inject({
                method: 'POST',
                url: '/register',
                payload: { redirect_uris: [MCP_OAUTH_REDIRECT_URI] },
            })

            expect(res.statusCode).toBe(201)
            expect(res.headers['cache-control']).toBe('no-store')
            expect(res.headers['pragma']).toBe('no-cache')
        })
    })

    describe('token endpoint', () => {
        it('accepts a confidential client secret from the Authorization header', async () => {
            const client = await registerClient('client_secret_basic')

            const res = await exchange({
                client,
                headers: { authorization: mcpOAuthTestHelpers.basicHeader({ clientId: client.client_id, clientSecret: client.client_secret ?? '' }) },
            })

            expect(res.statusCode).toBe(200)
            expect(res.json().access_token).toBeDefined()
        })

        it('accepts a confidential client secret from the request body', async () => {
            const client = await registerClient('client_secret_post')

            const res = await exchange({
                client,
                body: { client_id: client.client_id, client_secret: client.client_secret ?? '' },
            })

            expect(res.statusCode).toBe(200)
            expect(res.json().access_token).toBeDefined()
        })

        it('accepts a confidential client secret over either transport regardless of the registered method', async () => {
            const basicClient = await registerClient('client_secret_basic')
            const postClient = await registerClient('client_secret_post')

            const basicClientViaBody = await exchange({
                client: basicClient,
                body: { client_id: basicClient.client_id, client_secret: basicClient.client_secret ?? '' },
            })
            const postClientViaHeader = await exchange({
                client: postClient,
                headers: { authorization: mcpOAuthTestHelpers.basicHeader({ clientId: postClient.client_id, clientSecret: postClient.client_secret ?? '' }) },
            })

            expect(basicClientViaBody.statusCode).toBe(200)
            expect(postClientViaHeader.statusCode).toBe(200)
        })

        it('exchanges an authorization code for a public client with no secret', async () => {
            const client = await registerClient('none')

            const res = await exchange({ client, body: { client_id: client.client_id } })

            expect(res.statusCode).toBe(200)
            expect(res.json().access_token).toBeDefined()
        })

        it('rejects a confidential client that presents no credentials', async () => {
            const client = await registerClient('client_secret_post')

            const res = await exchange({ client, body: { client_id: client.client_id } })

            expect(res.statusCode).toBe(400)
            expect(res.json().error).toBe('invalid_client')
        })

        it('rejects a wrong secret in the Authorization header', async () => {
            const client = await registerClient('client_secret_basic')

            const res = await exchange({ client, headers: { authorization: mcpOAuthTestHelpers.basicHeader({ clientId: client.client_id, clientSecret: 'wrong-secret' }) } })

            expect(res.statusCode).toBe(400)
            expect(res.json().error).toBe('invalid_client')
        })

        it('rejects a wrong secret in the request body', async () => {
            const client = await registerClient('client_secret_post')

            const res = await exchange({ client, body: { client_id: client.client_id, client_secret: 'wrong-secret' } })

            expect(res.statusCode).toBe(400)
            expect(res.json().error).toBe('invalid_client')
        })

        it('refuses a request that presents credentials over both transports (RFC 6749 section 2.3)', async () => {
            const client = await registerClient('client_secret_basic')

            const res = await exchange({
                client,
                headers: { authorization: mcpOAuthTestHelpers.basicHeader({ clientId: client.client_id, clientSecret: client.client_secret ?? '' }) },
                body: { client_id: client.client_id, client_secret: client.client_secret ?? '' },
            })

            expect(res.statusCode).toBe(400)
            expect(res.json().error).toBe('invalid_request')
        })

        it('refuses a body secret alongside a malformed Basic header rather than silently ignoring the header', async () => {
            const client = await registerClient('client_secret_post')

            const res = await exchange({
                client,
                headers: { authorization: 'Basic ' + Buffer.from('proxy-user-with-no-colon').toString('base64') },
                body: { client_id: client.client_id, client_secret: client.client_secret ?? '' },
            })

            expect(res.statusCode).toBe(400)
            expect(res.json().error).toBe('invalid_request')
        })

        it('does not let an empty Basic username adopt the client_id from the body', async () => {
            const client = await registerClient('none')

            const res = await exchange({
                client,
                headers: { authorization: 'Basic ' + Buffer.from(':password').toString('base64') },
                body: { client_id: client.client_id },
            })

            expect(res.statusCode).toBe(400)
        })

        it('rejects a client_id in the Authorization header that disagrees with the body (RFC 6749 section 2.3.1)', async () => {
            const client = await registerClient('client_secret_post')
            const other = await registerClient('none')

            const res = await exchange({
                client,
                headers: { authorization: mcpOAuthTestHelpers.basicHeader({ clientId: other.client_id, clientSecret: '' }) },
                body: { client_id: client.client_id, client_secret: client.client_secret ?? '' },
            })

            expect(res.statusCode).toBe(400)
            expect(res.json().error).toBe('invalid_request')
        })

        it.each([
            ['empty scheme payload', 'Basic'],
            ['scheme with trailing space', 'Basic '],
            ['non-base64 payload', 'Basic !!!not-base64!!!'],
            ['colon-only payload', 'Basic ' + Buffer.from(':').toString('base64')],
            ['lowercase scheme', 'basic ' + Buffer.from('a:b').toString('base64')],
            ['bearer scheme', 'Bearer ' + Buffer.from('a:b').toString('base64')],
            ['malformed percent escape', 'Basic ' + Buffer.from('a%zz:b').toString('base64')],
        ])('never returns 5xx for a malformed Authorization header (%s)', async (_name, authorization) => {
            const client = await registerClient('none')

            const res = await exchange({ client, headers: { authorization }, body: { client_id: client.client_id } })

            expect(res.statusCode).toBeLessThan(500)
        })

        it.each([
            ['raw NUL', '%00abc'],
            ['encoded NUL', '%2500abc'],
            ['over-long identifier', 'a'.repeat(300)],
        ])('never reaches the database with an unusable client_id (%s)', async (_name, clientId) => {
            const viaBody = await app.inject({
                method: 'POST',
                url: '/token',
                headers: { 'content-type': 'application/x-www-form-urlencoded' },
                payload: `grant_type=authorization_code&code=x&code_verifier=y&redirect_uri=${MCP_OAUTH_REDIRECT_URI}&client_id=${clientId}`,
            })
            const viaHeader = await app.inject({
                method: 'POST',
                url: '/revoke',
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                    authorization: 'Basic ' + Buffer.from(`${clientId}:secret`).toString('base64'),
                },
                payload: new URLSearchParams({ token: 'x' }).toString(),
            })
            const viaQuery = await app.inject({
                method: 'GET',
                url: `/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(MCP_OAUTH_REDIRECT_URI)}&response_type=code&code_challenge=abc&code_challenge_method=S256`,
            })

            expect(viaBody.statusCode).toBe(400)
            expect(viaHeader.statusCode).toBe(400)
            expect(viaQuery.statusCode).toBe(400)
            expect(viaHeader.body).not.toContain('22021')
        })

        it('sets cache-prevention headers on a successful token response (RFC 6749 section 5.1)', async () => {
            const client = await registerClient('none')

            const res = await exchange({ client, body: { client_id: client.client_id } })

            expect(res.statusCode).toBe(200)
            expect(res.headers['cache-control']).toBe('no-store')
            expect(res.headers['pragma']).toBe('no-cache')
        })

        it('sets cache-prevention headers on an error token response (RFC 6749 section 5.2)', async () => {
            const res = await app.inject({
                method: 'POST',
                url: '/token',
                headers: { 'content-type': 'application/x-www-form-urlencoded' },
                payload: new URLSearchParams({ grant_type: 'authorization_code' }).toString(),
            })

            expect(res.statusCode).toBe(400)
            expect(res.headers['cache-control']).toBe('no-store')
            expect(res.headers['pragma']).toBe('no-cache')
        })
    })

    describe('clients registered before the auth-method fix', () => {
        async function registerLegacyClient(): Promise<RegisteredClient> {
            const client = await mcpOAuthClientService.register({
                redirectUris: [MCP_OAUTH_REDIRECT_URI],
                tokenEndpointAuthMethod: 'client_secret_post',
            })
            await databaseConnection().query(
                'UPDATE mcp_oauth_client SET "tokenEndpointAuthMethod" = \'none\' WHERE "clientId" = $1',
                [client.client_id],
            )
            return { client_id: client.client_id, client_secret: client.client_secret, token_endpoint_auth_method: 'none' }
        }

        it('keeps working when it still sends the secret it was issued', async () => {
            const legacy = await registerLegacyClient()

            const res = await exchange({
                client: legacy,
                body: { client_id: legacy.client_id, client_secret: legacy.client_secret ?? '' },
            })

            expect(res.statusCode).toBe(200)
        })

        it('keeps working when it stops sending a secret', async () => {
            const legacy = await registerLegacyClient()

            const res = await exchange({ client: legacy, body: { client_id: legacy.client_id } })

            expect(res.statusCode).toBe(200)
        })
    })

    describe('refresh grant', () => {
        async function issueRefreshToken({ client, headers, body }: {
            client: RegisteredClient
            headers?: Record<string, string>
            body?: Record<string, string>
        }): Promise<string> {
            const res = await exchange({ client, headers, body })
            expect(res.statusCode).toBe(200)
            return res.json().refresh_token
        }

        it('renews a confidential client over the Authorization header, the path a default registration takes', async () => {
            const client = await registerClient()
            const authorization = mcpOAuthTestHelpers.basicHeader({ clientId: client.client_id, clientSecret: client.client_secret ?? '' })
            const refreshToken = await issueRefreshToken({ client, headers: { authorization } })

            const res = await app.inject({
                method: 'POST',
                url: '/token',
                headers: { 'content-type': 'application/x-www-form-urlencoded', authorization },
                payload: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }).toString(),
            })

            expect(res.statusCode).toBe(200)
            expect(res.json().access_token).toBeDefined()
            expect(res.json().refresh_token).toBe(refreshToken)
        })

        it('renews a confidential client over the request body', async () => {
            const client = await registerClient('client_secret_post')
            const credentials = { client_id: client.client_id, client_secret: client.client_secret ?? '' }
            const refreshToken = await issueRefreshToken({ client, body: credentials })

            const res = await app.inject({
                method: 'POST',
                url: '/token',
                headers: { 'content-type': 'application/x-www-form-urlencoded' },
                payload: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken, ...credentials }).toString(),
            })

            expect(res.statusCode).toBe(200)
            expect(res.json().refresh_token).toBe(refreshToken)
        })

        it('keeps renewing indefinitely, so a session does not die when the access token expires', async () => {
            const client = await registerClient()
            const authorization = mcpOAuthTestHelpers.basicHeader({ clientId: client.client_id, clientSecret: client.client_secret ?? '' })
            let refreshToken = await issueRefreshToken({ client, headers: { authorization } })

            for (let renewal = 0; renewal < 3; renewal++) {
                const res = await app.inject({
                    method: 'POST',
                    url: '/token',
                    headers: { 'content-type': 'application/x-www-form-urlencoded', authorization },
                    payload: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }).toString(),
                })
                expect(res.statusCode, `renewal ${renewal}`).toBe(200)
                refreshToken = res.json().refresh_token
            }
        })

        it('refuses to renew a confidential client that presents no secret', async () => {
            const client = await registerClient()
            const authorization = mcpOAuthTestHelpers.basicHeader({ clientId: client.client_id, clientSecret: client.client_secret ?? '' })
            const refreshToken = await issueRefreshToken({ client, headers: { authorization } })

            const res = await app.inject({
                method: 'POST',
                url: '/token',
                headers: { 'content-type': 'application/x-www-form-urlencoded' },
                payload: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken, client_id: client.client_id }).toString(),
            })

            expect(res.statusCode).toBe(400)
            expect(res.json().error).toBe('invalid_client')
        })
    })

    describe('revocation endpoint', () => {
        it('accepts a confidential client authenticating with the Authorization header', async () => {
            const client = await registerClient('client_secret_basic')

            const res = await app.inject({
                method: 'POST',
                url: '/revoke',
                headers: { 'content-type': 'application/x-www-form-urlencoded', authorization: mcpOAuthTestHelpers.basicHeader({ clientId: client.client_id, clientSecret: client.client_secret ?? '' }) },
                payload: new URLSearchParams({ token: 'some-refresh-token' }).toString(),
            })

            expect(res.statusCode).toBe(200)
        })

        it('rejects a confidential client presenting a wrong secret', async () => {
            const client = await registerClient('client_secret_basic')

            const res = await app.inject({
                method: 'POST',
                url: '/revoke',
                headers: { 'content-type': 'application/x-www-form-urlencoded', authorization: mcpOAuthTestHelpers.basicHeader({ clientId: client.client_id, clientSecret: 'wrong-secret' }) },
                payload: new URLSearchParams({ token: 'some-refresh-token' }).toString(),
            })

            expect(res.statusCode).toBe(400)
            expect(res.json().error).toBe('invalid_client')
        })

        it('lets a public client revoke by naming itself', async () => {
            const client = await registerClient('none')

            const res = await app.inject({
                method: 'POST',
                url: '/revoke',
                headers: { 'content-type': 'application/x-www-form-urlencoded' },
                payload: new URLSearchParams({ token: 'some-refresh-token', client_id: client.client_id }).toString(),
            })

            expect(res.statusCode).toBe(200)
        })

        it('refuses to revoke for a caller that presents no client identity (RFC 7009 section 2.1)', async () => {
            const res = await app.inject({
                method: 'POST',
                url: '/revoke',
                headers: { 'content-type': 'application/x-www-form-urlencoded' },
                payload: new URLSearchParams({ token: 'some-refresh-token' }).toString(),
            })

            expect(res.statusCode).toBe(400)
            expect(res.json().error).toBe('invalid_client')
        })

        it('does not revoke another client\'s refresh token', async () => {
            const owner = await registerClient('none')
            const attacker = await registerClient('none')
            const { verifier, challenge } = mcpOAuthTestHelpers.generatePkce()
            const code = await mcpOAuthTestHelpers.issueCode({ clientId: owner.client_id, codeChallenge: challenge })
            const issued = await app.inject({
                method: 'POST',
                url: '/token',
                headers: { 'content-type': 'application/x-www-form-urlencoded' },
                payload: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code,
                    client_id: owner.client_id,
                    code_verifier: verifier,
                    redirect_uri: MCP_OAUTH_REDIRECT_URI,
                }).toString(),
            })
            const refreshToken = issued.json().refresh_token

            const revoke = await app.inject({
                method: 'POST',
                url: '/revoke',
                headers: { 'content-type': 'application/x-www-form-urlencoded' },
                payload: new URLSearchParams({ token: refreshToken, client_id: attacker.client_id }).toString(),
            })
            const refreshed = await app.inject({
                method: 'POST',
                url: '/token',
                headers: { 'content-type': 'application/x-www-form-urlencoded' },
                payload: new URLSearchParams({
                    grant_type: 'refresh_token',
                    client_id: owner.client_id,
                    refresh_token: refreshToken,
                }).toString(),
            })

            expect(revoke.statusCode).toBe(200)
            expect(refreshed.statusCode).toBe(200)
        })

        it('rejects a confidential client naming itself in the body without a secret', async () => {
            const client = await registerClient('client_secret_basic')

            const res = await app.inject({
                method: 'POST',
                url: '/revoke',
                headers: { 'content-type': 'application/x-www-form-urlencoded' },
                payload: new URLSearchParams({ token: 'some-refresh-token', client_id: client.client_id }).toString(),
            })

            expect(res.statusCode).toBe(400)
            expect(res.json().error).toBe('invalid_client')
        })
    })
})
