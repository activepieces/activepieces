import { logger } from '@activepieces/server-shared'
import {
    apId,
    FilteredPieceBehavior,
    PiecesFilterType,
    PieceType,
    PlatformRole,
    PrincipalType,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupServer } from '../../../../src/app/server'
import { generateMockToken } from '../../../helpers/auth'
import {
    createMockPieceMetadata,
    createMockPlan,
    createMockPlatform,
    createMockProject,
    createMockUser,
    mockBasicSetup,
} from '../../../helpers/mocks'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await initializeDatabase({ runMigrations: false })
    app = await setupServer()
})

beforeEach(async () => {
    await databaseConnection().getRepository('piece_metadata').delete({})
})

afterAll(async () => {
    await databaseConnection().destroy()
    await app?.close()
})

describe('Piece Metadata API', () => {
    describe('List Piece Versions endpoint', () => {
        it('Should return versions in sorted order for a piece', async () => {
            // arrange
            const mockPieceMetadata1 = createMockPieceMetadata({
                name: '@ap/a',
                version: '0.0.1',
                pieceType: PieceType.OFFICIAL,
            })
            await databaseConnection()
                .getRepository('piece_metadata')
                .save(mockPieceMetadata1)

            const mockPieceMetadata2 = createMockPieceMetadata({
                name: '@ap/a',
                version: '0.0.2',
                pieceType: PieceType.OFFICIAL,
            })
            await databaseConnection()
                .getRepository('piece_metadata')
                .save(mockPieceMetadata2)

            const testToken = await generateMockToken({
                type: PrincipalType.UNKNOWN,
                id: apId(),
                projectId: apId(),
            })

            // act
            const response = await app?.inject({
                method: 'GET',
                url: '/v1/pieces/versions?release=1.1.1&name=@ap/a',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const keys = Object.keys(responseBody)
            expect(keys).toHaveLength(2)
            expect(keys[0]).toBe('0.0.1')
            expect(keys[1]).toBe('0.0.2')
        })
    })

    describe('Get Piece metadata', () => {
        it('Should return metadata when authenticated', async () => {
            // arrange
            const mockPieceMetadata = createMockPieceMetadata({
                name: '@activepieces/a',
                pieceType: PieceType.OFFICIAL,
            })
            await databaseConnection()
                .getRepository('piece_metadata')
                .save(mockPieceMetadata)

            const mockUser = createMockUser()
            await databaseConnection().getRepository('user').save([mockUser])

            const mockPlatform = createMockPlatform({
                ownerId: mockUser.id,
                filteredPieceNames: [],
                filteredPieceBehavior: FilteredPieceBehavior.BLOCKED,
            })
            await databaseConnection().getRepository('platform').save([mockPlatform])

            const mockProject = await createProjectAndPlan({
                platformId: mockPlatform.id,
                ownerId: mockUser.id,
            })

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                projectId: mockProject.id,
                id: mockUser.id,
            })

            // act
            const response = await app?.inject({
                method: 'GET',
                url: '/v1/pieces/@activepieces/a',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody.id).toBe(mockPieceMetadata.id)
        })

        it('Should return metadata when not authenticated', async () => {
            // arrange
            const mockPieceMetadata = createMockPieceMetadata({
                name: '@activepieces/a',
                pieceType: PieceType.OFFICIAL,
                displayName: 'a',
            })
            await databaseConnection()
                .getRepository('piece_metadata')
                .save(mockPieceMetadata)

            const testToken = await generateMockToken({
                projectId: apId(),
                type: PrincipalType.UNKNOWN,
                id: apId(),
            })

            // act
            const response = await app?.inject({
                method: 'GET',
                url: '/v1/pieces/@activepieces/a',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.OK)
            // Expectations for each attribute
            expect(responseBody.actions).toEqual(mockPieceMetadata.actions)
            expect(responseBody.triggers).toEqual(mockPieceMetadata.triggers)
            expect(responseBody.archiveId).toBe(mockPieceMetadata.archiveId)
            expect(responseBody.auth).toEqual(mockPieceMetadata.auth)
            expect(responseBody.description).toBe(mockPieceMetadata.description)
            expect(responseBody.directoryPath).toBe(mockPieceMetadata.directoryPath)
            expect(responseBody.displayName).toBe(mockPieceMetadata.displayName)
            expect(responseBody.id).toBe(mockPieceMetadata.id)
            expect(responseBody.logoUrl).toBe(mockPieceMetadata.logoUrl)
            expect(responseBody.maximumSupportedRelease).toBe(
                mockPieceMetadata.maximumSupportedRelease,
            )
            expect(responseBody.minimumSupportedRelease).toBe(
                mockPieceMetadata.minimumSupportedRelease,
            )
            expect(responseBody.packageType).toBe(mockPieceMetadata.packageType)
            expect(responseBody.pieceType).toBe(mockPieceMetadata.pieceType)
            expect(responseBody.platformId).toBe(mockPieceMetadata.platformId)
            expect(responseBody.projectId).toBe(mockPieceMetadata.projectId)
            expect(responseBody.version).toBe(mockPieceMetadata.version)
        })
    })
    describe('List Piece Metadata endpoint', () => {
        it('Should list platform and project pieces', async () => {
            const mockUser = createMockUser()
            await databaseConnection().getRepository('user').save([mockUser])

            const mockPlatform = createMockPlatform({
                ownerId: mockUser.id,
                filteredPieceNames: [],
                filteredPieceBehavior: FilteredPieceBehavior.BLOCKED,
            })
            await databaseConnection().getRepository('platform').save([mockPlatform])

            const mockProject = await createProjectAndPlan({
                platformId: mockPlatform.id,
                ownerId: mockUser.id,
            })
            const mockProject2 = await createProjectAndPlan({
                platformId: mockPlatform.id,
                ownerId: mockUser.id,
            })


            // arrange
            const mockPieceMetadataA = createMockPieceMetadata({
                name: 'a',
                pieceType: PieceType.CUSTOM,
                projectId: mockProject.id,
                displayName: 'a',
            })
            const mockPieceMetadataB = createMockPieceMetadata({
                name: 'b',
                pieceType: PieceType.OFFICIAL,
                displayName: 'b',
            })
            const mockPieceMetadataC = createMockPieceMetadata({
                name: 'c',
                pieceType: PieceType.CUSTOM,
                projectId: mockProject2.id,
                platformId: mockPlatform.id,
                displayName: 'c',
            })
            const mockPieceMetadataD = createMockPieceMetadata({
                name: 'd',
                pieceType: PieceType.CUSTOM,
                platformId: mockPlatform.id,
                displayName: 'd',
            })
            await databaseConnection()
                .getRepository('piece_metadata')
                .save([
                    mockPieceMetadataA,
                    mockPieceMetadataB,
                    mockPieceMetadataC,
                    mockPieceMetadataD,
                ])

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                projectId: mockProject.id,
                id: mockUser.id,
                platform: {
                    id: mockPlatform.id,
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
            const { mockOwner, mockPlatform } = await mockBasicSetup({
                platform: {
                    filteredPieceBehavior: FilteredPieceBehavior.BLOCKED,
                    filteredPieceNames: [],
                },
            })

            const mockProject1 = await createProjectAndPlan({
                ownerId: mockOwner.id,
                platformId: mockPlatform.id,
            })

            const mockProject2 = await createProjectAndPlan({
                ownerId: mockOwner.id,
                platformId: mockPlatform.id,
            })

            // arrange
            const mockPieceMetadataA = createMockPieceMetadata({
                name: 'a',
                pieceType: PieceType.CUSTOM,
                projectId: mockProject1.id,
                platformId: mockPlatform.id,
                displayName: 'a',
            })
            const mockPieceMetadataB = createMockPieceMetadata({
                name: 'b',
                pieceType: PieceType.OFFICIAL,
                displayName: 'b',
            })
            const mockPieceMetadataC = createMockPieceMetadata({
                name: 'c',
                pieceType: PieceType.CUSTOM,
                projectId: mockProject2.id,
                platformId: mockPlatform.id,
                displayName: 'c',
            })
            await databaseConnection()
                .getRepository('piece_metadata')
                .save([mockPieceMetadataA, mockPieceMetadataB, mockPieceMetadataC])

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                projectId: mockProject1.id,
                id: mockOwner.id,
                platform: {
                    id: mockPlatform.id,
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
            expect(responseBody).toHaveLength(2)
            expect(responseBody?.[0].id).toBe(mockPieceMetadataA.id)
            expect(responseBody?.[1].id).toBe(mockPieceMetadataB.id)
        })
        it('Should list correct version by piece name', async () => {
            // arrange
            const mockPieceMetadataA = createMockPieceMetadata({
                name: 'a',
                pieceType: PieceType.OFFICIAL,
                displayName: 'a',
                version: '0.0.1',
            })
            const mockPieceMetadataB = createMockPieceMetadata({
                name: 'a',
                pieceType: PieceType.OFFICIAL,
                displayName: 'a',
                version: '0.0.2',
            })
            const mockPieceMetadataC = createMockPieceMetadata({
                name: 'a',
                pieceType: PieceType.OFFICIAL,
                displayName: 'a',
                version: '0.1.0',
            })
            const mockPieceMetadataD = createMockPieceMetadata({
                name: 'a',
                pieceType: PieceType.OFFICIAL,
                displayName: 'a',
                version: '0.1.1',
            })
            await databaseConnection()
                .getRepository('piece_metadata')
                .save([mockPieceMetadataA, mockPieceMetadataB, mockPieceMetadataC, mockPieceMetadataD])

            const testToken = await generateMockToken({
                type: PrincipalType.UNKNOWN,
                id: apId(),
                projectId: apId(),
                platform: {
                    id: apId(),
                },
            })

            // act
            const exactVersionResponse = await app?.inject({
                method: 'GET',
                url: '/v1/pieces/a?version=0.0.1',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })
            const exactVersionResponseBody = exactVersionResponse?.json()
            expect(exactVersionResponse?.statusCode).toBe(StatusCodes.OK)
            expect(exactVersionResponseBody?.id).toBe(mockPieceMetadataA.id)

            const telda2VersionResponse = await app?.inject({
                method: 'GET',
                url: '/v1/pieces/a?version=~0.0.2',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })
            const teldaVersion2ResponseBody = telda2VersionResponse?.json()
            expect(telda2VersionResponse?.statusCode).toBe(StatusCodes.OK)
            expect(teldaVersion2ResponseBody?.id).toBe(mockPieceMetadataB.id)

            const teldaVersionResponse = await app?.inject({
                method: 'GET',
                url: '/v1/pieces/a?version=~0.0.1',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })
            const teldaVersionResponseBody = teldaVersionResponse?.json()
            expect(teldaVersionResponse?.statusCode).toBe(StatusCodes.OK)
            expect(teldaVersionResponseBody?.id).toBe(mockPieceMetadataB.id)

            const notFoundVersionResponse = await app?.inject({
                method: 'GET',
                url: '/v1/pieces/a?version=~0.1.2',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })
            expect(notFoundVersionResponse?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })

        it('Should list latest version by piece name', async () => {
            // arrange
            const mockPieceMetadataA = createMockPieceMetadata({
                name: 'a',
                pieceType: PieceType.OFFICIAL,
                displayName: 'a',
                version: '0.31.0',
            })
            const mockPieceMetadataB = createMockPieceMetadata({
                name: 'a',
                pieceType: PieceType.OFFICIAL,
                displayName: 'a',
                version: '1.0.0',
            })
            await databaseConnection()
                .getRepository('piece_metadata')
                .save([mockPieceMetadataA, mockPieceMetadataB])

            const testToken = await generateMockToken({
                type: PrincipalType.UNKNOWN,
                id: apId(),
                projectId: apId(),
                platform: {
                    id: apId(),
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
            logger.error(responseBody)

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody).toHaveLength(1)
            expect(responseBody?.[0].id).toBe(mockPieceMetadataB.id)
        })


        it('Sorts by piece name', async () => {
            // arrange
            const mockPieceMetadataA = createMockPieceMetadata({
                name: 'a',
                pieceType: PieceType.OFFICIAL,
                displayName: 'a',
            })
            const mockPieceMetadataB = createMockPieceMetadata({
                name: 'b',
                pieceType: PieceType.OFFICIAL,
                displayName: 'b',
            })
            await databaseConnection()
                .getRepository('piece_metadata')
                .save([mockPieceMetadataA, mockPieceMetadataB])

            const testToken = await generateMockToken({
                type: PrincipalType.UNKNOWN,
                id: apId(),
                projectId: apId(),
                platform: {
                    id: apId(),
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
            logger.error(responseBody)

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody).toHaveLength(2)
            expect(responseBody?.[0].id).toBe(mockPieceMetadataA.id)
            expect(responseBody?.[1].id).toBe(mockPieceMetadataB.id)
        })

        it('Allows filtered pieces if project filter is set to "ALLOWED"', async () => {
            // arrange

            const mockUser = createMockUser()
            await databaseConnection().getRepository('user').save([mockUser])

            const mockPlatform = createMockPlatform({
                ownerId: mockUser.id,
                filteredPieceNames: [],
                filteredPieceBehavior: FilteredPieceBehavior.BLOCKED,
            })

            await databaseConnection().getRepository('platform').save([mockPlatform])

            await databaseConnection().getRepository('user').update(mockUser.id, {
                platformId: mockPlatform.id,
                platformRole: PlatformRole.ADMIN,
            })
            const mockProject = await createProjectAndPlan({
                ownerId: mockUser.id,
                platformId: mockPlatform.id,
                piecesFilterType: PiecesFilterType.ALLOWED,
                pieces: ['a'],
            })

            const mockPieceMetadataA = createMockPieceMetadata({
                name: 'a',
                pieceType: PieceType.OFFICIAL,
                displayName: 'a',
            })
            const mockPieceMetadataB = createMockPieceMetadata({
                name: 'b',
                pieceType: PieceType.OFFICIAL,
                displayName: 'b',
            })
            await databaseConnection()
                .getRepository('piece_metadata')
                .save([mockPieceMetadataA, mockPieceMetadataB])

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                projectId: mockProject.id,
                platform: {
                    id: mockPlatform.id,
                },
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
            expect(responseBody).toHaveLength(1)
            expect(responseBody?.[0].id).toBe(mockPieceMetadataA.id)
        })

        it('Allows filtered pieces if platform filter is set to "ALLOWED"', async () => {
            // arrange
            const mockUser = createMockUser()
            await databaseConnection().getRepository('user').save([mockUser])

            const mockPlatform = createMockPlatform({
                ownerId: mockUser.id,
                filteredPieceNames: ['a'],
                filteredPieceBehavior: FilteredPieceBehavior.ALLOWED,
            })

            await databaseConnection().getRepository('platform').save([mockPlatform])

            await databaseConnection().getRepository('user').update(mockUser.id, {
                platformId: mockPlatform.id,
                platformRole: PlatformRole.ADMIN,
            })

            const mockProject = await createProjectAndPlan({
                ownerId: mockUser.id,
                platformId: mockPlatform.id,
            })

            const mockPieceMetadataA = createMockPieceMetadata({
                name: 'a',
                pieceType: PieceType.OFFICIAL,
                displayName: 'a',
            })
            const mockPieceMetadataB = createMockPieceMetadata({
                name: 'b',
                pieceType: PieceType.OFFICIAL,
                displayName: 'b',
            })
            await databaseConnection()
                .getRepository('piece_metadata')
                .save([mockPieceMetadataA, mockPieceMetadataB])

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                projectId: mockProject.id,
                platform: {
                    id: mockPlatform.id,
                },
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
            expect(responseBody).toHaveLength(1)
            expect(responseBody?.[0].id).toBe(mockPieceMetadataA.id)
        })

        it('Blocks filtered pieces if platform filter is set to "BLOCKED"', async () => {
            // arrange
            const mockUser = createMockUser()
            await databaseConnection().getRepository('user').save([mockUser])

            const mockPlatform = createMockPlatform({
                ownerId: mockUser.id,
                filteredPieceNames: ['a'],
                filteredPieceBehavior: FilteredPieceBehavior.BLOCKED,
            })

            await databaseConnection().getRepository('platform').save([mockPlatform])

            await databaseConnection().getRepository('user').update(mockUser.id, {
                platformId: mockPlatform.id,
                platformRole: PlatformRole.ADMIN,
            })

            const mockProject = await createProjectAndPlan({
                ownerId: mockUser.id,
                platformId: mockPlatform.id,
            })
            const mockPieceMetadataA = createMockPieceMetadata({
                name: 'a',
                pieceType: PieceType.OFFICIAL,
                displayName: 'a',
            })
            const mockPieceMetadataB = createMockPieceMetadata({
                name: 'b',
                pieceType: PieceType.OFFICIAL,
                displayName: 'b',
            })
            await databaseConnection()
                .getRepository('piece_metadata')
                .save([mockPieceMetadataA, mockPieceMetadataB])

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                projectId: mockProject.id,
                platform: {
                    id: mockPlatform.id,
                },
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
            expect(responseBody).toHaveLength(1)
            expect(responseBody?.[0].id).toBe(mockPieceMetadataB.id)
        })
    })
})

async function createProjectAndPlan({
    platformId,
    ownerId,
    piecesFilterType,
    pieces,
}: {
    platformId: string
    ownerId: string
    piecesFilterType?: PiecesFilterType
    pieces?: string[]
}) {
    const project = createMockProject({
        platformId,
        ownerId,
    })
    await databaseConnection().getRepository('project').save([project])

    const projectPlan = createMockPlan({
        projectId: project.id,
        piecesFilterType,
        pieces,
    })
    await databaseConnection().getRepository('project_plan').save([projectPlan])
    return project
}