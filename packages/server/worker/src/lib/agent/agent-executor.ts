import { AgentTool, AgentToolType, BATCH_SCRAPE_TOOL, CANCEL_TOOL, ChatSession, ChatSessionUpdate, chatSessionUtils, ConversationMessage, CRAWL_TOOL, EmitAgentStreamingEndedRequest, EXECUTE_TOOL, ExecuteAgentJobData, EXTRACT_TOOL, isNil, MAP_TOOL, POLL_TOOL, SCRAPE_TOOL, SEARCH_TOOL, STATUS_TOOL, WebsocketClientEvent, WebsocketServerEvent } from '@activepieces/shared'
import { LanguageModelV2ToolResultOutput } from '@ai-sdk/provider'
import { ModelMessage, stepCountIs, streamText } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { appSocket } from '../app-socket'
import { createPlanningTool, WRITE_TODOS_TOOL_NAME } from './tools/planning-tool'
import { systemPrompt } from './system-prompt'
import { agentUtils } from './utils'
import { createExecuteCodeTool } from './execute-code'
import { workerMachine } from '../utils/machine'


async function getFirecrawlTools(tools: AgentTool[]): Promise<Record<string, unknown>> {
    const firecrawlAisdk = await import('firecrawl-aisdk')
    const firecrawlTool = tools.find(tool => tool.type === AgentToolType.SEARCH)

    return !isNil(firecrawlTool) ? {
        [SCRAPE_TOOL]: firecrawlAisdk.scrapeTool,
        [SEARCH_TOOL]: firecrawlAisdk.searchTool,
        [MAP_TOOL]: firecrawlAisdk.mapTool,
        [CRAWL_TOOL]: firecrawlAisdk.crawlTool,
        [BATCH_SCRAPE_TOOL]: firecrawlAisdk.batchScrapeTool,
        [EXTRACT_TOOL]: firecrawlAisdk.extractTool,
        [POLL_TOOL]: firecrawlAisdk.pollTool,
        [STATUS_TOOL]: firecrawlAisdk.statusTool,
        [CANCEL_TOOL]: firecrawlAisdk.cancelTool,
    } : {}
}

async function getExecuteCodeTool(tools: AgentTool[]): Promise<Record<string, unknown>> {
    const e2bApiKey = workerMachine.getSettings().E2B_API_KEY!
    const executeCodeTool = tools.find(tool => tool.type === AgentToolType.EXECUTE_CODE)

    return !isNil(executeCodeTool) ? { 
        [EXECUTE_TOOL]: await createExecuteCodeTool(e2bApiKey) 
    } : {}
}


export const agentExecutor = (log: FastifyBaseLogger) => ({
    async execute(data: ExecuteAgentJobData, engineToken: string) {

        const { conversation, modelId, tools  } = data.session
        let newSession: ChatSession = data.session
        const planningState: Pick<ChatSession, 'plan'> = { plan: data.session.plan }

        const { fullStream } = streamText({
            model: await agentUtils.getModel(modelId, engineToken),
            system: systemPrompt(),
            stopWhen: [stepCountIs(25)],
            messages: convertHistory(conversation),
            tools: {
                ...(await getFirecrawlTools(tools)),
                ...(await getExecuteCodeTool(tools)),
                [WRITE_TODOS_TOOL_NAME]: createPlanningTool(planningState),
                
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
                    if (chunk.toolName === WRITE_TODOS_TOOL_NAME) {
                        newSession = { ...newSession, plan: planningState.plan }
                    }
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