import { AgentJobSource } from '@activepieces/server-shared'
import { Agent, agentbuiltInToolsNames, AgentOutputFieldType, AgentOutputType, isNil, McpWithTools } from '@activepieces/shared'
import { experimental_createMCPClient, tool } from 'ai'
import { z, ZodRawShape, ZodSchema } from 'zod'

export const agentTools = async <T extends AgentJobSource>(params: AgentToolsParams<T>) => {
    const mcpClient = await getMcpClient(params)
    const builtInTools = await buildInternalTools(params)
    const mcpTools = isNil(await mcpClient?.tools()) ? {} : await mcpClient?.tools()
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

async function buildInternalTools<T extends AgentJobSource>(params: AgentToolsParams<T>) {
    return {
        [agentbuiltInToolsNames.markAsComplete]: tool({
            description: 'Mark the todo as complete',
            inputSchema: params.agent.outputType === AgentOutputType.STRUCTURED_OUTPUT ? z.object({
                output: await getStructuredOutput(params.agent),
            }) : z.object({}),
            execute: async () => {
                return 'Marked as Complete'
            },
        }),
    }
}

async function getMcpClient<T extends AgentJobSource>(params: AgentToolsParams<T>) {
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

type AgentToolsParams<T extends AgentJobSource> = {
    publicUrl: string
    token: string
    mcp: McpWithTools
    agent: Agent
    source: T
}
