import {
    DefaultProjectRole,
    FlowOperationType,
    FlowStatus,
    FlowTriggerType,
    PackageType,
    PieceType,
    PlatformRole,
    PrincipalType,
    ProjectRole,
    TriggerStrategy,
    TriggerTestStrategy,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupServer } from '../../../../src/app/server'
import { generateMockToken } from '../../../helpers/auth'
import {
    createMockFlow,
    createMockFlowVersion,
    createMockPieceMetadata,
    createMockProjectMember,
    mockAndSaveBasicSetup,
    mockBasicUser,
} from '../../../helpers/mocks'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await initializeDatabase({ runMigrations: false })
    app = await setupServer()
})

afterAll(async () => {
    await databaseConnection().destroy()
    await app?.close()
})

describe('Flow API', () => {
    describe('Create Flow endpoint', () => {

        it.each([
            DefaultProjectRole.ADMIN,
            DefaultProjectRole.EDITOR,
        ])('Succeeds if user role is %s', async (testRole) => {
            // arrange
            const { mockPlatform, mockProject } = await mockAndSaveBasicSetup()

            const { mockUser } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })

            const projectRole = await databaseConnection().getRepository('project_role').findOneByOrFail({ name: testRole }) as ProjectRole

            const mockProjectMember = createMockProjectMember({
                userId: mockUser.id,
                platformId: mockPlatform.id,
                projectId: mockProject.id,
                projectRoleId: projectRole.id,
            })
            await databaseConnection().getRepository('project_member').save([mockProjectMember])

            const mockToken = await generateMockToken({
                id: mockUser.id,
                type: PrincipalType.USER,
                
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
            DefaultProjectRole.VIEWER,
            DefaultProjectRole.OPERATOR,
        ])('Fails if user role is %s', async (testRole) => {
            // arrange
            const { mockPlatform, mockProject } = await mockAndSaveBasicSetup()

            const { mockUser } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })

            const projectRole = await databaseConnection().getRepository('project_role').findOneByOrFail({ name: testRole }) as ProjectRole

            const mockProjectMember = createMockProjectMember({
                userId: mockUser.id,
                platformId: mockPlatform.id,
                projectId: mockProject.id,
                projectRoleId: projectRole.id,
            })
            await databaseConnection().getRepository('project_member').save([mockProjectMember])

            const mockToken = await generateMockToken({
                id: mockUser.id,
                type: PrincipalType.USER,
                
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
                role: DefaultProjectRole.ADMIN,
                request: {
                    type: FlowOperationType.CHANGE_STATUS,
                    request: {
                        status: 'ENABLED',
                    },
                },
            },
            {
                role: DefaultProjectRole.EDITOR,
                request: {
                    type: FlowOperationType.CHANGE_STATUS,
                    request: {
                        status: 'ENABLED',
                    },
                },
            },
            {
                role: DefaultProjectRole.OPERATOR,
                request: {
                    type: FlowOperationType.CHANGE_STATUS,
                    request: {
                        status: 'ENABLED',
                    },
                },
            },
        ])('Succeeds if user role is %s', async ({ role, request }) => {
            // arrange
            const { mockPlatform, mockProject } = await mockAndSaveBasicSetup()
            const { mockUser } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })

            const projectRole = await databaseConnection().getRepository('project_role').findOneByOrFail({ name: role }) as ProjectRole

            const mockProjectMember = createMockProjectMember({
                userId: mockUser.id,
                platformId: mockPlatform.id,
                projectId: mockProject.id,
                projectRoleId: projectRole.id,
            })
            await databaseConnection().getRepository('project_member').save([mockProjectMember])
            
            const mockFlow = createMockFlow({
                projectId: mockProject.id,
                status: FlowStatus.DISABLED,
            })
            await databaseConnection().getRepository('flow').save([mockFlow])
            const mockPieceMetadata = createMockPieceMetadata({ 
                name: '@activepieces/piece-schedule',
                version: '0.1.5',
                triggers: {
                    'every_hour': {
                        'name': 'every_hour',
                        'displayName': 'Every Hour',
                        'description': 'Triggers the current flow every hour',
                        'requireAuth': false,
                        'props': {
                        },
                        'type': TriggerStrategy.POLLING,
                        'sampleData': {
                        },
                        'testStrategy': TriggerTestStrategy.TEST_FUNCTION,
                    },
                },
                pieceType: PieceType.OFFICIAL,
                packageType: PackageType.REGISTRY,
            })
            await databaseConnection().getRepository('piece_metadata').save([mockPieceMetadata])
            const mockFlowVersion = createMockFlowVersion({
                flowId: mockFlow.id,
                updatedBy: mockUser.id,
                trigger: {
                    type: FlowTriggerType.PIECE,
                    name: 'trigger',
                    settings: {
                        pieceName: '@activepieces/piece-schedule',
                        pieceVersion: '0.1.5',
                        input: {},
                        propertySettings: {},
                        triggerName: 'every_hour',
                    },
                    valid: true,
                    displayName: 'Trigger',
                },
            })
            await databaseConnection()
                .getRepository('flow_version')
                .save([mockFlowVersion])

            await databaseConnection().getRepository('flow').update(mockFlow.id, {
                publishedVersionId: mockFlowVersion.id,
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
                role: DefaultProjectRole.VIEWER,
                request: {
                    type: FlowOperationType.CHANGE_STATUS,
                    request: {
                        status: 'ENABLED',
                    },
                },
            },
            {
                role: DefaultProjectRole.OPERATOR,
                request: {
                    type: FlowOperationType.CHANGE_NAME,
                    request: {
                        displayName: 'hello',
                    },
                },
            },
        ])('Fails if user role is %s', async ({ role, request }) => {
            // arrange
            const { mockPlatform, mockProject } = await mockAndSaveBasicSetup()

            const { mockUser } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })

            const projectRole = await databaseConnection().getRepository('project_role').findOneByOrFail({ name: role }) as ProjectRole

            const mockProjectMember = createMockProjectMember({
                userId: mockUser.id,
                platformId: mockPlatform.id,
                projectId: mockProject.id,
                projectRoleId: projectRole.id,
            })
            await databaseConnection().getRepository('project_member').save([mockProjectMember])

            const mockFlow = createMockFlow({
                projectId: mockProject.id,
                status: FlowStatus.DISABLED,
            })
            await databaseConnection().getRepository('flow').save([mockFlow])

            const mockFlowVersion = createMockFlowVersion({
                flowId: mockFlow.id,
                updatedBy: mockUser.id,
            })
            await databaseConnection()
                .getRepository('flow_version')
                .save([mockFlowVersion])

            await databaseConnection().getRepository('flow').update(mockFlow.id, {
                publishedVersionId: mockFlowVersion.id,
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
            DefaultProjectRole.ADMIN,
            DefaultProjectRole.EDITOR,
            DefaultProjectRole.OPERATOR,
            DefaultProjectRole.VIEWER,
        ])('Succeeds if user role is %s', async (testRole) => {
            // arrange
            const { mockPlatform, mockProject } = await mockAndSaveBasicSetup()

            const { mockUser } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })

            const projectRole = await databaseConnection().getRepository('project_role').findOneByOrFail({ name: testRole }) as ProjectRole

            const mockProjectMember = createMockProjectMember({
                userId: mockUser.id,
                platformId: mockPlatform.id,
                projectId: mockProject.id,
                projectRoleId: projectRole.id,
            })
            await databaseConnection().getRepository('project_member').save([mockProjectMember])

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

      
    })
})
