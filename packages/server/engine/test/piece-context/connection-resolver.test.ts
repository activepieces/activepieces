import { ContextVersion } from '@activepieces/pieces-framework'
import { AppConnectionStatus, AppConnectionType, ConnectionExpiredError, ConnectionLoadingError, ConnectionNotFoundError, ConnectionPieceMismatchError, ErrorCode, FetchError } from '@activepieces/shared'
import { createConnectionResolver } from '../../src/lib/piece-context/connection-resolver'

const RESOLVER_PARAMS = {
    projectId: 'project-123',
    apiUrl: 'http://localhost:3000/',
    engineToken: 'test-token',
    contextVersion: ContextVersion.V1,
}

function makeConnection({ status = AppConnectionStatus.ACTIVE, type = AppConnectionType.SECRET_TEXT, value = { type: AppConnectionType.SECRET_TEXT, secret_text: 'my-secret' } }: {
    status?: AppConnectionStatus
    type?: AppConnectionType
    value?: Record<string, unknown>
} = {}) {
    return {
        id: 'conn-1',
        name: 'my-connection',
        status,
        value: { ...value, type },
    }
}

describe('connection-resolver service', () => {

    beforeEach(() => {
        vi.restoreAllMocks()
    })

    it('V1 happy path returns connection.value', async () => {
        const connection = makeConnection()
        vi.spyOn(global, 'fetch').mockResolvedValue(new Response(
            JSON.stringify(connection),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
        ))

        const resolver = createConnectionResolver(RESOLVER_PARAMS)
        const result = await resolver.obtain('my-connection')

        expect(result).toEqual(connection.value)
    })

    it('V0 SECRET_TEXT returns connection.value.secret_text', async () => {
        const connection = makeConnection({
            type: AppConnectionType.SECRET_TEXT,
            value: { type: AppConnectionType.SECRET_TEXT, secret_text: 'my-secret' },
        })
        vi.spyOn(global, 'fetch').mockResolvedValue(new Response(
            JSON.stringify(connection),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
        ))

        const resolver = createConnectionResolver({ ...RESOLVER_PARAMS, contextVersion: undefined })
        const result = await resolver.obtain('my-connection')

        expect(result).toBe('my-secret')
    })

    it('V0 CUSTOM_AUTH returns connection.value.props', async () => {
        const customProps = { apiKey: 'abc', domain: 'example.com' }
        const connection = makeConnection({
            type: AppConnectionType.CUSTOM_AUTH,
            value: { type: AppConnectionType.CUSTOM_AUTH, props: customProps },
        })
        vi.spyOn(global, 'fetch').mockResolvedValue(new Response(
            JSON.stringify(connection),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
        ))

        const resolver = createConnectionResolver({ ...RESOLVER_PARAMS, contextVersion: undefined })
        const result = await resolver.obtain('my-connection')

        expect(result).toEqual(customProps)
    })

    it('V0 other types returns connection.value', async () => {
        const connection = makeConnection({
            type: AppConnectionType.OAUTH2,
            value: { type: AppConnectionType.OAUTH2, access_token: 'tok' },
        })
        vi.spyOn(global, 'fetch').mockResolvedValue(new Response(
            JSON.stringify(connection),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
        ))

        const resolver = createConnectionResolver({ ...RESOLVER_PARAMS, contextVersion: undefined })
        const result = await resolver.obtain('my-connection')

        expect(result).toEqual(connection.value)
    })

    it('throws ConnectionNotFoundError on 404', async () => {
        vi.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 404 }))

        const resolver = createConnectionResolver(RESOLVER_PARAMS)
        await expect(resolver.obtain('missing')).rejects.toThrow(ConnectionNotFoundError)
    })

    it('throws ConnectionExpiredError when status is ERROR', async () => {
        const connection = makeConnection({ status: AppConnectionStatus.ERROR })
        vi.spyOn(global, 'fetch').mockResolvedValue(new Response(
            JSON.stringify(connection),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
        ))

        const resolver = createConnectionResolver(RESOLVER_PARAMS)
        await expect(resolver.obtain('my-connection')).rejects.toThrow(ConnectionExpiredError)
    })

    it('throws ConnectionLoadingError on non-404 error', async () => {
        vi.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 500 }))

        const resolver = createConnectionResolver(RESOLVER_PARAMS)
        await expect(resolver.obtain('my-connection')).rejects.toThrow(ConnectionLoadingError)
    })

    it('sends the piece name so the server can enforce the binding', async () => {
        const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(new Response(
            JSON.stringify(makeConnection()),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
        ))

        const resolver = createConnectionResolver({ ...RESOLVER_PARAMS, pieceName: '@activepieces/piece-slack' })
        await resolver.obtain('my-connection')

        expect(fetchSpy.mock.calls[0][0]).toContain('&pieceName=%40activepieces%2Fpiece-slack')
    })

    it('throws ConnectionPieceMismatchError when the server rejects the binding', async () => {
        vi.spyOn(global, 'fetch').mockResolvedValue(new Response(
            JSON.stringify({ code: ErrorCode.MCP_PIECE_CONNECTION_MISMATCH, params: {} }),
            { status: 400, headers: { 'Content-Type': 'application/json' } },
        ))

        const resolver = createConnectionResolver({ ...RESOLVER_PARAMS, pieceName: '@activepieces/piece-slack' })
        await expect(resolver.obtain('my-connection')).rejects.toThrow(ConnectionPieceMismatchError)
    })

    it('throws ConnectionLoadingError on a non-mismatch error even when a piece name is sent', async () => {
        vi.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 500 }))

        const resolver = createConnectionResolver({ ...RESOLVER_PARAMS, pieceName: '@activepieces/piece-slack' })
        await expect(resolver.obtain('my-connection')).rejects.toThrow(ConnectionLoadingError)
    })

    it('throws FetchError on network failure', async () => {
        vi.spyOn(global, 'fetch').mockRejectedValue(new TypeError('fetch failed'))

        const resolver = createConnectionResolver(RESOLVER_PARAMS)
        await expect(resolver.obtain('my-connection')).rejects.toThrow(FetchError)
    })
})
