import { WebhookRenewStrategy } from '@activepieces/pieces-framework'
import {
    ApplicationEventName,
    EventDestinationScope,
    Flow,
    FlowStatus,
    FlowTrigger,
    FlowTriggerType,
    FlowVersion,
    FlowVersionState,
    McpServerType,
    PackageType,
    PieceType,
    ProjectScopedMcpServer,
    PropertyExecutionType,
    TriggerStrategy,
    TriggerTestStrategy,
    WebhookHandshakeStrategy,
    WorkerJobType,
} from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { apLockAndPublishTool } from '../../../../src/app/mcp/tools/ap-lock-and-publish'
import * as jobQueueModule from '../../../../src/app/workers/job-queue/job-queue'
import { db } from '../../../helpers/db'
import { createMockEventDestination, createMockFlow, createMockFlowVersion, createMockPieceMetadata } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

const DESTINATION_URL = 'https://example.com/external-hook'

let app: FastifyInstance
let mockLog: FastifyBaseLogger
const originalJobQueue = jobQueueModule.jobQueue

beforeAll(async () => {
    app = await setupTestEnvironment({ fresh: true })
    mockLog = app.log
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('MCP publish delivers flow.published to event destinations', () => {
    let addSpy: ReturnType<typeof vi.fn>

    beforeEach(() => {
        addSpy = vi.fn()
        vi.spyOn(jobQueueModule, 'jobQueue').mockImplementation((log) => {
            const real = originalJobQueue(log)
            return {
                ...real,
                add: addSpy,
            }
        })
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('queues an EVENT_DESTINATION job when publishing through ap_lock_and_publish', async () => {
        const ctx = await createTestContext(app)
        await db.save('event_destination', createMockEventDestination({
            platformId: ctx.platform.id,
            events: [ApplicationEventName.FLOW_PUBLISHED],
            scope: EventDestinationScope.PLATFORM,
            url: DESTINATION_URL,
        }))
        const { flow } = await seedDraftFlow(ctx)

        await apLockAndPublishTool({ mcp: mockMcpServer(ctx), userId: undefined }, mockLog).execute({ flowId: flow.id })
        await vi.waitUntil(() => publishedJobs(addSpy).length > 0, { timeout: 5000, interval: 50 })

        const jobs = publishedJobs(addSpy)
        expect(jobs).toHaveLength(1)
        expect(jobs[0].webhookUrl).toBe(DESTINATION_URL)
        expect(jobs[0].projectId).toBe(ctx.project.id)
        expect(jobs[0].platformId).toBe(ctx.platform.id)
    })

    it('queues no job when the destination does not subscribe to flow.published', async () => {
        const ctx = await createTestContext(app)
        await db.save('event_destination', createMockEventDestination({
            platformId: ctx.platform.id,
            events: [ApplicationEventName.FLOW_RUN_FINISHED],
            scope: EventDestinationScope.PLATFORM,
            url: DESTINATION_URL,
        }))
        const { flow } = await seedDraftFlow(ctx)

        await apLockAndPublishTool({ mcp: mockMcpServer(ctx), userId: undefined }, mockLog).execute({ flowId: flow.id })

        const publishedFlow = await db.findOneByOrFail<Flow>('flow', { id: flow.id })
        expect(publishedFlow.publishedVersionId).not.toBeNull()
        expect(publishedJobs(addSpy)).toHaveLength(0)
    })
})

type QueuedJobData = {
    jobType?: WorkerJobType
    webhookUrl?: string
    projectId?: string
    platformId?: string
    payload?: { action?: ApplicationEventName }
}

function publishedJobs(spy: ReturnType<typeof vi.fn>): QueuedJobData[] {
    return spy.mock.calls
        .map((call) => (call[0] as { data: QueuedJobData }).data)
        .filter((data) => data.jobType === WorkerJobType.EVENT_DESTINATION && data.payload?.action === ApplicationEventName.FLOW_PUBLISHED)
}

function mockMcpServer(ctx: TestContext): ProjectScopedMcpServer {
    return {
        id: 'mcp-server-id',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        projectId: ctx.project.id,
        platformId: ctx.platform.id,
        type: McpServerType.PROJECT,
        token: 'mcp-token',
        disabledTools: [],
    }
}

async function seedDraftFlow(ctx: TestContext): Promise<{ flow: Flow, flowVersion: FlowVersion }> {
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

    const flow = createMockFlow({ projectId: ctx.project.id, status: FlowStatus.DISABLED })
    await db.save('flow', flow)

    const flowVersion = createMockFlowVersion({
        flowId: flow.id,
        updatedBy: ctx.user.id,
        state: FlowVersionState.DRAFT,
        valid: true,
        trigger: scheduleTrigger(),
    })
    await db.save('flow_version', flowVersion)
    return { flow, flowVersion }
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
