import { chatAiUtils } from '@activepieces/server-utils'
import {
    AIProviderName,
    ChatAgentEvent,
    ChatAgentEventType,
    ChatPhase,
    EngineResponseStatus,
    ErrorCode,
    ExecuteChatAgentJobData,
    isNil,
    PersistedChatMessage,
    PersistedChatRole,
    spreadIfDefined,
    tryCatch,
    WorkerJobType,
} from '@activepieces/shared'
import { createUIMessageStream, generateText, ModelMessage, streamText } from 'ai'
import { FireAndForgetJobResult, JobContext, JobHandler, JobResultKind } from '../../../types'
import { chatMcpClient } from './chat-mcp-client'
import { chatWorkerTools } from './chat-worker-tools'
import { runChatTurn } from './run-chat-turn'

export { decideLoopAction, shouldRetryStream } from './run-chat-turn'

const BATCH_SIZE = 10
const BATCH_FLUSH_MS = 50
const APPROVAL_TIMEOUT_MS = 5 * 60 * 1_000
const APPROVAL_BLOCK_MS = 50_000
const DISPLAY_TOOL_TIMEOUT_MS = 15 * 60 * 1_000
const HEARTBEAT_INTERVAL_MS = 15_000
const RETRY_MAX_ATTEMPTS = 3
const RETRY_BASE_DELAY_MS = 1_000

export const executeChatAgentJob: JobHandler<ExecuteChatAgentJobData, FireAndForgetJobResult> = {
    jobType: WorkerJobType.EXECUTE_CHAT_AGENT,
    async execute(ctx: JobContext, data: ExecuteChatAgentJobData): Promise<FireAndForgetJobResult> {
        const { conversationId, runId, platformId, userId, userMessage, modelName, files, promptOverride } = data
        const log = ctx.log.child({ conversationId })

        const config = await ctx.apiClient.getChatConfig({
            conversationId, runId, platformId, userId, userMessage, modelName, files,
            ...spreadIfDefined('promptOverride', promptOverride),
        })

        const provider = config.provider as AIProviderName
        const model = chatAiUtils.createChatModel({
            provider, auth: config.auth, config: config.providerConfig, modelId: config.modelId,
        })

        const eventEmitter = chatWorkerTools.createEventEmitter({
            sendEvent: (input) => ctx.apiClient.sendChatEvent({ ...input, runId }),
            userId,
            conversationId,
            log,
        })

        const { mcpClient, mcpToolSet } = await chatMcpClient.connect({
            mcpCredentials: config.mcpCredentials, conversationId, log,
        })

        const sendEventWithRetry = ({ event }: { event: ChatAgentEvent }) =>
            retryWithBackoff({
                fn: () => ctx.apiClient.sendChatEvent({ userId, conversationId, runId, event }),
                log,
            })

        const abortController = new AbortController()

        const checkCancelled = async () => {
            const { data: response } = await tryCatch(() => ctx.apiClient.executeChatTool({
                toolName: '__cancel_check', toolInput: { conversationId, runId }, platformId, userId,
            }))
            if (response?.result === true) {
                abortController.abort()
            }
        }

        const cancelCheckInterval = setInterval(() => {
            checkCancelled().catch(() => {})
        }, 3_000)

        try {
            const phaseState: { phase: ChatPhase } = { phase: 'discovery' }

            const allTools = buildToolSet({
                ctx, eventEmitter, log, phaseState, mcpToolSet,
                projects: config.projects, conversationId, runId, platformId, userId,
                guides: config.guides,
            })

            const thinkingStartTime = Date.now()
            const allToolNames = Object.keys(allTools)

            const autoTitlePromise = generateTitleIfFirstTurn({
                model, userMessage, previousUiMessages: config.previousUiMessages as unknown[], log, conversationId, abortSignal: abortController.signal,
            })

            const turn = await runChatTurn({
                model,
                provider,
                systemPrompt: config.systemPrompt,
                messages: config.messages as ModelMessage[],
                tools: allTools,
                allToolNames,
                tier: config.tier,
                phaseState,
                abortSignal: abortController.signal,
                log,
                sinks: {
                    drainStream: (result) => streamChunksToClient({ result, ctx, userId, conversationId, runId, log }),
                    onProgress: (parts) => {
                        void retryWithBackoff({
                            fn: () => ctx.apiClient.updateChatProgress({
                                conversationId,
                                uiMessages: [
                                    ...(config.previousUiMessages as PersistedChatMessage[]),
                                    { role: PersistedChatRole.ASSISTANT, parts, thinkingDurationMs: Date.now() - thinkingStartTime },
                                ],
                            }),
                            maxAttempts: 2,
                            log,
                        })
                    },
                },
            })

            const { uiParts, accumulatedResponseMessages, abortedStepMessages, streamError, truncatedAfterRetries, continuations, usage, totalInputTokens, totalOutputTokens } = turn

            if (abortController.signal.aborted) {
                if (streamError) {
                    log.warn({ err: streamError, conversationId }, 'Stream error occurred during abort')
                }
                log.info({ conversationId, completedSteps: abortedStepMessages.length }, 'Chat agent cancelled by user')
                const thinkingDurationMs = Date.now() - thinkingStartTime
                const cancelSavePayload = {
                    conversationId,
                    messages: [...(config.allMessages as ModelMessage[]), ...accumulatedResponseMessages, ...abortedStepMessages],
                    uiMessages: [
                        ...(config.previousUiMessages as PersistedChatMessage[]),
                        ...(uiParts.length > 0 ? [{ role: PersistedChatRole.ASSISTANT, parts: uiParts, thinkingDurationMs }] : []),
                    ],
                }
                const { error: cancelSaveError } = await tryCatch(() => ctx.apiClient.saveChatMessages(cancelSavePayload))
                if (cancelSaveError) {
                    log.warn({ err: cancelSaveError, conversationId }, 'Cancel save failed, retrying')
                    await new Promise((resolve) => setTimeout(resolve, 1_000))
                    const { error: retryError } = await tryCatch(() => ctx.apiClient.saveChatMessages(cancelSavePayload))
                    if (retryError) {
                        log.error({ err: retryError, conversationId }, 'Cancel save retry also failed')
                    }
                }
                await sendEventWithRetry({
                    event: { type: ChatAgentEventType.FINISHED, data: { conversationId } },
                })
                return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
            }

            if (streamError) {
                throw streamError
            }

            const autoTitle = await autoTitlePromise

            log.info({
                conversationId,
                continuations,
                inputTokens: totalInputTokens,
                outputTokens: totalOutputTokens,
                ...spreadIfDefined('cacheReadTokens', usage?.inputTokenDetails?.cacheReadTokens),
                ...spreadIfDefined('cacheWriteTokens', usage?.inputTokenDetails?.cacheWriteTokens),
                provider: config.provider,
            }, 'Chat message completed')

            const thinkingDurationMs = Date.now() - thinkingStartTime
            const savePayload = {
                conversationId,
                messages: [...(config.allMessages as ModelMessage[]), ...accumulatedResponseMessages],
                uiMessages: [
                    ...(config.previousUiMessages as PersistedChatMessage[]),
                    ...(uiParts.length > 0 ? [{ role: PersistedChatRole.ASSISTANT, parts: uiParts, thinkingDurationMs }] : []),
                ],
                ...spreadIfDefined('title', autoTitle),
                ...spreadIfDefined('modelName', isNil(data.modelName) ? config.tier.id : undefined),
            }
            const { error: saveError } = await tryCatch(() => ctx.apiClient.saveChatMessages(savePayload))
            if (saveError) {
                log.warn({ err: saveError, conversationId }, 'First saveChatMessages attempt failed, retrying')
                await new Promise((resolve) => setTimeout(resolve, 1_000))
                const { error: retryError } = await tryCatch(() => ctx.apiClient.saveChatMessages(savePayload))
                if (retryError) {
                    log.error({ err: retryError, conversationId }, 'saveChatMessages retry also failed')
                    throw retryError
                }
            }

            if (autoTitle) {
                await sendEventWithRetry({
                    event: { type: ChatAgentEventType.TITLE_UPDATE, data: { title: autoTitle } },
                })
            }

            if (truncatedAfterRetries) {
                await sendEventWithRetry({
                    event: { type: ChatAgentEventType.ERROR, data: { message: 'The response was cut off because it reached the output limit. Send "continue" to pick up where it left off.' } },
                })
            }

            await sendEventWithRetry({
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
            await sendEventWithRetry({
                event: { type: ChatAgentEventType.ERROR, data: { message: errorMessage, ...spreadIfDefined('code', errorCode) } },
            })
            await sendEventWithRetry({
                event: { type: ChatAgentEventType.FINISHED, data: { conversationId } },
            })
            throw err
        }
        finally {
            clearInterval(cancelCheckInterval)
            if (mcpClient) {
                await mcpClient.close().catch((closeErr: unknown) => {
                    log.warn({ err: closeErr }, 'Failed to close MCP client')
                })
            }
        }

        return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
    },
}

function buildToolSet({ ctx, eventEmitter, log, phaseState, mcpToolSet, projects, conversationId, runId, platformId, userId, guides }: {
    ctx: JobContext
    eventEmitter: ReturnType<typeof chatWorkerTools.createEventEmitter>
    log: JobContext['log']
    phaseState: { phase: ChatPhase }
    mcpToolSet: Record<string, unknown>
    projects: Array<{ id: string, displayName: string, type: string }>
    conversationId: string
    runId?: string
    platformId: string
    userId: string
    guides: Record<string, string>
}) {
    const executeCrossProjectTool = async (toolName: string, toolInput: Record<string, unknown>) => {
        const response = await ctx.apiClient.executeChatTool({ toolName, toolInput, platformId, userId, conversationId })
        return response.result
    }

    const sendHeartbeat = () => {
        void tryCatch(() => ctx.apiClient.sendChatEvent({
            userId, conversationId, runId,
            event: { type: ChatAgentEventType.CHUNK, data: [] },
        }))
    }

    const waitForApproval = async ({ gateId, timeoutMs }: { gateId: string, timeoutMs?: number }): Promise<GateDecision> => {
        const deadline = Date.now() + (timeoutMs ?? APPROVAL_TIMEOUT_MS)
        let lastHeartbeat = Date.now()
        while (Date.now() < deadline) {
            const remainingMs = deadline - Date.now()
            if (remainingMs <= 0) break
            const blockMs = Math.min(remainingMs, APPROVAL_BLOCK_MS)
            const { data: response, error } = await tryCatch(() => ctx.apiClient.executeChatTool({
                toolName: '__approval_wait', toolInput: { gateId, timeoutMs: blockMs }, platformId, userId,
            }))
            if (error) {
                log.warn({ err: error, gateId }, 'Approval wait RPC failed, retrying')
                await new Promise((resolve) => setTimeout(resolve, 1_000))
                continue
            }
            if (response.result !== 'pending') {
                const decision = response.result as GateDecision
                return { approved: decision.approved, payload: decision.payload }
            }
            if (Date.now() - lastHeartbeat >= HEARTBEAT_INTERVAL_MS) {
                lastHeartbeat = Date.now()
                sendHeartbeat()
            }
        }
        return { approved: false }
    }

    const localTools = chatWorkerTools.createLocalTools({
        onSetProjectContext: async (projectId) => {
            await ctx.apiClient.updateProjectContext({ conversationId, projectId })
        },
        projects,
    })
    const storePendingGate = async ({ gateId, toolName: gateTool, displayName, toolInput: gateInput }: {
        gateId: string
        toolName: string
        displayName: string
        toolInput: Record<string, unknown>
    }) => {
        await tryCatch(() => ctx.apiClient.executeChatTool({
            toolName: '__store_pending_gate',
            toolInput: { conversationId, gateId, toolName: gateTool, displayName, toolInput: gateInput },
            platformId, userId, conversationId,
        }))
    }

    const displayTools = chatWorkerTools.createDisplayTools({
        waitForApproval,
        displayToolTimeoutMs: DISPLAY_TOOL_TIMEOUT_MS,
        log,
        onConnectionSelected: async ({ pieceName, connectionExternalId, label, projectId: connProjectId }) => {
            await tryCatch(() => ctx.apiClient.executeChatTool({
                toolName: '__store_selected_connection',
                toolInput: { pieceName, connectionExternalId, label, projectId: connProjectId },
                platformId, userId, conversationId,
            }))
        },
        onGateOpened: storePendingGate,
    })
    const crossProjectTools = chatWorkerTools.createCrossProjectTools({ executeTool: executeCrossProjectTool, eventEmitter, waitForApproval, onGateOpened: storePendingGate, guides })
    const thinkingTools = chatWorkerTools.createThinkingTools()
    const phaseTools = chatWorkerTools.createPhaseTools({ onPhaseChange: (phase) => {
        phaseState.phase = phase
    } })
    const mcpTools = chatWorkerTools.wrapTestFlowGate({
        mcpTools: chatMcpClient.withToolTimeouts({ mcpToolSet }),
        checkFlowWrites: async (flowId) => {
            const response = await ctx.apiClient.executeChatTool({ toolName: '__flow_write_check', toolInput: { flowId }, platformId, userId, conversationId })
            return response.result
        },
        waitForApproval,
        storePendingGate,
        eventEmitter,
        log,
    })

    return { ...localTools, ...displayTools, ...crossProjectTools, ...thinkingTools, ...phaseTools, ...(mcpTools as Record<string, typeof localTools[keyof typeof localTools]>) }
}

async function streamChunksToClient({ result, ctx, userId, conversationId, runId, log }: {
    result: ReturnType<typeof streamText>
    ctx: JobContext
    userId: string
    conversationId: string
    runId?: string
    log: JobContext['log']
}): Promise<void> {
    let chunkBuffer: unknown[] = []
    let flushTimer: ReturnType<typeof setTimeout> | null = null

    const flushChunks = async () => {
        if (chunkBuffer.length === 0) return
        const batch = chunkBuffer
        chunkBuffer = []
        await retryWithBackoff({
            fn: () => ctx.apiClient.sendChatEvent({
                userId, conversationId, runId,
                event: { type: ChatAgentEventType.CHUNK, data: batch },
            }),
            maxAttempts: 2,
            log,
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

async function generateTitleIfFirstTurn({ model, userMessage, previousUiMessages, log, conversationId, abortSignal }: {
    model: ReturnType<typeof chatAiUtils.createChatModel>
    userMessage: string
    previousUiMessages: unknown[]
    log: JobContext['log']
    conversationId: string
    abortSignal?: AbortSignal
}): Promise<string | undefined> {
    // getChatConfig includes the just-saved user message, so length 1 = first turn
    const isFirstTurn = previousUiMessages.length === 1
    if (!isFirstTurn) return undefined

    const { data: generatedTitle } = await tryCatch(async () => {
        const { text } = await generateText({
            model,
            abortSignal,
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

async function retryWithBackoff({ fn, maxAttempts = RETRY_MAX_ATTEMPTS, log }: {
    fn: () => Promise<void>
    maxAttempts?: number
    log?: { warn: (obj: Record<string, unknown>, msg: string) => void }
}): Promise<void> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const { error } = await tryCatch(fn)
        if (!error) return
        if (attempt === maxAttempts) {
            log?.warn({ err: error, attempt }, 'All retry attempts exhausted')
            return
        }
        await delayWithJitter(RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1))
    }
}

function delayWithJitter(baseMs: number): Promise<void> {
    const jitter = Math.random() * 0.5 + 0.75
    return new Promise((resolve) => setTimeout(resolve, baseMs * jitter))
}

type GateDecision = {
    approved: boolean
    payload?: Record<string, unknown>
}
