import {
    AgentFlowTool,
    AgentTool,
    ExecuteToolResponse,
    ExecutionToolStatus,
    isNil,
    McpProperty,
    McpPropertyType,
    mcpToolNameUtils,
    McpTrigger,
    WorkerToApiContract,
} from '@activepieces/shared'
import { dynamicTool, ToolSet } from 'ai'
import { Logger } from 'pino'
import { z } from 'zod'

/**
 * Worker-side port of the AI piece's `agentUtils.constructFlowsTools`. Each flow tool exposes another
 * flow (published as an MCP tool) to the agent: its input schema is derived from the flow trigger's
 * declared `inputSchema`, and invoking it runs that flow's webhook. The worker has no HTTP client to
 * the API, so both the flow lookup and the webhook invocation go through the worker→API RPC client
 * (`listPopulatedFlows` / `invokeFlowTool`), authorized by the engine token.
 */
export async function buildFlowTools({ flowTools, apiClient, engineToken, log }: BuildFlowToolsParams): Promise<BuiltFlowTools> {
    const tools: ToolSet = {}
    const toolKeyToAgentTool: Record<string, AgentTool> = {}
    if (flowTools.length === 0) {
        return { tools, toolKeyToAgentTool }
    }

    const flows = await apiClient.listPopulatedFlows({ engineToken, externalIds: flowTools.map((tool) => tool.externalFlowId) })
    const flowsByExternalId = new Map(flows.data.map((flow) => [flow.externalId, flow]))

    for (const flowTool of flowTools) {
        const populatedFlow = flowsByExternalId.get(flowTool.externalFlowId)
        if (isNil(populatedFlow)) {
            continue
        }
        const parsedTrigger = McpTrigger.safeParse(populatedFlow.version.trigger.settings)
        if (!parsedTrigger.success) {
            log.warn({ flowId: populatedFlow.id, externalFlowId: flowTool.externalFlowId }, '[flowTools] Flow trigger is not an MCP tool trigger; skipping')
            continue
        }
        const { toolDescription, inputSchema, returnsResponse } = parsedTrigger.data.input

        const toolName = mcpToolNameUtils.createToolName(flowTool.toolName)
        const flowId = populatedFlow.id
        tools[toolName] = dynamicTool({
            description: toolDescription,
            inputSchema: z.object(Object.fromEntries(inputSchema.map((property) => [fixPropertyName(property.name), mcpPropertyToSchema(property)]))),
            execute: (inputs) => invokeFlow({ apiClient, engineToken, flowId, async: !returnsResponse, inputs }),
        })
        toolKeyToAgentTool[toolName] = flowTool
    }

    return { tools, toolKeyToAgentTool }
}

async function invokeFlow({ apiClient, engineToken, flowId, async, inputs }: InvokeFlowParams): Promise<ExecuteToolResponse> {
    try {
        const response = await apiClient.invokeFlowTool({ engineToken, flowId, async, inputs: asRecord(inputs) })
        const success = isOkSuccess(response.status)
        return {
            status: success ? ExecutionToolStatus.SUCCESS : ExecutionToolStatus.FAILED,
            output: response.body,
            resolvedInput: {},
            errorMessage: success ? undefined : 'Error',
        }
    }
    catch (error) {
        return {
            status: ExecutionToolStatus.FAILED,
            output: undefined,
            resolvedInput: {},
            errorMessage: error instanceof Error ? error.message : 'Error executing flow tool',
        }
    }
}

function isOkSuccess(status: number): boolean {
    return Math.floor(status / 100) === 2
}

function fixPropertyName(name: string): string {
    return name.replace(/[\s/@-]+/g, '_')
}

function mcpPropertyToSchema(property: McpProperty): z.ZodTypeAny {
    let schema: z.ZodTypeAny
    switch (property.type) {
        case McpPropertyType.TEXT:
        case McpPropertyType.DATE:
            schema = z.string()
            break
        case McpPropertyType.NUMBER:
            schema = z.number()
            break
        case McpPropertyType.BOOLEAN:
            schema = z.boolean()
            break
        case McpPropertyType.ARRAY:
            schema = z.array(z.string())
            break
        case McpPropertyType.OBJECT:
            schema = z.record(z.string(), z.string())
            break
        default:
            schema = z.unknown()
    }
    if (property.description) {
        schema = schema.describe(property.description)
    }
    return property.required ? schema : schema.nullish()
}

function asRecord(value: unknown): Record<string, unknown> {
    return isRecord(value) ? value : {}
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && !isNil(value) && !Array.isArray(value)
}

type InvokeFlowParams = {
    apiClient: WorkerToApiContract
    engineToken: string
    flowId: string
    async: boolean
    inputs: unknown
}

type BuildFlowToolsParams = {
    flowTools: AgentFlowTool[]
    apiClient: WorkerToApiContract
    engineToken: string
    log: Logger
}

export type BuiltFlowTools = {
    tools: ToolSet
    toolKeyToAgentTool: Record<string, AgentTool>
}
