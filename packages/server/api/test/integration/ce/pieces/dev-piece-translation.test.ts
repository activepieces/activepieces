import { apId, LocalesEnum } from '@activepieces/core-utils'
import { PackageType, PieceType, PrincipalType } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { pieceCache } from '../../../../src/app/pieces/metadata/piece-cache'
import { PieceMetadataSchema } from '../../../../src/app/pieces/metadata/piece-metadata-entity'
import { generateMockToken } from '../../../helpers/auth'
import { createMockPieceMetadata } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

const devPiece: PieceMetadataSchema = {
    ...createMockPieceMetadata({
        name: 'dev-translated-piece',
        version: '0.1.0',
        pieceType: PieceType.OFFICIAL,
        packageType: PackageType.REGISTRY,
        description: 'Send a message',
        i18n: {
            [LocalesEnum.GERMAN]: { 'Send a message': 'Eine Nachricht senden' },
        },
    }),
}

vi.mock('../../../../src/app/pieces/metadata/utils', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../../../../src/app/pieces/metadata/utils')>()),
    loadDevPiecesIfEnabled: async () => [devPiece],
}))

let app: FastifyInstance | null = null
let mockLog: FastifyBaseLogger

beforeAll(async () => {
    app = await setupTestEnvironment()
    mockLog = app!.log!
    await pieceCache(mockLog).setup()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('dev pieces carrying their own translations', () => {
    it('are translated in the list and the single-piece route without leaking i18n', async () => {
        const testToken = await generateMockToken({
            type: PrincipalType.UNKNOWN,
            id: apId(),
        })
        const headers = { authorization: `Bearer ${testToken}` }

        const [list, single] = await Promise.all([
            app?.inject({ method: 'GET', url: '/api/v1/pieces?locale=de', headers }),
            app?.inject({ method: 'GET', url: '/api/v1/pieces/dev-translated-piece?locale=de', headers }),
        ])

        expect(list?.statusCode).toBe(StatusCodes.OK)
        expect(single?.statusCode).toBe(StatusCodes.OK)
        const listed = list?.json().find((piece: { name: string }) => piece.name === 'dev-translated-piece')
        expect(listed.description).toBe('Eine Nachricht senden')
        expect(listed.i18n).toBeUndefined()
        expect(single?.json().description).toBe('Eine Nachricht senden')
        expect(single?.json().i18n).toBeUndefined()
        expect(devPiece.description).toBe('Send a message')
    })
})
