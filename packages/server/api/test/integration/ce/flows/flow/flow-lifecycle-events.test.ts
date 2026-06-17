import { WebhookRenewStrategy } from '@activepieces/pieces-framework'
import {
    ApplicationEventName,
    Flow,
    FlowOperationType,
    FlowStatus,
    FlowTrigger,
    FlowTriggerType,
    FlowVersion,
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
import * as applicationEventsModule from '../../../../../src/app/helper/application-events'
import { actionsEmitted } from '../../../../helpers/application-events'
import { db } from '../../../../helpers/db'
import { createMockFlow, createMockFlowVersion, createMockPieceMetadata } from '../../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../../helpers/test-setup'

let app: FastifyInstance
const originalApplicationEvents = applicationEventsModule.applicationEvents

beforeAll(async () => {
    app = await setupTestEnvironment({ fresh: true })
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Flow application events', () => {
    let sendUserEventSpy: ReturnType<typeof vi.fn>

    beforeEach(() => {
        sendUserEventSpy = vi.fn()
        vi.spyOn(applicationEventsModule, 'applicationEvents').mockImplementation((log) => {
            const real = originalApplicationEvents(log)
            return {
                ...real,
                sendUserEvent: sendUserEventSpy,
            }
        })
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('Create flow', () => {
        it('emits FLOW_CREATED when POST /v1/flows succeeds', async () => {
            const ctx = await createTestContext(app)

            const response = await ctx.post('/v1/flows', {
                displayName: 'My flow',
                projectId: ctx.project.id,
            })

            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            expect(actionsEmitted(sendUserEventSpy)).toEqual([
                ApplicationEventName.FLOW_CREATED,
            ])
        })
    })

    describe('Delete flow', () => {
        it('emits FLOW_DELETED when DELETE /v1/flows/:id succeeds', async () => {
            const ctx = await createTestContext(app)
            const { flow } = await seedPublishableFlow({
                ctx,
                initialStatus: FlowStatus.DISABLED,
                publishCurrentVersion: false,
            })

            const response = await ctx.delete(`/v1/flows/${flow.id}`)

            expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
            expect(actionsEmitted(sendUserEventSpy)).toEqual([
                ApplicationEventName.FLOW_DELETED,
            ])
        })
    })

    describe('CHANGE_STATUS operation', () => {
        it('emits FLOW_ACTIVATED when going from DISABLED to ENABLED', async () => {
            const ctx = await createTestContext(app)
            const { flow } = await seedPublishableFlow({ ctx, initialStatus: FlowStatus.DISABLED })

            const response = await ctx.post(`/v1/flows/${flow.id}`, {
                type: FlowOperationType.CHANGE_STATUS,
                request: { status: FlowStatus.ENABLED },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(actionsEmitted(sendUserEventSpy)).toEqual([
                ApplicationEventName.FLOW_UPDATED,
                ApplicationEventName.FLOW_ACTIVATED,
            ])
        })

        it('emits FLOW_DEACTIVATED when going from ENABLED to DISABLED', async () => {
            const ctx = await createTestContext(app)
            const { flow } = await seedPublishableFlow({ ctx, initialStatus: FlowStatus.ENABLED })

            const response = await ctx.post(`/v1/flows/${flow.id}`, {
                type: FlowOperationType.CHANGE_STATUS,
                request: { status: FlowStatus.DISABLED },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(actionsEmitted(sendUserEventSpy)).toEqual([
                ApplicationEventName.FLOW_UPDATED,
                ApplicationEventName.FLOW_DEACTIVATED,
            ])
        })

        it('does NOT emit a lifecycle event when status is unchanged (DISABLED -> DISABLED)', async () => {
            const ctx = await createTestContext(app)
            const { flow } = await seedPublishableFlow({ ctx, initialStatus: FlowStatus.DISABLED })

            const response = await ctx.post(`/v1/flows/${flow.id}`, {
                type: FlowOperationType.CHANGE_STATUS,
                request: { status: FlowStatus.DISABLED },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(actionsEmitted(sendUserEventSpy)).toEqual([
                ApplicationEventName.FLOW_UPDATED,
            ])
            expect(actionsEmitted(sendUserEventSpy)).not.toContain(ApplicationEventName.FLOW_ACTIVATED)
            expect(actionsEmitted(sendUserEventSpy)).not.toContain(ApplicationEventName.FLOW_DEACTIVATED)
        })

        it('does NOT emit a lifecycle event when status is unchanged (ENABLED -> ENABLED)', async () => {
            const ctx = await createTestContext(app)
            const { flow } = await seedPublishableFlow({ ctx, initialStatus: FlowStatus.ENABLED })

            const response = await ctx.post(`/v1/flows/${flow.id}`, {
                type: FlowOperationType.CHANGE_STATUS,
                request: { status: FlowStatus.ENABLED },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(actionsEmitted(sendUserEventSpy)).toEqual([
                ApplicationEventName.FLOW_UPDATED,
            ])
            expect(actionsEmitted(sendUserEventSpy)).not.toContain(ApplicationEventName.FLOW_ACTIVATED)
            expect(actionsEmitted(sendUserEventSpy)).not.toContain(ApplicationEventName.FLOW_DEACTIVATED)
        })
    })

    describe('LOCK_AND_PUBLISH operation', () => {
        it('emits FLOW_PUBLISHED and FLOW_ACTIVATED when publishing a previously DISABLED flow (status defaults to ENABLED)', async () => {
            const ctx = await createTestContext(app)
            const { flow } = await seedPublishableFlow({
                ctx,
                initialStatus: FlowStatus.DISABLED,
                publishCurrentVersion: false,
            })

            const response = await ctx.post(`/v1/flows/${flow.id}`, {
                type: FlowOperationType.LOCK_AND_PUBLISH,
                request: {},
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(actionsEmitted(sendUserEventSpy)).toEqual([
                ApplicationEventName.FLOW_UPDATED,
                ApplicationEventName.FLOW_PUBLISHED,
                ApplicationEventName.FLOW_ACTIVATED,
            ])
        })

        it('emits only FLOW_PUBLISHED when re-publishing an already-ENABLED flow', async () => {
            const ctx = await createTestContext(app)
            const { flow } = await seedPublishableFlow({ ctx, initialStatus: FlowStatus.ENABLED })
            await seedAdditionalDraftVersion({ flowId: flow.id, userId: ctx.user.id })

            const response = await ctx.post(`/v1/flows/${flow.id}`, {
                type: FlowOperationType.LOCK_AND_PUBLISH,
                request: { status: FlowStatus.ENABLED },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(actionsEmitted(sendUserEventSpy)).toEqual([
                ApplicationEventName.FLOW_UPDATED,
                ApplicationEventName.FLOW_PUBLISHED,
            ])
            expect(actionsEmitted(sendUserEventSpy)).not.toContain(ApplicationEventName.FLOW_ACTIVATED)
            expect(actionsEmitted(sendUserEventSpy)).not.toContain(ApplicationEventName.FLOW_DEACTIVATED)
        })

        it('emits only FLOW_PUBLISHED when re-publishing an already-ENABLED flow with no explicit status (defaults to ENABLED)', async () => {
            const ctx = await createTestContext(app)
            const { flow } = await seedPublishableFlow({ ctx, initialStatus: FlowStatus.ENABLED })
            await seedAdditionalDraftVersion({ flowId: flow.id, userId: ctx.user.id })

            const response = await ctx.post(`/v1/flows/${flow.id}`, {
                type: FlowOperationType.LOCK_AND_PUBLISH,
                request: {},
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(actionsEmitted(sendUserEventSpy)).toEqual([
                ApplicationEventName.FLOW_UPDATED,
                ApplicationEventName.FLOW_PUBLISHED,
            ])
            expect(actionsEmitted(sendUserEventSpy)).not.toContain(ApplicationEventName.FLOW_ACTIVATED)
            expect(actionsEmitted(sendUserEventSpy)).not.toContain(ApplicationEventName.FLOW_DEACTIVATED)
        })

        it('emits FLOW_PUBLISHED and FLOW_DEACTIVATED when publishing with explicit DISABLED status from an ENABLED flow', async () => {
            const ctx = await createTestContext(app)
            const { flow } = await seedPublishableFlow({ ctx, initialStatus: FlowStatus.ENABLED })
            await seedAdditionalDraftVersion({ flowId: flow.id, userId: ctx.user.id })

            const response = await ctx.post(`/v1/flows/${flow.id}`, {
                type: FlowOperationType.LOCK_AND_PUBLISH,
                request: { status: FlowStatus.DISABLED },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(actionsEmitted(sendUserEventSpy)).toEqual([
                ApplicationEventName.FLOW_UPDATED,
                ApplicationEventName.FLOW_PUBLISHED,
                ApplicationEventName.FLOW_DEACTIVATED,
            ])
        })
    })

    describe('Non-lifecycle operations', () => {
        it('does NOT emit any lifecycle events on UPDATE_METADATA', async () => {
            const ctx = await createTestContext(app)
            const { flow } = await seedPublishableFlow({ ctx, initialStatus: FlowStatus.DISABLED })

            const response = await ctx.post(`/v1/flows/${flow.id}`, {
                type: FlowOperationType.UPDATE_METADATA,
                request: { metadata: { foo: 'bar' } },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const actions = actionsEmitted(sendUserEventSpy)
            expect(actions).toEqual([ApplicationEventName.FLOW_UPDATED])
            expect(actions).not.toContain(ApplicationEventName.FLOW_PUBLISHED)
            expect(actions).not.toContain(ApplicationEventName.FLOW_ACTIVATED)
            expect(actions).not.toContain(ApplicationEventName.FLOW_DEACTIVATED)
        })
    })
})

type SeedPublishableFlowParams = {
    ctx: TestContext
    initialStatus: FlowStatus
    publishCurrentVersion?: boolean
}

type SeedAdditionalDraftVersionParams = {
    flowId: string
    userId: string
}

async function seedPublishableFlow({
    ctx,
    initialStatus,
    publishCurrentVersion,
}: SeedPublishableFlowParams): Promise<{ flow: Flow, flowVersion: FlowVersion }> {
    const pieceMetadata = createMockPieceMetadata({
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
    await db.save('piece_metadata', pieceMetadata)

    const flow = createMockFlow({
        projectId: ctx.project.id,
        status: initialStatus,
    })
    await db.save('flow', flow)

    const trigger = scheduleTrigger()
    const shouldPublish = publishCurrentVersion ?? true
    const flowVersion = createMockFlowVersion({
        flowId: flow.id,
        updatedBy: ctx.user.id,
        state: shouldPublish ? FlowVersionState.LOCKED : FlowVersionState.DRAFT,
        valid: true,
        trigger,
    })
    await db.save('flow_version', flowVersion)
    if (shouldPublish) {
        await db.update('flow', flow.id, { publishedVersionId: flowVersion.id })
    }
    return { flow, flowVersion }
}

async function seedAdditionalDraftVersion({
    flowId,
    userId,
}: SeedAdditionalDraftVersionParams): Promise<FlowVersion> {
    const draftVersion = createMockFlowVersion({
        flowId,
        updatedBy: userId,
        state: FlowVersionState.DRAFT,
        valid: true,
        trigger: scheduleTrigger(),
    })
    await db.save('flow_version', draftVersion)
    return draftVersion
}

function scheduleTrigger(): FlowTrigger {
    return {
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
        lastUpdatedDate: new Date().toISOString(),
    }
}

