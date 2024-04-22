import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { setupApp } from '../../../../src/app/app'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { engineHelper } from '../../../../src/app/helper/engine-helper'
import { pieceMetadataService } from '../../../../src/app/pieces/piece-metadata-service'
import { generateMockToken } from '../../../helpers/auth'
import {
    createMockPieceMetadata,
    createMockPlatform,
    createMockProject,
    createMockProjectMember,
    createMockUser,
} from '../../../helpers/mocks'
import {
    apId,
    EngineResponseStatus,
    PackageType,
    PlatformRole,
    PrincipalType,
    ProjectMemberRole,
} from '@activepieces/shared'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await databaseConnection.initialize()
    app = await setupApp()
})

afterAll(async () => {
    await databaseConnection.destroy()
    await app?.close()
})

describe('AppConnection API', () => {
    describe('Upsert AppConnection endpoint', () => {
        it.each([
            ProjectMemberRole.ADMIN,
            ProjectMemberRole.EDITOR,
            ProjectMemberRole.EXTERNAL_CUSTOMER,
        ])('Succeeds if user role is %s', async (testRole) => {
            // arrange
            const mockPlatformId = apId()
            const mockOwner = createMockUser({ platformId: mockPlatformId, platformRole: PlatformRole.MEMBER })
            const mockUser = createMockUser({ platformId: mockPlatformId, platformRole: PlatformRole.MEMBER })
            await databaseConnection.getRepository('user').save([mockOwner, mockUser])

            const mockPlatform = createMockPlatform({ id: mockPlatformId, ownerId: mockUser.id })
            await databaseConnection.getRepository('platform').save(mockPlatform)

            const mockProject = createMockProject({
                ownerId: mockOwner.id,
                platformId: mockPlatform.id,
            })
            await databaseConnection.getRepository('project').save([mockProject])

            const mockProjectMember = createMockProjectMember({
                email: mockUser.email,
                platformId: mockPlatform.id,
                projectId: mockProject.id,
                role: testRole,
            })
            await databaseConnection.getRepository('project_member').save([mockProjectMember])

            const mockPieceMetadata = createMockPieceMetadata({
                projectId: mockProject.id,
                platformId: mockPlatform.id,
                packageType: PackageType.REGISTRY,
            })
            await databaseConnection.getRepository('piece_metadata').save([mockPieceMetadata])

            pieceMetadataService.getOrThrow = jest.fn().mockResolvedValue(mockPieceMetadata)

            engineHelper.executeValidateAuth = jest.fn().mockResolvedValue({
                status: EngineResponseStatus.OK,
                result: {
                    valid: true,
                },
                standardError: '',
                standardOutput: '',
            })

            const mockToken = await generateMockToken({
                id: mockUser.id,
                type: PrincipalType.USER,
                projectId: mockProject.id,
                platform: {
                    id: mockPlatform.id,
                },
            })

            const mockUpsertAppConnectionRequest = {
                name: 'test-app-connection',
                pieceName: mockPieceMetadata.name,
                projectId: mockProject.id,
                type: 'SECRET_TEXT',
                value: {
                    type: 'SECRET_TEXT',
                    secret_text: 'test-secret-text',
                },
            }

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/app-connections',
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
                body: mockUpsertAppConnectionRequest,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.CREATED)
        })

        it('Fails if user role is VIEWER', async () => {
            // arrange
            const mockPlatformId = apId()
            const mockOwner = createMockUser({ platformId: mockPlatformId, platformRole: PlatformRole.MEMBER })
            const mockUser = createMockUser({ platformId: mockPlatformId, platformRole: PlatformRole.MEMBER })
            await databaseConnection.getRepository('user').save([mockOwner, mockUser])

            const mockPlatform = createMockPlatform({ id: mockPlatformId, ownerId: mockUser.id })
            await databaseConnection.getRepository('platform').save(mockPlatform)

            const mockProject = createMockProject({
                ownerId: mockOwner.id,
                platformId: mockPlatform.id,
            })
            await databaseConnection.getRepository('project').save([mockProject])

            const mockProjectMember = createMockProjectMember({
                email: mockUser.email,
                platformId: mockPlatform.id,
                projectId: mockProject.id,
                role: ProjectMemberRole.VIEWER,
            })
            await databaseConnection.getRepository('project_member').save([mockProjectMember])

            const mockPieceMetadata = createMockPieceMetadata({
                projectId: mockProject.id,
                platformId: mockPlatform.id,
            })
            await databaseConnection.getRepository('piece_metadata').save([mockPieceMetadata])

            pieceMetadataService.getOrThrow = jest.fn().mockResolvedValue(mockPieceMetadata)

            engineHelper.executeValidateAuth = jest.fn().mockResolvedValue({
                status: EngineResponseStatus.OK,
                result: {
                    valid: true,
                },
                standardError: '',
                standardOutput: '',
            })

            const mockToken = await generateMockToken({
                id: mockUser.id,
                type: PrincipalType.USER,
                projectId: mockProject.id,
                platform: {
                    id: mockPlatform.id,
                },
            })

            const mockUpsertAppConnectionRequest = {
                name: 'test-app-connection',
                pieceName: mockPieceMetadata.name,
                projectId: mockProject.id,
                type: 'SECRET_TEXT',
                value: {
                    type: 'SECRET_TEXT',
                    secret_text: 'test-secret-text',
                },
            }

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/app-connections',
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
                body: mockUpsertAppConnectionRequest,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)

            const responseBody = response?.json()
            expect(responseBody?.code).toBe('PERMISSION_DENIED')
            expect(responseBody?.params?.userId).toBe(mockUser.id)
            expect(responseBody?.params?.projectId).toBe(mockProject.id)
        })
    })

    describe('List AppConnections endpoint', () => {
        it.each([
            ProjectMemberRole.ADMIN,
            ProjectMemberRole.EDITOR,
            ProjectMemberRole.VIEWER,
            ProjectMemberRole.EXTERNAL_CUSTOMER,
        ])('Succeeds if user role is %s', async (testRole) => {
            // arrange
            const mockPlatformId = apId()
            const mockOwner = createMockUser({ platformId: mockPlatformId, platformRole: PlatformRole.ADMIN })
            const mockUser = createMockUser({ platformId: mockPlatformId, platformRole: PlatformRole.MEMBER })
            await databaseConnection.getRepository('user').save([mockOwner, mockUser])

            const mockPlatform = createMockPlatform({ id: mockPlatformId, ownerId: mockUser.id })
            await databaseConnection.getRepository('platform').save(mockPlatform)

            const mockProject = createMockProject({
                ownerId: mockOwner.id,
                platformId: mockPlatform.id,
            })
            await databaseConnection.getRepository('project').save([mockProject])

            const mockProjectMember = createMockProjectMember({
                email: mockUser.email,
                platformId: mockPlatform.id,
                projectId: mockProject.id,
                role: testRole,
            })
            await databaseConnection.getRepository('project_member').save([mockProjectMember])

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
                url: '/v1/app-connections',
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
                query: {
                    projectId: mockProject.id,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)
        })
    })
})
