import { Agent,  agentbuiltInToolsNames,  AgentOutputFieldType,  AgentOutputType, isNil, McpToolMetadata } from '@activepieces/shared'
import { experimental_createMCPClient, tool } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { Socket } from 'socket.io'
import { z, ZodRawShape, ZodSchema } from 'zod'
import { mcpService } from '../mcp/mcp-service'

export const agentTools = async (params: AgentToolsParams) => {
    const mcpClient = await getMcpClient(params.agent, params.log)
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
        getMetadata: async (toolName: string): Promise<McpToolMetadata> => {
            if (toolName === agentbuiltInToolsNames.markAsComplete) {
                return {
                    displayName: 'Mark as Complete',
                }
            }
            return mcpService(params.log).getMcpToolMetadata({ toolName, projectId: params.agent.projectId, platformId: params.agent.platformId })
        },
    }
}


async function buildInternalTools(params: AgentToolsParams) {
    return {
        [agentbuiltInToolsNames.markAsComplete]: tool({
            description: 'Mark the todo as complete',
            parameters: z.object({
                output: await getStructuredOutput(params.agent),
            }),
            execute: async () => {
                return 'Marked as Complete'
            },
        }),
    }   
}

async function getMcpClient(agent: Agent, log: FastifyBaseLogger) {
    const mcpServer = await mcpService(log).getOrThrow({
        mcpId: agent.mcpId,
    })
    if (mcpServer.tools.length === 0) {
        return null
    }
    const mcpServerUrl = await mcpService(log).getMcpServerUrl({ mcpId: agent.mcpId })
    return experimental_createMCPClient({
        transport: {
            type: 'sse',
            url: mcpServerUrl,
        },
    })
}


async function getStructuredOutput(agent: Agent): Promise<ZodSchema> {
    if (agent.outputType !== AgentOutputType.STRUCTURED_OUTPUT) {
        return z.string()
    }
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
    agent: Agent
    todoId: string
    socket: Socket
    log: FastifyBaseLogger
}
