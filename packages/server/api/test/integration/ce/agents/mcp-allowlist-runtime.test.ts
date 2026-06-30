import {
    AgentPieceProps,
    AgentToolType,
    FlowActionType,
    FlowTriggerType,
    FlowVersion,
    flowStructureUtil,
    McpAuthType,
    McpProtocol,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { createHandlers } from '../../../../src/app/workers/rpc/worker-rpc-service'
import { db } from '../../../helpers/db'
import { createMockFlow, createMockFlowVersion } from '../../../helpers/mocks'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

const ON_LIST_URL = 'https://mcp.acme.com/sse'
const OFF_LIST_URL = 'https://evil.example.com/sse'

function mcpTool(toolName: string, serverUrl: string): Record<string, unknown> {
    return {
        type: AgentToolType.MCP,
        toolName,
        serverUrl,
        protocol: McpProtocol.STREAMABLE_HTTP,
        auth: { type: McpAuthType.NONE },
    }
}

function runAgentTrigger(agentTools: Record<string, unknown>[]): Record<string, unknown> {
    return {
        type: FlowTriggerType.EMPTY,
        name: 'trigger',
        displayName: 'trigger',
        settings: {},
        valid: true,
        nextAction: {
            type: FlowActionType.PIECE,
            name: 'step_1',
            displayName: 'Run Agent',
            valid: true,
            settings: {
                pieceName: '@activepieces/piece-ai',
                pieceVersion: '0.0.1',
                actionName: 'run_agent',
                input: { [AgentPieceProps.AGENT_TOOLS]: agentTools },
                inputUiInfo: {},
                packageType: 'REGISTRY',
                pieceType: 'OFFICIAL',
            },
        },
    }
}

function agentToolsOf(flowVersion: FlowVersion): unknown[] {
    const step = flowStructureUtil
        .getAllSteps(flowVersion.trigger)
        .find((s) => s.name === 'step_1')
    if (step === undefined || step.type !== FlowActionType.PIECE) {
        return []
    }
    const tools = step.settings.input?.[AgentPieceProps.AGENT_TOOLS]
    return Array.isArray(tools) ? tools : []
}

function serverUrlsOf(tools: unknown[]): (string | undefined)[] {
    return tools.map((tool) => {
        if (typeof tool === 'object' && tool !== null && 'serverUrl' in tool && typeof tool.serverUrl === 'string') {
            return tool.serverUrl
        }
        return undefined
    })
}

async function seedAgentFlowVersion(projectId: string, agentTools: Record<string, unknown>[]): Promise<string> {
    const flow = createMockFlow({ projectId })
    await db.save('flow', flow)
    const flowVersion = createMockFlowVersion({
        flowId: flow.id,
        trigger: runAgentTrigger(agentTools),
    })
    await db.save('flow_version', flowVersion)
    return flowVersion.id
}

describe('getFlowVersion worker RPC — MCP endpoint allowlist enforcement', () => {
    it('strips off-list MCP tools and keeps on-list and non-MCP tools when an allowlist is configured', async () => {
        const ctx = await createTestContext(app, {
            platform: { mcpServerEndpointAllowlist: ['mcp.acme.com'] },
        })
        const versionId = await seedAgentFlowVersion(ctx.project.id, [
            mcpTool('on-list', ON_LIST_URL),
            mcpTool('off-list', OFF_LIST_URL),
            { type: AgentToolType.PIECE, toolName: 'keep-piece' },
        ])

        const result = await createHandlers(app.log).getFlowVersion({ versionId })

        expect(result).not.toBeNull()
        if (result === null) {
            return
        }
        const tools = agentToolsOf(result)
        expect(tools).toHaveLength(2)
        expect(serverUrlsOf(tools)).toContain(ON_LIST_URL)
        expect(serverUrlsOf(tools)).not.toContain(OFF_LIST_URL)
    })

    it('leaves every MCP tool untouched when the allowlist is unset (opt-in passthrough)', async () => {
        const ctx = await createTestContext(app, {
            platform: { mcpServerEndpointAllowlist: null },
        })
        const versionId = await seedAgentFlowVersion(ctx.project.id, [
            mcpTool('on-list', ON_LIST_URL),
            mcpTool('off-list', OFF_LIST_URL),
        ])

        const result = await createHandlers(app.log).getFlowVersion({ versionId })

        expect(result).not.toBeNull()
        if (result === null) {
            return
        }
        const urls = serverUrlsOf(agentToolsOf(result))
        expect(urls).toContain(ON_LIST_URL)
        expect(urls).toContain(OFF_LIST_URL)
    })
})
