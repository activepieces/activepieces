import { apId } from '@activepieces/core-utils'
import { WebhookRenewStrategy } from '@activepieces/pieces-framework'
import {
    EngineResponseStatus,
    Flow,
    FlowStatus,
    FlowTriggerType,
    FlowVersionState,
    PackageType,
    PieceType,
    TriggerStrategy,
    TriggerTestStrategy,
    WebhookHandshakeStrategy,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { flowSideEffects } from '../../../../src/app/flows/flow/flow-service-side-effects'
import { appEventRoutingService } from '../../../../src/app/trigger/app-event-routing/app-event-routing.service'
import { triggerSourceService } from '../../../../src/app/trigger/trigger-source/trigger-source-service'
import { userInteractionWatcher } from '../../../../src/app/workers/user-interaction-watcher'
import { db } from '../../../helpers/db'
import { createMockFlow, createMockFlowVersion, createMockPieceMetadata } from '../../../helpers/mocks'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('POST /v1/test-trigger with the simulation strategy', () => {
    it('keeps the trigger listening when the test is started again', async () => {
        const { ctx, flowId, flowVersionId } = await createDraftFlowWithTrigger({ triggerType: TriggerStrategy.WEBHOOK })
        const body = { projectId: ctx.project.id, flowId, flowVersionId, testStrategy: TriggerTestStrategy.SIMULATION }

        const first = await ctx.post('/v1/test-trigger', body)
        expect(first?.statusCode).toBe(StatusCodes.OK)
        const [firstSource] = await listSimulationSources(flowId)

        const second = await ctx.post('/v1/test-trigger', body)
        expect(second?.statusCode).toBe(StatusCodes.OK)

        const sources = await listSimulationSources(flowId)
        expect(sources).toHaveLength(1)
        expect(sources[0].id).not.toBe(firstSource.id)
        expect(sources[0].flowVersionId).toBe(flowVersionId)
    })

    it('keeps the app event listeners of the published flow when its test is started again', async () => {
        const { ctx, flowId, flowVersionId } = await createDraftFlowWithTrigger({ triggerType: TriggerStrategy.APP_WEBHOOK })
        await saveTriggerSource({ projectId: ctx.project.id, flowId, flowVersionId, simulate: false })
        await saveTriggerSource({ projectId: ctx.project.id, flowId, flowVersionId, simulate: true })
        await saveAppEventListener({ projectId: ctx.project.id, flowId })

        const response = await ctx.post('/v1/test-trigger', { projectId: ctx.project.id, flowId, flowVersionId, testStrategy: TriggerTestStrategy.SIMULATION })
        expect(response?.statusCode).toBe(StatusCodes.OK)

        expect(await db.findBy('app_event_routing', { flowId })).toHaveLength(1)
    })

    it('deletes the app event listeners when the flow has no published source', async () => {
        const { ctx, flowId, flowVersionId } = await createDraftFlowWithTrigger({ triggerType: TriggerStrategy.APP_WEBHOOK })
        await saveTriggerSource({ projectId: ctx.project.id, flowId, flowVersionId, simulate: true })
        await saveAppEventListener({ projectId: ctx.project.id, flowId })

        const response = await ctx.post('/v1/test-trigger', { projectId: ctx.project.id, flowId, flowVersionId, testStrategy: TriggerTestStrategy.SIMULATION })
        expect(response?.statusCode).toBe(StatusCodes.OK)

        expect(await db.findBy('app_event_routing', { flowId })).toHaveLength(0)
    })

    it('keeps the test source when its app event listeners cannot be deleted, so a retry can finish the cleanup', async () => {
        const { ctx, flowId, flowVersionId } = await createDraftFlowWithTrigger({ triggerType: TriggerStrategy.APP_WEBHOOK })
        await saveTriggerSource({ projectId: ctx.project.id, flowId, flowVersionId, simulate: true })
        await saveAppEventListener({ projectId: ctx.project.id, flowId })
        const deleteListeners = vi.spyOn(appEventRoutingService, 'deleteListeners').mockRejectedValue(new Error('database unavailable'))

        try {
            const response = await ctx.post('/v1/test-trigger', { projectId: ctx.project.id, flowId, flowVersionId, testStrategy: TriggerTestStrategy.SIMULATION })
            expect(response?.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR)
        }
        finally {
            deleteListeners.mockRestore()
        }

        expect(await listSimulationSources(flowId)).toHaveLength(1)
        expect(await db.findBy('app_event_routing', { flowId })).toHaveLength(1)
    })
})

describe('POST /v1/test-trigger with the test function strategy', () => {
    it('lists the samples in the order the trigger returned them, newest first', async () => {
        const { ctx, flowId, flowVersionId } = await createDraftFlowWithTrigger({ triggerType: TriggerStrategy.POLLING })
        const samples = [{ row: 105 }, { row: 104 }, { row: 103 }, { row: 102 }, { row: 101 }]
        const submit = vi.spyOn(userInteractionWatcher, 'submitAndWaitForResponse').mockResolvedValue({
            status: EngineResponseStatus.OK,
            response: { output: samples },
        })
        try {
            const testResponse = await ctx.post('/v1/test-trigger', { projectId: ctx.project.id, flowId, flowVersionId, testStrategy: TriggerTestStrategy.TEST_FUNCTION })
            expect(testResponse?.statusCode).toBe(StatusCodes.OK)
            expect(testResponse?.json().data.map((event: { payload: unknown }) => event.payload)).toEqual(samples)
        }
        finally {
            submit.mockRestore()
        }

        const listResponse = await ctx.get('/v1/trigger-events', { projectId: ctx.project.id, flowId, limit: '5' })
        expect(listResponse?.statusCode).toBe(StatusCodes.OK)
        expect(listResponse?.json().data.map((event: { payload: unknown }) => event.payload)).toEqual(samples)
    })
})

describe('disabling the published source of an app-webhook flow', () => {
    it('keeps the app event listeners while an app-webhook test is running', async () => {
        const { ctx, flowId, flowVersionId } = await createDraftFlowWithTrigger({ triggerType: TriggerStrategy.APP_WEBHOOK })
        await saveTriggerSource({ projectId: ctx.project.id, flowId, flowVersionId, simulate: false })
        await saveTriggerSource({ projectId: ctx.project.id, flowId, flowVersionId, simulate: true })
        await saveAppEventListener({ projectId: ctx.project.id, flowId })

        await triggerSourceService(app!.log).disable({ projectId: ctx.project.id, flowId, simulate: false, ignoreError: true })

        expect(await db.findBy('app_event_routing', { flowId })).toHaveLength(1)
    })

    it('deletes the app event listeners when the running test uses a different trigger type', async () => {
        const { ctx, flowId, flowVersionId } = await createDraftFlowWithTrigger({ triggerType: TriggerStrategy.APP_WEBHOOK })
        await saveTriggerSource({ projectId: ctx.project.id, flowId, flowVersionId, simulate: false })
        await saveTriggerSource({ projectId: ctx.project.id, flowId, flowVersionId, simulate: true, type: TriggerStrategy.WEBHOOK })
        await saveAppEventListener({ projectId: ctx.project.id, flowId })

        await triggerSourceService(app!.log).disable({ projectId: ctx.project.id, flowId, simulate: false, ignoreError: true })

        expect(await db.findBy('app_event_routing', { flowId })).toHaveLength(0)
    })

    it('deletes the app event listeners when the flow is deleted while a test is running', async () => {
        const { ctx, flowId, flowVersionId } = await createDraftFlowWithTrigger({ triggerType: TriggerStrategy.APP_WEBHOOK })
        await db.update('flow', flowId, { publishedVersionId: flowVersionId })
        await saveTriggerSource({ projectId: ctx.project.id, flowId, flowVersionId, simulate: false })
        await saveTriggerSource({ projectId: ctx.project.id, flowId, flowVersionId, simulate: true })
        await saveAppEventListener({ projectId: ctx.project.id, flowId })
        const flowToDelete = await db.findOneByOrFail<Flow>('flow', { id: flowId })

        await flowSideEffects(app!.log).preDelete({ flowToDelete })

        expect(await db.findBy('trigger_source', { flowId })).toHaveLength(0)
        expect(await db.findBy('app_event_routing', { flowId })).toHaveLength(0)
    })
})

async function createDraftFlowWithTrigger({ triggerType }: { triggerType: TriggerStrategy }) {
    const ctx = await createTestContext(app!)
    const pieceName = `${PIECE_NAME_PREFIX}-${triggerType.toLowerCase()}`
    await db.save('piece_metadata', createMockPieceMetadata({
        name: pieceName,
        version: PIECE_VERSION,
        triggers: {
            new_event: {
                name: 'new_event',
                displayName: 'New Event',
                description: 'Test trigger',
                requireAuth: false,
                props: {},
                type: triggerType,
                handshakeConfiguration: { strategy: WebhookHandshakeStrategy.NONE },
                renewConfiguration: { strategy: WebhookRenewStrategy.NONE },
                sampleData: {},
                testStrategy: TriggerTestStrategy.SIMULATION,
            },
        },
        pieceType: PieceType.OFFICIAL,
        packageType: PackageType.REGISTRY,
    }))
    const flow = createMockFlow({ projectId: ctx.project.id, status: FlowStatus.DISABLED })
    await db.save('flow', flow)
    const flowVersion = createMockFlowVersion({
        flowId: flow.id,
        updatedBy: ctx.user.id,
        state: FlowVersionState.DRAFT,
        trigger: {
            type: FlowTriggerType.PIECE,
            name: 'trigger',
            displayName: 'New Event',
            settings: {
                pieceName,
                pieceVersion: PIECE_VERSION,
                triggerName: 'new_event',
                input: {},
                propertySettings: {},
            },
            valid: true,
            lastUpdatedDate: new Date().toISOString(),
        },
    })
    await db.save('flow_version', flowVersion)
    return { ctx, flowId: flow.id, flowVersionId: flowVersion.id }
}

async function saveTriggerSource({ projectId, flowId, flowVersionId, simulate, type = TriggerStrategy.APP_WEBHOOK }: SaveTriggerSourceParams): Promise<void> {
    const now = new Date().toISOString()
    await db.save('trigger_source', {
        id: apId(),
        created: now,
        updated: now,
        projectId,
        flowId,
        flowVersionId,
        type,
        triggerName: 'new_event',
        pieceName: 'app-webhook-piece',
        pieceVersion: PIECE_VERSION,
        simulate,
    })
}

async function saveAppEventListener({ projectId, flowId }: { projectId: string, flowId: string }): Promise<void> {
    const now = new Date().toISOString()
    await db.save('app_event_routing', {
        id: apId(),
        created: now,
        updated: now,
        appName: 'app-webhook-piece',
        event: 'new_event',
        identifierValue: 'team-1',
        projectId,
        flowId,
    })
}

function listSimulationSources(flowId: string): Promise<{ id: string, flowVersionId: string }[]> {
    return db.findBy('trigger_source', { flowId, simulate: true })
}

type SaveTriggerSourceParams = {
    projectId: string
    flowId: string
    flowVersionId: string
    simulate: boolean
    type?: TriggerStrategy
}

const PIECE_NAME_PREFIX = '@activepieces/piece-test-trigger'
const PIECE_VERSION = '0.0.1'
