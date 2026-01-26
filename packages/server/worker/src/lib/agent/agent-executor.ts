import { ChatSession, ChatSessionUpdate, chatSessionUtils, ConversationMessage, EmitAgentStreamingEndedRequest, ExecuteAgentJobData, isNil, WebsocketClientEvent, WebsocketServerEvent } from '@activepieces/shared'
import { ModelMessage, stepCountIs, streamText, ToolSet } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { appSocket } from '../app-socket'
import { systemPrompt } from './system-prompt'
import { agentUtils } from './utils'
import { createFlowTools } from './tools/flow-maker'
import { LanguageModelV2ToolResultOutput } from '@ai-sdk/provider'

export const agentExecutor = (log: FastifyBaseLogger) => ({
    async execute(data: ExecuteAgentJobData, engineToken: string) {

        const { platformId, projectId } = data
        const { conversation, modelId } = data.session
        let newSession: ChatSession = data.session

        const { fullStream } = streamText({
            model: await agentUtils.getModel(modelId, engineToken),
            system: systemPrompt(),
            stopWhen: [stepCountIs(25)],
            messages: convertHistory(conversation),
            tools: {
                ...(await createFlowTools({ engineToken, projectId, platformId, state: data.session.state })),
            } as ToolSet,
        })
        let previousText = ''
        for await (const chunk of fullStream) {
            let quickStreamingUpdate: ChatSessionUpdate | undefined
            switch (chunk.type) {
                case 'text-start': {
                    previousText = ''
                    quickStreamingUpdate = publishTextUpdate(newSession, '', true)
                    break
                }
                case 'text-delta': {
                    previousText += chunk.text
                    quickStreamingUpdate = publishTextUpdate(newSession, previousText, true)
                    break
                }
                case 'text-end': {
                    quickStreamingUpdate = publishTextUpdate(newSession, previousText, false)
                    break
                }
                case 'tool-input-start': {
                    previousText = ''
                    quickStreamingUpdate = publishToolCallUpdate(newSession, chunk.id, chunk.toolName, undefined, 'loading')
                    break
                }
                case 'tool-call': {
                    previousText = ''
                    quickStreamingUpdate = publishToolCallUpdate(newSession, chunk.toolCallId, chunk.toolName, chunk.input as Record<string, any>, 'ready')
                    break
                }
                case 'tool-error': {
                    previousText = ''
                    const errorMessage = chunk.error instanceof Error ? chunk.error.message : String(chunk.error)
                    quickStreamingUpdate = publishToolCallUpdate(newSession, chunk.toolCallId, chunk.toolName, chunk.input as Record<string, any>, 'error', errorMessage)
                    break
                }
                case 'tool-result': {
                    previousText = ''
                    quickStreamingUpdate = publishToolCallUpdate(newSession, chunk.toolCallId, chunk.toolName, undefined, 'completed', undefined, chunk.output as Record<string, any>)
                    break
                }
                default: {
                    break
                }
            }

            if (!isNil(quickStreamingUpdate)) {
                newSession = chatSessionUtils.streamChunk(newSession, quickStreamingUpdate)
                await appSocket(log).emitWithAck(WebsocketServerEvent.EMIT_AGENT_PROGRESS, {
                    userId: data.session.userId,
                    event: WebsocketClientEvent.AGENT_STREAMING_UPDATE,
                    data: quickStreamingUpdate,
                })
            }
        }
        const chatSessionEnded: EmitAgentStreamingEndedRequest = {
            userId: data.session.userId,
            event: WebsocketClientEvent.AGENT_STREAMING_ENDED,
            data: {
                session: newSession,
            },
        }
        await appSocket(log).emitWithAck(WebsocketServerEvent.EMIT_AGENT_PROGRESS, chatSessionEnded)
    },
})

function publishToolCallUpdate(session: ChatSession, toolcallId: string, toolName: string, input: Record<string, any> | undefined, status: 'loading' | 'ready' | 'completed' | 'error', error?: string, output?: Record<string, any>) {
    const quickStreamingUpdate: ChatSessionUpdate = {
        sessionId: session.id,
        part: {
            type: 'tool-call',
            toolCallId: toolcallId,
            toolName,
            input,
            output,
            status,
            error,
        },
    }
    return quickStreamingUpdate
}

function publishTextUpdate(session: ChatSession, text: string, isStreaming: boolean) {
    const quickStreamingUpdate: ChatSessionUpdate = {
        sessionId: session.id,
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