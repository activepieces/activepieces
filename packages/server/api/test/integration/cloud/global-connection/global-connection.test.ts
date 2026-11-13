import { apId, ErrorCode } from '@activepieces/core-utils'
import { AppConnectionScope, AppConnectionType, PackageType, PlatformRole, PrincipalType, UpdateGlobalConnectionValueRequestBody, UpsertGlobalConnectionRequestBody } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import {
    createMockPieceMetadata,
    mockAndSaveBasicSetup,
    mockBasicUser,
} from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
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
                platformId: mockPlatform.id,
                packageType: PackageType.REGISTRY,
            })
            await db.save('piece_metadata', [mockPieceMetadata])

            

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
                url: '/api/v1/global-connections',
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
                platformId: mockPlatform.id,
            })
            await db.save('piece_metadata', [mockPieceMetadata])

            

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
                url: '/api/v1/global-connections',
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
            const { mockPlatform, mockOwner } = await setupWithGlobalConnections()

            const mockPieceMetadata = createMockPieceMetadata({
                platformId: mockPlatform.id,
                packageType: PackageType.REGISTRY,
            })
            await db.save('piece_metadata', [mockPieceMetadata])

            

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
                url: '/api/v1/global-connections',
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
                url: '/api/v1/global-connections',
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
                url: '/api/v1/global-connections',
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
                platformId: mockPlatform.id,
                packageType: PackageType.REGISTRY,
            })
            await db.save('piece_metadata', [mockPieceMetadata])

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
                url: '/api/v1/global-connections',
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
                body: mockUpsertGlobalConnectionRequest,
            })
            const connectionId = upsertResponse?.json().id
            // act
            const response = await app?.inject({
                method: 'DELETE',
                url: `/api/v1/global-connections/${connectionId}`,
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
                platformId: mockPlatform.id,
                packageType: PackageType.REGISTRY,
            })
            await db.save('piece_metadata', [mockPieceMetadata])

            

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
                url: '/api/v1/global-connections',
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
                url: `/api/v1/global-connections/${connectionId}`,
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
                platformId: mockPlatform.id,
                packageType: PackageType.REGISTRY,
            })
            await db.save('piece_metadata', [mockPieceMetadata])

            

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
                url: '/api/v1/global-connections',
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
                url: `/api/v1/global-connections/${connectionId}`,
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
                platformId: mockPlatform.id,
                packageType: PackageType.REGISTRY,
            })
            await db.save('piece_metadata', [mockPieceMetadata])

            

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
                url: '/api/v1/global-connections',
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
                url: `/api/v1/global-connections/${connectionId}`,
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
                platformId: mockPlatform.id,
                packageType: PackageType.REGISTRY,
            })
            await db.save('piece_metadata', [mockPieceMetadata])

            

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
                url: '/api/v1/global-connections',
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
                url: `/api/v1/global-connections/${connectionId}`,
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
                body: mockUpdateGlobalConnectionRequest,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })

        it('Fails with 404 if connection does not exist', async () => {
            const ctx = await createTestContext(app!, { plan: { globalConnectionsEnabled: true } })

            const response = await ctx.post(`/v1/global-connections/${apId()}`, {
                displayName: 'updated-global-connection',
            })

            expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
            expect(response.json().code).toBe(ErrorCode.ENTITY_NOT_FOUND)
        })

        it('Fails with 404 if connection belongs to another platform', async () => {
            const ownerCtx = await createTestContext(app!, { plan: { globalConnectionsEnabled: true } })
            const otherCtx = await createTestContext(app!, { plan: { globalConnectionsEnabled: true } })
            const connectionId = await createGlobalConnection(ownerCtx)

            const response = await otherCtx.post(`/v1/global-connections/${connectionId}`, {
                displayName: 'updated-global-connection',
            })

            expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
            expect(response.json().code).toBe(ErrorCode.ENTITY_NOT_FOUND)
        })

        it('Fails with 404 if updated through the project connections endpoint', async () => {
            const ctx = await createTestContext(app!, { plan: { globalConnectionsEnabled: true } })
            const connectionId = await createGlobalConnection(ctx)

            const response = await ctx.post(`/v1/app-connections/${connectionId}`, {
                displayName: 'updated-global-connection',
                metadata: { foo: 'bar' },
            })

            expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
            expect(response.json().code).toBe(ErrorCode.ENTITY_NOT_FOUND)
        })
    })
})

async function createGlobalConnection(ctx: TestContext): Promise<string> {
    const mockPieceMetadata = createMockPieceMetadata({
        platformId: ctx.platform.id,
        packageType: PackageType.REGISTRY,
    })
    await db.save('piece_metadata', [mockPieceMetadata])
    const response = await ctx.post('/v1/global-connections', {
        pieceVersion: mockPieceMetadata.version,
        displayName: 'test global connection',
        pieceName: mockPieceMetadata.name,
        scope: AppConnectionScope.PLATFORM,
        type: AppConnectionType.SECRET_TEXT,
        projectIds: [ctx.project.id],
        value: {
            type: AppConnectionType.SECRET_TEXT,
            secret_text: 'test-secret-text',
        },
    })
    expect(response.statusCode).toBe(StatusCodes.CREATED)
    return response.json().id
}
