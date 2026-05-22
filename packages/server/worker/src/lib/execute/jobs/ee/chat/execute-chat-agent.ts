import { chatAiUtils, ContentPartLike } from '@activepieces/server-utils'
import {
    AIProviderName,
    ChatAgentEventType,
    EngineResponseStatus,
    ExecuteChatAgentJobData,
    isNil,
    PersistedChatMessage,
    PersistedChatPart,
    PersistedChatRole,
    spreadIfDefined,
    WorkerJobType,
} from '@activepieces/shared'
import { createUIMessageStream, ModelMessage, stepCountIs, streamText } from 'ai'
import { FireAndForgetJobResult, JobContext, JobHandler, JobResultKind } from '../../../types'
import { chatMcpClient } from './chat-mcp-client'
import { chatWorkerTools } from './chat-worker-tools'

const MAX_STEPS = 30

export const executeChatAgentJob: JobHandler<ExecuteChatAgentJobData, FireAndForgetJobResult> = {
    jobType: WorkerJobType.EXECUTE_CHAT_AGENT,
    async execute(ctx: JobContext, data: ExecuteChatAgentJobData): Promise<FireAndForgetJobResult> {
        const { conversationId, platformId, userId, userMessage, modelName, files } = data
        const log = ctx.log.child({ conversationId })

        const config = await ctx.apiClient.getChatConfig({
            conversationId, platformId, userId, userMessage, modelName, files,
        })

        const model = chatAiUtils.createChatModel({
            provider: config.provider as AIProviderName,
            auth: config.auth,
            config: config.providerConfig,
            modelId: config.modelId,
        })

        const writer = chatWorkerTools.createRpcWriterForConversation({
            sendEvent: (input) => ctx.apiClient.sendChatEvent(input),
            userId,
            conversationId,
        })

        const { mcpClient, mcpToolSet } = await chatMcpClient.connect({
            mcpCredentials: config.mcpCredentials,
            conversationId,
            log,
        })

        try {
            const planApproved = { approved: false }
            let pendingTitle = ''

            const waitForApproval = async (gateId: string): Promise<boolean> => {
                const POLL_INTERVAL_MS = 2_000
                const MAX_WAIT_MS = 5 * 60 * 1_000
                const deadline = Date.now() + MAX_WAIT_MS
                while (Date.now() < deadline) {
                    const response = await ctx.apiClient.executeChatTool({
                        toolName: '__approval_check',
                        toolInput: { gateId },
                        platformId,
                        userId,
                    })
                    if (response.result !== 'pending') {
                        return response.result === true
                    }
                    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
                }
                return false
            }

            const onSetProjectContext = async (projectId: string | null) => {
                await ctx.apiClient.updateProjectContext({ conversationId, projectId })
            }

            const displayTools = chatWorkerTools.createDisplayTools({ writer })
            const localTools = chatWorkerTools.createLocalTools({
                writer,
                onSessionTitle: (title) => {
                    pendingTitle = title
                },
                onSetProjectContext,
                projects: config.projects,
            })
            const planTools = chatWorkerTools.createPlanTools({
                writer,
                onPlanApproved: () => {
                    planApproved.approved = true
                },
                waitForApproval,
            })
            const crossProjectTools = chatWorkerTools.createCrossProjectTools({
                executeTool: async (toolName, toolInput) => {
                    const response = await ctx.apiClient.executeChatTool({
                        toolName,
                        toolInput,
                        platformId,
                        userId,
                    })
                    return response.result
                },
            })
            const gatedMcpTools = chatMcpClient.withApprovalGates({
                mcpToolSet, writer, log, isApproved: () => planApproved.approved, waitForApproval,
            })
            const allTools = { ...localTools, ...displayTools, ...crossProjectTools, ...planTools, ...(gatedMcpTools as Record<string, typeof localTools[keyof typeof localTools]>) }

            const sanitizedMessages = chatAiUtils.stripThinkingBlocks(config.messages as ModelMessage[], config.provider as AIProviderName)
            const systemPrompt = chatAiUtils.buildSystemPromptWithCaching({
                systemPrompt: config.systemPrompt,
                provider: config.provider as AIProviderName,
            })
            const providerOptions = chatAiUtils.buildProviderOptions({
                provider: config.provider as AIProviderName,
                tier: config.tier,
            })

            const uiParts: PersistedChatPart[] = []

            const result = streamText({
                model,
                system: systemPrompt,
                messages: sanitizedMessages,
                tools: allTools,
                providerOptions,
                stopWhen: stepCountIs(MAX_STEPS),
                onStepFinish: ({ content }) => {
                    const contentParts = content as ContentPartLike[]
                    uiParts.push(...chatAiUtils.buildStepParts({ content: contentParts }))
                    const titleCall = contentParts.find((p) => p.type === 'tool-call' && p.toolName === 'ap_set_session_title')
                    if (titleCall) {
                        const titleInput = (titleCall.args ?? titleCall.input) as Record<string, unknown> | undefined
                        if (titleInput && typeof titleInput['title'] === 'string') {
                            pendingTitle = titleInput['title']
                        }
                    }
                    const progressUiMessages: PersistedChatMessage[] = [
                        ...(config.previousUiMessages as PersistedChatMessage[]),
                        { role: PersistedChatRole.ASSISTANT, parts: [...uiParts] },
                    ]
                    ctx.apiClient.updateChatProgress({
                        conversationId,
                        uiMessages: progressUiMessages,
                    }).catch((err: unknown) => {
                        log.warn({ err, conversationId }, 'Failed to save chat progress')
                    })
                },
                onError: ({ error }) => {
                    log.error({ err: error, conversationId }, 'Chat streamText error')
                },
            })

            const BATCH_SIZE = 10
            const BATCH_FLUSH_MS = 50
            let chunkBuffer: unknown[] = []
            let flushTimer: ReturnType<typeof setTimeout> | null = null

            const flushChunks = async () => {
                if (chunkBuffer.length === 0) return
                const batch = chunkBuffer
                chunkBuffer = []
                await ctx.apiClient.sendChatEvent({
                    userId,
                    conversationId,
                    event: { type: ChatAgentEventType.CHUNK, data: batch },
                })
            }

            const uiStream = createUIMessageStream({
                execute: ({ writer: streamWriter }) => {
                    streamWriter.merge(result.toUIMessageStream())
                },
            })

            const reader = uiStream.getReader()
            try {
                while (true) {
                    const { done, value: chunk } = await reader.read()
                    if (done) break
                    chunkBuffer.push(chunk)
                    if (chunkBuffer.length >= BATCH_SIZE) {
                        if (flushTimer) {
                            clearTimeout(flushTimer)
                            flushTimer = null
                        }
                        await flushChunks()
                    }
                    else if (!flushTimer) {
                        flushTimer = setTimeout(() => {
                            flushTimer = null
                            flushChunks().catch((err: unknown) => {
                                log.error({ err, conversationId }, 'Failed to flush chat chunk batch')
                            })
                        }, BATCH_FLUSH_MS)
                    }
                }
            }
            finally {
                reader.releaseLock()
            }
            if (flushTimer) clearTimeout(flushTimer)
            await flushChunks()

            const response = await result.response
            const usage = await result.usage

            const updatedMessages = [...(config.allMessages as ModelMessage[]), ...response.messages]
            const updatedUiMessages: PersistedChatMessage[] = [
                ...(config.previousUiMessages as PersistedChatMessage[]),
                { role: PersistedChatRole.ASSISTANT, parts: uiParts },
            ]

            log.info({
                conversationId,
                inputTokens: usage.inputTokens,
                outputTokens: usage.outputTokens,
                ...spreadIfDefined('cacheReadTokens', usage.inputTokenDetails?.cacheReadTokens),
                ...spreadIfDefined('cacheWriteTokens', usage.inputTokenDetails?.cacheWriteTokens),
                provider: config.provider,
            }, 'Chat message completed')

            await ctx.apiClient.saveChatMessages({
                conversationId,
                messages: updatedMessages,
                uiMessages: updatedUiMessages,
                ...(pendingTitle ? { title: pendingTitle } : {}),
                ...spreadIfDefined('modelName', isNil(data.modelName) ? config.tier.id : undefined),
            })

            await ctx.apiClient.sendChatEvent({
                userId,
                conversationId,
                event: { type: ChatAgentEventType.FINISHED, data: { conversationId } },
            })
        }
        catch (err) {
            log.error({ err, conversationId }, '[executeChatAgent] Agent job failed')
            const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
            await ctx.apiClient.saveChatMessages({
                conversationId,
                messages: [],
                uiMessages: [],
            }).catch(() => {})
            await ctx.apiClient.sendChatEvent({
                userId,
                conversationId,
                event: { type: ChatAgentEventType.ERROR, data: { message: errorMessage } },
            }).catch(() => {})
            await ctx.apiClient.sendChatEvent({
                userId,
                conversationId,
                event: { type: ChatAgentEventType.FINISHED, data: { conversationId } },
            }).catch(() => {})
            throw err
        }
        finally {
            if (mcpClient) {
                await mcpClient.close().catch((closeErr: unknown) => {
                    log.warn({ err: closeErr }, 'Failed to close MCP client')
                })
            }
        }

        return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
    },
}
