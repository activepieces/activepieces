import { FlowStatus, FlowTriggerType, FlowVersionState, McpPropertyType, TelemetryEventName } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { mcpOAuthTokenService } from '../../../../src/app/mcp/oauth/token/mcp-oauth-token.service'
import { db } from '../../../helpers/db'
import { McpClient, mcpClientHelpers } from '../../../helpers/mcp-client'
import { createMockFlow, createMockFlowVersion } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

const { mockTrackPlatform, mockTrackProject, mockInstrumentMcpServer } = vi.hoisted(() => ({
    mockTrackPlatform: vi.fn().mockResolvedValue(undefined),
    mockTrackProject: vi.fn().mockResolvedValue(undefined),
    mockInstrumentMcpServer: vi.fn(),
}))

vi.mock('../../../../src/app/helper/telemetry.utils', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../../../src/app/helper/telemetry.utils')>()
    return {
        ...actual,
        instrumentMcpServer: mockInstrumentMcpServer,
        telemetry: () => ({
            identify: vi.fn().mockResolvedValue(undefined),
            trackPlatform: mockTrackPlatform,
            trackProject: mockTrackProject,
            trackIdentity: vi.fn().mockResolvedValue(undefined),
            trackUser: vi.fn().mockResolvedValue(undefined),
            aliasIdentity: vi.fn().mockResolvedValue(undefined),
            identifyPlatformGroup: vi.fn().mockResolvedValue(undefined),
        }),
    }
})

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(() => {
    vi.clearAllMocks()
})

async function chatClient(ctx: TestContext): Promise<McpClient> {
    const response = await ctx.post('/v1/agents/conversations', {})
    expect(response.statusCode).toBe(StatusCodes.CREATED)
    const conversationId = response.json().id
    await db.update('agent_conversation', conversationId, { projectId: ctx.project.id })
    const accessToken = await mcpOAuthTokenService.issueChatTurnAccessToken({ userId: ctx.user.id, platformId: ctx.platform.id, projectId: null })
    return { accessToken, endpoint: '/mcp/platform', conversationId }
}

function externalClient({ ctx, projectId }: { ctx: TestContext, projectId?: string }): Promise<McpClient> {
    return mcpClientHelpers.connect({
        app,
        projectId,
        approve: (payload) => ctx.post('/v1/mcp-oauth/approve', payload),
    })
}

async function seedFlowTool(ctx: TestContext): Promise<void> {
    const flow = createMockFlow({ projectId: ctx.project.id, status: FlowStatus.ENABLED })
    await db.save('flow', flow)
    const flowVersion = createMockFlowVersion({
        flowId: flow.id,
        updatedBy: ctx.user.id,
        state: FlowVersionState.LOCKED,
        valid: true,
        trigger: {
            type: FlowTriggerType.PIECE,
            name: 'trigger',
            displayName: 'MCP Tool',
            valid: true,
            lastUpdatedDate: new Date().toISOString(),
            settings: {
                pieceName: '@activepieces/piece-mcp',
                pieceVersion: '0.0.21',
                triggerName: 'mcp_tool',
                propertySettings: {},
                input: {
                    toolName: FLOW_TOOL_PREFIX,
                    toolDescription: 'Look up the delivery status of a customer order.',
                    inputSchema: [{ name: 'orderNumber', type: McpPropertyType.TEXT, required: true, description: 'The order number' }],
                    returnsResponse: false,
                },
            },
        },
    })
    await db.save('flow_version', flowVersion)
    await db.update('flow', flow.id, { publishedVersionId: flowVersion.id })
}

async function callFlowTool(mcpClient: McpClient): Promise<void> {
    const toolNames = await mcpClientHelpers.listToolNames({ app, mcpClient })
    const flowTool = toolNames.find((name) => name.startsWith(FLOW_TOOL_PREFIX))
    expect(flowTool).toBeDefined()
    await mcpClientHelpers.callTool({ app, mcpClient, name: flowTool ?? '', args: { orderNumber: '42' } })
}

function sentEventNames(): string[] {
    return [...mockTrackPlatform.mock.calls, ...mockTrackProject.mock.calls].map(([params]) => params.event.name)
}

describe('MCP analytics', () => {
    it('sends no MCP analytics for an in-app chat turn', async () => {
        const ctx = await createTestContext(app, { plan: { agentsEnabled: true, chatEnabled: true } })
        await seedFlowTool(ctx)

        await callFlowTool(await chatClient(ctx))

        expect(sentEventNames()).not.toContain(TelemetryEventName.MCP_SERVER_CONNECTED)
        expect(sentEventNames()).not.toContain(TelemetryEventName.MCP_TOOL_CALLED)
        expect(mockInstrumentMcpServer).not.toHaveBeenCalled()
    })

    it('sends every MCP analytics event for an outside client on the platform server', async () => {
        const ctx = await createTestContext(app)

        await mcpClientHelpers.listToolNames({ app, mcpClient: await externalClient({ ctx }) })

        expect(sentEventNames()).toContain(TelemetryEventName.MCP_SERVER_CONNECTED)
        expect(mockInstrumentMcpServer).toHaveBeenCalled()
    })

    it('sends every MCP analytics event for an outside client running a flow tool', async () => {
        const ctx = await createTestContext(app)
        await seedFlowTool(ctx)

        await callFlowTool(await externalClient({ ctx, projectId: ctx.project.id }))

        expect(sentEventNames()).toEqual(expect.arrayContaining([TelemetryEventName.MCP_SERVER_CONNECTED, TelemetryEventName.MCP_TOOL_CALLED]))
        expect(mockInstrumentMcpServer).toHaveBeenCalled()
    })
})

const FLOW_TOOL_PREFIX = 'check_order_status'
