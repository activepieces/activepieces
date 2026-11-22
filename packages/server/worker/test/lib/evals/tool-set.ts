import { aiProviderCredentials, AIProviderName, isNil, isObject, tryCatch } from '@activepieces/core-utils'
import { AgentRunSource, agentToolClassification } from '@activepieces/shared'
import { aiUtils } from '@activepieces/server-utils'
import { ToolExecutionOptions, ToolSet } from 'ai'
import Fastify from 'fastify'
import { z } from 'zod'
import { agentMcpClient } from '../../../src/lib/execute/jobs/ee/agent/agent-mcp-client'
import { agentToolPolicy } from '../../../src/lib/execute/jobs/ee/agent/agent-tool-policy'
import { agentWorkerTools, GateDecision } from '../../../src/lib/execute/jobs/ee/agent/agent-worker-tools'
import { devServer } from './dev-server'
import { EVAL_PROJECT } from './prompts'
import { replay, Replay, ReplayMode } from './replay'
import { ProjectConnection, ScriptedUser } from './scripted-user'

async function connectMcp(): Promise<McpTools> {
    const res = await devServer.request({ path: '/v1/agents/eval/mcp-credentials', method: 'POST' })
    if (!res.ok) {
        throw new Error(`Could not get MCP credentials from the dev server at ${devServer.url()} (${res.status}). Is it running? ${await res.text()}`)
    }
    return connect(McpCredentials.parse(await res.json()))
}

async function connect({ conversationId, projectId, projectName, ...mcpCredentials }: McpCredentials): Promise<McpTools> {
    const connection = await agentMcpClient.connect({ mcpCredentials, conversationId, log: silentLog })
    if (isNil(connection.mcpClient)) {
        throw new Error(`Could not connect to the dev server MCP at ${mcpCredentials.mcpServerUrl}`)
    }
    const client = connection.mcpClient
    return {
        toolSet: onlyTools(connection.mcpToolSet),
        close: () => client.close(),
        projectId,
        projectName,
        conversationId,
    }
}

function build({ mcp, caseReplay, auth, mode, user }: { mcp: McpTools, caseReplay: Replay, auth: Record<string, unknown>, mode: ReplayMode, user: ScriptedUser | null }): ToolSet {
    const taintState = agentWorkerTools.createTaintState({ carried: false })
    const eventEmitter = agentWorkerTools.createEventEmitter({ sendEvent: async () => {}, userId: EVAL_USER_ID, conversationId: mcp.conversationId })
    const executeTool = async (toolName: string, toolInput: Record<string, unknown>): Promise<unknown> => replay.resolveCall({
        caseReplay,
        mode,
        toolName,
        input: toolInput,
        live: () => executeOnDevServer({ toolName, toolInput, conversationId: mcp.conversationId }),
    })
    const approve = async (): Promise<GateDecision> => ({ outcome: 'approved' })
    const dismissCard = async (): Promise<GateDecision> => ({ outcome: 'declined' })
    const noop = async (): Promise<void> => {}
    const storeSelectedConnection = async (toolInput: { pieceName: string, connectionExternalId: string, label: string, projectId: string }): Promise<void> => {
        await tryCatch(() => executeOnDevServer({ toolName: STORE_SELECTED_CONNECTION_TOOL, toolInput, conversationId: mcp.conversationId }))
    }
    const buildPlanTools = agentWorkerTools.createBuildPlanTools({ eventEmitter, getProjectId: () => EVAL_PROJECT.id })
    const mcpTools = agentMcpClient.withToolTimeouts({
        mcpToolSet: replayed({ tools: mcp.toolSet, caseReplay, mode }),
        brokenConnectors: new Set(),
        taintState,
    })
    return agentToolPolicy.selectToolsForSource({
        source: AgentRunSource.CHAT,
        groups: {
            local: agentWorkerTools.createLocalTools({ onSetProjectContext: async () => ({ success: true }), projects: [EVAL_PROJECT] }),
            display: agentWorkerTools.createDisplayTools({ waitForApproval: user?.waitForApproval ?? dismissCard, displayToolTimeoutMs: DISPLAY_TOOL_TIMEOUT_MS, onConnectionSelected: storeSelectedConnection, onGateOpened: user?.onGateOpened ?? noop }),
            crossProject: agentWorkerTools.createCrossProjectTools({ executeTool, eventEmitter, waitForApproval: approve, onGateOpened: noop, taintState }),
            web: replayed({
                tools: {
                    ...agentWorkerTools.createWebTools({ taintState }),
                    ...agentWorkerTools.createProviderSearchTools({ search: (request) => searchWeb({ request, auth }), billedAtCost: false, taintState }),
                },
                caseReplay,
                mode,
            }),
            thinking: agentWorkerTools.createThinkingTools(),
            buildPlan: buildPlanTools,
            email: {},
            agentSurface: agentWorkerTools.createAgentSurfaceTools({ executeTool, taintState, eventEmitter, waitForApproval: approve, onGateOpened: noop }),
            mcp: onlyTools(mcpTools),
            configuredPiece: {},
            configuredFlow: {},
            knowledgeBase: {},
            completion: {},
        },
    })
}

function replayed({ tools, caseReplay, mode }: { tools: ToolSet, caseReplay: Replay, mode: ReplayMode }): ToolSet {
    return Object.fromEntries(Object.entries(tools).map(([toolName, tool]) => {
        const liveExecute = tool.execute
        return [toolName, {
            ...tool,
            execute: async (input: unknown, options: ToolExecutionOptions<unknown>) => replay.resolveCall({
                caseReplay,
                mode,
                toolName,
                input,
                live: isNil(liveExecute) ? undefined : async () => liveExecute(input, options),
            }),
        }]
    }))
}

async function listConnections({ mcp, pieceName }: { mcp: McpTools, pieceName: string }): Promise<ProjectConnection[]> {
    const execute = mcp.toolSet[LIST_CONNECTIONS_TOOL]?.execute
    if (isNil(execute)) {
        throw new Error(`The dev server MCP does not offer ${LIST_CONNECTIONS_TOOL}`)
    }
    return ListConnectionsOutput.parse(await execute({ pieceName }, { toolCallId: LIST_CONNECTIONS_TOOL, messages: [], context: {} })).structuredContent.connections
}

async function call({ mcp, toolName, input }: { mcp: McpTools, toolName: string, input: Record<string, unknown> }): Promise<unknown> {
    const execute = mcp.toolSet[toolName]?.execute
    if (isNil(execute)) {
        throw new Error(`the dev server MCP does not offer ${toolName}`)
    }
    return execute(input, { toolCallId: toolName, messages: [], context: {} })
}

function readResult(output: unknown): ToolResult {
    const structured = isObject(output) && isObject(output['structuredContent']) ? output['structuredContent'] : {}
    const text = resultText(output)
    const failed = (isObject(output) && output['isError'] === true) || agentToolClassification.hasFailureTextPrefix(text.trim())
    return { failed, text, structured }
}

function resultText(output: unknown): string {
    if (typeof output === 'string') {
        return output
    }
    const content = isObject(output) ? output['content'] : null
    const texts = Array.isArray(content) ? content.flatMap((item) => isObject(item) && typeof item['text'] === 'string' ? [item['text']] : []) : []
    return texts.length === 0 ? JSON.stringify(output ?? null) : texts.join('\n')
}

async function executeOnDevServer({ toolName, toolInput, conversationId }: { toolName: string, toolInput: Record<string, unknown>, conversationId: string }): Promise<unknown> {
    const res = await devServer.request({ path: '/v1/agents/eval/execute-tool', method: 'POST', body: { toolName, toolInput, conversationId } })
    if (!res.ok) {
        return { error: `The dev server could not run ${toolName}: ${res.status} ${await res.text()}` }
    }
    return ExecuteToolResponse.parse(await res.json()).result
}

function searchWeb({ request, auth }: { request: { system: string, prompt: string, abortSignal: AbortSignal }, auth: Record<string, unknown> }): ReturnType<typeof aiUtils.searchWeb> {
    return aiUtils.searchWeb({ ...request, credentials: aiProviderCredentials({ provider: AIProviderName.OPENROUTER, auth, config: {} }), modelId: SEARCH_MODEL_ID, billing: null })
}

function onlyTools(tools: Record<string, unknown>): ToolSet {
    return Object.fromEntries(Object.entries(tools).flatMap(([name, tool]) => isTool(tool) ? [[name, tool]] : []))
}

function isTool(value: unknown): value is ToolSet[string] {
    return typeof value === 'object' && value !== null && 'inputSchema' in value
}

const DISPLAY_TOOL_TIMEOUT_MS = 1_000
const SEARCH_MODEL_ID = 'google/gemini-2.5-flash'
const EVAL_USER_ID = 'eval-user'

const ExecuteToolResponse = z.object({ result: z.unknown() })
const LIST_CONNECTIONS_TOOL = 'ap_list_connections'
const STORE_SELECTED_CONNECTION_TOOL = '__store_selected_connection'
const ListConnectionsOutput = z.object({ structuredContent: z.object({ connections: z.array(ProjectConnection) }) })

const silentLog = Fastify({ logger: false }).log

export const McpCredentials = z.object({ mcpServerUrl: z.string(), mcpToken: z.string(), conversationId: z.string(), projectId: z.string(), projectName: z.string() })

export const evalToolSet = {
    connectMcp,
    connect,
    build,
    call,
    readResult,
    listConnections,
}

export type ToolResult = {
    failed: boolean
    text: string
    structured: Record<string, unknown>
}

export type McpCredentials = z.infer<typeof McpCredentials>

export type McpTools = {
    toolSet: ToolSet
    close: () => Promise<void>
    projectId: string
    projectName: string
    conversationId: string
}
