import {
    FlowOperationType,
    FlowStatus,
    FlowVersionState,
    PrincipalType,
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
    createMockPlatform,
    createMockProject,
    createMockUser,
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
        it('Adds an empty flow', async () => {
            // arrange
            const mockUser = createMockUser()
            await databaseConnection().getRepository('user').save([mockUser])

            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            await databaseConnection().getRepository('platform').save(mockPlatform)

            const mockProject = createMockProject({
                ownerId: mockUser.id,
                platformId: mockPlatform.id,
            })
            await databaseConnection().getRepository('project').save([mockProject])

            const mockToken = await generateMockToken({
                type: PrincipalType.USER,
                projectId: mockProject.id,
                id: mockUser.id,
            })

            const mockCreateFlowRequest = {
                displayName: 'test flow',
                projectId: mockProject.id,
            }

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/flows',
                query: {
                    projectId: mockProject.id,
                },
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
                body: mockCreateFlowRequest,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            const responseBody = response?.json()

            expect(Object.keys(responseBody)).toHaveLength(9)
            expect(responseBody?.id).toHaveLength(21)
            expect(responseBody?.created).toBeDefined()
            expect(responseBody?.updated).toBeDefined()
            expect(responseBody?.projectId).toBe(mockProject.id)
            expect(responseBody?.folderId).toBeNull()
            expect(responseBody?.status).toBe('DISABLED')
            expect(responseBody?.publishedVersionId).toBeNull()
            expect(responseBody?.schedule).toBeNull()

            expect(Object.keys(responseBody?.version)).toHaveLength(10)
            expect(responseBody?.version?.id).toHaveLength(21)
            expect(responseBody?.version?.created).toBeDefined()
            expect(responseBody?.version?.updated).toBeDefined()
            expect(responseBody?.version?.updatedBy).toBeNull()
            expect(responseBody?.version?.flowId).toBe(responseBody?.id)
            expect(responseBody?.version?.displayName).toBe('test flow')
            expect(Object.keys(responseBody?.version?.trigger)).toHaveLength(5)
            expect(responseBody?.version?.trigger.type).toBe('EMPTY')
            expect(responseBody?.version?.trigger.name).toBe('trigger')
            expect(responseBody?.version?.trigger.settings).toMatchObject({})
            expect(responseBody?.version?.trigger.valid).toBe(false)
            expect(responseBody?.version?.trigger.displayName).toBe('Select Trigger')
            expect(responseBody?.version?.valid).toBe(false)
            expect(responseBody?.version?.state).toBe('DRAFT')
        })
    })

    describe('Update status endpoint', () => {
        it('Enables a disabled Flow', async () => {
            // arrange
            const mockUser = createMockUser()
            await databaseConnection().getRepository('user').save([mockUser])

            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            await databaseConnection().getRepository('platform').save(mockPlatform)

            const mockProject = createMockProject({
                ownerId: mockUser.id,
                platformId: mockPlatform.id,
            })
            await databaseConnection().getRepository('project').save([mockProject])

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
                type: PrincipalType.USER,
                projectId: mockProject.id,
                id: mockUser.id,
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
            const responseBody = response?.json()

            expect(Object.keys(responseBody)).toHaveLength(9)
            expect(responseBody?.id).toBe(mockFlow.id)
            expect(responseBody?.created).toBeDefined()
            expect(responseBody?.updated).toBeDefined()
            expect(responseBody?.projectId).toBe(mockProject.id)
            expect(responseBody?.folderId).toBeNull()
            expect(responseBody?.status).toBe('ENABLED')
            expect(responseBody?.publishedVersionId).toBe(mockFlowVersion.id)
            expect(responseBody?.schedule).toBeNull()

            expect(Object.keys(responseBody?.version)).toHaveLength(10)
            expect(responseBody?.version?.id).toBe(mockFlowVersion.id)
        })

        it('Disables an enabled Flow', async () => {
            // arrange
            const mockUser = createMockUser()
            await databaseConnection().getRepository('user').save([mockUser])

            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            await databaseConnection().getRepository('platform').save(mockPlatform)

            const mockProject = createMockProject({
                ownerId: mockUser.id,
                platformId: mockPlatform.id,
            })
            await databaseConnection().getRepository('project').save([mockProject])
            const mockFlow = createMockFlow({
                projectId: mockProject.id,
                status: FlowStatus.ENABLED,
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
                type: PrincipalType.USER,
                projectId: mockProject.id,
                id: mockUser.id,
            })

            const mockUpdateFlowStatusRequest = {
                type: FlowOperationType.CHANGE_STATUS,
                request: {
                    status: 'DISABLED',
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
            const responseBody = response?.json()

            expect(Object.keys(responseBody)).toHaveLength(9)
            expect(responseBody?.id).toBe(mockFlow.id)
            expect(responseBody?.created).toBeDefined()
            expect(responseBody?.updated).toBeDefined()
            expect(responseBody?.projectId).toBe(mockProject.id)
            expect(responseBody?.folderId).toBeNull()
            expect(responseBody?.status).toBe('DISABLED')
            expect(responseBody?.publishedVersionId).toBe(mockFlowVersion.id)
            expect(responseBody?.schedule).toBeNull()

            expect(Object.keys(responseBody?.version)).toHaveLength(10)
            expect(responseBody?.version?.id).toBe(mockFlowVersion.id)
        })
    })

    describe('Update published version id endpoint', () => {
        it('Publishes latest draft version', async () => {
            // arrange
            const mockUser = createMockUser()
            await databaseConnection().getRepository('user').save([mockUser])

            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            await databaseConnection().getRepository('platform').save(mockPlatform)

            const mockProject = createMockProject({
                ownerId: mockUser.id,
                platformId: mockPlatform.id,
            })
            await databaseConnection().getRepository('project').save([mockProject])
            const mockFlow = createMockFlow({
                projectId: mockProject.id,
                status: FlowStatus.DISABLED,
            })
            await databaseConnection().getRepository('flow').save([mockFlow])

            const mockFlowVersion = createMockFlowVersion({
                flowId: mockFlow.id,
                updatedBy: mockUser.id,
                state: FlowVersionState.DRAFT,
            })
            await databaseConnection()
                .getRepository('flow_version')
                .save([mockFlowVersion])

            const mockToken = await generateMockToken({
                id: mockUser.id,
                type: PrincipalType.USER,
                projectId: mockProject.id,
            })

            // act
            const response = await app?.inject({
                method: 'POST',
                url: `/v1/flows/${mockFlow.id}`,
                body: {
                    type: FlowOperationType.LOCK_AND_PUBLISH,
                    request: {},
                },
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)
            const responseBody = response?.json()

            expect(Object.keys(responseBody)).toHaveLength(9)
            expect(responseBody?.id).toBe(mockFlow.id)
            expect(responseBody?.created).toBeDefined()
            expect(responseBody?.updated).toBeDefined()
            expect(responseBody?.projectId).toBe(mockProject.id)
            expect(responseBody?.folderId).toBeNull()
            expect(responseBody?.status).toBe('ENABLED')
            expect(responseBody?.publishedVersionId).toBe(mockFlowVersion.id)
            expect(responseBody?.schedule).toBeNull()

            expect(Object.keys(responseBody?.version)).toHaveLength(10)
            expect(responseBody?.version?.id).toBe(mockFlowVersion.id)
            expect(responseBody?.version?.state).toBe('LOCKED')
        })
    })

    describe('List Flows endpoint', () => {
        it('Filters Flows by status', async () => {
            // arrange
            const mockUser = createMockUser()
            await databaseConnection().getRepository('user').save([mockUser])

            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            await databaseConnection().getRepository('platform').save(mockPlatform)

            const mockProject = createMockProject({
                ownerId: mockUser.id,
                platformId: mockPlatform.id,
            })
            await databaseConnection().getRepository('project').save([mockProject])

            const mockEnabledFlow = createMockFlow({
                projectId: mockProject.id,
                status: FlowStatus.ENABLED,
            })
            const mockDisabledFlow = createMockFlow({
                projectId: mockProject.id,
                status: FlowStatus.DISABLED,
            })
            await databaseConnection()
                .getRepository('flow')
                .save([mockEnabledFlow, mockDisabledFlow])

            const mockEnabledFlowVersion = createMockFlowVersion({
                flowId: mockEnabledFlow.id,
            })
            const mockDisabledFlowVersion = createMockFlowVersion({
                flowId: mockDisabledFlow.id,
            })
            await databaseConnection()
                .getRepository('flow_version')
                .save([mockEnabledFlowVersion, mockDisabledFlowVersion])

            const mockToken = await generateMockToken({
                type: PrincipalType.USER,
                projectId: mockProject.id,
                id: mockUser.id,
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
            const responseBody = response?.json()

            expect(responseBody.data).toHaveLength(1)
            expect(responseBody.data[0].id).toBe(mockEnabledFlow.id)
        })

        it('Populates Flow version', async () => {
            // arrange
            const mockUser = createMockUser()
            await databaseConnection().getRepository('user').save([mockUser])

            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            await databaseConnection().getRepository('platform').save(mockPlatform)

            const mockProject = createMockProject({
                platformId: mockPlatform.id,
                ownerId: mockUser.id,
            })
            await databaseConnection().getRepository('project').save([mockProject])

            const mockFlow = createMockFlow({ projectId: mockProject.id })
            await databaseConnection().getRepository('flow').save([mockFlow])

            const mockFlowVersion = createMockFlowVersion({ flowId: mockFlow.id })
            await databaseConnection()
                .getRepository('flow_version')
                .save([mockFlowVersion])

            const mockToken = await generateMockToken({
                type: PrincipalType.USER,
                projectId: mockProject.id,
                id: mockUser.id,
            })

            // act
            const response = await app?.inject({
                method: 'GET',
                url: '/v1/flows',
                query: {
                    projectId: mockProject.id,
                },
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)
            const responseBody = response?.json()

            expect(responseBody?.data).toHaveLength(1)
            expect(responseBody?.data?.[0]?.id).toBe(mockFlow.id)
            expect(responseBody?.data?.[0]?.version?.id).toBe(mockFlowVersion.id)
        })

        it('Fails if a flow with no version exists', async () => {
            // arrange
            const mockUser = createMockUser()
            await databaseConnection().getRepository('user').save([mockUser])

            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            await databaseConnection().getRepository('platform').save(mockPlatform)

            const mockProject = createMockProject({
                platformId: mockPlatform.id,
                ownerId: mockUser.id,
            })
            await databaseConnection().getRepository('project').save([mockProject])

            const mockFlow = createMockFlow({ projectId: mockProject.id })
            await databaseConnection().getRepository('flow').save([mockFlow])

            const mockToken = await generateMockToken({
                type: PrincipalType.USER,
                projectId: mockProject.id,
                id: mockUser.id,
            })

            // act
            const response = await app?.inject({
                method: 'GET',
                url: '/v1/flows',
                query: {
                    projectId: mockProject.id,
                },
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
            const responseBody = response?.json()

            expect(responseBody?.code).toBe('ENTITY_NOT_FOUND')
            expect(responseBody?.params?.entityType).toBe('FlowVersion')
            expect(responseBody?.params?.message).toBe(`flowId=${mockFlow.id}`)
        })
    })

    describe('Export Flow Template endpoint', () => {
        it('Exports a flow template using an API key', async () => {
            // arrange
            const mockUser = createMockUser()
            await databaseConnection().getRepository('user').save([mockUser])

            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            await databaseConnection().getRepository('platform').save(mockPlatform)

            const mockProject = createMockProject({
                ownerId: mockUser.id,
                platformId: mockPlatform.id,
            })
            await databaseConnection().getRepository('project').save([mockProject])

            const mockFlow = createMockFlow({
                projectId: mockProject.id,
                status: FlowStatus.ENABLED,
            })
            await databaseConnection().getRepository('flow').save([mockFlow])

            const mockFlowVersion = createMockFlowVersion({
                flowId: mockFlow.id,
                updatedBy: mockUser.id,
            })
            await databaseConnection()
                .getRepository('flow_version')
                .save([mockFlowVersion])

            const mockApiKey = 'test_api_key'
            const mockToken = await generateMockToken({
                type: PrincipalType.SERVICE,
                projectId: mockProject.id,
                id: mockApiKey,
            })

            // act
            const response = await app?.inject({
                method: 'GET',
                url: `/v1/flows/${mockFlow.id}/template`,
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)
            const responseBody = response?.json()

            expect(responseBody).toHaveProperty('name')
            expect(responseBody).toHaveProperty('description')
            expect(responseBody).toHaveProperty('template')
            expect(responseBody.template).toHaveProperty('trigger')
        })
    })
})
