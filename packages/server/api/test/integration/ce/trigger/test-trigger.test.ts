import { WebhookRenewStrategy } from '@activepieces/pieces-framework'
import {
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
        const { ctx, flowId, flowVersionId } = await createDraftFlowWithWebhookTrigger()
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
})

async function createDraftFlowWithWebhookTrigger() {
    const ctx = await createTestContext(app!)
    await db.save('piece_metadata', createMockPieceMetadata({
        name: PIECE_NAME,
        version: PIECE_VERSION,
        triggers: {
            new_event: {
                name: 'new_event',
                displayName: 'New Event',
                description: 'Webhook trigger',
                requireAuth: false,
                props: {},
                type: TriggerStrategy.WEBHOOK,
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
                pieceName: PIECE_NAME,
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

function listSimulationSources(flowId: string): Promise<{ id: string, flowVersionId: string }[]> {
    return db.findBy('trigger_source', { flowId, simulate: true })
}

const PIECE_NAME = '@activepieces/piece-test-trigger-rearm'
const PIECE_VERSION = '0.0.1'
