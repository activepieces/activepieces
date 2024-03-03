import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupApp } from '../../../../src/app/app'
import { generateMockToken } from '../../../helpers/auth'
import {
    createMockUser,
    createMockProject,
    createMockFlow,
    createMockFlowVersion,
    createMockPlatform,
    createMockProjectMember,
} from '../../../helpers/mocks'
import { StatusCodes } from 'http-status-codes'
import { FastifyInstance } from 'fastify'
import {
    FlowOperationType,
    FlowStatus,
    PlatformRole,
    PrincipalType,
    ProjectMemberRole,
    apId,
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
            const mockOwner = createMockUser({ platformId: mockPlatformId })
            const mockUser = createMockUser({ platformId: mockPlatformId })
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
                    role: PlatformRole.MEMBER,
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
            ProjectMemberRole.EXTERNAL_CUSTOMER,
        ])('Fails if user role is %s', async (testRole) => {
            // arrange
            const mockPlatformId = apId()
            const mockOwner = createMockUser({ platformId: mockPlatformId })
            const mockUser = createMockUser({ platformId: mockPlatformId })
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
                    role: PlatformRole.MEMBER,
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
            ProjectMemberRole.ADMIN,
            ProjectMemberRole.EDITOR,
        ])('Succeeds if user role is %s', async (testRole) => {
            // arrange
            const mockPlatformId = apId()
            const mockOwner = createMockUser({ platformId: mockPlatformId })
            const mockUser = createMockUser({ platformId: mockPlatformId })
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
                    role: PlatformRole.MEMBER,
                },
            })

            const mockUpdateFlowStatusRequest = {
                type: FlowOperationType.CHANGE_STATUS,
                request: {
                    status: 'ENABLED',
                },
            }

            // act
            const response = await app?.inject({
                method: 'POST',
                url: `/v1/flows/${mockFlow.id}`,
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
                body: mockUpdateFlowStatusRequest,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)
        })

        it.each([
            ProjectMemberRole.VIEWER,
            ProjectMemberRole.EXTERNAL_CUSTOMER,
        ])('Fails if user role is %s', async (testRole) => {
            // arrange
            const mockPlatformId = apId()
            const mockOwner = createMockUser({ platformId: mockPlatformId })
            const mockUser = createMockUser({ platformId: mockPlatformId })
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
                    role: PlatformRole.MEMBER,
                },
            })

            const mockUpdateFlowStatusRequest = {
                type: FlowOperationType.CHANGE_STATUS,
                request: {
                    status: 'ENABLED',
                },
            }

            // act
            const response = await app?.inject({
                method: 'POST',
                url: `/v1/flows/${mockFlow.id}`,
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
                body: mockUpdateFlowStatusRequest,
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
            ProjectMemberRole.VIEWER,
        ])('Succeeds if user role is %s', async (testRole) => {
            // arrange
            const mockPlatformId = apId()
            const mockOwner = createMockUser({ platformId: mockPlatformId })
            const mockUser = createMockUser({ platformId: mockPlatformId })
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
                    role: PlatformRole.MEMBER,
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
            const mockOwner = createMockUser({ platformId: mockPlatformId })
            const mockUser = createMockUser({ platformId: mockPlatformId })
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
                    role: PlatformRole.MEMBER,
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
