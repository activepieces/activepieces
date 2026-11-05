import { isNil } from '@activepieces/core-utils'
import { AgentRunSource } from '@activepieces/shared'
import { ToolSet } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { agentMcpClient } from '../../../src/lib/execute/jobs/ee/agent/agent-mcp-client'
import { agentToolPolicy } from '../../../src/lib/execute/jobs/ee/agent/agent-tool-policy'
import { agentWorkerTools, GateDecision } from '../../../src/lib/execute/jobs/ee/agent/agent-worker-tools'
import { Replay } from './replay'

async function connectMcp({ conversationId }: { conversationId: string }): Promise<McpTools> {
    const apiKey = process.env[API_KEY_ENV]
    if (isNil(apiKey) || apiKey.length === 0) {
        throw new Error(`${API_KEY_ENV} is not set. It must match the running dev server's AP_API_KEY.`)
    }
    const baseUrl = (process.env[BASE_URL_ENV] ?? DEFAULT_BASE_URL).replace(/\/$/, '')
    const res = await fetch(`${baseUrl}/v1/agents/eval/mcp-credentials`, { method: 'POST', headers: { 'api-key': apiKey } })
    if (!res.ok) {
        throw new Error(`Could not get MCP credentials from the dev server at ${baseUrl} (${res.status}). Is it running? ${await res.text()}`)
    }
    const mcpCredentials = McpCredentials.parse(await res.json())
    const connection = await agentMcpClient.connect({ mcpCredentials, conversationId, log: silentLog })
    if (isNil(connection.mcpClient)) {
        throw new Error(`Could not connect to the dev server MCP at ${mcpCredentials.mcpServerUrl}`)
    }
    const client = connection.mcpClient
    return {
        toolSet: Object.fromEntries(Object.entries(connection.mcpToolSet).flatMap(([name, tool]) => isTool(tool) ? [[name, tool]] : [])),
        close: () => client.close(),
    }
}

function build({ mcpToolSet, replay }: { mcpToolSet: ToolSet, replay: Replay }): ToolSet {
    const taintState = agentWorkerTools.createTaintState({ carried: false })
    const eventEmitter = agentWorkerTools.createEventEmitter({ sendEvent: async () => {}, userId: EVAL_USER_ID, conversationId: EVAL_CONVERSATION_ID })
    const executeTool = async (toolName: string): Promise<unknown> => replay.execute({ toolName })
    const approve = async (): Promise<GateDecision> => ({ outcome: 'approved' })
    const dismissCard = async (): Promise<GateDecision> => ({ outcome: 'declined' })
    const noop = async (): Promise<void> => {}
    return agentToolPolicy.selectToolsForSource({
        source: AgentRunSource.CHAT,
        groups: {
            local: agentWorkerTools.createLocalTools({ onSetProjectContext: async () => ({ success: true }), projects: EVAL_PROJECTS }),
            display: agentWorkerTools.createDisplayTools({ waitForApproval: dismissCard, displayToolTimeoutMs: DISPLAY_TOOL_TIMEOUT_MS, onConnectionSelected: noop, onGateOpened: noop }),
            crossProject: agentWorkerTools.createCrossProjectTools({ executeTool, eventEmitter, waitForApproval: approve, onGateOpened: noop, taintState }),
            web: replayed({
                tools: {
                    ...agentWorkerTools.createWebTools({ taintState }),
                    ...agentWorkerTools.createProviderSearchTools({ search: unreachableSearch, billedAtCost: false, taintState }),
                },
                replay,
            }),
            thinking: agentWorkerTools.createThinkingTools(),
            buildPlan: agentWorkerTools.createBuildPlanTools({ eventEmitter, getProjectId: () => EVAL_PROJECTS[0].id }),
            email: {},
            agentSurface: agentWorkerTools.createAgentSurfaceTools({ executeTool, taintState, eventEmitter, waitForApproval: approve, onGateOpened: noop }),
            mcp: replayed({ tools: mcpToolSet, replay }),
            configuredPiece: {},
            configuredFlow: {},
            knowledgeBase: {},
            completion: {},
        },
    })
}

function replayed({ tools, replay }: { tools: ToolSet, replay: Replay }): ToolSet {
    return Object.fromEntries(Object.entries(tools).map(([toolName, tool]) => [toolName, { ...tool, execute: async () => replay.execute({ toolName }) }]))
}

function isTool(value: unknown): value is ToolSet[string] {
    return typeof value === 'object' && value !== null && 'inputSchema' in value
}

async function unreachableSearch(): Promise<never> {
    throw new Error('Web search runs through replay in evals')
}

const API_KEY_ENV = 'AP_API_KEY'
const BASE_URL_ENV = 'AP_EVAL_BASE_URL'
const DEFAULT_BASE_URL = 'http://localhost:3000/api'
const DISPLAY_TOOL_TIMEOUT_MS = 1_000
const EVAL_USER_ID = 'eval-user'
const EVAL_CONVERSATION_ID = 'eval-conversation'
const EVAL_PROJECTS = [{ id: 'eval-project', displayName: 'Eval Project', type: 'TEAM' }]

const McpCredentials = z.object({ mcpServerUrl: z.string(), mcpToken: z.string() })

const silentLog: FastifyBaseLogger = {
    level: 'silent',
    silent: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
    fatal: () => undefined,
    debug: () => undefined,
    trace: () => undefined,
    child: () => silentLog,
}

export const evalToolSet = {
    connectMcp,
    build,
}

type McpTools = {
    toolSet: ToolSet
    close: () => Promise<void>
}
