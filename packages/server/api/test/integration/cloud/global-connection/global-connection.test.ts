import {
    apId,
    PackageType,
    PlatformRole,
    PrincipalType,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { pieceMetadataService } from '../../../../src/app/pieces/piece-metadata-service'
import { setupServer } from '../../../../src/app/server'
import { generateMockToken } from '../../../helpers/auth'
import {
    createMockPieceMetadata,
    createMockPlatform,
    createMockProject,
    createMockUser,
} from '../../../helpers/mocks'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await databaseConnection().initialize()
    app = await setupServer()
})

afterAll(async () => {
    await databaseConnection().destroy()
    await app?.close()
})

describe('GlobalConnection API', () => {
    describe('Upsert GlobalConnection endpoint', () => {
        it('Succeeds if user is platform owner', async () => {
            // arrange
            const mockPlatformId = apId()
            const mockUser = createMockUser({ platformId: mockPlatformId, platformRole: PlatformRole.ADMIN })
            await databaseConnection().getRepository('user').save([mockUser])

            const mockPlatform = createMockPlatform({ id: mockPlatformId, ownerId: mockUser.id })
            await databaseConnection().getRepository('platform').save(mockPlatform)

            const mockProject = createMockProject({
                ownerId: mockUser.id,
                platformId: mockPlatform.id,
            })
            await databaseConnection().getRepository('project').save([mockProject])

            const mockPieceMetadata = createMockPieceMetadata({
                projectId: mockProject.id,
                platformId: mockPlatform.id,
                packageType: PackageType.REGISTRY,
            })
            await databaseConnection().getRepository('piece_metadata').save([mockPieceMetadata])

            pieceMetadataService.getOrThrow = jest.fn().mockResolvedValue(mockPieceMetadata)
            
            const mockToken = await generateMockToken({
                id: mockUser.id,
                type: PrincipalType.USER,
                projectId: mockProject.id,
                platform: {
                    id: mockPlatform.id,
                },
            })

            const mockUpsertGlobalConnectionRequest = {
                displayName: 'test-global-connection',
                pieceName: mockPieceMetadata.name,
                type: 'SECRET_TEXT',
                value: {
                    type: 'SECRET_TEXT',
                    secret_text: 'test-secret-text',
                },
            }

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/global-connections',
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
                body: mockUpsertGlobalConnectionRequest,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.CREATED)
        })

        it('Fails if user is not platform owner', async () => {
            // arrange
            const mockPlatformId = apId()
            const mockOwner = createMockUser({ platformId: mockPlatformId, platformRole: PlatformRole.ADMIN })
            const mockUser = createMockUser({ platformId: mockPlatformId, platformRole: PlatformRole.MEMBER })
            await databaseConnection().getRepository('user').save([mockOwner, mockUser])

            const mockPlatform = createMockPlatform({ id: mockPlatformId, ownerId: mockOwner.id })
            await databaseConnection().getRepository('platform').save(mockPlatform)

            const mockProject = createMockProject({
                ownerId: mockOwner.id,
                platformId: mockPlatform.id,
            })
            await databaseConnection().getRepository('project').save([mockProject])

            const mockPieceMetadata = createMockPieceMetadata({
                projectId: mockProject.id,
                platformId: mockPlatform.id,
            })
            await databaseConnection().getRepository('piece_metadata').save([mockPieceMetadata])

            pieceMetadataService.getOrThrow = jest.fn().mockResolvedValue(mockPieceMetadata)

            const mockToken = await generateMockToken({
                id: mockUser.id,
                type: PrincipalType.USER,
                projectId: mockProject.id,
                platform: {
                    id: mockPlatform.id,
                },
            })

            const mockUpsertGlobalConnectionRequest = {
                displayName: 'test-global-connection',
                pieceName: mockPieceMetadata.name,
                type: 'SECRET_TEXT',
                value: {
                    type: 'SECRET_TEXT',
                    secret_text: 'test-secret-text',
                },
            }

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/global-connections',
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
                body: mockUpsertGlobalConnectionRequest,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })

    describe('List GlobalConnections endpoint', () => {
        it('Succeeds if user is platform owner', async () => {
            // arrange
            const mockPlatformId = apId()
            const mockUser = createMockUser({ platformId: mockPlatformId, platformRole: PlatformRole.ADMIN })
            await databaseConnection().getRepository('user').save([mockUser])

            const mockPlatform = createMockPlatform({ id: mockPlatformId, ownerId: mockUser.id })
            await databaseConnection().getRepository('platform').save(mockPlatform)

            const mockProject = createMockProject({
                ownerId: mockUser.id,
                platformId: mockPlatform.id,
            })
            await databaseConnection().getRepository('project').save([mockProject])

            const mockToken = await generateMockToken({
                id: mockUser.id,
                type: PrincipalType.USER,
                projectId: mockProject.id,
                platform: {
                    id: mockPlatform.id,
                },
            })

            // act
            const response = await app?.inject({
                method: 'GET',
                url: '/v1/global-connections',
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)
        })

        it('Fails if user is not platform owner', async () => {
            // arrange
            const mockPlatformId = apId()
            const mockOwner = createMockUser({ platformId: mockPlatformId, platformRole: PlatformRole.ADMIN })
            const mockUser = createMockUser({ platformId: mockPlatformId, platformRole: PlatformRole.MEMBER })
            await databaseConnection().getRepository('user').save([mockOwner, mockUser])

            const mockPlatform = createMockPlatform({ id: mockPlatformId, ownerId: mockOwner.id })
            await databaseConnection().getRepository('platform').save(mockPlatform)

            const mockProject = createMockProject({
                ownerId: mockOwner.id,
                platformId: mockPlatform.id,
            })
            await databaseConnection().getRepository('project').save([mockProject])

            const mockToken = await generateMockToken({
                id: mockUser.id,
                type: PrincipalType.USER,
                projectId: mockProject.id,
                platform: {
                    id: mockPlatform.id,
                },
            })

            // act
            const response = await app?.inject({
                method: 'GET',
                url: '/v1/global-connections',
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })
})
