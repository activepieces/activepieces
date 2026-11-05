import { aiProviderCredentials, AIProviderName, isNil } from '@activepieces/core-utils'
import { AgentRunSource, agentToolPhases } from '@activepieces/shared'
import { aiUtils } from '@activepieces/server-utils'
import { ToolExecutionOptions, ToolSet } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { agentMcpClient } from '../../../src/lib/execute/jobs/ee/agent/agent-mcp-client'
import { agentToolPolicy } from '../../../src/lib/execute/jobs/ee/agent/agent-tool-policy'
import { agentWorkerTools, GateDecision } from '../../../src/lib/execute/jobs/ee/agent/agent-worker-tools'
import { Replay } from './replay'

async function connectMcp(): Promise<McpTools> {
    const baseUrl = devServerUrl()
    const res = await fetch(`${baseUrl}/v1/agents/eval/mcp-credentials`, { method: 'POST', headers: { 'api-key': devServerApiKey() } })
    if (!res.ok) {
        throw new Error(`Could not get MCP credentials from the dev server at ${baseUrl} (${res.status}). Is it running? ${await res.text()}`)
    }
    const { conversationId, projectName, ...mcpCredentials } = McpCredentials.parse(await res.json())
    const connection = await agentMcpClient.connect({ mcpCredentials, conversationId, log: silentLog })
    if (isNil(connection.mcpClient)) {
        throw new Error(`Could not connect to the dev server MCP at ${mcpCredentials.mcpServerUrl}`)
    }
    const client = connection.mcpClient
    return {
        toolSet: Object.fromEntries(Object.entries(connection.mcpToolSet).flatMap(([name, tool]) => isTool(tool) ? [[name, tool]] : [])),
        close: () => client.close(),
        projectName,
    }
}

function build({ mcpToolSet, replay, auth, recordMode }: { mcpToolSet: ToolSet, replay: Replay, auth: Record<string, unknown>, recordMode: boolean }): ToolSet {
    const taintState = agentWorkerTools.createTaintState({ carried: false })
    const eventEmitter = agentWorkerTools.createEventEmitter({ sendEvent: async () => {}, userId: EVAL_USER_ID, conversationId: EVAL_CONVERSATION_ID })
    const executeTool = async (toolName: string, toolInput: Record<string, unknown>): Promise<unknown> => resolveCall({
        replay,
        recordMode,
        toolName,
        input: toolInput,
        live: () => executeOnDevServer({ toolName, toolInput }),
    })
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
                    ...agentWorkerTools.createProviderSearchTools({ search: (request) => searchWeb({ request, auth }), billedAtCost: false, taintState }),
                },
                replay,
                recordMode,
            }),
            thinking: agentWorkerTools.createThinkingTools(),
            buildPlan: agentWorkerTools.createBuildPlanTools({ eventEmitter, getProjectId: () => EVAL_PROJECTS[0].id }),
            email: {},
            agentSurface: agentWorkerTools.createAgentSurfaceTools({ executeTool, taintState, eventEmitter, waitForApproval: approve, onGateOpened: noop }),
            mcp: replayed({ tools: mcpToolSet, replay, recordMode }),
            configuredPiece: {},
            configuredFlow: {},
            knowledgeBase: {},
            completion: {},
        },
    })
}

function replayed({ tools, replay, recordMode }: { tools: ToolSet, replay: Replay, recordMode: boolean }): ToolSet {
    return Object.fromEntries(Object.entries(tools).map(([toolName, tool]) => {
        const liveExecute = tool.execute
        return [toolName, {
            ...tool,
            execute: async (input: unknown, options: ToolExecutionOptions) => resolveCall({
                replay,
                recordMode,
                toolName,
                input,
                live: isNil(liveExecute) ? undefined : async () => liveExecute(input, options),
            }),
        }]
    }))
}

async function resolveCall({ replay, recordMode, toolName, input, live }: { replay: Replay, recordMode: boolean, toolName: string, input: unknown, live: (() => Promise<unknown>) | undefined }): Promise<unknown> {
    const read = !agentToolPhases.isBuildOnlyTool(toolName)
    const fixture = replay.take({ toolName, input, sameInputOnly: read })
    if (fixture.found) {
        return fixture.output
    }
    if (!recordMode || isNil(live)) {
        return replay.stop({ toolName, input, kind: read ? 'missing_fixture' : 'unrecorded_write' })
    }
    const output = await live()
    replay.record({ toolName, input, output })
    return output
}

async function executeOnDevServer({ toolName, toolInput }: { toolName: string, toolInput: Record<string, unknown> }): Promise<unknown> {
    const res = await fetch(`${devServerUrl()}/v1/agents/eval/execute-tool`, {
        method: 'POST',
        headers: { 'api-key': devServerApiKey(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolName, toolInput }),
    })
    if (!res.ok) {
        return { error: `The dev server could not run ${toolName}: ${res.status} ${await res.text()}` }
    }
    return ExecuteToolResponse.parse(await res.json()).result
}

function devServerUrl(): string {
    return (process.env[BASE_URL_ENV] ?? DEFAULT_BASE_URL).replace(/\/$/, '')
}

function devServerApiKey(): string {
    const apiKey = process.env[API_KEY_ENV]
    if (isNil(apiKey) || apiKey.length === 0) {
        throw new Error(`${API_KEY_ENV} is not set. It must match the running dev server's AP_API_KEY.`)
    }
    return apiKey
}

function searchWeb({ request, auth }: { request: { system: string, prompt: string, abortSignal: AbortSignal }, auth: Record<string, unknown> }): ReturnType<typeof aiUtils.searchWeb> {
    return aiUtils.searchWeb({ ...request, credentials: aiProviderCredentials({ provider: AIProviderName.OPENROUTER, auth, config: {} }), modelId: SEARCH_MODEL_ID, billing: null })
}

function isTool(value: unknown): value is ToolSet[string] {
    return typeof value === 'object' && value !== null && 'inputSchema' in value
}

const API_KEY_ENV = 'AP_API_KEY'
const BASE_URL_ENV = 'AP_EVAL_BASE_URL'
const DEFAULT_BASE_URL = 'http://localhost:3000/api'
const DISPLAY_TOOL_TIMEOUT_MS = 1_000
const SEARCH_MODEL_ID = 'google/gemini-2.5-flash'
const EVAL_USER_ID = 'eval-user'
const EVAL_CONVERSATION_ID = 'eval-conversation'
const EVAL_PROJECTS = [{ id: 'eval-project', displayName: 'Eval Project', type: 'TEAM' }]

const McpCredentials = z.object({ mcpServerUrl: z.string(), mcpToken: z.string(), conversationId: z.string(), projectId: z.string(), projectName: z.string() })
const ExecuteToolResponse = z.object({ result: z.unknown() })

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
    projectName: string
}
