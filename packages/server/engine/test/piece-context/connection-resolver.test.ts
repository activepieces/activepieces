import { ContextVersion } from '@activepieces/pieces-framework'
import { AppConnectionStatus, AppConnectionType, ConnectionExpiredError, ConnectionLoadingError, ConnectionNotFoundError, ConnectionPieceMismatchError, FetchError } from '@activepieces/shared'
import { createConnectionResolver } from '../../src/lib/piece-context/connection-resolver'

const RESOLVER_PARAMS = {
    projectId: 'project-123',
    apiUrl: 'http://localhost:3000/',
    engineToken: 'test-token',
    contextVersion: ContextVersion.V1,
}

function makeConnection({ status = AppConnectionStatus.ACTIVE, type = AppConnectionType.SECRET_TEXT, value = { type: AppConnectionType.SECRET_TEXT, secret_text: 'my-secret' }, pieceName = '@activepieces/piece-slack' }: {
    status?: AppConnectionStatus
    type?: AppConnectionType
    value?: Record<string, unknown>
    pieceName?: string
} = {}) {
    return {
        id: 'conn-1',
        name: 'my-connection',
        pieceName,
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

    describe('AP_ENFORCE_CONNECTION_PIECE_BINDING', () => {
        const pieceName = '@activepieces/piece-slack'

        afterEach(() => {
            delete process.env.AP_ENFORCE_CONNECTION_PIECE_BINDING
        })

        const mockFetchReturning = (connectionPieceName: string) => {
            vi.spyOn(global, 'fetch').mockResolvedValue(new Response(
                JSON.stringify(makeConnection({ pieceName: connectionPieceName })),
                { status: 200, headers: { 'Content-Type': 'application/json' } },
            ))
        }

        it('throws ConnectionPieceMismatchError for another piece when enabled', async () => {
            process.env.AP_ENFORCE_CONNECTION_PIECE_BINDING = 'true'
            mockFetchReturning('@activepieces/piece-google-sheets')

            const resolver = createConnectionResolver({ ...RESOLVER_PARAMS, pieceName })
            await expect(resolver.obtain('my-connection')).rejects.toThrow(ConnectionPieceMismatchError)
        })

        it('resolves a connection for the same piece when enabled', async () => {
            process.env.AP_ENFORCE_CONNECTION_PIECE_BINDING = 'true'
            mockFetchReturning(pieceName)

            const resolver = createConnectionResolver({ ...RESOLVER_PARAMS, pieceName })
            await expect(resolver.obtain('my-connection')).resolves.toEqual({
                type: AppConnectionType.SECRET_TEXT,
                secret_text: 'my-secret',
            })
        })

        it('resolves a connection for another piece when disabled', async () => {
            mockFetchReturning('@activepieces/piece-google-sheets')

            const resolver = createConnectionResolver({ ...RESOLVER_PARAMS, pieceName })
            await expect(resolver.obtain('my-connection')).resolves.toEqual({
                type: AppConnectionType.SECRET_TEXT,
                secret_text: 'my-secret',
            })
        })

        it('throws ConnectionPieceMismatchError for a step with no piece of its own when enabled', async () => {
            process.env.AP_ENFORCE_CONNECTION_PIECE_BINDING = 'true'
            mockFetchReturning('@activepieces/piece-google-sheets')

            const resolver = createConnectionResolver(RESOLVER_PARAMS)
            await expect(resolver.obtain('my-connection')).rejects.toThrow(ConnectionPieceMismatchError)
        })

        it('resolves for a step with no piece of its own when disabled', async () => {
            mockFetchReturning('@activepieces/piece-google-sheets')

            const resolver = createConnectionResolver(RESOLVER_PARAMS)
            await expect(resolver.obtain('my-connection')).resolves.toEqual({
                type: AppConnectionType.SECRET_TEXT,
                secret_text: 'my-secret',
            })
        })
    })

    it('throws FetchError on network failure', async () => {
        vi.spyOn(global, 'fetch').mockRejectedValue(new TypeError('fetch failed'))

        const resolver = createConnectionResolver(RESOLVER_PARAMS)
        await expect(resolver.obtain('my-connection')).rejects.toThrow(FetchError)
    })
})
