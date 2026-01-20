import {
    apId,
    AppConnectionScope,
    AppConnectionType,
    PackageType,
    PlatformRole,
    PrincipalType,
    UpdateGlobalConnectionValueRequestBody,
    UpsertGlobalConnectionRequestBody,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupServer } from '../../../../src/app/server'
import { generateMockToken } from '../../../helpers/auth'
import {
    createMockPieceMetadata,
    mockAndSaveBasicSetup,
    mockBasicUser,
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

const setupWithGlobalConnections = () => {
    return mockAndSaveBasicSetup({
        platform: {
        },
        plan: {
            globalConnectionsEnabled: true,
        },
    })
}

describe('GlobalConnection API', () => {
    describe('Upsert GlobalConnection endpoint', () => {
        it('Succeeds if user is platform owner', async () => {
            // arrange
            const { mockPlatform, mockProject, mockOwner } = await setupWithGlobalConnections()

            const mockPieceMetadata = createMockPieceMetadata({
                projectId: mockProject.id,
                platformId: mockPlatform.id,
                packageType: PackageType.REGISTRY,
            })
            await databaseConnection().getRepository('piece_metadata').save([mockPieceMetadata])

            

            const mockToken = await generateMockToken({
                id: mockOwner.id,
                type: PrincipalType.USER,
                
                platform: {
                    id: mockPlatform.id,
                },
            })

            const mockUpsertGlobalConnectionRequest: UpsertGlobalConnectionRequestBody = {
                pieceVersion: mockPieceMetadata.version,
                displayName: 'test global connection',
                pieceName: mockPieceMetadata.name,
                projectIds: [mockProject.id],
                scope: AppConnectionScope.PLATFORM,
                type: AppConnectionType.SECRET_TEXT,
                value: {
                    type: AppConnectionType.SECRET_TEXT,
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
            const responseBody = response?.json()
            expect(responseBody.pieceVersion).toEqual(mockPieceMetadata.version)
            // assert
            expect(response?.statusCode).toBe(StatusCodes.CREATED)
        })

        it('Fails if user is not platform owner', async () => {
            // arrange
            const { mockPlatform, mockProject } = await setupWithGlobalConnections()

            const { mockUser } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })
            const mockPieceMetadata = createMockPieceMetadata({
                projectId: mockProject.id,
                platformId: mockPlatform.id,
            })
            await databaseConnection().getRepository('piece_metadata').save([mockPieceMetadata])

            

            const mockToken = await generateMockToken({
                id: mockUser.id,
                type: PrincipalType.USER,
                
                platform: {
                    id: mockPlatform.id,
                },
            })

            const mockUpsertGlobalConnectionRequest: UpsertGlobalConnectionRequestBody = {
                pieceVersion: mockPieceMetadata.version,
                displayName: 'test global connection',
                pieceName: mockPieceMetadata.name,
                scope: AppConnectionScope.PLATFORM,
                projectIds: [mockProject.id],
                type: AppConnectionType.SECRET_TEXT,
                value: {
                    type: AppConnectionType.SECRET_TEXT,
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

        it('Fails if project ids are invalid', async () => {
            // arrange
            const { mockPlatform, mockProject, mockOwner } = await setupWithGlobalConnections()

            const mockPieceMetadata = createMockPieceMetadata({
                projectId: mockProject.id,
                platformId: mockPlatform.id,
                packageType: PackageType.REGISTRY,
            })
            await databaseConnection().getRepository('piece_metadata').save([mockPieceMetadata])

            

            const mockToken = await generateMockToken({
                id: mockOwner.id,
                type: PrincipalType.USER,
                
                platform: {
                    id: mockPlatform.id,
                },
            })

            const mockUpsertGlobalConnectionRequest: UpsertGlobalConnectionRequestBody = {
                pieceVersion: mockPieceMetadata.version,
                displayName: 'test global connection',
                pieceName: mockPieceMetadata.name,
                projectIds: [apId()], // Invalid project ID
                scope: AppConnectionScope.PLATFORM,
                type: AppConnectionType.SECRET_TEXT,
                value: {
                    type: AppConnectionType.SECRET_TEXT,
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
            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })
    })

    describe('List GlobalConnections endpoint', () => {
        it('Succeeds if user is platform owner', async () => {
            // arrange
            const { mockPlatform, mockOwner } = await setupWithGlobalConnections()

            const mockToken = await generateMockToken({
                id: mockOwner.id,
                type: PrincipalType.USER,
                
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
            const { mockPlatform } = await setupWithGlobalConnections()

            const { mockUser } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })
            const mockToken = await generateMockToken({
                id: mockUser.id,
                type: PrincipalType.USER,
                
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

    describe('Delete GlobalConnection endpoint', () => {
        it('Succeeds if user is platform owner', async () => {
            // arrange
            const { mockPlatform, mockProject, mockOwner } = await setupWithGlobalConnections()

            const mockPieceMetadata = createMockPieceMetadata({
                projectId: mockProject.id,
                platformId: mockPlatform.id,
                packageType: PackageType.REGISTRY,
            })
            await databaseConnection().getRepository('piece_metadata').save([mockPieceMetadata])

            const mockToken = await generateMockToken({
                id: mockOwner.id,
                type: PrincipalType.USER,
                
                platform: {
                    id: mockPlatform.id,
                },
            })

            const mockUpsertGlobalConnectionRequest: UpsertGlobalConnectionRequestBody = {
                pieceVersion: mockPieceMetadata.version,
                displayName: 'test global connection',
                pieceName: mockPieceMetadata.name,
                scope: AppConnectionScope.PLATFORM,
                projectIds: [mockProject.id],
                type: AppConnectionType.SECRET_TEXT,
                value: {
                    type: AppConnectionType.SECRET_TEXT,
                    secret_text: 'test-secret-text',
                },
               
            }

            const upsertResponse = await app?.inject({
                method: 'POST',
                url: '/v1/global-connections',
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
                body: mockUpsertGlobalConnectionRequest,
            })
            const connectionId = upsertResponse?.json().id
            // act
            const response = await app?.inject({
                method: 'DELETE',
                url: `/v1/global-connections/${connectionId}`,
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
            })
            // assert
            expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        })

        it('Fails if user is not platform owner', async () => {
            // arrange
            const { mockPlatform, mockProject, mockOwner } = await setupWithGlobalConnections()
            const { mockUser } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })
            const mockPieceMetadata = createMockPieceMetadata({
                projectId: mockProject.id,
                platformId: mockPlatform.id,
                packageType: PackageType.REGISTRY,
            })
            await databaseConnection().getRepository('piece_metadata').save([mockPieceMetadata])

            

            const mockOwnerToken = await generateMockToken({
                id: mockOwner.id,
                type: PrincipalType.USER,
                
                platform: {
                    id: mockPlatform.id,
                },
            })

            const mockUpsertGlobalConnectionRequest: UpsertGlobalConnectionRequestBody = {
                pieceVersion: mockPieceMetadata.version,
                displayName: 'test global connection',
                pieceName: mockPieceMetadata.name,
                scope: AppConnectionScope.PLATFORM,
                projectIds: [mockProject.id],
                type: AppConnectionType.SECRET_TEXT,
                value: {
                    type: AppConnectionType.SECRET_TEXT,
                    secret_text: 'test-secret-text',
                },
               
            }

            const upsertResponse = await app?.inject({
                method: 'POST',
                url: '/v1/global-connections',
                headers: {
                    authorization: `Bearer ${mockOwnerToken}`,
                },
                body: mockUpsertGlobalConnectionRequest,
            })
            const connectionId = upsertResponse?.json().id

            const mockUserToken = await generateMockToken({
                id: mockUser.id,
                type: PrincipalType.USER,
                
                platform: {
                    id: mockPlatform.id,
                },
            })


            // act
            const response = await app?.inject({
                method: 'DELETE',
                url: `/v1/global-connections/${connectionId}`,
                headers: {
                    authorization: `Bearer ${mockUserToken}`,
                },
            })
            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })

    describe('Update GlobalConnection endpoint', () => {
        it('Succeeds if user is platform owner', async () => {
            // arrange
            const { mockPlatform, mockProject, mockOwner } = await setupWithGlobalConnections()

            const mockPieceMetadata = createMockPieceMetadata({
                projectId: mockProject.id,
                platformId: mockPlatform.id,
                packageType: PackageType.REGISTRY,
            })
            await databaseConnection().getRepository('piece_metadata').save([mockPieceMetadata])

            

            const mockToken = await generateMockToken({
                id: mockOwner.id,
                type: PrincipalType.USER,
                
                platform: {
                    id: mockPlatform.id,
                },
            })

            const mockUpsertGlobalConnectionRequest: UpsertGlobalConnectionRequestBody = {
                pieceVersion: mockPieceMetadata.version,
                displayName: 'test global connection',
                pieceName: mockPieceMetadata.name,
                scope: AppConnectionScope.PLATFORM,
                type: AppConnectionType.SECRET_TEXT,
                projectIds: [mockProject.id],
                value: {
                    type: AppConnectionType.SECRET_TEXT,
                    secret_text: 'test-secret-text',
                },
               
            }

            const upsertResponse = await app?.inject({
                method: 'POST',
                url: '/v1/global-connections',
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
                body: mockUpsertGlobalConnectionRequest,
            })

            const connectionId = upsertResponse?.json().id
            const mockUpdateGlobalConnectionRequest: UpdateGlobalConnectionValueRequestBody = {
                displayName: 'updated-global-connection',
            }
            

            // act
            const response = await app?.inject({
                method: 'POST',
                url: `/v1/global-connections/${connectionId}`,
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
                body: mockUpdateGlobalConnectionRequest,
            })
            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(response?.json().displayName).toBe('updated-global-connection')
        })

        it('Fails if user is not platform owner', async () => {
            // arrange
            const { mockPlatform, mockProject, mockOwner } = await setupWithGlobalConnections()

            const { mockUser } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })

            const mockPieceMetadata = createMockPieceMetadata({
                projectId: mockProject.id,
                platformId: mockPlatform.id,
                packageType: PackageType.REGISTRY,
            })
            await databaseConnection().getRepository('piece_metadata').save([mockPieceMetadata])

            

            const mockOwnerToken = await generateMockToken({
                id: mockOwner.id,
                type: PrincipalType.USER,
                
                platform: {
                    id: mockPlatform.id,
                },
            })

            const mockUpsertGlobalConnectionRequest: UpsertGlobalConnectionRequestBody = {
                pieceVersion: mockPieceMetadata.version,
                displayName: 'test global connection',
                pieceName: mockPieceMetadata.name,
                scope: AppConnectionScope.PLATFORM,
                type: AppConnectionType.SECRET_TEXT,
                projectIds: [mockProject.id],
                value: {
                    type: AppConnectionType.SECRET_TEXT,
                    secret_text: 'test-secret-text',
                },
               
                
            }

            const upsertResponse = await app?.inject({
                method: 'POST',
                url: '/v1/global-connections',
                headers: {
                    authorization: `Bearer ${mockOwnerToken}`,
                },
                body: mockUpsertGlobalConnectionRequest,
            })

            const connectionId = upsertResponse?.json().id
            const mockUserToken = await generateMockToken({
                id: mockUser.id,
                type: PrincipalType.USER,
                
                platform: {
                    id: mockPlatform.id,
                },
            })

            const mockUpdateGlobalConnectionRequest = {
                displayName: 'updated-global-connection',
            }

            // act
            const response = await app?.inject({
                method: 'POST',
                url: `/v1/global-connections/${connectionId}`,
                headers: {  
                    authorization: `Bearer ${mockUserToken}`,
                },
                body: mockUpdateGlobalConnectionRequest,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('Fails if project ids are invalid', async () => {
            // arrange
            const { mockPlatform, mockProject, mockOwner } = await setupWithGlobalConnections()

            const mockPieceMetadata = createMockPieceMetadata({
                projectId: mockProject.id,
                platformId: mockPlatform.id,
                packageType: PackageType.REGISTRY,
            })
            await databaseConnection().getRepository('piece_metadata').save([mockPieceMetadata])

            

            const mockToken = await generateMockToken({
                id: mockOwner.id,
                type: PrincipalType.USER,
                
                platform: {
                    id: mockPlatform.id,
                },
            })


            const mockUpsertGlobalConnectionRequest: UpsertGlobalConnectionRequestBody = {
                pieceVersion: mockPieceMetadata.version,
                displayName: 'test global connection',
                pieceName: mockPieceMetadata.name,
                scope: AppConnectionScope.PLATFORM,
                type: AppConnectionType.SECRET_TEXT,
                projectIds: [mockProject.id],
                value: {
                    type: AppConnectionType.SECRET_TEXT,
                    secret_text: 'test-secret-text',
                },
               
            }

            const upsertResponse = await app?.inject({
                method: 'POST',
                url: '/v1/global-connections',
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
                body: mockUpsertGlobalConnectionRequest,
            })

            const connectionId = upsertResponse?.json().id

            const mockUpdateGlobalConnectionRequest: UpdateGlobalConnectionValueRequestBody = {
                projectIds: [apId()], // Invalid project ID
                displayName: 'updated-global-connection',
            }

            // act
            const response = await app?.inject({
                method: 'POST',
                url: `/v1/global-connections/${connectionId}`,
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
                body: mockUpdateGlobalConnectionRequest,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })
    })
})
