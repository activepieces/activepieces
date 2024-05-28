import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { setupApp } from '../../../../src/app/app'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { generateMockToken } from '../../../helpers/auth'
import {
    createMockFlow,
    createMockFlowVersion,
    createMockPlatform,
    createMockProject,
    createMockProjectMember,
    createMockUser,
} from '../../../helpers/mocks'
import {
    apId,
    FlowOperationType,
    FlowStatus,
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

describe('Flow API', () => {
    describe('Create Flow endpoint', () => {

        it.each([
            ProjectMemberRole.ADMIN,
            ProjectMemberRole.EDITOR,
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

            const mockCreateFlowRequest = {
                displayName: 'test flow',
                projectId: mockProject.id,
            }

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/flows',
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
                body: mockCreateFlowRequest,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.CREATED)
        })

        it.each([
            ProjectMemberRole.VIEWER,
            ProjectMemberRole.OPERATOR,
            ProjectMemberRole.EXTERNAL_CUSTOMER,
        ])('Fails if user role is %s', async (testRole) => {
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

            const mockCreateFlowRequest = {
                displayName: 'test flow',
                projectId: mockProject.id,
            }

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/flows',
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
                body: mockCreateFlowRequest,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)

            const responseBody = response?.json()
            expect(responseBody?.code).toBe('PERMISSION_DENIED')
            expect(responseBody?.params?.userId).toBe(mockUser.id)
            expect(responseBody?.params?.projectId).toBe(mockProject.id)
        })
    })

    describe('Update flow endpoint', () => {
        it.each([
            {
                role: ProjectMemberRole.ADMIN,
                request: {
                    type: FlowOperationType.CHANGE_STATUS,
                    request: {
                        status: 'ENABLED',
                    },
                },
            },
            {
                role: ProjectMemberRole.EDITOR,
                request: {
                    type: FlowOperationType.CHANGE_STATUS,
                    request: {
                        status: 'ENABLED',
                    },
                },
            },
            {
                role: ProjectMemberRole.OPERATOR,
                request: {
                    type: FlowOperationType.CHANGE_STATUS,
                    request: {
                        status: 'ENABLED',
                    },
                },
            },
        ])('Succeeds if user role is %s', async ({ role, request }) => {
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
                role,
            })
            await databaseConnection.getRepository('project_member').save([mockProjectMember])

            const mockFlow = createMockFlow({
                projectId: mockProject.id,
                status: FlowStatus.DISABLED,
            })
            await databaseConnection.getRepository('flow').save([mockFlow])

            const mockFlowVersion = createMockFlowVersion({
                flowId: mockFlow.id,
                updatedBy: mockUser.id,
            })
            await databaseConnection
                .getRepository('flow_version')
                .save([mockFlowVersion])

            await databaseConnection.getRepository('flow').update(mockFlow.id, {
                publishedVersionId: mockFlowVersion.id,
            })

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
                method: 'POST',
                url: `/v1/flows/${mockFlow.id}`,
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
                body: request,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)
        })

        it.each([
            {
                role: ProjectMemberRole.VIEWER,
                request: {
                    type: FlowOperationType.CHANGE_STATUS,
                    request: {
                        status: 'ENABLED',
                    },
                },
            },
            {
                role: ProjectMemberRole.EXTERNAL_CUSTOMER,
                request: {
                    type: FlowOperationType.CHANGE_STATUS,
                    request: {
                        status: 'ENABLED',
                    },
                },
            },
            {
                role: ProjectMemberRole.OPERATOR,
                request: {
                    type: FlowOperationType.CHANGE_NAME,
                    request: {
                        displayName: 'hello',
                    },
                },
            },
        ])('Fails if user role is %s', async ({ role, request }) => {
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
                role,
            })
            await databaseConnection.getRepository('project_member').save([mockProjectMember])

            const mockFlow = createMockFlow({
                projectId: mockProject.id,
                status: FlowStatus.DISABLED,
            })
            await databaseConnection.getRepository('flow').save([mockFlow])

            const mockFlowVersion = createMockFlowVersion({
                flowId: mockFlow.id,
                updatedBy: mockUser.id,
            })
            await databaseConnection
                .getRepository('flow_version')
                .save([mockFlowVersion])

            await databaseConnection.getRepository('flow').update(mockFlow.id, {
                publishedVersionId: mockFlowVersion.id,
            })

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
                method: 'POST',
                url: `/v1/flows/${mockFlow.id}`,
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
                body: request,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)

            const responseBody = response?.json()
            expect(responseBody?.code).toBe('PERMISSION_DENIED')
            expect(responseBody?.params?.userId).toBe(mockUser.id)
            expect(responseBody?.params?.projectId).toBe(mockProject.id)
        })
    })

    describe('List Flows endpoint', () => {
        it.each([
            ProjectMemberRole.ADMIN,
            ProjectMemberRole.EDITOR,
            ProjectMemberRole.OPERATOR,
            ProjectMemberRole.VIEWER,
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
                url: '/v1/flows',
                query: {
                    projectId: mockProject.id,
                    status: 'ENABLED',
                },
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)
        })

        it('Fails if user role is EXTERNAL_CUSTOMER', async () => {
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
                role: ProjectMemberRole.EXTERNAL_CUSTOMER,
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
                url: '/v1/flows',
                query: {
                    projectId: mockProject.id,
                    status: 'ENABLED',
                },
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)

            const responseBody = response?.json()
            expect(responseBody?.code).toBe('PERMISSION_DENIED')
            expect(responseBody?.params?.userId).toBe(mockUser.id)
            expect(responseBody?.params?.projectId).toBe(mockProject.id)
        })
    })
})
