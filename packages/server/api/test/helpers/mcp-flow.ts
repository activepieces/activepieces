import { WebhookRenewStrategy } from '@activepieces/pieces-framework'
import {
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
import { db } from './db'
import { createMockFlow, createMockFlowVersion, createMockPieceMetadata } from './mocks'
import { TestContext } from './test-context'

export function mockProjectScopedMcpServer(ctx: TestContext): ProjectScopedMcpServer {
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

export function mockMcpToolContext(ctx: TestContext, userId?: string): { mcp: ProjectScopedMcpServer, userId?: string } {
    return { mcp: mockProjectScopedMcpServer(ctx), userId }
}

export async function seedPublishableFlow({ ctx, status = FlowStatus.DISABLED, publishCurrentVersion = false }: SeedPublishableFlowParams): Promise<{ flow: Flow, flowVersion: FlowVersion }> {
    await db.save('piece_metadata', createMockPieceMetadata({
        name: SCHEDULE_PIECE_NAME,
        version: SCHEDULE_PIECE_VERSION,
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
    }))

    const flow = createMockFlow({ projectId: ctx.project.id, status })
    await db.save('flow', flow)

    const flowVersion = createMockFlowVersion({
        flowId: flow.id,
        updatedBy: ctx.user.id,
        state: publishCurrentVersion ? FlowVersionState.LOCKED : FlowVersionState.DRAFT,
        valid: true,
        trigger: scheduleTrigger(),
    })
    await db.save('flow_version', flowVersion)
    if (publishCurrentVersion) {
        await db.update('flow', flow.id, { publishedVersionId: flowVersion.id })
    }
    return { flow, flowVersion }
}

function scheduleTrigger(): FlowTrigger {
    return {
        type: FlowTriggerType.PIECE,
        settings: {
            pieceName: SCHEDULE_PIECE_NAME,
            pieceVersion: SCHEDULE_PIECE_VERSION,
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

const SCHEDULE_PIECE_NAME = '@activepieces/piece-schedule'
const SCHEDULE_PIECE_VERSION = '0.1.5'

type SeedPublishableFlowParams = {
    ctx: TestContext
    status?: FlowStatus
    publishCurrentVersion?: boolean
}
