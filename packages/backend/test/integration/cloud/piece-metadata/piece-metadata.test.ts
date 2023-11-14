import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupApp } from '../../../../src/app/app'
import { generateMockToken } from '../../../helpers/auth'
import { createMockPieceMetadata, createMockPlatform, createMockUser } from '../../../helpers/mocks'
import { StatusCodes } from 'http-status-codes'
import { FastifyInstance } from 'fastify'
import { FilteredPieceBehavior } from '@activepieces/ee-shared'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await databaseConnection.initialize()
    app = await setupApp()
})

beforeEach(async () => {
    await databaseConnection.getRepository('piece_metadata').delete({})
})

afterAll(async () => {
    await databaseConnection.destroy()
    await app?.close()
})

describe('Piece Metadata API', () => {
    describe('List Piece Metadata endpoint', () => {
        it('Sorts by piece name', async () => {
            // arrange
            const mockPieceMetadataA = createMockPieceMetadata({ name: 'a' })
            const mockPieceMetadataB = createMockPieceMetadata({ name: 'b' })
            await databaseConnection.getRepository('piece_metadata').save([mockPieceMetadataA, mockPieceMetadataB])

            const testToken = await generateMockToken()

            // act
            const response = await app?.inject({
                method: 'GET',
                url: '/v1/pieces?release=1.1.1',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody).toHaveLength(2)
            expect(responseBody?.[0].id).toBe(mockPieceMetadataA.id)
            expect(responseBody?.[1].id).toBe(mockPieceMetadataB.id)
        })

        it('Allows filtered pieces if platform filter is set to "ALLOWED"', async () => {
            // arrange
            const mockUser = createMockUser()
            await databaseConnection.getRepository('user').save([mockUser])

            const mockPlatform = createMockPlatform({
                ownerId: mockUser.id,
                filteredPieceNames: ['a'],
                filteredPieceBehavior: FilteredPieceBehavior.ALLOWED,
            })

            await databaseConnection.getRepository('platform').save([mockPlatform])

            const mockPieceMetadataA = createMockPieceMetadata({ name: 'a' })
            const mockPieceMetadataB = createMockPieceMetadata({ name: 'b' })
            await databaseConnection.getRepository('piece_metadata').save([mockPieceMetadataA, mockPieceMetadataB])

            const testToken = await generateMockToken({ platformId: mockPlatform.id })

            // act
            const response = await app?.inject({
                method: 'GET',
                url: '/v1/pieces?release=1.1.1',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody).toHaveLength(1)
            expect(responseBody?.[0].id).toBe(mockPieceMetadataA.id)
        })

        it('Blocks filtered pieces if platform filter is set to "BLOCKED"', async () => {
            // arrange
            const mockUser = createMockUser()
            await databaseConnection.getRepository('user').save([mockUser])

            const mockPlatform = createMockPlatform({
                ownerId: mockUser.id,
                filteredPieceNames: ['a'],
                filteredPieceBehavior: FilteredPieceBehavior.BLOCKED,
            })

            await databaseConnection.getRepository('platform').save([mockPlatform])

            const mockPieceMetadataA = createMockPieceMetadata({ name: 'a' })
            const mockPieceMetadataB = createMockPieceMetadata({ name: 'b' })
            await databaseConnection.getRepository('piece_metadata').save([mockPieceMetadataA, mockPieceMetadataB])

            const testToken = await generateMockToken({ platformId: mockPlatform.id })

            // act
            const response = await app?.inject({
                method: 'GET',
                url: '/v1/pieces?release=1.1.1',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody).toHaveLength(1)
            expect(responseBody?.[0].id).toBe(mockPieceMetadataB.id)
        })
    })
})
