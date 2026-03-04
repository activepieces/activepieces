import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { WebhookRenewStrategy } from '@activepieces/pieces-framework'
import {
    FlowOperationType,
    FlowStatus,
    FlowTriggerType,
    FlowVersionState,
    PackageType,
    PieceType,
    PopulatedFlow,
    PrincipalType,
    PropertyExecutionType,
    TriggerStrategy,
    TriggerTestStrategy,
    WebhookHandshakeStrategy,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import {
    createMockFlow,
    createMockFlowVersion,
    createMockPieceMetadata,
    mockAndSaveBasicSetup,
} from '../../../helpers/mocks'
import { createTestContext } from '../../../helpers/test-context'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Flow API', () => {
    describe('Create Flow endpoint', () => {
        it('Adds an empty flow', async () => {
            const ctx = await createTestContext(app!)

            const response = await ctx.post('/v1/flows', {
                displayName: 'test flow',
                projectId: ctx.project.id,
                metadata: { foo: 'bar' },
            }, { query: { projectId: ctx.project.id } })

            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            const responseBody = response?.json()

            expect(Object.keys(responseBody)).toHaveLength(14)
            expect(responseBody?.id).toHaveLength(21)
            expect(responseBody?.created).toBeDefined()
            expect(responseBody?.updated).toBeDefined()
            expect(responseBody?.projectId).toBe(ctx.project.id)
            expect(responseBody?.folderId).toBeNull()
            expect(responseBody?.status).toBe('DISABLED')
            expect(responseBody?.publishedVersionId).toBeNull()
            expect(responseBody?.metadata).toMatchObject({ foo: 'bar' })
            expect(responseBody?.operationStatus).toBeDefined()
            expect(responseBody?.templateId).toBeNull()

            expect(Object.keys(responseBody?.version)).toHaveLength(14)
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
            const ctx = await createTestContext(app!)

            const mockPieceMetadata1 = createMockPieceMetadata({
                name: '@activepieces/piece-schedule',
                version: '0.1.5',
                triggers: {
                    every_hour: {
                        name: 'every_hour',
                        displayName: 'Every Hour',
                        description: 'Triggers the current flow every hour',
                        requireAuth: false,
                        props: {},
                        type: TriggerStrategy.POLLING,
                        sampleData: {},
                        testStrategy: TriggerTestStrategy.TEST_FUNCTION,
                    },
                },
                pieceType: PieceType.OFFICIAL,
                packageType: PackageType.REGISTRY,
            })
            await db.save('piece_metadata', mockPieceMetadata1)

            const mockFlow = createMockFlow({
                projectId: ctx.project.id,
                status: FlowStatus.DISABLED,
            })
            await db.save('flow', mockFlow)

            const mockFlowVersion = createMockFlowVersion({
                flowId: mockFlow.id,
                updatedBy: ctx.user.id,
                trigger: {
                    type: FlowTriggerType.PIECE,
                    settings: {
                        pieceName: '@activepieces/piece-schedule',
                        pieceVersion: '0.1.5',
                        input: { run_on_weekends: false },
                        triggerName: 'every_hour',
                        propertySettings: {
                            run_on_weekends: { type: PropertyExecutionType.MANUAL },
                        },
                    },
                    valid: true,
                    name: 'trigger',
                    displayName: 'Schedule',
                },
            })
            await db.save('flow_version', mockFlowVersion)
            await db.update('flow', mockFlow.id, { publishedVersionId: mockFlowVersion.id })

            const response = await ctx.post(`/v1/flows/${mockFlow.id}`, {
                type: FlowOperationType.CHANGE_STATUS,
                request: { status: 'ENABLED' },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const responseBody: PopulatedFlow | undefined = response?.json()
            expect(responseBody).toBeDefined()
            if (responseBody) {
                expect(responseBody.id).toBe(mockFlow.id)
                expect(responseBody.created).toBeDefined()
                expect(responseBody.updated).toBeDefined()
                expect(responseBody.projectId).toBe(ctx.project.id)
                expect(responseBody.folderId).toBeNull()
                expect(responseBody.publishedVersionId).toBe(mockFlowVersion.id)
                expect(responseBody.metadata).toBeNull()
                expect(responseBody.operationStatus).toBe('ENABLING')
                expect(Object.keys(responseBody.version)).toHaveLength(14)
                expect(responseBody.version.id).toBe(mockFlowVersion.id)
            }
        })

        it('Disables an enabled Flow', async () => {
            const ctx = await createTestContext(app!)

            const mockFlow = createMockFlow({
                projectId: ctx.project.id,
                status: FlowStatus.ENABLED,
            })
            await db.save('flow', mockFlow)

            const mockFlowVersion = createMockFlowVersion({
                flowId: mockFlow.id,
                updatedBy: ctx.user.id,
            })
            await db.save('flow_version', mockFlowVersion)
            await db.update('flow', mockFlow.id, { publishedVersionId: mockFlowVersion.id })

            const response = await ctx.post(`/v1/flows/${mockFlow.id}`, {
                type: FlowOperationType.CHANGE_STATUS,
                request: { status: 'DISABLED' },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const responseBody = response?.json()

            expect(Object.keys(responseBody)).toHaveLength(14)
            expect(responseBody?.id).toBe(mockFlow.id)
            expect(responseBody?.created).toBeDefined()
            expect(responseBody?.updated).toBeDefined()
            expect(responseBody?.projectId).toBe(ctx.project.id)
            expect(responseBody?.folderId).toBeNull()
            expect(responseBody?.status).toBe('ENABLED')
            expect(responseBody?.publishedVersionId).toBe(mockFlowVersion.id)
            expect(responseBody?.metadata).toBeNull()
            expect(responseBody?.operationStatus).toBe('DISABLING')
            expect(responseBody?.templateId).toBeNull()
            expect(Object.keys(responseBody?.version)).toHaveLength(14)
            expect(responseBody?.version?.id).toBe(mockFlowVersion.id)
        })
    })

    describe('Update published version id endpoint', () => {
        it('Publishes latest draft version', async () => {
            const ctx = await createTestContext(app!)

            const mockPieceMetadata1 = createMockPieceMetadata({
                name: '@activepieces/piece-schedule',
                version: '0.1.5',
                triggers: {
                    every_hour: {
                        name: 'every_hour',
                        displayName: 'Every Hour',
                        description: 'Triggers the current flow every hour',
                        requireAuth: true,
                        props: {},
                        type: TriggerStrategy.WEBHOOK,
                        handshakeConfiguration: { strategy: WebhookHandshakeStrategy.NONE },
                        renewConfiguration: { strategy: WebhookRenewStrategy.NONE },
                        sampleData: {},
                        testStrategy: TriggerTestStrategy.TEST_FUNCTION,
                    },
                },
                pieceType: PieceType.OFFICIAL,
                packageType: PackageType.REGISTRY,
            })
            await db.save('piece_metadata', mockPieceMetadata1)

            const mockFlow = createMockFlow({
                projectId: ctx.project.id,
                status: FlowStatus.DISABLED,
            })
            await db.save('flow', mockFlow)

            const mockFlowVersion = createMockFlowVersion({
                flowId: mockFlow.id,
                updatedBy: ctx.user.id,
                state: FlowVersionState.DRAFT,
                trigger: {
                    type: FlowTriggerType.PIECE,
                    settings: {
                        pieceName: '@activepieces/piece-schedule',
                        pieceVersion: '0.1.5',
                        input: { run_on_weekends: false },
                        triggerName: 'every_hour',
                        propertySettings: {
                            run_on_weekends: { type: PropertyExecutionType.MANUAL },
                        },
                    },
                    valid: true,
                    name: 'trigger',
                    displayName: 'Schedule',
                },
            })
            await db.save('flow_version', mockFlowVersion)

            const response = await ctx.post(`/v1/flows/${mockFlow.id}`, {
                type: FlowOperationType.LOCK_AND_PUBLISH,
                request: {},
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const responseBody: PopulatedFlow | undefined = response?.json()
            expect(responseBody).toBeDefined()
            if (responseBody) {
                expect(Object.keys(responseBody)).toHaveLength(14)
                expect(responseBody.id).toBe(mockFlow.id)
                expect(responseBody.created).toBeDefined()
                expect(responseBody.updated).toBeDefined()
                expect(responseBody.projectId).toBe(ctx.project.id)
                expect(responseBody.folderId).toBeNull()
                expect(responseBody.status).toBe(mockFlow.status)
                expect(responseBody.publishedVersionId).toBe(mockFlowVersion.id)
                expect(responseBody.metadata).toBeNull()
                expect(responseBody.operationStatus).toBe('DISABLING')
                expect(Object.keys(responseBody.version)).toHaveLength(14)
                expect(responseBody.version.id).toBe(mockFlowVersion.id)
                expect(responseBody.version.state).toBe('LOCKED')
                expect(responseBody.templateId).toBeNull()
            }
        })
    })

    describe('List Flows endpoint', () => {
        it('Filters Flows by status', async () => {
            const ctx = await createTestContext(app!)

            const mockEnabledFlow = createMockFlow({
                projectId: ctx.project.id,
                status: FlowStatus.ENABLED,
            })
            const mockDisabledFlow = createMockFlow({
                projectId: ctx.project.id,
                status: FlowStatus.DISABLED,
            })
            await db.save('flow', [mockEnabledFlow, mockDisabledFlow])

            const mockEnabledFlowVersion = createMockFlowVersion({ flowId: mockEnabledFlow.id })
            const mockDisabledFlowVersion = createMockFlowVersion({ flowId: mockDisabledFlow.id })
            await db.save('flow_version', [mockEnabledFlowVersion, mockDisabledFlowVersion])

            const response = await ctx.get('/v1/flows', {
                projectId: ctx.project.id,
                status: 'ENABLED',
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const responseBody = response?.json()

            expect(responseBody.data).toHaveLength(1)
            expect(responseBody.data[0].id).toBe(mockEnabledFlow.id)
        })

        it('Populates Flow version', async () => {
            const ctx = await createTestContext(app!)

            const mockFlow = createMockFlow({ projectId: ctx.project.id })
            await db.save('flow', mockFlow)

            const mockFlowVersion = createMockFlowVersion({ flowId: mockFlow.id })
            await db.save('flow_version', mockFlowVersion)

            const response = await ctx.get('/v1/flows', { projectId: ctx.project.id })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const responseBody = response?.json()

            expect(responseBody?.data).toHaveLength(1)
            expect(responseBody?.data?.[0]?.id).toBe(mockFlow.id)
            expect(responseBody?.data?.[0]?.version?.id).toBe(mockFlowVersion.id)
        })

        it('Fails if a flow with no version exists', async () => {
            const ctx = await createTestContext(app!)

            const mockFlow = createMockFlow({ projectId: ctx.project.id })
            await db.save('flow', mockFlow)

            const response = await ctx.get('/v1/flows', { projectId: ctx.project.id })

            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
            const responseBody = response?.json()

            expect(responseBody?.code).toBe('ENTITY_NOT_FOUND')
            expect(responseBody?.params?.entityType).toBe('FlowVersion')
            expect(responseBody?.params?.message).toBe(`flowId=${mockFlow.id}`)
        })
    })

    describe('Update Metadata endpoint', () => {
        it('Updates flow metadata', async () => {
            const ctx = await createTestContext(app!)

            const mockFlow = createMockFlow({ projectId: ctx.project.id })
            await db.save('flow', mockFlow)

            const mockFlowVersion = createMockFlowVersion({ flowId: mockFlow.id })
            await db.save('flow_version', mockFlowVersion)

            const updatedMetadata = { foo: 'bar' }

            const response = await ctx.post(`/v1/flows/${mockFlow.id}`, {
                type: FlowOperationType.UPDATE_METADATA,
                request: { metadata: updatedMetadata },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const responseBody = response?.json()

            expect(responseBody.id).toBe(mockFlow.id)
            expect(responseBody.metadata).toEqual(updatedMetadata)

            const updatedFlow = await db.findOneBy('flow', { id: mockFlow.id })
            expect((updatedFlow as Record<string, unknown>)?.metadata).toEqual(updatedMetadata)
        })
    })

    describe('Export Flow Template endpoint', () => {
        it('Exports a flow template using an API key', async () => {
            const ctx = await createTestContext(app!)

            const mockFlow = createMockFlow({
                projectId: ctx.project.id,
                status: FlowStatus.ENABLED,
            })
            await db.save('flow', mockFlow)

            const mockFlowVersion = createMockFlowVersion({
                flowId: mockFlow.id,
                updatedBy: ctx.user.id,
            })
            await db.save('flow_version', mockFlowVersion)

            const mockApiKey = 'test_api_key'
            const mockToken = await generateMockToken({
                type: PrincipalType.SERVICE,
                id: mockApiKey,
                platform: { id: ctx.platform.id },
            })

            const response = await app?.inject({
                method: 'GET',
                url: `/v1/flows/${mockFlow.id}/template`,
                headers: { authorization: `Bearer ${mockToken}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const responseBody = response?.json()

            expect(responseBody).toHaveProperty('name')
            expect(responseBody).toHaveProperty('description')
            expect(responseBody).toHaveProperty('flows')
            expect(responseBody.flows).toHaveLength(1)
            expect(responseBody.flows[0]).toHaveProperty('trigger')
        })
    })
})
