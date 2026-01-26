import { AgentStreamingEvent, AgentStreamingUpdate, chatSessionUtils, ExecuteAgentJobData, isNil, ConversationMessage, ExecuteAgentData, AgentStreamingUpdateProgressData } from '@activepieces/shared'
import { LanguageModelV2ToolResultOutput } from '@ai-sdk/provider'
import { ModelMessage, stepCountIs, streamText, ToolSet } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { systemPrompt } from './system-prompt'
import { agentUtils } from './utils'
import { createFlowTools } from './tools/flow-maker'
import { pubsubFactory } from '@activepieces/server-shared'
import { workerRedisConnections } from '../utils/worker-redis'

const pubsub = pubsubFactory(workerRedisConnections.create)

export const agentExecutor = (log: FastifyBaseLogger) => ({
    async execute(data: ExecuteAgentJobData, engineToken: string) {

        const { platformId, projectId } = data
        const { requestId, conversation, modelId } = data.session
        let newSession: ExecuteAgentData = data.session satisfies ExecuteAgentData

        const { fullStream } = streamText({
            model: await agentUtils.getModel(modelId, engineToken),
            system: systemPrompt(),
            stopWhen: [stepCountIs(25)],
            messages: conversation ? convertHistory(conversation) : [],
            tools: {
                ...(await createFlowTools({ engineToken, projectId, platformId, state: data.session.state })),
            } as ToolSet,
        })
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
                case 'tool-result': {
                    previousText = ''
                    // First mark the tool call as completed
                    const toolCompletedUpdate = publishToolCallUpdate(requestId, chunk.toolCallId, chunk.toolName, undefined, 'completed')
                    newSession = chatSessionUtils.streamChunk(newSession, toolCompletedUpdate)
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
                newSession = chatSessionUtils.streamChunk(newSession, quickStreamingUpdate)
                await this.emitProgress(requestId, {
                    event: AgentStreamingEvent.AGENT_STREAMING_UPDATE,
                    data: quickStreamingUpdate,
                })
            }
        }
   
        await this.emitProgress(requestId, {
            event: AgentStreamingEvent.AGENT_STREAMING_ENDED,
            data: newSession,
        })
    },
    emitProgress: async (requestId: string, update: AgentStreamingUpdate) => {
        await pubsub.publish(`agent-response:${requestId}`, JSON.stringify(update))
    }
})

function publishToolCallUpdate(requestId: string, toolcallId: string, toolName: string, input: Record<string, any> | undefined, status: 'loading' | 'ready' | 'completed' | 'error') {
    const quickStreamingUpdate: AgentStreamingUpdateProgressData = {
        sessionId: requestId,
        part: {
            type: 'tool-call',
            toolCallId: toolcallId,
            toolName,
            input,
            status,
        },
    }
    return quickStreamingUpdate
}

function publishToolResultUpdate(requestId: string, toolcallId: string, toolName: string, output: Record<string, any>) {
    const quickStreamingUpdate: AgentStreamingUpdateProgressData = {
        sessionId: requestId, // should be session id not request id
        part: {
            type: 'tool-result',
            toolCallId: toolcallId,
            toolName,
            output,
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