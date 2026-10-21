import { AppConnectionType, OAuth2GrantType } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockPost = vi.fn()
vi.mock('@activepieces/server-utils', () => ({
    safeHttp: {
        retryingAxios: {
            post: (...args: unknown[]) => mockPost(...args),
        },
    },
}))

const mockResolveString = vi.fn()
vi.mock('../../../../src/app/ee/secret-managers/secret-managers.service', () => ({
    secretManagersService: () => ({ resolveString: mockResolveString }),
}))

// oauth2-util.ts imports pieceMetadataService, whose module chain touches DB config at
// import time; credentialsOauth2Service never calls it, but the import graph still does.
vi.mock('../../../../src/app/pieces/metadata/piece-metadata-service', () => ({
    pieceMetadataService: () => ({ getOrThrow: vi.fn() }),
}))

import { credentialsOauth2Service } from '../../../../src/app/app-connection/app-connection-service/oauth2/services/credentials-oauth2-service'

const log = {} as never
const service = credentialsOauth2Service(log)
const RESOURCE = 'https://mcp.example.com/mcp'

function tokenResponseBody(): { data: Record<string, unknown> } {
    return { data: { access_token: 'token', refresh_token: 'refresh', expires_in: 3600 } }
}

describe('credentialsOauth2Service.claim', () => {
    beforeEach(() => {
        mockPost.mockReset()
        mockPost.mockResolvedValue(tokenResponseBody())
    })

    it('sends the RFC 8707 resource indicator on the authorization_code token request when discovery set one', async () => {
        await service.claim({
            projectId: undefined,
            platformId: 'platform',
            pieceName: 'mcp-client',
            request: {
                code: 'auth-code',
                clientId: 'client-id',
                clientSecret: 'client-secret',
                tokenUrl: 'https://as.example.com/token',
                redirectUrl: 'https://redirect',
                resource: RESOURCE,
            },
        })

        const [, body] = mockPost.mock.calls[0]
        expect((body as URLSearchParams).get('resource')).toBe(RESOURCE)
    })

    it('omits resource from the token request when discovery did not set one (unrelated, non-discoverable pieces)', async () => {
        await service.claim({
            projectId: undefined,
            platformId: 'platform',
            pieceName: 'zoom',
            request: {
                code: 'auth-code',
                clientId: 'client-id',
                clientSecret: 'client-secret',
                tokenUrl: 'https://as.example.com/token',
                redirectUrl: 'https://redirect',
            },
        })

        const [, body] = mockPost.mock.calls[0]
        expect((body as URLSearchParams).has('resource')).toBe(false)
    })

    it('persists the resource on the claimed connection value so refresh can read it back', async () => {
        const result = await service.claim({
            projectId: undefined,
            platformId: 'platform',
            pieceName: 'mcp-client',
            request: {
                code: 'auth-code',
                clientId: 'client-id',
                clientSecret: 'client-secret',
                tokenUrl: 'https://as.example.com/token',
                redirectUrl: 'https://redirect',
                resource: RESOURCE,
            },
        })

        expect(result.resource).toBe(RESOURCE)
    })
})

describe('credentialsOauth2Service.refresh', () => {
    beforeEach(() => {
        mockPost.mockReset()
        mockPost.mockResolvedValue(tokenResponseBody())
        mockResolveString.mockReset()
        mockResolveString.mockImplementation(({ key }: { key: string }) => Promise.resolve(key))
    })

    function expiredConnection(resource: string | undefined): never {
        return {
            type: AppConnectionType.OAUTH2,
            access_token: 'stale-token',
            refresh_token: 'refresh-token',
            claimed_at: 0,
            expires_in: 3600,
            client_id: 'client-id',
            client_secret: 'client-secret',
            token_url: 'https://as.example.com/token',
            grant_type: OAuth2GrantType.AUTHORIZATION_CODE,
            data: {},
            resource,
        } as never
    }

    it('re-sends the persisted resource indicator on refresh', async () => {
        await service.refresh({
            pieceName: 'mcp-client',
            platformId: 'platform',
            projectId: undefined,
            connectionValue: expiredConnection(RESOURCE),
        })

        const [, body] = mockPost.mock.calls[0]
        expect((body as URLSearchParams).get('resource')).toBe(RESOURCE)
    })

    it('omits resource from the refresh request when the connection never had one', async () => {
        await service.refresh({
            pieceName: 'mcp-client',
            platformId: 'platform',
            projectId: undefined,
            connectionValue: expiredConnection(undefined),
        })

        const [, body] = mockPost.mock.calls[0]
        expect((body as URLSearchParams).has('resource')).toBe(false)
    })

    it('keeps the resource on the connection value after a successful refresh', async () => {
        const result = await service.refresh({
            pieceName: 'mcp-client',
            platformId: 'platform',
            projectId: undefined,
            connectionValue: expiredConnection(RESOURCE),
        })

        expect(result.resource).toBe(RESOURCE)
    })
})
