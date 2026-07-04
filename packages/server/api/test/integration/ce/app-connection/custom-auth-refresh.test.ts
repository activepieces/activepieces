import { apId, isNil } from '@activepieces/core-utils'
import { PropertyType } from '@activepieces/pieces-framework'
import { AppConnection, AppConnectionScope, AppConnectionStatus, AppConnectionType, CustomAuthConnectionValue, PackageType, PieceType } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { appConnectionHandler } from '../../../../src/app/app-connection/app-connection-service/app-connection.handler'
import { db } from '../../../helpers/db'
import { createMockPieceMetadata } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null
let mockLog: FastifyBaseLogger

beforeAll(async () => {
    app = await setupTestEnvironment()
    mockLog = app!.log!
})

afterAll(async () => {
    await teardownTestEnvironment()
})

const customAuthOf = (overrides: Record<string, unknown>) => ({
    type: PropertyType.CUSTOM_AUTH,
    displayName: 'Connection',
    required: true,
    props: {},
    ...overrides,
})

const saveCustomAuthPiece = async ({ pieceName, pieceVersion, platformId, hasRefresh }: { pieceName: string, pieceVersion: string, platformId: string | undefined, hasRefresh: boolean }): Promise<void> => {
    const mockPiece = createMockPieceMetadata({
        name: pieceName,
        version: pieceVersion,
        platformId,
        pieceType: isNil(platformId) ? PieceType.OFFICIAL : PieceType.CUSTOM,
        packageType: PackageType.REGISTRY,
        minimumSupportedRelease: '0.0.0',
        maximumSupportedRelease: '999.999.999',
        // Functions (generate) do not survive metadata serialization; the stored
        // refresh is a plain object, so detection only checks for its presence.
        auth: customAuthOf(hasRefresh ? { refresh: { defaultExpiresIn: 3300 } } : {}),
    })
    await db.save('piece_metadata', mockPiece)
}

const customAuthConnection = ({ platformId, pieceName, pieceVersion, value }: { platformId: string, pieceName: string, pieceVersion: string, value: CustomAuthConnectionValue }): AppConnection => ({
    id: apId(),
    created: dayjs().toISOString(),
    updated: dayjs().toISOString(),
    platformId,
    projectIds: [apId()],
    pieceName,
    pieceVersion,
    displayName: 'Test Custom Auth',
    type: AppConnectionType.CUSTOM_AUTH,
    scope: AppConnectionScope.PROJECT,
    status: AppConnectionStatus.ACTIVE,
    ownerId: apId(),
    value,
    metadata: {},
    externalId: apId(),
    owner: null,
    preSelectForNewProjects: false,
})

describe('Custom auth token refresh — needRefresh', () => {
    describe('refresh-support detection from stored metadata', () => {
        it('returns true when the piece metadata declares a refresh callback', async () => {
            const pieceName = `piece-${apId()}`
            const platformId = apId()
            await saveCustomAuthPiece({ pieceName, pieceVersion: '1.0.0', platformId, hasRefresh: true })

            const connection = customAuthConnection({
                platformId,
                pieceName,
                pieceVersion: '1.0.0',
                value: { type: AppConnectionType.CUSTOM_AUTH, props: {} },
            })

            const result = await appConnectionHandler(mockLog).needRefresh(connection, mockLog)
            expect(result).toBe(true)
        })

        it('returns false when the piece metadata has no refresh callback', async () => {
            const pieceName = `piece-${apId()}`
            const platformId = apId()
            await saveCustomAuthPiece({ pieceName, pieceVersion: '1.0.0', platformId, hasRefresh: false })

            const connection = customAuthConnection({
                platformId,
                pieceName,
                pieceVersion: '1.0.0',
                value: { type: AppConnectionType.CUSTOM_AUTH, props: {} },
            })

            const result = await appConnectionHandler(mockLog).needRefresh(connection, mockLog)
            expect(result).toBe(false)
        })
    })

    describe('per-platform cache scoping', () => {
        it('resolves each platform independently when two platforms share a piece name@version with different refresh support', async () => {
            const pieceName = `piece-${apId()}`
            const pieceVersion = '1.0.0'
            const platformWithRefresh = apId()
            const platformWithoutRefresh = apId()

            await saveCustomAuthPiece({ pieceName, pieceVersion, platformId: platformWithRefresh, hasRefresh: true })
            await saveCustomAuthPiece({ pieceName, pieceVersion, platformId: platformWithoutRefresh, hasRefresh: false })

            const connWithRefresh = customAuthConnection({
                platformId: platformWithRefresh,
                pieceName,
                pieceVersion,
                value: { type: AppConnectionType.CUSTOM_AUTH, props: {} },
            })
            const connWithoutRefresh = customAuthConnection({
                platformId: platformWithoutRefresh,
                pieceName,
                pieceVersion,
                value: { type: AppConnectionType.CUSTOM_AUTH, props: {} },
            })

            // Warm the cache for the refresh-supporting platform first; a key that
            // ignored platformId would then leak `true` to the other platform.
            expect(await appConnectionHandler(mockLog).needRefresh(connWithRefresh, mockLog)).toBe(true)
            expect(await appConnectionHandler(mockLog).needRefresh(connWithoutRefresh, mockLog)).toBe(false)
        })
    })

    describe('token branch', () => {
        it('uses token staleness without a metadata lookup when a token is already present', async () => {
            // No piece_metadata row is saved — if needRefresh consulted metadata it would throw.
            const pieceName = `piece-${apId()}`

            const staleConnection = customAuthConnection({
                platformId: apId(),
                pieceName,
                pieceVersion: '1.0.0',
                value: { type: AppConnectionType.CUSTOM_AUTH, props: {}, access_token: 'tok', token_refresh_at: dayjs().unix() - 60 },
            })
            expect(await appConnectionHandler(mockLog).needRefresh(staleConnection, mockLog)).toBe(true)

            const freshConnection = customAuthConnection({
                platformId: apId(),
                pieceName,
                pieceVersion: '1.0.0',
                value: { type: AppConnectionType.CUSTOM_AUTH, props: {}, access_token: 'tok', token_refresh_at: dayjs().unix() + 3600 },
            })
            expect(await appConnectionHandler(mockLog).needRefresh(freshConnection, mockLog)).toBe(false)
        })
    })
})
