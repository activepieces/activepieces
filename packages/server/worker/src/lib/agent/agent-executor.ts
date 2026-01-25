import { AgentPieceTool, AgentToolType, ChatSession, ChatSessionUpdate, chatSessionUtils, ConversationMessage, EmitAgentStreamingEndedRequest, ExecuteAgentJobData, isNil, WebsocketClientEvent, WebsocketServerEvent } from '@activepieces/shared'
import { LanguageModelV2ToolResultOutput } from '@ai-sdk/provider'
import { ModelMessage, stepCountIs, streamText } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { appSocket } from '../app-socket'
import { systemPrompt } from './system-prompt'
import { agentUtils } from './utils'
import { pieceToolExecutor } from './tools/piece-tool-executor'





export const agentExecutor = (log: FastifyBaseLogger) => ({
    async execute(data: ExecuteAgentJobData, engineToken: string) {

        const { platformId, projectId } = data
        const { conversation, modelId, tools } = data.session
        let newSession: ChatSession = data.session

        const { fullStream } = streamText({
            model: await agentUtils.getModel(modelId, engineToken),
            system: systemPrompt(),
            stopWhen: [stepCountIs(25)],
            messages: convertHistory(conversation),
            tools: {
                ...(await pieceToolExecutor(log).makeTools({ tools: tools.filter(tool => tool.type === AgentToolType.PIECE) as AgentPieceTool[], engineToken, platformId, projectId, modelId })),
            },
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
                case 'tool-call': {
                    previousText = ''
                    quickStreamingUpdate = publishToolCallUpdate(newSession, chunk.toolCallId, chunk.toolName, chunk.input as Record<string, any>)
                    break
                }
                case 'tool-result': {
                    previousText = ''
                    quickStreamingUpdate = publishToolResultUpdate(newSession, chunk.toolCallId, chunk.toolName, chunk.output as Record<string, any>)
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

function publishToolCallUpdate(session: ChatSession, toolcallId: string, toolName: string, input?: Record<string, any>) {
    const quickStreamingUpdate: ChatSessionUpdate = {
        sessionId: session.id,
        plan: session.plan,
        part: {
            type: 'tool-call',
            toolCallId: toolcallId,
            toolName,
            input,
        },
    }
    return quickStreamingUpdate
}

function publishToolResultUpdate(session: ChatSession, toolcallId: string, toolName: string, output: Record<string, any>) {
    const quickStreamingUpdate: ChatSessionUpdate = {
        sessionId: session.id,
        plan: session.plan,
        part: {
            type: 'tool-result',
            toolCallId: toolcallId,
            toolName,
            output,
        },
    }
    return quickStreamingUpdate
}

function publishTextUpdate(session: ChatSession, text: string, isStreaming: boolean) {
    const quickStreamingUpdate: ChatSessionUpdate = {
        sessionId: session.id,
        plan: session.plan,
        part: {
            type: 'text',
            message: text,
            isStreaming,
        },
    }
    return quickStreamingUpdate
}

function convertHistory(conversation: ConversationMessage[]): ModelMessage[] {
    return conversation.map(message => {
        if (message.role === 'user') {
            return [{
                role: 'user',
                content: message.content.map(part => {
                    switch (part.type) {
                        case 'text':
                            return {
                                type: 'text',
                                text: part.message,
                            }
                        case 'image':
                            return {
                                type: 'image',
                                image: part.image,
                            }
                        case 'file':
                            return {
                                type: 'file',
                                file: part.file,
                                name: part.name,
                                mimeType: part.mimeType,
                            }
                        default:
                            return undefined
                    }
                }),
            }]
        }
        return message.parts.map(item => {
            switch (item.type) {
                case 'tool-result':
                    return {
                        role: 'tool',
                        content: [{
                            type: 'tool-result',
                            toolCallId: item.toolCallId,
                            toolName: item.toolName,
                            result: item.output as LanguageModelV2ToolResultOutput,
                        }],
                    }
                case 'text':
                    return {
                        role: 'assistant',
                        content: item.message,
                    }
                default:
                    return undefined
            }
        })
    }).flat().filter(f => !isNil(f)) as ModelMessage[]
}