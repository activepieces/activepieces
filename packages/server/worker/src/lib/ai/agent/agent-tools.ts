import { CreateEmbeddingModelResult } from '@activepieces/server-utils'
import {
    AgentOutputField,
    AgentOutputFieldType,
    AgentTaskStatus,
    AgentToolType,
    isNil,
    isString,
    KnowledgeBaseSourceType,
    RunAgentConfig,
    TASK_COMPLETION_TOOL_NAME,
    WorkerToApiContract,
} from '@activepieces/shared'
import { dynamicTool, Tool, ToolSet } from 'ai'
import { Logger } from 'pino'
import { z, ZodObject } from 'zod'
import { AgentOutputBuilder, ToolKeyToAgentTool } from './agent-output-builder'
import { AgentSession } from './agent-session'
import { buildFlowTools } from './tools/flow-tools'
import { buildKnowledgeBaseTools } from './tools/knowledge-base-tools'
import { buildMcpTools, closeMcpClients } from './tools/mcp-tools'
import { buildWebSearchConfig, WebSearchConfig } from './tools/web-search'

/**
 * Builds the worker-side `ToolSet` for an agent run. Piece tools become yield-and-park callbacks —
 * their `execute` registers the call with the session and returns a promise that stays unresolved
 * until the engine runs the piece (via flowExecutor) and feeds the result back through
 * `continueAgent`. Web search is provider-native (a model-invoked tool or a provider option);
 * knowledge-base and flow tools reach the API over the worker→API RPC client; MCP tools connect to
 * user servers through an SSRF-filtered fetch (the worker, unlike the sandbox, is not egress-proxied)
 * and are closed on session dispose. The completion tool runs inline (pure state).
 */
export async function buildAgentToolSet({ config, session, outputBuilder, apiClient, embeddingConfig, log }: BuildAgentToolSetParams): Promise<BuiltAgentTools> {
    const structuredOutput = config.structuredOutput
    const tools: ToolSet = {}
    const toolKeyToAgentTool: ToolKeyToAgentTool = {}

    for (const pieceTool of config.pieceTools) {
        tools[pieceTool.toolName] = dynamicTool({
            description: pieceTool.description,
            inputSchema: z.object({ instruction: z.string().describe('The instruction to the tool') }),
            execute: (input, options) => session.parkToolCall({
                toolCallId: options.toolCallId,
                toolName: pieceTool.toolName,
                input: asRecord(input),
            }),
        })
        toolKeyToAgentTool[pieceTool.toolName] = {
            type: AgentToolType.PIECE,
            toolName: pieceTool.toolName,
            pieceMetadata: pieceTool.pieceMetadata,
        }
    }

    const webSearch = buildWebSearchConfig({
        provider: config.provider,
        model: config.model,
        webSearchEnabled: config.webSearchEnabled,
        webSearchOptions: config.webSearchOptions,
    })
    Object.assign(tools, webSearch.tools ?? {})

    const knowledgeBase = await buildKnowledgeBaseTools({
        kbTools: config.knowledgeBaseTools,
        apiClient,
        engineToken: config.engineToken,
        embeddingConfig,
        log,
    })
    Object.assign(tools, knowledgeBase.tools)
    Object.assign(toolKeyToAgentTool, knowledgeBase.toolKeyToAgentTool)

    const flow = await buildFlowTools({
        flowTools: config.flowTools,
        apiClient,
        engineToken: config.engineToken,
        log,
    })
    Object.assign(tools, flow.tools)
    Object.assign(toolKeyToAgentTool, flow.toolKeyToAgentTool)

    const mcp = await buildMcpTools({ mcpTools: config.mcpTools, log })
    Object.assign(tools, mcp.tools)
    Object.assign(toolKeyToAgentTool, mcp.toolKeyToAgentTool)
    session.addDisposeHook(() => closeMcpClients(mcp.mcpClients, log))

    tools[TASK_COMPLETION_TOOL_NAME] = buildCompletionTool({ structuredOutput, outputBuilder })

    return { tools, toolKeyToAgentTool, providerOptions: webSearch.providerOptions, ...buildAgentPrompts(config.prompt) }
}

export function hasKnowledgeBaseFileTools(config: RunAgentConfig): boolean {
    return config.knowledgeBaseTools.some((tool) => tool.sourceType === KnowledgeBaseSourceType.FILE)
}

function buildCompletionTool({ structuredOutput, outputBuilder }: BuildCompletionToolParams): Tool {
    return dynamicTool({
        description: 'This tool must be called as your FINAL ACTION to indicate whether the assigned goal was accomplished. Call it only when you have completed the task, or if you are unable to continue.',
        inputSchema: z.object({
            success: z.boolean().describe('Set to true if the assigned goal was achieved, or false if the task was abandoned or failed.'),
            ...(isNil(structuredOutput)
                ? { output: z.string().describe('Your complete response to the user. Always populate this with the full answer, result, or explanation.') }
                : { output: z.object(structuredOutputSchema(structuredOutput)?.shape ?? {}).nullable().describe('The structured output of your task.') }),
        }),
        execute: (params) => {
            const { success, output } = params as { success: boolean, output?: Record<string, unknown> | string }
            outputBuilder.setStatus(success ? AgentTaskStatus.COMPLETED : AgentTaskStatus.FAILED)
            if (!isNil(structuredOutput) && !isNil(output) && !isString(output)) {
                outputBuilder.setStructuredOutput(output)
            }
            else if (isNil(structuredOutput) && isString(output) && !outputBuilder.hasTextContent()) {
                outputBuilder.addMarkdown(output)
            }
            return Promise.resolve({})
        },
    })
}

function buildAgentPrompts(userPrompt: string): { system: string, prompt: string } {
    return {
        prompt: `${userPrompt}\n<important_note>\nAs your FINAL ACTION, you must call the \`${TASK_COMPLETION_TOOL_NAME}\` tool to indicate if the task is complete or not. Call it only once you have done everything you can to achieve the user's goal, or if you are unable to continue.\n</important_note>`,
        system: `You are a helpful, proactive AI assistant designed to assist users efficiently and accurately.\nToday's date is ${new Date().toISOString().split('T')[0]}.\nThink step-by-step before taking any action. Use tools meaningfully and only when they advance the task. Tolerate minor errors and retry with adjusted parameters up to 2-3 times before giving up. Once the goal is achieved or unachievable, call the \`${TASK_COMPLETION_TOOL_NAME}\` tool as your last action.`,
    }
}

function structuredOutputSchema(outputFields: AgentOutputField[]): ZodObject | undefined {
    const shape: Record<string, z.ZodType> = {}
    for (const field of outputFields) {
        switch (field.type) {
            case AgentOutputFieldType.TEXT:
                shape[field.displayName] = z.string()
                break
            case AgentOutputFieldType.NUMBER:
                shape[field.displayName] = z.number()
                break
            case AgentOutputFieldType.BOOLEAN:
                shape[field.displayName] = z.boolean()
                break
            default:
                shape[field.displayName] = z.unknown()
        }
    }
    return Object.keys(shape).length > 0 ? z.object(shape) : undefined
}

function asRecord(value: unknown): Record<string, unknown> {
    return typeof value === 'object' && !isNil(value) && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

type BuildAgentToolSetParams = {
    config: RunAgentConfig
    session: AgentSession
    outputBuilder: AgentOutputBuilder
    apiClient: WorkerToApiContract
    embeddingConfig: CreateEmbeddingModelResult | undefined
    log: Logger
}

type BuildCompletionToolParams = {
    structuredOutput: AgentOutputField[] | undefined
    outputBuilder: AgentOutputBuilder
}

export type BuiltAgentTools = {
    tools: ToolSet
    toolKeyToAgentTool: ToolKeyToAgentTool
    system: string
    prompt: string
    providerOptions: WebSearchConfig['providerOptions']
}
