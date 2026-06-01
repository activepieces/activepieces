import { chatAiUtils, ContentPartLike } from '@activepieces/server-utils'
import {
    AIProviderName,
    ChatAgentEventType,
    EngineResponseStatus,
    ErrorCode,
    ExecuteChatAgentJobData,
    isNil,
    PersistedChatMessage,
    PersistedChatPart,
    PersistedChatRole,
    spreadIfDefined,
    tryCatch,
    WorkerJobType,
} from '@activepieces/shared'
import { createUIMessageStream, generateText, ModelMessage, stepCountIs, streamText } from 'ai'
import { FireAndForgetJobResult, JobContext, JobHandler, JobResultKind } from '../../../types'
import { chatMcpClient } from './chat-mcp-client'
import { chatWorkerTools } from './chat-worker-tools'

const MAX_STEPS = 30
const BATCH_SIZE = 10
const BATCH_FLUSH_MS = 50
const APPROVAL_POLL_INTERVAL_MS = 2_000
const APPROVAL_TIMEOUT_MS = 5 * 60 * 1_000
const DISPLAY_TOOL_TIMEOUT_MS = 15 * 60 * 1_000

export const executeChatAgentJob: JobHandler<ExecuteChatAgentJobData, FireAndForgetJobResult> = {
    jobType: WorkerJobType.EXECUTE_CHAT_AGENT,
    async execute(ctx: JobContext, data: ExecuteChatAgentJobData): Promise<FireAndForgetJobResult> {
        const { conversationId, platformId, userId, userMessage, modelName, files } = data
        const log = ctx.log.child({ conversationId })

        const config = await ctx.apiClient.getChatConfig({
            conversationId, platformId, userId, userMessage, modelName, files,
        })

        const provider = config.provider as AIProviderName
        const model = chatAiUtils.createChatModel({
            provider, auth: config.auth, config: config.providerConfig, modelId: config.modelId,
        })

        const writer = chatWorkerTools.createRpcWriterForConversation({
            sendEvent: (input) => ctx.apiClient.sendChatEvent(input),
            userId,
            conversationId,
        })

        const { mcpClient, mcpToolSet } = await chatMcpClient.connect({
            mcpCredentials: config.mcpCredentials, conversationId, log,
        })

        try {
            const planApproved = { approved: false }

            const allTools = buildToolSet({
                ctx, writer, log, planApproved, mcpToolSet,
                projects: config.projects, conversationId, platformId, userId,
            })

            const uiParts: PersistedChatPart[] = []
            const thinkingStartTime = Date.now()

            const result = streamText({
                model,
                system: chatAiUtils.buildSystemPromptWithCaching({ systemPrompt: config.systemPrompt, provider }),
                messages: chatAiUtils.stripThinkingBlocks(config.messages as ModelMessage[], provider),
                tools: allTools,
                providerOptions: chatAiUtils.buildProviderOptions({ provider, tier: config.tier }),
                stopWhen: stepCountIs(MAX_STEPS),
                onStepFinish: ({ content }) => {
                    uiParts.push(...chatAiUtils.buildStepParts({ content: content as ContentPartLike[] }))
                    ctx.apiClient.updateChatProgress({
                        conversationId,
                        uiMessages: [
                            ...(config.previousUiMessages as PersistedChatMessage[]),
                            { role: PersistedChatRole.ASSISTANT, parts: [...uiParts], thinkingDurationMs: Date.now() - thinkingStartTime },
                        ],
                    }).catch((err: unknown) => {
                        log.warn({ err, conversationId }, 'Failed to save chat progress')
                    })
                },
                onError: ({ error }) => {
                    log.error({ err: error, conversationId }, 'Chat streamText error')
                },
            })

            await streamChunksToClient({ result, ctx, userId, conversationId, log })

            const [response, usage, autoTitle] = await Promise.all([
                result.response,
                result.usage,
                generateTitleIfFirstTurn({
                    model, userMessage, previousUiMessages: config.previousUiMessages as unknown[], log, conversationId,
                }),
            ])

            log.info({
                conversationId,
                inputTokens: usage.inputTokens,
                outputTokens: usage.outputTokens,
                ...spreadIfDefined('cacheReadTokens', usage.inputTokenDetails?.cacheReadTokens),
                ...spreadIfDefined('cacheWriteTokens', usage.inputTokenDetails?.cacheWriteTokens),
                provider: config.provider,
            }, 'Chat message completed')

            const thinkingDurationMs = Date.now() - thinkingStartTime
            await ctx.apiClient.saveChatMessages({
                conversationId,
                messages: [...(config.allMessages as ModelMessage[]), ...response.messages],
                uiMessages: [
                    ...(config.previousUiMessages as PersistedChatMessage[]),
                    { role: PersistedChatRole.ASSISTANT, parts: uiParts, thinkingDurationMs },
                ],
                ...spreadIfDefined('title', autoTitle),
                ...spreadIfDefined('modelName', isNil(data.modelName) ? config.tier.id : undefined),
            })

            if (autoTitle) {
                await ctx.apiClient.sendChatEvent({
                    userId, conversationId,
                    event: { type: ChatAgentEventType.CHUNK, data: { type: 'data-session-title', data: { title: autoTitle }, transient: true } },
                })
            }

            await ctx.apiClient.sendChatEvent({
                userId, conversationId,
                event: { type: ChatAgentEventType.FINISHED, data: { conversationId } },
            })
        }
        catch (err) {
            log.error({ err, conversationId }, '[executeChatAgent] Agent job failed')
            const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
            const errorCode = isCreditExhaustedError(errorMessage) ? ErrorCode.AI_CREDIT_LIMIT_EXCEEDED : undefined
            await ctx.apiClient.saveChatMessages({
                conversationId, messages: [], uiMessages: [],
            }).catch(() => {})
            await ctx.apiClient.sendChatEvent({
                userId, conversationId,
                event: { type: ChatAgentEventType.ERROR, data: { message: errorMessage, ...spreadIfDefined('code', errorCode) } },
            }).catch(() => {})
            await ctx.apiClient.sendChatEvent({
                userId, conversationId,
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

function buildToolSet({ ctx, writer, log, planApproved, mcpToolSet, projects, conversationId, platformId, userId }: {
    ctx: JobContext
    writer: ReturnType<typeof chatWorkerTools.createRpcWriterForConversation>
    log: JobContext['log']
    planApproved: { approved: boolean }
    mcpToolSet: Record<string, unknown>
    projects: Array<{ id: string, displayName: string, type: string }>
    conversationId: string
    platformId: string
    userId: string
}) {
    const executeCrossProjectTool = async (toolName: string, toolInput: Record<string, unknown>) => {
        const response = await ctx.apiClient.executeChatTool({ toolName, toolInput, platformId, userId })
        return response.result
    }

    const waitForApproval = async ({ gateId, timeoutMs }: { gateId: string, timeoutMs?: number }): Promise<GateDecision> => {
        const deadline = Date.now() + (timeoutMs ?? APPROVAL_TIMEOUT_MS)
        while (Date.now() < deadline) {
            const response = await ctx.apiClient.executeChatTool({
                toolName: '__approval_check', toolInput: { gateId }, platformId, userId,
            })
            if (response.result !== 'pending') {
                const decision = response.result as GateDecision
                return { approved: decision.approved, payload: decision.payload }
            }
            await new Promise((resolve) => setTimeout(resolve, APPROVAL_POLL_INTERVAL_MS))
        }
        return { approved: false }
    }

    const localTools = chatWorkerTools.createLocalTools({
        onSetProjectContext: async (projectId) => {
            await ctx.apiClient.updateProjectContext({ conversationId, projectId })
        },
        projects,
    })
    const displayTools = chatWorkerTools.createDisplayTools({ writer, waitForApproval, displayToolTimeoutMs: DISPLAY_TOOL_TIMEOUT_MS })
    const planTools = chatWorkerTools.createPlanTools({
        writer,
        onPlanApproved: () => {
            planApproved.approved = true 
        },
        waitForApproval,
    })
    const crossProjectTools = chatWorkerTools.createCrossProjectTools({ executeTool: executeCrossProjectTool })
    const thinkingTools = chatWorkerTools.createThinkingTools()
    const gatedMcpTools = chatMcpClient.withApprovalGates({
        mcpToolSet, writer, log, isApproved: () => planApproved.approved, waitForApproval,
    })

    return { ...localTools, ...displayTools, ...crossProjectTools, ...planTools, ...thinkingTools, ...(gatedMcpTools as Record<string, typeof localTools[keyof typeof localTools]>) }
}

async function streamChunksToClient({ result, ctx, userId, conversationId, log }: {
    result: ReturnType<typeof streamText>
    ctx: JobContext
    userId: string
    conversationId: string
    log: JobContext['log']
}): Promise<void> {
    let chunkBuffer: unknown[] = []
    let flushTimer: ReturnType<typeof setTimeout> | null = null

    const flushChunks = async () => {
        if (chunkBuffer.length === 0) return
        const batch = chunkBuffer
        chunkBuffer = []
        await ctx.apiClient.sendChatEvent({
            userId, conversationId,
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
}

async function generateTitleIfFirstTurn({ model, userMessage, previousUiMessages, log, conversationId }: {
    model: ReturnType<typeof chatAiUtils.createChatModel>
    userMessage: string
    previousUiMessages: unknown[]
    log: JobContext['log']
    conversationId: string
}): Promise<string | undefined> {
    const isFirstTurn = previousUiMessages.length === 1
    if (!isFirstTurn) return undefined

    const { data: generatedTitle } = await tryCatch(async () => {
        const { text } = await generateText({
            model,
            prompt: `Generate a concise 3-6 word title for this conversation. Return ONLY the title, nothing else.\n\nUser: ${userMessage}`,
        })
        return text.replace(/^["']|["']$/g, '').slice(0, 100)
    })

    if (!generatedTitle) {
        log.warn({ conversationId }, 'Failed to auto-generate title')
    }
    return generatedTitle ?? undefined
}

const CREDIT_ERROR_PATTERNS = [/credits/i, /\b402\b/, /payment.required/i]

function isCreditExhaustedError(message: string): boolean {
    return CREDIT_ERROR_PATTERNS.some((pattern) => pattern.test(message))
}

type GateDecision = {
    approved: boolean
    payload?: Record<string, unknown>
}
