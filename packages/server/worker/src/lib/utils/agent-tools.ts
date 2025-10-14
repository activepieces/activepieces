import { Agent, agentbuiltInToolsNames, AgentOutputFieldType, AgentOutputType, isNil, McpWithTools } from '@activepieces/shared'
import { experimental_createMCPClient, tool, type Schema as AiSchema } from 'ai'
import { z, ZodRawShape, ZodSchema } from 'zod'

export const agentTools = async (params: AgentToolsParams) => {
    const mcpClient = await getMcpClient(params)
    const builtInTools = await buildInternalTools(params)
    const mcpTools = isNil(mcpClient) ? {} : await mcpClient.tools()
    const tools = {
        ...builtInTools,
        ...mcpTools,
    }
    
    return {
        tools: async () => {
            return tools
        },
        close: async () => {
            await mcpClient?.close()
        },
    }
}

async function buildInternalTools(params: AgentToolsParams) {
    const structuredOutput = await getStructuredOutput(params.agent)
    const inputSchema: ZodSchema = params.agent.outputType === AgentOutputType.STRUCTURED_OUTPUT
        ? z.object({ output: structuredOutput }) as ZodSchema
        : z.object({})

    return {
        [agentbuiltInToolsNames.markAsComplete]: tool({
            description: 'Mark the todo as complete',
            inputSchema: inputSchema as unknown as AiSchema,
            execute: async () => {
                return 'Marked as Complete'
            },
        }),
    }
}

async function getMcpClient(params: AgentToolsParams) {
    const mcpServer = params.mcp
    if (mcpServer.tools.length === 0) {
        return null
    }
    const mcpServerUrl = `${params.publicUrl}v1/mcp/${params.mcp.token}/sse`
    return experimental_createMCPClient({
        transport: {
            type: 'sse',
            url: mcpServerUrl,
        },
    })
}

async function getStructuredOutput(agent: Agent): Promise<ZodSchema> {
    const outputFields = agent.outputFields ?? []
    const shape: ZodRawShape = {}

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
                shape[field.displayName] = z.any()
        }
    }

    return z.object(shape)
}   

type AgentToolsParams = {
    publicUrl: string
    token: string
    mcp: McpWithTools
    agent: Agent
}
