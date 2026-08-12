import { WebhookRenewStrategy } from '@activepieces/pieces-framework'
import {
    ApplicationEvent,
    ApplicationEventName,
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
} from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { applicationEvents } from '../../../../src/app/helper/application-events'
import { apChangeFlowStatusTool } from '../../../../src/app/mcp/tools/ap-change-flow-status'
import { apCreateFlowTool } from '../../../../src/app/mcp/tools/ap-create-flow'
import { apDeleteFlowTool } from '../../../../src/app/mcp/tools/ap-delete-flow'
import { apDuplicateFlowTool } from '../../../../src/app/mcp/tools/ap-duplicate-flow'
import { apLockAndPublishTool } from '../../../../src/app/mcp/tools/ap-lock-and-publish'
import { apRenameFlowTool } from '../../../../src/app/mcp/tools/ap-rename-flow'
import { activepiecesTools } from '../../../../src/app/mcp/tools/index'
import { db } from '../../../helpers/db'
import { createMockFlow, createMockFlowVersion, createMockPieceMetadata } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance
let mockLog: FastifyBaseLogger
const captured: ApplicationEvent[] = []

beforeAll(async () => {
    app = await setupTestEnvironment({ fresh: true })
    mockLog = app.log
    applicationEvents(mockLog).registerListeners(mockLog, {
        userEvent: () => (event) => {
            captured.push(event)
        },
        workerEvent: () => () => undefined,
    })
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(() => {
    captured.length = 0
})

describe('MCP flow tools emit application events', () => {
    it('emits FLOW_PUBLISHED and FLOW_ACTIVATED when publishing a DISABLED flow', async () => {
        const ctx = await createTestContext(app)
        const { flow } = await seedFlow({ ctx, status: FlowStatus.DISABLED, publishCurrentVersion: false })

        const result = await apLockAndPublishTool(mcpContext(ctx), mockLog).execute({ flowId: flow.id })

        expect(result.content[0].text).toContain('published')
        expect(await emittedActions()).toEqual([
            ApplicationEventName.FLOW_UPDATED,
            ApplicationEventName.FLOW_PUBLISHED,
            ApplicationEventName.FLOW_ACTIVATED,
        ])
    })

    it('emits FLOW_DEACTIVATED when disabling an ENABLED flow', async () => {
        const ctx = await createTestContext(app)
        const { flow } = await seedFlow({ ctx, status: FlowStatus.ENABLED })

        await apChangeFlowStatusTool(mcpContext(ctx), mockLog).execute({ flowId: flow.id, status: FlowStatus.DISABLED })

        expect(await emittedActions()).toEqual([
            ApplicationEventName.FLOW_UPDATED,
            ApplicationEventName.FLOW_DEACTIVATED,
        ])
    })

    it('emits FLOW_CREATED when creating a flow', async () => {
        const ctx = await createTestContext(app)

        await apCreateFlowTool(mcpContext(ctx), mockLog).execute({ flowName: 'Agent built flow' })

        expect(await emittedActions()).toEqual([ApplicationEventName.FLOW_CREATED])
    })

    it('emits FLOW_CREATED then FLOW_UPDATED when duplicating a flow, as the builder does', async () => {
        const ctx = await createTestContext(app)
        const { flow } = await seedFlow({ ctx, status: FlowStatus.DISABLED, publishCurrentVersion: false })

        await apDuplicateFlowTool(mcpContext(ctx), mockLog).execute({ flowId: flow.id })

        expect(await emittedActions()).toEqual([
            ApplicationEventName.FLOW_CREATED,
            ApplicationEventName.FLOW_UPDATED,
        ])
    })

    it('emits FLOW_DELETED when deleting a flow', async () => {
        const ctx = await createTestContext(app)
        const { flow } = await seedFlow({ ctx, status: FlowStatus.DISABLED, publishCurrentVersion: false })

        await apDeleteFlowTool(mcpContext(ctx), mockLog).execute({ flowId: flow.id })

        expect(await emittedActions()).toEqual([ApplicationEventName.FLOW_DELETED])
    })

    it('emits FLOW_UPDATED without a lifecycle event for a non-lifecycle operation', async () => {
        const ctx = await createTestContext(app)
        const { flow } = await seedFlow({ ctx, status: FlowStatus.DISABLED, publishCurrentVersion: false })

        await apRenameFlowTool(mcpContext(ctx), mockLog).execute({ flowId: flow.id, displayName: 'Renamed by agent' })

        const actions = await emittedActions()
        expect(actions).toEqual([ApplicationEventName.FLOW_UPDATED])
        expect(actions).not.toContain(ApplicationEventName.FLOW_PUBLISHED)
        expect(actions).not.toContain(ApplicationEventName.FLOW_ACTIVATED)
    })

    it('attributes the event to the project owner and tenant when MCP has no authenticated user', async () => {
        const ctx = await createTestContext(app)
        const { flow } = await seedFlow({ ctx, status: FlowStatus.DISABLED, publishCurrentVersion: false })

        await apLockAndPublishTool(mcpContext(ctx), mockLog).execute({ flowId: flow.id })
        await emittedActions()

        const published = captured.find((event) => event.action === ApplicationEventName.FLOW_PUBLISHED)
        expect(published?.userId).toBe(ctx.user.id)
        expect(published?.userEmail).toBe(ctx.userIdentity.email)
        expect(published?.projectId).toBe(ctx.project.id)
        expect(published?.platformId).toBe(ctx.platform.id)
    })

    it('attributes the event to the authenticated MCP user when one is present', async () => {
        const ctx = await createTestContext(app)
        const { flow } = await seedFlow({ ctx, status: FlowStatus.DISABLED, publishCurrentVersion: false })

        await apLockAndPublishTool({ mcp: mockMcpServer(ctx), userId: ctx.user.id }, mockLog).execute({ flowId: flow.id })
        await emittedActions()

        const published = captured.find((event) => event.action === ApplicationEventName.FLOW_PUBLISHED)
        expect(published?.userId).toBe(ctx.user.id)
    })

    it('emits when the tool is resolved through the registered tool list', async () => {
        const ctx = await createTestContext(app)
        const { flow } = await seedFlow({ ctx, status: FlowStatus.DISABLED, publishCurrentVersion: false })

        const tools = activepiecesTools(mockMcpServer(ctx), ctx.user.id, mockLog)
        const publishTool = tools.find((tool) => tool.title === 'ap_lock_and_publish')
        await publishTool?.execute({ flowId: flow.id })
        await emittedActions()

        const published = captured.find((event) => event.action === ApplicationEventName.FLOW_PUBLISHED)
        expect(published?.userId).toBe(ctx.user.id)
    })
})

async function emittedActions(): Promise<ApplicationEventName[]> {
    await vi.waitUntil(() => captured.length > 0, { timeout: 5000, interval: 50 })
    await new Promise((resolve) => setTimeout(resolve, 200))
    return captured.map((event) => event.action)
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

function mcpContext(ctx: TestContext): { mcp: ProjectScopedMcpServer, userId: undefined } {
    return { mcp: mockMcpServer(ctx), userId: undefined }
}

type SeedFlowParams = {
    ctx: TestContext
    status: FlowStatus
    publishCurrentVersion?: boolean
}

async function seedFlow({ ctx, status, publishCurrentVersion }: SeedFlowParams): Promise<{ flow: Flow, flowVersion: FlowVersion }> {
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

    const flow = createMockFlow({ projectId: ctx.project.id, status })
    await db.save('flow', flow)

    const shouldPublish = publishCurrentVersion ?? true
    const flowVersion = createMockFlowVersion({
        flowId: flow.id,
        updatedBy: ctx.user.id,
        state: shouldPublish ? FlowVersionState.LOCKED : FlowVersionState.DRAFT,
        valid: true,
        trigger: scheduleTrigger(),
    })
    await db.save('flow_version', flowVersion)
    if (shouldPublish) {
        await db.update('flow', flow.id, { publishedVersionId: flowVersion.id })
    }
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
