import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupApp } from '../../../../src/app/app'
import { generateMockToken } from '../../../helpers/auth'
import { createMockPieceMetadata, createMockPlatform, createMockProject, createMockUser } from '../../../helpers/mocks'
import { StatusCodes } from 'http-status-codes'
import { FastifyInstance } from 'fastify'
import { FilteredPieceBehavior } from '@activepieces/ee-shared'
import { PieceType, ProjectType } from '@activepieces/shared'

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
        it('Should list platform and project pieces', async () => {

            const mockUser = createMockUser()
            await databaseConnection.getRepository('user').save([mockUser])

            const mockPlatform = createMockPlatform({
                ownerId: mockUser.id,
                filteredPieceNames: [],
                filteredPieceBehavior: FilteredPieceBehavior.BLOCKED,
            })
            await databaseConnection.getRepository('platform').save([mockPlatform])

            const mockProject = createMockProject({
                platformId: mockPlatform.id,
                type: ProjectType.PLATFORM_MANAGED,
                ownerId: mockUser.id,
            })
            const mockProject2 = createMockProject({
                platformId: mockPlatform.id,
                type: ProjectType.PLATFORM_MANAGED,
                ownerId: mockUser.id,
            })
            await databaseConnection.getRepository('project').save([mockProject, mockProject2])

            // arrange
            const mockPieceMetadataA = createMockPieceMetadata({ name: 'a', pieceType: PieceType.CUSTOM, projectId: mockProject.id })
            const mockPieceMetadataB = createMockPieceMetadata({ name: 'b', pieceType: PieceType.OFFICIAL })
            const mockPieceMetadataC = createMockPieceMetadata({ name: 'c', pieceType: PieceType.CUSTOM, projectId: mockProject2.id })
            const mockPieceMetadataD = createMockPieceMetadata({ name: 'd', pieceType: PieceType.CUSTOM, platformId: mockPlatform.id })
            await databaseConnection.getRepository('piece_metadata').save([mockPieceMetadataA, mockPieceMetadataB, mockPieceMetadataC, mockPieceMetadataD])

            const testToken = await generateMockToken({
                projectId: mockProject.id,
                id: mockUser.id,
                platform: {
                    id: mockPlatform.id,
                    role: 'MEMBER',
                },
            })

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
            expect(responseBody).toHaveLength(3)
            expect(responseBody?.[0].id).toBe(mockPieceMetadataA.id)
            expect(responseBody?.[1].id).toBe(mockPieceMetadataB.id)
            expect(responseBody?.[2].id).toBe(mockPieceMetadataD.id)
        })

        it('Should list project pieces', async () => {

            const mockUser = createMockUser()
            await databaseConnection.getRepository('user').save([mockUser])

            const mockProject = createMockProject({
                ownerId: mockUser.id,
            })
            const mockProject2 = createMockProject({
                ownerId: mockUser.id,
            })
            await databaseConnection.getRepository('project').save([mockProject, mockProject2])

            // arrange
            const mockPieceMetadataA = createMockPieceMetadata({ name: 'a', pieceType: PieceType.CUSTOM, projectId: mockProject.id })
            const mockPieceMetadataB = createMockPieceMetadata({ name: 'b', pieceType: PieceType.OFFICIAL })
            const mockPieceMetadataC = createMockPieceMetadata({ name: 'c', pieceType: PieceType.CUSTOM, projectId: mockProject2.id })
            await databaseConnection.getRepository('piece_metadata').save([mockPieceMetadataA, mockPieceMetadataB, mockPieceMetadataC])

            const testToken = await generateMockToken({
                projectId: mockProject.id,
                id: mockUser.id,
            })

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

        it('Sorts by piece name', async () => {
            // arrange
            const mockPieceMetadataA = createMockPieceMetadata({ name: 'a', pieceType: PieceType.OFFICIAL })
            const mockPieceMetadataB = createMockPieceMetadata({ name: 'b', pieceType: PieceType.OFFICIAL })
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

            const mockPieceMetadataA = createMockPieceMetadata({ name: 'a', pieceType: PieceType.OFFICIAL })
            const mockPieceMetadataB = createMockPieceMetadata({ name: 'b', pieceType: PieceType.OFFICIAL })
            await databaseConnection.getRepository('piece_metadata').save([mockPieceMetadataA, mockPieceMetadataB])

            const testToken = await generateMockToken({
                platform: {
                    id: mockPlatform.id,
                    role: 'OWNER',
                },
            })

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

            const mockPieceMetadataA = createMockPieceMetadata({ name: 'a', pieceType: PieceType.OFFICIAL })
            const mockPieceMetadataB = createMockPieceMetadata({ name: 'b', pieceType: PieceType.OFFICIAL })
            await databaseConnection.getRepository('piece_metadata').save([mockPieceMetadataA, mockPieceMetadataB])

            const testToken = await generateMockToken({
                platform: {
                    id: mockPlatform.id,
                    role: 'OWNER',
                },
            })

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
