import { AIProviderName, ErrorCode, isNil, isObject, spreadIfDefined, tryCatch, tryCatchSync } from '@activepieces/core-utils'
import { chatAiUtils } from '@activepieces/server-utils'
import { ChatAgentEvent, ChatAgentEventType, ChatPhase, EngineResponseStatus, ExecuteChatAgentJobData, PersistedChatMessage, PersistedChatRole, WorkerJobType } from '@activepieces/shared'
import { createUIMessageStream, generateText, ModelMessage, streamText, ToolSet } from 'ai'
import { FireAndForgetJobResult, JobContext, JobHandler, JobResultKind } from '../../../types'
import { chatMcpClient } from './chat-mcp-client'
import { chatWorkerTools } from './chat-worker-tools'
import { delayWithJitter, runChatTurn } from './run-chat-turn'

const BATCH_SIZE = 10
const BATCH_FLUSH_MS = 50
const APPROVAL_TIMEOUT_MS = 5 * 60 * 1_000
const APPROVAL_BLOCK_MS = 50_000
const DISPLAY_TOOL_TIMEOUT_MS = 15 * 60 * 1_000
const HEARTBEAT_INTERVAL_MS = 15_000
const RETRY_MAX_ATTEMPTS = 3
const RETRY_BASE_DELAY_MS = 1_000
// A turn is wedged if the model stream goes quiet for this long with NO tool call in
// flight. Tool execution and approval waits legitimately block the stream for minutes,
// so the watchdog is suspended while a tool is pending (see streamChunksToClient) — this
// timeout only bites a true stall (e.g. a stalled upstream LLM stream that never closes).
const STREAM_IDLE_TIMEOUT_MS = 90_000
// Absolute ceiling on a single turn. Backstop for pathological cases the idle watchdog
// can't see (runaway continuations, watchdog mis-detection). Must exceed the longest
// legitimate single wait — the approval/display-tool timeout is 15m — so set well above it.
const MAX_TURN_WALL_CLOCK_MS = 20 * 60 * 1_000
// The single side-effecting piece-execution tool, neutralized under discovery-only eval runs.
const DISCOVERY_ONLY_NEUTRALIZED_TOOL = 'ap_execute_action'

export const executeChatAgentJob: JobHandler<ExecuteChatAgentJobData, FireAndForgetJobResult> = {
    jobType: WorkerJobType.EXECUTE_CHAT_AGENT,
    async execute(ctx: JobContext, data: ExecuteChatAgentJobData): Promise<FireAndForgetJobResult> {
        const { conversationId, runId, projectId, platformId, userId, userMessage, modelName, files, mentions, promptOverride, activeContext, dryRun, discoveryOnly } = data
        const log = ctx.log.child({ conversation: { id: conversationId }, ...spreadIfDefined('run', isNil(runId) ? undefined : { id: runId }) })

        const config = await ctx.apiClient.getChatConfig({
            conversationId, runId, platformId, userId, userMessage, modelName, files,
            ...spreadIfDefined('mentions', mentions),
            ...spreadIfDefined('promptOverride', promptOverride),
            ...spreadIfDefined('activeContext', activeContext),
            ...spreadIfDefined('dryRun', dryRun),
        })

        const provider = config.provider as AIProviderName
        const aiTools = config.aiTools
        // Tavily takes precedence; native LLM web search is only the no-Tavily fallback.
        const tavilySearchActive = !dryRun && !isNil(aiTools.webSearch)
        const webSearchActive = !dryRun && !tavilySearchActive && chatAiUtils.supportsWebSearch(provider)
        const model = chatAiUtils.createChatModel({
            provider, auth: config.auth, config: config.providerConfig, modelId: config.modelId,
            webSearchEnabled: webSearchActive,
        })
        // Fast model used for round one of the turn (opener + first discovery) — see prepareStep in runChatTurn.
        const fastModel = chatAiUtils.createChatModel({
            provider, auth: config.auth, config: config.providerConfig, modelId: config.fastModelId,
        })

        log.info({ provider, model: { id: config.modelId }, tier: { id: config.tier.id }, dryRun: dryRun ?? false, tavilySearchActive, webSearchActive }, '[executeChatAgent] Chat config loaded')

        const eventEmitter = chatWorkerTools.createEventEmitter({
            sendEvent: (input) => ctx.apiClient.sendChatEvent({ ...input, runId }),
            userId,
            conversationId,
            log,
        })

        // dryRun (playground): skip MCP and don't execute tools, so the run has no side effects.
        const { mcpClient, mcpToolSet } = dryRun
            ? { mcpClient: null, mcpToolSet: {} }
            : await chatMcpClient.connect({ mcpCredentials: config.mcpCredentials, conversationId, log })

        const sendEventWithRetry = ({ event }: { event: ChatAgentEvent }) =>
            retryWithBackoff({
                fn: () => ctx.apiClient.sendChatEvent({ userId, conversationId, runId, event }),
                log,
            })

        const abortController = new AbortController()

        // Flow/table ids the agent has locked this turn so any open Stage shows a calm
        // "Chat is working on this" state. Renewed on each heartbeat (60s TTL would else
        // drop mid-build) and released in finally (covers completion, abort, and error).
        const lockedResources = new Set<string>()

        // Absolute backstop: guarantees the turn tears down even if every finer-grained
        // signal misses. Routes through the same abortController as user-cancel and the
        // idle watchdog, so it lands in the existing cancel-save branch (status → IDLE).
        const turnWallClockTimer = setTimeout(() => {
            log.error({ conversation: { id: conversationId }, maxTurnMs: MAX_TURN_WALL_CLOCK_MS }, 'Chat turn exceeded max wall-clock — aborting')
            abortController.abort()
        }, MAX_TURN_WALL_CLOCK_MS)

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

        // Continuous liveness signal for the entire turn — covers long tool/LLM steps and
        // approval waits alike, not just gaps between AI-SDK steps. Refreshes connected
        // clients' last-chunk clock (empty keepalive chunk) AND the server-side `updated`
        // timestamp, so a slow-but-live turn is never reclaimed as stale by either the
        // client stale-check or the server's getConversationOrThrow stale-recovery.
        const sendHeartbeat = () => {
            void tryCatch(() => ctx.apiClient.sendChatEvent({
                userId, conversationId, runId,
                event: { type: ChatAgentEventType.CHUNK, data: [] },
            }))
            void tryCatch(() => ctx.apiClient.heartbeatChatConversation({ conversationId, runId }))
            for (const resourceId of lockedResources) {
                void tryCatch(() => ctx.apiClient.executeChatTool({
                    toolName: '__lock_resource', toolInput: { resourceId, conversationId, reason: 'Chat is working on this' }, platformId, userId, conversationId,
                }))
            }
        }
        const heartbeatInterval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS)

        try {
            const phaseState: { phase: ChatPhase } = { phase: 'discovery' }

            const webTools: ToolSet = dryRun ? {} : {
                ...chatWorkerTools.createWebTools(),
                ...(aiTools.webSearch ? chatWorkerTools.createSearchTools({ webSearch: aiTools.webSearch }) : {}),
                ...(webSearchActive ? chatAiUtils.buildWebSearchTools({ provider, auth: config.auth }) : {}),
                ...(aiTools.webScraping ? chatWorkerTools.createScrapeTools({ scraping: aiTools.webScraping }) : {}),
                ...(aiTools.imageGeneration && !discoveryOnly ? chatWorkerTools.createImageTools({
                    imageGeneration: aiTools.imageGeneration,
                    saveFile: ({ data, mediaType, fileName }) => ctx.apiClient.saveChatFile({ platformId, conversationId, data, mediaType, ...spreadIfDefined('projectId', projectId ?? undefined), ...spreadIfDefined('fileName', fileName) }),
                    emitImage: eventEmitter.emitImageGenerated,
                }) : {}),
            }

            const allTools = buildToolSet({
                ctx, eventEmitter, log, phaseState, mcpToolSet, webTools,
                projects: config.projects, projectId, conversationId, platformId, userId,
                guides: config.guides, dryRun: dryRun ?? false, discoveryOnly: discoveryOnly ?? false,
                emailEnabled: config.emailEnabled,
                abortSignal: abortController.signal,
                lockedResources,
            })

            const thinkingStartTime = Date.now()
            const allToolNames = Object.keys(allTools)
            log.info({ toolCount: allToolNames.length, mcpToolCount: Object.keys(mcpToolSet).length, phase: phaseState.phase }, '[executeChatAgent] Tool set assembled')
            log.debug({ toolNames: allToolNames }, '[executeChatAgent] Tool set details')

            const autoTitlePromise = generateTitleIfFirstTurn({
                model, userMessage, previousUiMessages: config.previousUiMessages as unknown[], log, conversationId, abortSignal: abortController.signal,
            })

            const turn = await runChatTurn({
                model,
                fastModel: dryRun ? undefined : fastModel,
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
                    drainStream: (result) => streamChunksToClient({
                        result, ctx, userId, conversationId, runId, log,
                        abortSignal: abortController.signal,
                        onStreamStalled: () => {
                            log.error({ conversation: { id: conversationId }, streamIdleMs: STREAM_IDLE_TIMEOUT_MS }, 'Chat stream stalled with no tool in flight — aborting wedged turn')
                            abortController.abort()
                        },
                    }),
                    onProgress: ({ uiParts, responseMessages }) => {
                        void retryWithBackoff({
                            fn: () => ctx.apiClient.updateChatProgress({
                                conversationId,
                                runId,
                                uiMessages: [
                                    ...(config.previousUiMessages as PersistedChatMessage[]),
                                    { role: PersistedChatRole.ASSISTANT, parts: uiParts, thinkingDurationMs: Date.now() - thinkingStartTime },
                                ],
                                messages: [...(config.allMessages as ModelMessage[]), ...responseMessages],
                            }),
                            maxAttempts: 2,
                            log,
                        })
                    },
                },
            })

            const { uiParts, accumulatedResponseMessages, streamError, truncatedAfterRetries, continuations, usage, totalInputTokens, totalOutputTokens } = turn

            if (abortController.signal.aborted) {
                if (streamError) {
                    log.warn({ error: streamError, conversation: { id: conversationId } }, 'Stream error occurred during abort')
                }
                log.info({ conversation: { id: conversationId }, completedSteps: accumulatedResponseMessages.length }, 'Chat agent cancelled by user')
                const thinkingDurationMs = Date.now() - thinkingStartTime
                const cancelSavePayload = {
                    conversationId,
                    runId,
                    messages: [...(config.allMessages as ModelMessage[]), ...accumulatedResponseMessages],
                    uiMessages: [
                        ...(config.previousUiMessages as PersistedChatMessage[]),
                        ...(uiParts.length > 0 ? [{ role: PersistedChatRole.ASSISTANT, parts: uiParts, thinkingDurationMs }] : []),
                    ],
                }
                const { error: cancelSaveError } = await tryCatch(() => ctx.apiClient.saveChatMessages(cancelSavePayload))
                if (cancelSaveError) {
                    log.warn({ error: cancelSaveError, conversation: { id: conversationId } }, 'Cancel save failed, retrying')
                    await new Promise((resolve) => setTimeout(resolve, 1_000))
                    const { error: retryError } = await tryCatch(() => ctx.apiClient.saveChatMessages(cancelSavePayload))
                    if (retryError) {
                        log.error({ error: retryError, conversation: { id: conversationId } }, 'Cancel save retry also failed')
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
                conversation: { id: conversationId },
                continuations,
                inputTokens: totalInputTokens,
                outputTokens: totalOutputTokens,
                ...spreadIfDefined('cacheReadTokens', usage?.inputTokenDetails?.cacheReadTokens),
                ...spreadIfDefined('cacheWriteTokens', usage?.inputTokenDetails?.cacheWriteTokens),
                provider: config.provider,
                finishReason: turn.finishReason,
                truncatedAfterRetries,
            }, 'Chat message completed')

            const thinkingDurationMs = Date.now() - thinkingStartTime
            const savePayload = {
                conversationId,
                runId,
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
                log.warn({ error: saveError, conversation: { id: conversationId } }, 'First saveChatMessages attempt failed, retrying')
                await new Promise((resolve) => setTimeout(resolve, 1_000))
                const { error: retryError } = await tryCatch(() => ctx.apiClient.saveChatMessages(savePayload))
                if (retryError) {
                    log.error({ error: retryError, conversation: { id: conversationId } }, 'saveChatMessages retry also failed')
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
            log.error({ error: err, conversation: { id: conversationId } }, '[executeChatAgent] Agent job failed')
            const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
            const errorCode = isCreditExhaustedError(errorMessage) ? ErrorCode.AI_CREDIT_LIMIT_EXCEEDED : undefined
            // Empty arrays here mean "mark this turn ERROR" — they do NOT wipe history. The
            // saveChatMessages handler's no-shrink guard preserves whatever was persisted
            // incrementally (updateChatProgress) and only flips status, so an errored turn keeps
            // its prior context instead of resetting the conversation.
            await ctx.apiClient.saveChatMessages({
                conversationId, runId, messages: [], uiMessages: [],
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
            clearTimeout(turnWallClockTimer)
            clearInterval(cancelCheckInterval)
            clearInterval(heartbeatInterval)
            // Release every Stage lock the agent took this turn (completion/abort/error all
            // land here). A worker crash skips this, but the 60s Redis TTL auto-expires it.
            for (const resourceId of lockedResources) {
                await tryCatch(() => ctx.apiClient.executeChatTool({
                    toolName: '__unlock_resource', toolInput: { resourceId, conversationId }, platformId, userId, conversationId,
                }))
            }
            if (mcpClient) {
                await mcpClient.close().catch((closeErr: unknown) => {
                    log.warn({ error: closeErr }, 'Failed to close MCP client')
                })
            }
        }

        return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
    },
}

function buildToolSet({ ctx, eventEmitter, log, phaseState, mcpToolSet, webTools, projects, projectId, conversationId, platformId, userId, guides, dryRun, discoveryOnly, emailEnabled, abortSignal, lockedResources }: {
    ctx: JobContext
    eventEmitter: ReturnType<typeof chatWorkerTools.createEventEmitter>
    log: JobContext['log']
    phaseState: { phase: ChatPhase }
    mcpToolSet: Record<string, unknown>
    webTools: ToolSet
    projects: Array<{ id: string, displayName: string, type: string }>
    projectId: string | null
    conversationId: string
    platformId: string
    userId: string
    guides: Record<string, string>
    dryRun: boolean
    discoveryOnly: boolean
    emailEnabled: boolean
    abortSignal: AbortSignal
    lockedResources: Set<string>
}) {
    const brokenConnectors = new Set<string>()

    const executeCrossProjectTool = async (toolName: string, toolInput: Record<string, unknown>) => {
        if (dryRun) {
            return { preview: true, message: `Tool "${toolName}" was not executed (prompt playground preview).` }
        }
        // Discovery-only eval: real discovery/reads still run, but neutralize the side-effecting
        // execute so we can measure how the agent reaches a runnable call without firing it.
        if (discoveryOnly && toolName === DISCOVERY_ONLY_NEUTRALIZED_TOOL) {
            return { content: [{ type: 'text', text: `🧪 Discovery-only run — ${toolName} was not executed. The agent reached a runnable call.` }] }
        }
        const response = await ctx.apiClient.executeChatTool({ toolName, toolInput, platformId, userId, conversationId })
        return response.result
    }

    const waitForApproval = async ({ gateId, timeoutMs }: { gateId: string, timeoutMs?: number }): Promise<GateDecision> => {
        // Auto-resolve in dry-run (playground) and discovery-only (eval): there's no UI to click
        // approve, so a real wait would stall the entire turn for APPROVAL_TIMEOUT_MS.
        if (dryRun || discoveryOnly) {
            return { approved: true }
        }
        const deadline = Date.now() + (timeoutMs ?? APPROVAL_TIMEOUT_MS)
        while (Date.now() < deadline) {
            // A preempted/cancelled turn must stop waiting immediately instead of
            // holding the gate for up to APPROVAL_TIMEOUT_MS — frees the MCP client
            // and lets the turn tear down promptly.
            if (abortSignal.aborted) {
                return { approved: false }
            }
            const remainingMs = deadline - Date.now()
            if (remainingMs <= 0) break
            const blockMs = Math.min(remainingMs, APPROVAL_BLOCK_MS)
            const { data: response, error } = await tryCatch(() => Promise.race([
                ctx.apiClient.executeChatTool({
                    toolName: '__approval_wait', toolInput: { gateId, timeoutMs: blockMs }, platformId, userId,
                }),
                waitForAbort(abortSignal).then(() => ({ result: 'aborted' as const })),
            ]))
            if (abortSignal.aborted || response?.result === 'aborted') {
                return { approved: false }
            }
            if (error) {
                log.warn({ error, gateId }, 'Approval wait RPC failed, retrying')
                await new Promise((resolve) => setTimeout(resolve, 1_000))
                continue
            }
            if (response.result !== 'pending') {
                const decision = response.result as GateDecision
                return { approved: decision.approved, payload: decision.payload }
            }
        }
        return { approved: false }
    }

    // Restore the conversation's already-chosen project so a continued turn doesn't
    // lose context and re-hit "No project selected"; otherwise default to the user's first
    // project (getChatConfig persists the same default) so the agent never starts project-less.
    const persistedProjectId = !isNil(projectId) && projects.some((p) => p.id === projectId) ? projectId : null
    const projectState: { projectId: string | null } = { projectId: persistedProjectId ?? projects[0]?.id ?? null }
    // Once the user picks a connection for a piece, that pick is authoritative for the rest of
    // the turn — injected as `auth` into piece-introspection tools so the model can't resolve
    // props/dropdowns against a guessed externalId. Keyed by normalized piece name.
    const selectedConnectionByPiece = new Map<string, string>()
    const localTools = chatWorkerTools.createLocalTools({
        onSetProjectContext: async (projectId) => {
            projectState.projectId = projectId
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
        onConnectionSelected: async ({ pieceName, connectionExternalId, label, projectId: connProjectId }) => {
            selectedConnectionByPiece.set(pieceName, connectionExternalId)
            await tryCatch(() => ctx.apiClient.executeChatTool({
                toolName: '__store_selected_connection',
                toolInput: { pieceName, connectionExternalId, label, projectId: connProjectId },
                platformId, userId, conversationId,
            }))
        },
        onConnectorReconnected: (connectorUuid) => brokenConnectors.delete(connectorUuid),
        onGateOpened: storePendingGate,
    })
    const crossProjectTools = chatWorkerTools.createCrossProjectTools({ executeTool: executeCrossProjectTool, eventEmitter, waitForApproval, onGateOpened: storePendingGate, guides })
    const thinkingTools = chatWorkerTools.createThinkingTools()
    const phaseTools = chatWorkerTools.createPhaseTools({ onPhaseChange: (phase) => {
        phaseState.phase = phase
    } })
    const buildPlanTools = chatWorkerTools.createBuildPlanTools({
        eventEmitter,
        getProjectId: () => projectState.projectId,
    })
    const mcpTools = chatWorkerTools.wrapTestFlowGate({
        mcpTools: chatMcpClient.withToolTimeouts({
            mcpToolSet,
            brokenConnectors,
            getSelectedAuth: ({ pieceName }) => selectedConnectionByPiece.get(pieceName),
            saveLargeResult: async ({ json, fileName }) => {
                const { data: saved } = await tryCatch(() => ctx.apiClient.saveChatFile({
                    platformId, conversationId, data: Buffer.from(json, 'utf8'), mediaType: 'application/json',
                    ...spreadIfDefined('projectId', projectState.projectId ?? undefined), fileName,
                }))
                return saved?.fileId ?? null
            },
            onEditResource: async (resourceId) => {
                if (lockedResources.has(resourceId)) {
                    return
                }
                lockedResources.add(resourceId)
                await tryCatch(() => ctx.apiClient.executeChatTool({
                    toolName: '__lock_resource', toolInput: { resourceId, conversationId, reason: 'Chat is working on this' }, platformId, userId, conversationId,
                }))
            },
        }),
        checkFlowWrites: async (flowId) => {
            const response = await ctx.apiClient.executeChatTool({ toolName: '__flow_write_check', toolInput: { flowId }, platformId, userId, conversationId })
            return response.result
        },
        waitForApproval,
        storePendingGate,
        eventEmitter,
        log,
    })
    const emailTools = emailEnabled && !dryRun && !discoveryOnly
        ? chatWorkerTools.createEmailTools({
            sendEmail: ({ to, subject, body }) => ctx.apiClient.sendChatEmail({ conversationId, platformId, userId, to, subject, body }),
            eventEmitter,
        })
        : {}

    return { ...localTools, ...displayTools, ...crossProjectTools, ...webTools, ...thinkingTools, ...phaseTools, ...buildPlanTools, ...emailTools, ...(mcpTools as Record<string, typeof localTools[keyof typeof localTools]>) }
}

async function streamChunksToClient({ result, ctx, userId, conversationId, runId, log, abortSignal, onStreamStalled }: {
    result: ReturnType<typeof streamText>
    ctx: JobContext
    userId: string
    conversationId: string
    runId?: string
    log: JobContext['log']
    abortSignal: AbortSignal
    onStreamStalled: () => void
}): Promise<void> {
    let chunkBuffer: unknown[] = []
    let flushTimer: ReturnType<typeof setTimeout> | null = null

    const flushChunks = async () => {
        if (chunkBuffer.length === 0) return
        const batch = chunkBuffer
        chunkBuffer = []
        log.debug({ chunkCount: batch.length }, 'Flushing chat chunk batch to client')
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
            streamWriter.merge(result.toUIMessageStream({ sendSources: true }))
        },
    })

    // Idle watchdog: a tool call (between its tool-input-available and tool-output-* chunks)
    // legitimately holds the stream silent for minutes, so the watchdog is suspended while
    // any tool is pending and only fires on a genuine wedge — quiet stream, nothing running.
    let pendingToolCalls = 0
    let idleTimer: ReturnType<typeof setTimeout> | null = null
    const armIdleWatchdog = () => {
        if (idleTimer) clearTimeout(idleTimer)
        idleTimer = setTimeout(() => {
            if (pendingToolCalls > 0) {
                armIdleWatchdog()
                return
            }
            onStreamStalled()
        }, STREAM_IDLE_TIMEOUT_MS)
    }

    const reader = uiStream.getReader()
    const abortRace = waitForAbort(abortSignal).then(() => 'aborted' as const)
    armIdleWatchdog()
    try {
        while (true) {
            const next = await Promise.race([reader.read(), abortRace])
            if (next === 'aborted') break
            const { done, value: chunk } = next
            if (done) break
            armIdleWatchdog()
            const chunkType = isObject(chunk) && typeof chunk['type'] === 'string' ? chunk['type'] : undefined
            if (chunkType === 'tool-input-available') {
                pendingToolCalls++
            }
            else if (chunkType === 'tool-output-available' || chunkType === 'tool-output-error' || chunkType === 'tool-output-denied') {
                pendingToolCalls = Math.max(0, pendingToolCalls - 1)
            }
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
                        log.error({ error: err, conversation: { id: conversationId } }, 'Failed to flush chat chunk batch')
                    })
                }, BATCH_FLUSH_MS)
            }
        }
    }
    finally {
        if (idleTimer) clearTimeout(idleTimer)
        // Breaking on abort can leave an outstanding reader.read(); cancel() settles it so
        // releaseLock() doesn't throw "still has outstanding read() calls".
        await tryCatch(() => reader.cancel())
        tryCatchSync(() => reader.releaseLock())
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
        return sanitizeGeneratedTitle(text)
    })

    if (!generatedTitle) {
        log.warn({ conversation: { id: conversationId } }, 'Failed to auto-generate title')
    }
    return generatedTitle ?? undefined
}

function sanitizeGeneratedTitle(rawTitle: string): string {
    return rawTitle
        .replace(/[*_`~#]/g, '')
        .replace(/^["']+|["']+$/g, '')
        .trim()
        .slice(0, 100)
}

const CREDIT_ERROR_PATTERNS = [/credits/i, /\b402\b/, /payment.required/i]

function isCreditExhaustedError(message: string): boolean {
    return CREDIT_ERROR_PATTERNS.some((pattern) => pattern.test(message))
}

function waitForAbort(signal: AbortSignal): Promise<void> {
    if (signal.aborted) {
        return Promise.resolve()
    }
    return new Promise<void>((resolve) => {
        signal.addEventListener('abort', () => resolve(), { once: true })
    })
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
            log?.warn({ error, attempt }, 'All retry attempts exhausted')
            return
        }
        await delayWithJitter(RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1))
    }
}

type GateDecision = {
    approved: boolean
    payload?: Record<string, unknown>
}
