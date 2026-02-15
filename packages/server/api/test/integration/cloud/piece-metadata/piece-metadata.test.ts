import {
    apId,
    FilteredPieceBehavior,
    PiecesFilterType,
    PieceType,
    PlatformRole,
    PrincipalType,
} from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { localPieceCache } from '../../../../src/app/pieces/metadata/lru-piece-cache'
import { setupServer } from '../../../../src/app/server'
import { generateMockToken } from '../../../helpers/auth'
import {
    createMockPieceMetadata,
    createMockPlan,
    createMockProject,
    mockAndSaveBasicSetup,
    mockBasicUser,
} from '../../../helpers/mocks'

let app: FastifyInstance | null = null
let mockLog: FastifyBaseLogger

beforeAll(async () => {
    await initializeDatabase({ runMigrations: false })
    app = await setupServer()
    mockLog = app!.log!
})

beforeEach(async () => {
    await databaseConnection().getRepository('piece_metadata').createQueryBuilder().delete().execute()
})

afterAll(async () => {
    await databaseConnection().destroy()
    await app?.close()
})

describe('Piece Metadata API', () => {
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

            await localPieceCache(mockLog).setup()

            const { mockOwner, mockPlatform, mockProject } = await mockAndSaveBasicSetup({
                platform: {
                    filteredPieceBehavior: FilteredPieceBehavior.BLOCKED,
                    filteredPieceNames: [],
                },
            })

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                
                platform: {
                    id: mockPlatform.id,
                },
            })

            // act
            const response = await app?.inject({
                method: 'GET',
                url: `/v1/pieces/@activepieces/a?projectId=${mockProject.id}`,
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

            await localPieceCache(mockLog).setup()
            const testToken = await generateMockToken({
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
            expect(responseBody.version).toBe(mockPieceMetadata.version)
        })
    })
    describe('List Piece Metadata endpoint', () => {
        it('Should list platform pieces', async () => {
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup({
                platform: {
                    filteredPieceBehavior: FilteredPieceBehavior.BLOCKED,
                    filteredPieceNames: [],
                },
            })

            const { mockPlatform: mockPlatform2 } = await mockAndSaveBasicSetup({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })

            const mockProject = await createProjectAndPlan({
                platformId: mockPlatform.id,
                ownerId: mockOwner.id,
            })


            // arrange
            const mockPieceMetadataA = createMockPieceMetadata({
                name: 'a',
                pieceType: PieceType.CUSTOM,
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
                platformId: mockPlatform2.id,
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

            await localPieceCache(mockLog).setup()

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                
                id: mockOwner.id,
                platform: {
                    id: mockPlatform.id,
                },
            })

            // act
            const response = await app?.inject({
                method: 'GET',
                url: `/v1/pieces?projectId=${mockProject.id}`,
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

        it('Should show official piece to other platforms when a custom piece with the same name exists', async () => {
            // arrange
            const { mockOwner: ownerA, mockPlatform: platformA } = await mockAndSaveBasicSetup({
                platform: {
                    filteredPieceBehavior: FilteredPieceBehavior.BLOCKED,
                    filteredPieceNames: [],
                },
            })
            const { mockOwner: ownerB, mockPlatform: platformB } = await mockAndSaveBasicSetup({
                platform: {
                    filteredPieceBehavior: FilteredPieceBehavior.BLOCKED,
                    filteredPieceNames: [],
                },
            })

            const projectA = await createProjectAndPlan({
                platformId: platformA.id,
                ownerId: ownerA.id,
            })
            const projectB = await createProjectAndPlan({
                platformId: platformB.id,
                ownerId: ownerB.id,
            })

            const officialPieceA = createMockPieceMetadata({
                name: 'a',
                pieceType: PieceType.OFFICIAL,
                displayName: 'a',
                version: '1.0.0',
            })
            const customPieceA = createMockPieceMetadata({
                name: 'a',
                pieceType: PieceType.CUSTOM,
                platformId: platformA.id,
                displayName: 'a',
                version: '2.0.0',
            })
            await databaseConnection()
                .getRepository('piece_metadata')
                .save([officialPieceA, customPieceA])

            await localPieceCache(mockLog).setup()

            const tokenA = await generateMockToken({
                type: PrincipalType.USER,
                id: ownerA.id,
                platform: {
                    id: platformA.id,
                },
            })
            const tokenB = await generateMockToken({
                type: PrincipalType.USER,
                id: ownerB.id,
                platform: {
                    id: platformB.id,
                },
            })

            const responseA = await app?.inject({
                method: 'GET',
                url: `/v1/pieces?projectId=${projectA.id}`,
                headers: {
                    authorization: `Bearer ${tokenA}`,
                },
            })

            const responseB = await app?.inject({
                method: 'GET',
                url: `/v1/pieces?projectId=${projectB.id}`,
                headers: {
                    authorization: `Bearer ${tokenB}`,
                },
            })

            const bodyA = responseA?.json()
            expect(responseA?.statusCode).toBe(StatusCodes.OK)
            expect(bodyA).toHaveLength(1)
            expect(bodyA?.[0].name).toBe('a')
            expect(bodyA?.[0].version).toBe('2.0.0')
            expect(bodyA?.[0].pieceType).toBe(PieceType.CUSTOM)

            const bodyB = responseB?.json()
            expect(responseB?.statusCode).toBe(StatusCodes.OK)
            expect(bodyB).toHaveLength(1)
            expect(bodyB?.[0].name).toBe('a')
            expect(bodyB?.[0].version).toBe('1.0.0')
            expect(bodyB?.[0].pieceType).toBe(PieceType.OFFICIAL)
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
            })
            await localPieceCache(mockLog).setup()

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

            await localPieceCache(mockLog).setup()

            const testToken = await generateMockToken({
                type: PrincipalType.UNKNOWN,
                id: apId(),
            })

            // act
            const response = await app?.inject({
                method: 'GET',
                url: '/v1/pieces',
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

            await localPieceCache(mockLog).setup()

            const testToken = await generateMockToken({
                type: PrincipalType.UNKNOWN,
                id: apId(),
            })

            // act
            const response = await app?.inject({
                method: 'GET',
                url: '/v1/pieces',
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

        it('Allows filtered pieces if project filter is set to "ALLOWED"', async () => {
            // arrange
            const { mockPlatform } = await mockAndSaveBasicSetup({
                platform: {
                    filteredPieceBehavior: FilteredPieceBehavior.BLOCKED,
                    filteredPieceNames: [],
                },
            })

            const { mockUser } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                },
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

            await localPieceCache(mockLog).setup()

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                
                platform: {
                    id: mockPlatform.id,
                },
                id: mockUser.id,
            })

            // act
            const response = await app?.inject({
                method: 'GET',
                url: `/v1/pieces?projectId=${mockProject.id}`,
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
            const { mockPlatform } = await mockAndSaveBasicSetup({
                platform: {
                    filteredPieceNames: ['a'],
                    filteredPieceBehavior: FilteredPieceBehavior.ALLOWED,
                },
            })

            const { mockUser } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                },
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

            await localPieceCache(mockLog).setup()

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                
                platform: {
                    id: mockPlatform.id,
                },
                id: mockUser.id,
            })

            // act
            const response = await app?.inject({
                method: 'GET',
                url: `/v1/pieces?projectId=${mockProject.id}`,
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
            const { mockPlatform } = await mockAndSaveBasicSetup({
                platform: {
                    filteredPieceNames: ['a'],
                    filteredPieceBehavior: FilteredPieceBehavior.BLOCKED,
                },
            })

            const { mockUser } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                },
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

            await localPieceCache(mockLog).setup()

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                
                platform: {
                    id: mockPlatform.id,
                },
                id: mockUser.id,
            })

            // act
            const response = await app?.inject({
                method: 'GET',
                url: `/v1/pieces?projectId=${mockProject.id}`,
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