import { AgentStreamingEvent, AgentStreamingUpdate, genericAgentUtils, ExecuteAgentJobData, isNil, ConversationMessage, AgentSession, AgentStreamingUpdateProgressData, AgentToolType, AgentPieceTool, AgentMcpTool } from '@activepieces/shared'
import { LanguageModelV2ToolResultOutput } from '@ai-sdk/provider'
import { MCPClient } from '@ai-sdk/mcp'
import { ModelMessage, stepCountIs, streamText, ToolSet } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { agentUtils } from './utils'
import { pubsubFactory } from '@activepieces/server-shared'
import { workerRedisConnections } from '../utils/worker-redis'
import { buildSystemPrompt } from './system-prompt'
import { createBuiltInTools } from './tools/built-in'
import { pieceToolExecutor } from './tools/piece-tools'
import { createMcpTools } from './tools/mcp'

const pubsub = pubsubFactory(workerRedisConnections.create)

export const agentExecutor = (log: FastifyBaseLogger) => ({
    async execute(data: ExecuteAgentJobData, engineToken: string) {

        const { platformId, projectId } = data
        const { requestId, conversation, modelId, structuredOutput, tools } = data.session

        const model = await agentUtils.getModel({
            modelId,
            engineToken,
            provider: data.session.provider,
        })

        // Build system prompt based on enabled tools
        const systemPrompt = buildSystemPrompt(tools ?? [])
        
        // Build built-in tools based on enabled tools
        const builtInTools = createBuiltInTools({
            engineToken,
            projectId,
            platformId,
            state: data.session.state,
            tools,
        })

        // Filter and construct piece tools
        const pieceTools = (tools ?? []).filter((t): t is AgentPieceTool => t.type === AgentToolType.PIECE)
        const constructedPieceTools = pieceTools.length > 0
            ? await pieceToolExecutor(log).makeTools({
                tools: pieceTools,
                engineToken,
                platformId,
                projectId,
                modelId,
            })
            : {}

        // Filter and construct MCP tools
        const mcpTools = (tools ?? []).filter((t): t is AgentMcpTool => t.type === AgentToolType.MCP)
        const { tools: constructedMcpTools, mcpClients } = mcpTools.length > 0
            ? await createMcpTools(mcpTools)
            : { tools: {}, mcpClients: [] as MCPClient[] }

        try {
            const { fullStream } = streamText({
                model,
                system: systemPrompt,
                stopWhen: [stepCountIs(25)],
                messages: convertHistory(conversation ?? []),
                tools: {
                    ...builtInTools,
                    ...constructedPieceTools,
                    ...constructedMcpTools,
                } as ToolSet,
            })
            let newSession: AgentSession = data.session

            let previousText = ''
            for await (const chunk of fullStream) {
                let quickStreamingUpdate: AgentStreamingUpdateProgressData | undefined
                switch (chunk.type) {
                    case 'text-start': {
                        previousText = ''
                        quickStreamingUpdate = publishTextUpdate(requestId, '', true)
                        break
                    }
                    case 'text-delta': {
                        previousText += chunk.text
                        quickStreamingUpdate = publishTextUpdate(requestId, previousText, true)
                        break
                    }
                    case 'text-end': {
                        quickStreamingUpdate = publishTextUpdate(requestId, previousText, false)
                        break
                    }
                    case 'tool-input-start': {
                        previousText = ''
                        quickStreamingUpdate = publishToolCallUpdate(requestId, chunk.id, chunk.toolName, undefined, 'loading')
                        break
                    }
                    case 'tool-call': {
                        previousText = ''
                        quickStreamingUpdate = publishToolCallUpdate(requestId, chunk.toolCallId, chunk.toolName, chunk.input as Record<string, any>, 'ready')
                        break
                    }
                    case 'tool-error': {
                        previousText = ''
                        const errorMessage = chunk.error instanceof Error ? chunk.error.message : String(chunk.error)
                        quickStreamingUpdate = publishToolCallUpdate(requestId, chunk.toolCallId, chunk.toolName, chunk.input as Record<string, any>, 'error', errorMessage)
                        break
                    }
                    case 'tool-result': {
                        previousText = ''
                        quickStreamingUpdate = publishToolCallUpdate(requestId, chunk.toolCallId, chunk.toolName, undefined, 'completed', undefined, chunk.output as Record<string, any>)
                        // First mark the tool call as completed
                        const toolCompletedUpdate = publishToolCallUpdate(requestId, chunk.toolCallId, chunk.toolName, undefined, 'completed')
                        newSession = { ...newSession, conversation: genericAgentUtils.streamChunk(newSession.conversation ?? [], toolCompletedUpdate) }
                        await this.emitProgress(requestId, {
                            event: AgentStreamingEvent.AGENT_STREAMING_UPDATE,
                            data: toolCompletedUpdate,
                        })
                        // Then publish the tool result
                        quickStreamingUpdate = publishToolResultUpdate(requestId, chunk.toolCallId, chunk.toolName, chunk.output as Record<string, any>)
                        break
                    }
                    default: {
                        break
                    }
                }

                if (!isNil(quickStreamingUpdate)) {
                    newSession = { ...newSession, conversation: genericAgentUtils.streamChunk(newSession.conversation ?? [], quickStreamingUpdate) }
                    await this.emitProgress(requestId, {
                        event: AgentStreamingEvent.AGENT_STREAMING_UPDATE,
                        data: quickStreamingUpdate,
                    })
                }
            }
   
            await this.emitProgress(requestId, {
                event: AgentStreamingEvent.AGENT_STREAMING_ENDED,
            })
        }
        finally {
            // Cleanup MCP clients
            await Promise.all(mcpClients.map(client => client.close().catch(() => {
                // Ignore close errors
            })))
        }
    },
    emitProgress: async (requestId: string, update: AgentStreamingUpdate) => {
        await pubsub.publish(`agent-response:${requestId}`, JSON.stringify(update))
    }
})

function publishToolCallUpdate(requestId: string, toolcallId: string, toolName: string, input: Record<string, any> | undefined, status: 'loading' | 'ready' | 'completed' | 'error', error?: string, output?: Record<string, any>) {
    const quickStreamingUpdate: AgentStreamingUpdateProgressData = {
        sessionId: requestId,
        part: {
            type: 'tool-call',
            toolCallId: toolcallId,
            toolName,
            input,
            output,
            status,
        },
    }
    return quickStreamingUpdate
}

function publishToolResultUpdate(requestId: string, toolcallId: string, toolName: string, output: Record<string, any>) {
    const quickStreamingUpdate: AgentStreamingUpdateProgressData = {
        sessionId: requestId, 
        part: {
            type: 'tool-call',
            toolCallId: toolcallId,
            toolName,
            output,
            status: 'completed',
        },
    }
    return quickStreamingUpdate
}

function publishTextUpdate(requestId: string, text: string, isStreaming: boolean) {
    const quickStreamingUpdate: AgentStreamingUpdateProgressData = {
        sessionId: requestId,// should be session id not request id
        part: {
            type: 'text',
            message: text,
            isStreaming,
        },
    }
    return quickStreamingUpdate
}

function convertHistory(conversation: ConversationMessage[]): ModelMessage[] {
    const result: ModelMessage[] = []

    for (const message of conversation) {
        if (message.role === 'user') {
            const userContent = message.content.map(part => {
                switch (part.type) {
                    case 'text':
                        return {
                            type: 'text' as const,
                            text: part.message,
                        }
                    case 'image':
                        return {
                            type: 'image' as const,
                            image: part.image,
                        }
                    case 'file':
                        return {
                            type: 'file' as const,
                            file: part.file,
                            name: part.name,
                            mimeType: part.mimeType,
                        }
                    default:
                        return undefined
                }
            }).filter(f => !isNil(f))

            if (userContent.length > 0) {
                result.push({
                    role: 'user',
                    content: userContent,
                } as ModelMessage)
            }
        }
        else {
            // Process assistant message parts
            const assistantContent = []
            const toolResults: ModelMessage[] = []

            for (const item of message.parts) {
                switch (item.type) {
                    case 'text':
                        if (item.message && item.message.trim().length > 0) {
                            assistantContent.push({
                                type: 'text',
                                text: item.message,
                            })
                        }
                        break
                    case 'tool-call':
                        if (item.status === 'completed' || item.status === 'ready') {
                            assistantContent.push({
                                type: 'tool-call',
                                toolCallId: item.toolCallId,
                                toolName: item.toolName,
                                args: item.input ?? {},
                            })
                            toolResults.push({
                                role: 'tool',
                                content: [{
                                    type: 'tool-result',
                                    toolCallId: item.toolCallId,
                                    toolName: item.toolName,
                                    output: item.output as LanguageModelV2ToolResultOutput,
                                }],
                            })
                        }
                        break
                }
            }

            // Add assistant message if it has any content
            if (assistantContent.length > 0) {
                result.push({
                    role: 'assistant',
                    content: assistantContent,
                } as ModelMessage)
            }

            // Add tool results after the assistant message
            result.push(...toolResults)
        }
    }

    return result
}
