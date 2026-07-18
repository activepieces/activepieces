import { WebhookRenewStrategy } from '@activepieces/pieces-framework'
import {
    EMBED_CONSTRAINTS_METADATA_KEY,
    FlowOperationType,
    FlowStatus,
    FlowTriggerType,
    FlowVersionState,
    PackageType,
    PieceType,
    PropertyExecutionType,
    TriggerStrategy,
    TriggerTestStrategy,
    WebhookHandshakeStrategy,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { db } from '../../../../helpers/db'
import {
    createMockFlow,
    createMockFlowVersion,
    createMockPieceMetadata,
} from '../../../../helpers/mocks'
import { createServiceContext, createTestContext } from '../../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../../helpers/test-setup'

let app: FastifyInstance | null = null

const REQUIRED_PIECE = '@activepieces/piece-example'
const SCHEDULE_PIECE = '@activepieces/piece-schedule'
const SUBFLOWS_PIECE = '@activepieces/piece-subflows'

const savePieceWithHourlyTrigger = async (name: string): Promise<void> => {
    const mockPieceMetadata = createMockPieceMetadata({
        name,
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
    await db.save('piece_metadata', mockPieceMetadata)
}

const buildScheduleTrigger = (pieceName: string) => ({
    type: FlowTriggerType.PIECE,
    settings: {
        pieceName,
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
    lastUpdatedDate: new Date().toISOString(),
})

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Embed publish constraints', () => {
    describe('Required piece publish guard', () => {
        it('rejects publish when the required piece is missing', async () => {
            const ctx = await createTestContext(app!)
            await savePieceWithHourlyTrigger(SCHEDULE_PIECE)

            const mockFlow = createMockFlow({
                projectId: ctx.project.id,
                status: FlowStatus.DISABLED,
            })
            await db.save('flow', mockFlow)
            await db.update('flow', mockFlow.id, {
                metadata: {
                    [EMBED_CONSTRAINTS_METADATA_KEY]: { requiredPieceNames: [REQUIRED_PIECE] },
                },
            })

            const mockFlowVersion = createMockFlowVersion({
                flowId: mockFlow.id,
                updatedBy: ctx.user.id,
                state: FlowVersionState.DRAFT,
                trigger: buildScheduleTrigger(SCHEDULE_PIECE),
            })
            await db.save('flow_version', mockFlowVersion)

            const response = await ctx.post(`/v1/flows/${mockFlow.id}`, {
                type: FlowOperationType.LOCK_AND_PUBLISH,
                request: {},
            })

            expect(response?.statusCode).toBe(StatusCodes.CONFLICT)
        })

        it('publishes when the required piece is present', async () => {
            const ctx = await createTestContext(app!)
            await savePieceWithHourlyTrigger(REQUIRED_PIECE)

            const mockFlow = createMockFlow({
                projectId: ctx.project.id,
                status: FlowStatus.DISABLED,
            })
            await db.save('flow', mockFlow)
            await db.update('flow', mockFlow.id, {
                metadata: {
                    [EMBED_CONSTRAINTS_METADATA_KEY]: { requiredPieceNames: [REQUIRED_PIECE] },
                },
            })

            const mockFlowVersion = createMockFlowVersion({
                flowId: mockFlow.id,
                updatedBy: ctx.user.id,
                state: FlowVersionState.DRAFT,
                trigger: buildScheduleTrigger(REQUIRED_PIECE),
            })
            await db.save('flow_version', mockFlowVersion)

            const response = await ctx.post(`/v1/flows/${mockFlow.id}`, {
                type: FlowOperationType.LOCK_AND_PUBLISH,
                request: {},
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
        })

        it('cannot bypass the guard by wiping embedConstraints via UPDATE_METADATA', async () => {
            const ctx = await createTestContext(app!)
            await savePieceWithHourlyTrigger(SCHEDULE_PIECE)

            const mockFlow = createMockFlow({
                projectId: ctx.project.id,
                status: FlowStatus.DISABLED,
            })
            await db.save('flow', mockFlow)
            await db.update('flow', mockFlow.id, {
                metadata: {
                    [EMBED_CONSTRAINTS_METADATA_KEY]: { requiredPieceNames: [REQUIRED_PIECE] },
                },
            })

            const mockFlowVersion = createMockFlowVersion({
                flowId: mockFlow.id,
                updatedBy: ctx.user.id,
                state: FlowVersionState.DRAFT,
                trigger: buildScheduleTrigger(SCHEDULE_PIECE),
            })
            await db.save('flow_version', mockFlowVersion)

            const wipeResponse = await ctx.post(`/v1/flows/${mockFlow.id}`, {
                type: FlowOperationType.UPDATE_METADATA,
                request: { metadata: {} },
            })
            expect(wipeResponse?.statusCode).toBe(StatusCodes.OK)

            const publishResponse = await ctx.post(`/v1/flows/${mockFlow.id}`, {
                type: FlowOperationType.LOCK_AND_PUBLISH,
                request: {},
            })
            expect(publishResponse?.statusCode).toBe(StatusCodes.CONFLICT)
        })

        it('lets a service principal (API key) update embedConstraints via UPDATE_METADATA', async () => {
            const ctx = await createTestContext(app!)
            const serviceCtx = await createServiceContext(app!, ctx)
            await savePieceWithHourlyTrigger(SCHEDULE_PIECE)

            const mockFlow = createMockFlow({
                projectId: ctx.project.id,
                status: FlowStatus.DISABLED,
            })
            await db.save('flow', mockFlow)
            await db.update('flow', mockFlow.id, {
                metadata: {
                    [EMBED_CONSTRAINTS_METADATA_KEY]: { requiredPieceNames: [REQUIRED_PIECE] },
                },
            })

            const mockFlowVersion = createMockFlowVersion({
                flowId: mockFlow.id,
                updatedBy: ctx.user.id,
                state: FlowVersionState.DRAFT,
                trigger: buildScheduleTrigger(SCHEDULE_PIECE),
            })
            await db.save('flow_version', mockFlowVersion)

            const updateResponse = await serviceCtx.post(`/v1/flows/${mockFlow.id}`, {
                type: FlowOperationType.UPDATE_METADATA,
                request: { metadata: {} },
            })
            expect(updateResponse?.statusCode).toBe(StatusCodes.OK)

            const updatedFlow = await db.findOneByOrFail<{ metadata: Record<string, unknown> | null }>('flow', { id: mockFlow.id })
            expect(updatedFlow.metadata?.[EMBED_CONSTRAINTS_METADATA_KEY]).toBeUndefined()
        })

        it('exempts subflows from the required piece', async () => {
            const ctx = await createTestContext(app!)
            await savePieceWithHourlyTrigger(SUBFLOWS_PIECE)

            const mockFlow = createMockFlow({
                projectId: ctx.project.id,
                status: FlowStatus.DISABLED,
            })
            await db.save('flow', mockFlow)
            await db.update('flow', mockFlow.id, {
                metadata: {
                    [EMBED_CONSTRAINTS_METADATA_KEY]: { requiredPieceNames: [REQUIRED_PIECE] },
                },
            })

            const mockFlowVersion = createMockFlowVersion({
                flowId: mockFlow.id,
                updatedBy: ctx.user.id,
                state: FlowVersionState.DRAFT,
                trigger: buildScheduleTrigger(SUBFLOWS_PIECE),
            })
            await db.save('flow_version', mockFlowVersion)

            const response = await ctx.post(`/v1/flows/${mockFlow.id}`, {
                type: FlowOperationType.LOCK_AND_PUBLISH,
                request: {},
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
        })
    })

    describe('Trigger lock guard', () => {
        it('rejects swapping a locked trigger piece', async () => {
            const ctx = await createTestContext(app!)
            await savePieceWithHourlyTrigger(SCHEDULE_PIECE)

            const mockFlow = createMockFlow({
                projectId: ctx.project.id,
                status: FlowStatus.DISABLED,
            })
            await db.save('flow', mockFlow)
            await db.update('flow', mockFlow.id, {
                metadata: {
                    [EMBED_CONSTRAINTS_METADATA_KEY]: { triggerLock: 'locked' },
                },
            })

            const mockFlowVersion = createMockFlowVersion({
                flowId: mockFlow.id,
                updatedBy: ctx.user.id,
                state: FlowVersionState.DRAFT,
                trigger: buildScheduleTrigger(SCHEDULE_PIECE),
            })
            await db.save('flow_version', mockFlowVersion)

            const response = await ctx.post(`/v1/flows/${mockFlow.id}`, {
                type: FlowOperationType.UPDATE_TRIGGER,
                request: buildScheduleTrigger(REQUIRED_PIECE),
            })

            expect(response?.statusCode).toBe(StatusCodes.CONFLICT)
        })

        it('rejects any trigger edit when frozen', async () => {
            const ctx = await createTestContext(app!)
            await savePieceWithHourlyTrigger(SCHEDULE_PIECE)

            const mockFlow = createMockFlow({
                projectId: ctx.project.id,
                status: FlowStatus.DISABLED,
            })
            await db.save('flow', mockFlow)
            await db.update('flow', mockFlow.id, {
                metadata: {
                    [EMBED_CONSTRAINTS_METADATA_KEY]: { triggerLock: 'frozen' },
                },
            })

            const mockFlowVersion = createMockFlowVersion({
                flowId: mockFlow.id,
                updatedBy: ctx.user.id,
                state: FlowVersionState.DRAFT,
                trigger: buildScheduleTrigger(SCHEDULE_PIECE),
            })
            await db.save('flow_version', mockFlowVersion)

            const response = await ctx.post(`/v1/flows/${mockFlow.id}`, {
                type: FlowOperationType.UPDATE_TRIGGER,
                request: buildScheduleTrigger(SCHEDULE_PIECE),
            })

            expect(response?.statusCode).toBe(StatusCodes.CONFLICT)
        })

        it('reports the frozen message when swapping a frozen trigger piece', async () => {
            const ctx = await createTestContext(app!)
            await savePieceWithHourlyTrigger(SCHEDULE_PIECE)
            await savePieceWithHourlyTrigger(REQUIRED_PIECE)

            const mockFlow = createMockFlow({
                projectId: ctx.project.id,
                status: FlowStatus.DISABLED,
            })
            await db.save('flow', mockFlow)
            await db.update('flow', mockFlow.id, {
                metadata: {
                    [EMBED_CONSTRAINTS_METADATA_KEY]: { triggerLock: 'frozen' },
                },
            })

            const mockFlowVersion = createMockFlowVersion({
                flowId: mockFlow.id,
                updatedBy: ctx.user.id,
                state: FlowVersionState.DRAFT,
                trigger: buildScheduleTrigger(SCHEDULE_PIECE),
            })
            await db.save('flow_version', mockFlowVersion)

            const response = await ctx.post(`/v1/flows/${mockFlow.id}`, {
                type: FlowOperationType.UPDATE_TRIGGER,
                request: buildScheduleTrigger(REQUIRED_PIECE),
            })

            expect(response?.statusCode).toBe(StatusCodes.CONFLICT)
            expect(response?.body).toContain('frozen')
        })

        it('rejects swapping a locked trigger piece via IMPORT_FLOW', async () => {
            const ctx = await createTestContext(app!)
            await savePieceWithHourlyTrigger(SCHEDULE_PIECE)

            const mockFlow = createMockFlow({
                projectId: ctx.project.id,
                status: FlowStatus.DISABLED,
            })
            await db.save('flow', mockFlow)
            await db.update('flow', mockFlow.id, {
                metadata: {
                    [EMBED_CONSTRAINTS_METADATA_KEY]: { triggerLock: 'locked' },
                },
            })

            const mockFlowVersion = createMockFlowVersion({
                flowId: mockFlow.id,
                updatedBy: ctx.user.id,
                state: FlowVersionState.DRAFT,
                trigger: buildScheduleTrigger(SCHEDULE_PIECE),
            })
            await db.save('flow_version', mockFlowVersion)

            const response = await ctx.post(`/v1/flows/${mockFlow.id}`, {
                type: FlowOperationType.IMPORT_FLOW,
                request: {
                    displayName: 'Imported',
                    trigger: buildScheduleTrigger(REQUIRED_PIECE),
                    schemaVersion: null,
                    notes: null,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.CONFLICT)
        })

        it('allows editing a locked trigger without swapping the piece', async () => {
            const ctx = await createTestContext(app!)
            await savePieceWithHourlyTrigger(SCHEDULE_PIECE)

            const mockFlow = createMockFlow({
                projectId: ctx.project.id,
                status: FlowStatus.DISABLED,
            })
            await db.save('flow', mockFlow)
            await db.update('flow', mockFlow.id, {
                metadata: {
                    [EMBED_CONSTRAINTS_METADATA_KEY]: { triggerLock: 'locked' },
                },
            })

            const mockFlowVersion = createMockFlowVersion({
                flowId: mockFlow.id,
                updatedBy: ctx.user.id,
                state: FlowVersionState.DRAFT,
                trigger: buildScheduleTrigger(SCHEDULE_PIECE),
            })
            await db.save('flow_version', mockFlowVersion)

            const response = await ctx.post(`/v1/flows/${mockFlow.id}`, {
                type: FlowOperationType.UPDATE_TRIGGER,
                request: {
                    ...buildScheduleTrigger(SCHEDULE_PIECE),
                    settings: {
                        ...buildScheduleTrigger(SCHEDULE_PIECE).settings,
                        input: { run_on_weekends: true },
                    },
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
        })

        it('lets a service principal (API key) swap a frozen trigger piece', async () => {
            const ctx = await createTestContext(app!)
            const serviceCtx = await createServiceContext(app!, ctx)
            await savePieceWithHourlyTrigger(SCHEDULE_PIECE)
            await savePieceWithHourlyTrigger(REQUIRED_PIECE)

            const mockFlow = createMockFlow({
                projectId: ctx.project.id,
                status: FlowStatus.DISABLED,
            })
            await db.save('flow', mockFlow)
            await db.update('flow', mockFlow.id, {
                metadata: {
                    [EMBED_CONSTRAINTS_METADATA_KEY]: { triggerLock: 'frozen' },
                },
            })

            const mockFlowVersion = createMockFlowVersion({
                flowId: mockFlow.id,
                updatedBy: ctx.user.id,
                state: FlowVersionState.DRAFT,
                trigger: buildScheduleTrigger(SCHEDULE_PIECE),
            })
            await db.save('flow_version', mockFlowVersion)

            const response = await serviceCtx.post(`/v1/flows/${mockFlow.id}`, {
                type: FlowOperationType.UPDATE_TRIGGER,
                request: buildScheduleTrigger(REQUIRED_PIECE),
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
        })
    })
})
