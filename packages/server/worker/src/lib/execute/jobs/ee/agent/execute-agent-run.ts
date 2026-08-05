import { AIProviderName, ErrorCode, isNil, isObject, omit, spreadIfDefined, tryCatch, tryCatchSync } from '@activepieces/core-utils'
import { agentAiUtils } from '@activepieces/server-utils'
import { AgentEvent, AgentEventType, AgentPhase, AgentRunSource, EngineResponseStatus, ExecuteAgentRunJobData, PersistedAgentMessage, PersistedAgentPart, PersistedAgentPartType, PersistedAgentRole, WorkerJobType } from '@activepieces/shared'
import { createUIMessageStream, generateText, ModelMessage, streamText, ToolSet, toUIMessageStream } from 'ai'
import { FireAndForgetJobResult, JobContext, JobHandler, JobResultKind } from '../../../types'
import { agentMcpClient } from './agent-mcp-client'
import { agentWorkerTools, GateDecision, TaintState } from './agent-worker-tools'
import { delayWithJitter, isTransientFailureText, runAgentTurn } from './run-agent-turn'

const BATCH_SIZE = 10
const BATCH_FLUSH_MS = 50
const APPROVAL_TIMEOUT_MS = 5 * 60 * 1_000
const APPROVAL_BLOCK_MS = 50_000
const DISPLAY_TOOL_TIMEOUT_MS = 5 * 60 * 1_000
const HEARTBEAT_INTERVAL_MS = 15_000
const RETRY_MAX_ATTEMPTS = 3
const RETRY_BASE_DELAY_MS = 1_000
// A turn quiet this long with NO tool call and NO reasoning block in flight is REPORTED as idle —
// a monitoring signal for the console. It never aborts the turn (see streamChunksToClient): tool/
// approval waits and extended thinking legitimately hold the stream silent, so those suspend it,
// and genuine unexplained silence is logged once while the turn keeps running.
const STREAM_IDLE_REPORT_MS = 90_000
// Absolute ceiling on a single turn — the only hard stop besides user-cancel, and the backstop
// that reclaims a worker slot if a turn truly wedges (an upstream stream that stays open but silent
// forever). The idle watchdog only REPORTS, never aborts, so a live turn is never killed for being
// quiet — extended thinking and tool waits run as long as they need. Liveness is kept by the 15s
// heartbeat (client + DB `updated`) and the worker's 30s BullMQ lock extension; set generously,
// well beyond any real chat turn, since its sole job is rescuing a stuck turn that lock-renewal
// would otherwise pin to a slot forever.
const MAX_TURN_WALL_CLOCK_MS = 2 * 60 * 60 * 1_000
// Discovery-only eval must not touch the environment: neutralize every side-effecting execute
// tool (raw action runs AND sandboxed code), not just ap_execute_action — otherwise a non-live
// `agent-evals` run could still execute ap_run_code against the developer's project.
const DISCOVERY_ONLY_NEUTRALIZED_TOOLS = new Set(['ap_execute_action', 'ap_run_code'])

const UNATTENDED_FORBIDDEN_TOOLS = ['ap_run_code']
const MAX_ANSWER_LENGTH = 51_200
const DELIVERY_MAX_ATTEMPTS = 5

export const executeAgentRunJob: JobHandler<ExecuteAgentRunJobData, FireAndForgetJobResult> = {
    jobType: WorkerJobType.EXECUTE_AGENT_RUN,
    async execute(ctx: JobContext, data: ExecuteAgentRunJobData): Promise<FireAndForgetJobResult> {
        const { conversationId, runId, projectId, platformId, userId, userMessage, modelName, files, promptOverride, dryRun, discoveryOnly, source: jobSource, flowRunId, waitpointId } = data
        const log = ctx.log.child({ conversation: { id: conversationId }, ...spreadIfDefined('run', isNil(runId) ? undefined : { id: runId }) })

        const config = await ctx.apiClient.getAgentConfig({
            conversationId, runId, platformId, userId, userMessage, modelName, files,
            ...spreadIfDefined('source', jobSource),
            ...spreadIfDefined('projectId', projectId),
            ...spreadIfDefined('promptOverride', promptOverride),
            ...spreadIfDefined('dryRun', dryRun),
        })

        const provider = config.provider as AIProviderName
        const source = config.source
        const aiTools = config.aiTools
        // Tavily takes precedence; native LLM web search is only the no-Tavily fallback.
        const tavilySearchActive = !dryRun && !isNil(aiTools.webSearch)
        const webSearchActive = !dryRun && !tavilySearchActive && agentAiUtils.supportsWebSearch(provider)
        const model = agentAiUtils.createChatModel({
            provider, auth: config.auth, config: config.providerConfig, modelId: config.modelId,
            metadata: { platformId, conversationId, runId },
            webSearchEnabled: webSearchActive,
        })
        const fastModel = agentAiUtils.createChatModel({
            provider, auth: config.auth, config: config.providerConfig, modelId: config.fastModelId,
        })

        log.info({ provider, model: { id: config.modelId }, tier: { id: config.tier.id }, dryRun: dryRun ?? false, tavilySearchActive, webSearchActive }, '[executeAgentRun] Chat config loaded')

        const eventEmitter = agentWorkerTools.createEventEmitter({
            sendEvent: (input) => ctx.apiClient.sendAgentEvent({ ...input, runId }),
            userId,
            conversationId,
            log,
        })

        // dryRun (playground): skip MCP and don't execute tools, so the run has no side effects.
        const { mcpClient, mcpToolSet } = dryRun
            ? { mcpClient: null, mcpToolSet: {} }
            : await agentMcpClient.connect({ mcpCredentials: config.mcpCredentials, conversationId, log })

        const sendEventWithRetry = ({ event }: { event: AgentEvent }) =>
            retryWithBackoff({
                fn: () => ctx.apiClient.sendAgentEvent({ userId, conversationId, runId, event }),
                log,
            })

        const abortController = new AbortController()

        // Absolute backstop: guarantees the turn tears down even if every finer-grained
        // signal misses. Routes through the same abortController as user-cancel and the
        // idle watchdog, so it lands in the existing cancel-save branch (status → IDLE).
        const turnWallClockTimer = setTimeout(() => {
            log.error({ conversation: { id: conversationId }, maxTurnMs: MAX_TURN_WALL_CLOCK_MS }, 'Chat turn exceeded max wall-clock — aborting')
            abortController.abort()
        }, MAX_TURN_WALL_CLOCK_MS)

        const checkCancelled = async () => {
            const { data: response } = await tryCatch(() => ctx.apiClient.executeAgentTool({
                toolName: '__cancel_check', toolInput: { conversationId, runId }, platformId, userId, source,
            }))
            if (response?.result === true) {
                abortController.abort()
            }
        }

        const cancelCheckInterval = source === AgentRunSource.CHAT
            ? setInterval(() => {
                checkCancelled().catch(() => {})
            }, 3_000)
            : undefined

        // Continuous liveness signal for the entire turn — covers long tool/LLM steps and
        // approval waits alike, not just gaps between AI-SDK steps. Refreshes connected
        // clients' last-chunk clock (empty keepalive chunk) AND the server-side `updated`
        // timestamp, so a slow-but-live turn is never reclaimed as stale by either the
        // client stale-check or the server's getConversationOrThrow stale-recovery.
        const sendHeartbeat = () => {
            void tryCatch(() => ctx.apiClient.sendAgentEvent({
                userId, conversationId, runId,
                event: { type: AgentEventType.CHUNK, data: [] },
            }))
            void tryCatch(() => ctx.apiClient.heartbeatAgentConversation({ conversationId, runId }))
        }
        const heartbeatInterval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS)
        let answer: StepOutcome | undefined

        try {
            const phaseState: { phase: AgentPhase } = { phase: 'discovery' }
            const taintState: TaintState = { tainted: source === AgentRunSource.FLOW_STEP }

            const webTools: ToolSet = dryRun ? {} : {
                ...agentWorkerTools.createWebTools({ taintState }),
                ...(aiTools.webSearch ? agentWorkerTools.createSearchTools({ webSearch: aiTools.webSearch, taintState }) : {}),
                ...(webSearchActive ? agentAiUtils.buildWebSearchTools({ provider, auth: config.auth }) : {}),
                ...(aiTools.webScraping ? agentWorkerTools.createScrapeTools({ scraping: aiTools.webScraping, taintState }) : {}),
                ...(aiTools.imageGeneration && !discoveryOnly ? agentWorkerTools.createImageTools({
                    imageGeneration: aiTools.imageGeneration,
                    saveFile: ({ data, mediaType, fileName }) => ctx.apiClient.saveAgentFile({ platformId, conversationId, data, mediaType, ...spreadIfDefined('projectId', projectId ?? undefined), ...spreadIfDefined('fileName', fileName) }),
                    emitImage: eventEmitter.emitImageGenerated,
                }) : {}),
            }

            const allTools = buildToolSet({
                ctx, eventEmitter, log, phaseState, taintState, mcpToolSet, webTools,
                projects: config.projects, projectId, conversationId, runId, platformId, userId, userEmail: config.userEmail,
                guides: config.guides, dryRun: dryRun ?? false, discoveryOnly: discoveryOnly ?? false,
                emailEnabled: config.emailEnabled,
                abortSignal: abortController.signal,
                source,
            })

            const thinkingStartTime = Date.now()
            const allToolNames = Object.keys(allTools)
            log.info({ toolCount: allToolNames.length, mcpToolCount: Object.keys(mcpToolSet).length, phase: phaseState.phase }, '[executeAgentRun] Tool set assembled')
            log.debug({ toolNames: allToolNames }, '[executeAgentRun] Tool set details')

            const autoTitlePromise = generateTitleIfFirstTurn({
                model, userMessage, previousUiMessages: config.previousUiMessages as unknown[], log, conversationId, abortSignal: abortController.signal,
            })

            const turn = await runAgentTurn({
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
                        onStreamIdle: (reason) => {
                            const fields = { conversation: { id: conversationId }, idleMs: STREAM_IDLE_REPORT_MS, reason }
                            if (reason === 'idle') {
                                log.warn(fields, 'Chat stream idle with nothing in flight — turn continues (monitoring signal)')
                            }
                            else {
                                log.info(fields, 'Chat stream quiet while work is in flight — turn continues (monitoring signal)')
                            }
                        },
                    }),
                    onProgress: ({ uiParts, responseMessages }) => {
                        void retryWithBackoff({
                            fn: () => ctx.apiClient.updateAgentProgress({
                                conversationId,
                                runId,
                                uiMessages: [
                                    ...(config.previousUiMessages as PersistedAgentMessage[]),
                                    { role: PersistedAgentRole.ASSISTANT, parts: uiParts, thinkingDurationMs: Date.now() - thinkingStartTime },
                                ],
                                messages: [...(config.allMessages as ModelMessage[]), ...responseMessages],
                            }),
                            maxAttempts: 2,
                            log,
                        })
                    },
                },
            })

            const { uiParts, accumulatedResponseMessages, streamError, truncatedAfterRetries, budgetExceeded, continuations, usage, totalInputTokens, totalOutputTokens } = turn

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
                        ...(config.previousUiMessages as PersistedAgentMessage[]),
                        ...(uiParts.length > 0 ? [{ role: PersistedAgentRole.ASSISTANT, parts: uiParts, thinkingDurationMs }] : []),
                    ],
                }
                const { error: cancelSaveError } = await tryCatch(() => ctx.apiClient.saveAgentMessages(cancelSavePayload))
                if (cancelSaveError) {
                    log.warn({ error: cancelSaveError, conversation: { id: conversationId } }, 'Cancel save failed, retrying')
                    await new Promise((resolve) => setTimeout(resolve, 1_000))
                    const { error: retryError } = await tryCatch(() => ctx.apiClient.saveAgentMessages(cancelSavePayload))
                    if (retryError) {
                        log.error({ error: retryError, conversation: { id: conversationId } }, 'Cancel save retry also failed')
                    }
                }
                await releaseFlowStep({ ctx, conversationId, flowRunId, waitpointId, output: { success: false, error: 'The agent run was stopped before it finished' }, source, log })
                await sendEventWithRetry({
                    event: { type: AgentEventType.FINISHED, data: { conversationId } },
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
                    ...(config.previousUiMessages as PersistedAgentMessage[]),
                    ...(uiParts.length > 0 ? [{ role: PersistedAgentRole.ASSISTANT, parts: uiParts, thinkingDurationMs }] : []),
                ],
                ...spreadIfDefined('title', autoTitle),
                ...spreadIfDefined('modelName', isNil(data.modelName) ? config.tier.id : undefined),
            }
            await retryWithBackoff({ fn: () => ctx.apiClient.saveAgentMessages(savePayload), description: 'Saving the transcript', throwOnExhausted: true, log })

            answer = stepOutcomeFrom({ uiParts, truncatedAfterRetries, budgetExceeded })

            if (autoTitle) {
                await sendEventWithRetry({
                    event: { type: AgentEventType.TITLE_UPDATE, data: { title: autoTitle } },
                })
            }

            if (truncatedAfterRetries) {
                await sendEventWithRetry({
                    event: { type: AgentEventType.ERROR, data: { message: 'The response was cut off because it reached the output limit. Send "continue" to pick up where it left off.' } },
                })
            }

            if (budgetExceeded) {
                await sendEventWithRetry({
                    event: { type: AgentEventType.ERROR, data: { message: 'This turn reached its usage limit and was stopped to prevent runaway cost. Your progress is saved — send a new message to continue.' } },
                })
            }

            await sendEventWithRetry({
                event: { type: AgentEventType.FINISHED, data: { conversationId } },
            })
        }
        catch (err) {
            log.error({ error: err, conversation: { id: conversationId } }, '[executeAgentRun] Agent job failed')
            const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
            const isCreditError = isCreditExhaustedError(errorMessage)
            const errorCode = isCreditError ? ErrorCode.QUOTA_EXCEEDED : undefined
            const clientMessage = !isCreditError && isTransientFailureText(errorMessage)
                ? 'The AI provider is temporarily unavailable. Please try again in a moment.'
                : errorMessage
            const { error: releaseError } = await tryCatch(() => releaseFlowStep({ ctx, conversationId, flowRunId, waitpointId, output: answer ?? { success: false, error: clientMessage }, source, log }))
            // Empty arrays here mean "mark this turn ERROR" — they do NOT wipe history. The
            // saveAgentMessages handler's no-shrink guard preserves whatever was persisted
            // incrementally (updateAgentProgress) and only flips status, so an errored turn keeps
            // its prior context instead of resetting the conversation.
            await ctx.apiClient.saveAgentMessages({
                conversationId, runId, messages: [], uiMessages: [],
            }).catch(() => {})
            await sendEventWithRetry({
                event: { type: AgentEventType.ERROR, data: { message: clientMessage, ...spreadIfDefined('code', errorCode) } },
            })
            await sendEventWithRetry({
                event: { type: AgentEventType.FINISHED, data: { conversationId } },
            })
            // Running out of AI credits is a user/billing condition, not an engine failure — the error has
            // already been delivered to the user. Complete the job (OK); re-throwing would mark it
            // INTERNAL_ERROR and fail+retry it (pointlessly — the user is still out of credits) and page.
            if (isCreditError) {
                if (isNil(releaseError)) {
                    return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
                }
                throw releaseError
            }
            throw err
        }
        finally {
            clearTimeout(turnWallClockTimer)
            clearInterval(cancelCheckInterval)
            clearInterval(heartbeatInterval)
            if (mcpClient) {
                await mcpClient.close().catch((closeErr: unknown) => {
                    log.warn({ error: closeErr }, 'Failed to close MCP client')
                })
            }
        }

        await releaseFlowStep({ ctx, conversationId, flowRunId, waitpointId, output: answer, source, log })
        return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
    },
}

export function stepOutcomeFrom({ uiParts, truncatedAfterRetries, budgetExceeded }: {
    uiParts: PersistedAgentPart[]
    truncatedAfterRetries: boolean
    budgetExceeded: boolean
}): StepOutcome {
    if (truncatedAfterRetries) {
        return { success: false, error: 'The response reached the output limit before the agent finished' }
    }
    if (budgetExceeded) {
        return { success: false, error: 'The run reached its usage limit and was stopped' }
    }
    return { success: true, output: agentTextFrom(uiParts).slice(0, MAX_ANSWER_LENGTH) }
}

function agentTextFrom(parts: PersistedAgentPart[]): string {
    return parts
        .filter((part) => part.type === PersistedAgentPartType.TEXT)
        .map((part) => part.text)
        .join('\n')
        .trim()
}

async function releaseFlowStep({ ctx, conversationId, flowRunId, waitpointId, output, source, log }: {
    ctx: JobContext
    conversationId: string
    flowRunId?: string
    waitpointId?: string
    output: unknown
    source: AgentRunSource
    log: JobContext['log']
}): Promise<void> {
    if (isNil(flowRunId) || isNil(waitpointId)) {
        if (source === AgentRunSource.FLOW_STEP) {
            log.error({ flowRun: isNil(flowRunId) ? undefined : { id: flowRunId }, waitpoint: isNil(waitpointId) ? undefined : { id: waitpointId } }, '[executeAgentRun] Flow-step run has nothing to release; the flow will stay paused')
        }
        return
    }
    await retryWithBackoff({
        fn: () => ctx.apiClient.resumeFlowStep({ conversationId, flowRunId, waitpointId, output }),
        maxAttempts: DELIVERY_MAX_ATTEMPTS,
        description: 'Handing the result back to the flow',
        throwOnExhausted: true,
        log: log.child({ flowRun: { id: flowRunId }, waitpoint: { id: waitpointId } }),
    })
}


function buildToolSet({ ctx, eventEmitter, log, phaseState, taintState, mcpToolSet, webTools, projects, projectId, conversationId, runId, platformId, userId, userEmail, guides, dryRun, discoveryOnly, emailEnabled, abortSignal, source }: {
    ctx: JobContext
    eventEmitter: ReturnType<typeof agentWorkerTools.createEventEmitter>
    log: JobContext['log']
    phaseState: { phase: AgentPhase }
    taintState: TaintState
    mcpToolSet: Record<string, unknown>
    webTools: ToolSet
    projects: Array<{ id: string, displayName: string, type: string }>
    projectId: string | null
    conversationId: string
    runId?: string
    platformId: string
    userId: string
    userEmail: string
    guides: Record<string, string>
    dryRun: boolean
    discoveryOnly: boolean
    emailEnabled: boolean
    abortSignal: AbortSignal
    source: AgentRunSource
}) {
    const brokenConnectors = new Set<string>()

    const executeCrossProjectTool = async (toolName: string, toolInput: Record<string, unknown>) => {
        if (dryRun) {
            return { preview: true, message: `Tool "${toolName}" was not executed (prompt playground preview).` }
        }
        // Discovery-only eval: real discovery/reads still run, but neutralize the side-effecting
        // execute so we can measure how the agent reaches a runnable call without firing it.
        if (discoveryOnly && DISCOVERY_ONLY_NEUTRALIZED_TOOLS.has(toolName)) {
            return { content: [{ type: 'text', text: `🧪 Discovery-only run — ${toolName} was not executed. The agent reached a runnable call.` }] }
        }
        const response = await ctx.apiClient.executeAgentTool({ toolName, toolInput, platformId, userId, source, conversationId })
        return response.result
    }

    const waitForApproval = async ({ gateId, timeoutMs }: { gateId: string, timeoutMs?: number }): Promise<GateDecision> => {
        if (source !== AgentRunSource.CHAT) {
            return { outcome: 'declined' }
        }
        // Auto-resolve in dry-run (playground) and discovery-only (eval): there's no UI to click
        // approve, so a real wait would stall the entire turn for APPROVAL_TIMEOUT_MS.
        if (dryRun || discoveryOnly) {
            return { outcome: 'approved' }
        }
        const deadline = Date.now() + (timeoutMs ?? APPROVAL_TIMEOUT_MS)
        while (Date.now() < deadline) {
            // A preempted/cancelled turn must stop waiting immediately instead of
            // holding the gate for up to APPROVAL_TIMEOUT_MS — frees the MCP client
            // and lets the turn tear down promptly.
            if (abortSignal.aborted) {
                return { outcome: 'aborted' }
            }
            const remainingMs = deadline - Date.now()
            if (remainingMs <= 0) break
            const blockMs = Math.min(remainingMs, APPROVAL_BLOCK_MS)
            const { data: response, error } = await tryCatch(() => Promise.race([
                ctx.apiClient.executeAgentTool({
                    toolName: '__approval_wait', toolInput: { gateId, timeoutMs: blockMs }, platformId, userId, source,
                }),
                waitForAbort(abortSignal).then(() => ({ result: 'aborted' as const })),
            ]))
            if (abortSignal.aborted || response?.result === 'aborted') {
                return { outcome: 'aborted' }
            }
            if (error) {
                log.warn({ error, gateId }, 'Approval wait RPC failed, retrying')
                await new Promise((resolve) => setTimeout(resolve, 1_000))
                continue
            }
            if (response.result !== 'pending') {
                const decision = response.result as { approved: boolean, payload?: Record<string, unknown> }
                return { outcome: decision.approved ? 'approved' : 'declined', payload: decision.payload }
            }
        }
        return { outcome: 'timeout' }
    }

    // Restore the conversation's already-chosen project so a continued turn doesn't
    // lose context and re-hit "No project selected"; otherwise default to the user's first
    // project (getAgentConfig persists the same default) so the agent never starts project-less.
    const persistedProjectId = !isNil(projectId) && projects.some((p) => p.id === projectId) ? projectId : null
    const projectState: { projectId: string | null } = { projectId: persistedProjectId ?? projects[0]?.id ?? null }
    // Once the user picks a connection for a piece, that pick is authoritative for the rest of
    // the turn — injected as `auth` into piece-introspection tools so the model can't resolve
    // props/dropdowns against a guessed externalId. Keyed by normalized piece name.
    const selectedConnectionByPiece = new Map<string, string>()
    const localTools = agentWorkerTools.createLocalTools({
        onSetProjectContext: async (projectId) => {
            projectState.projectId = projectId
            await ctx.apiClient.updateProjectContext({ conversationId, runId, projectId })
        },
        projects,
    })
    const storePendingGate = async ({ gateId, toolName: gateTool, displayName, toolInput: gateInput }: {
        gateId: string
        toolName: string
        displayName: string
        toolInput: Record<string, unknown>
    }) => {
        await tryCatch(() => ctx.apiClient.executeAgentTool({
            toolName: '__store_pending_gate',
            toolInput: { conversationId, runId, gateId, toolName: gateTool, displayName, toolInput: gateInput },
            platformId, userId, source, conversationId,
        }))
    }

    const displayTools = agentWorkerTools.createDisplayTools({
        waitForApproval,
        displayToolTimeoutMs: DISPLAY_TOOL_TIMEOUT_MS,
        onConnectionSelected: async ({ pieceName, connectionExternalId, label, projectId: connProjectId }) => {
            selectedConnectionByPiece.set(pieceName, connectionExternalId)
            await tryCatch(() => ctx.apiClient.executeAgentTool({
                toolName: '__store_selected_connection',
                toolInput: { pieceName, connectionExternalId, label, projectId: connProjectId },
                platformId, userId, source, conversationId,
            }))
        },
        onConnectorReconnected: (connectorUuid) => brokenConnectors.delete(connectorUuid),
        onGateOpened: storePendingGate,
    })
    const crossProjectTools = agentWorkerTools.createCrossProjectTools({ executeTool: executeCrossProjectTool, eventEmitter, waitForApproval, onGateOpened: storePendingGate, guides, taintState })
    const thinkingTools = agentWorkerTools.createThinkingTools()
    const phaseTools = agentWorkerTools.createPhaseTools({ onPhaseChange: (phase) => {
        phaseState.phase = phase
    } })
    const buildPlanTools = agentWorkerTools.createBuildPlanTools({
        eventEmitter,
        getProjectId: () => projectState.projectId,
    })
    const mcpTools = agentWorkerTools.wrapTestFlowGate({
        mcpTools: agentMcpClient.withToolTimeouts({
            mcpToolSet,
            brokenConnectors,
            getSelectedAuth: ({ pieceName }) => selectedConnectionByPiece.get(pieceName),
            saveLargeResult: async ({ json, fileName }) => {
                const { data: saved } = await tryCatch(() => ctx.apiClient.saveAgentFile({
                    platformId, conversationId, data: Buffer.from(json, 'utf8'), mediaType: 'application/json',
                    ...spreadIfDefined('projectId', projectState.projectId ?? undefined), fileName,
                }))
                return saved?.fileId ?? null
            },
        }),
        checkFlowWrites: async (flowId) => {
            const response = await ctx.apiClient.executeAgentTool({ toolName: '__flow_write_check', toolInput: { flowId }, platformId, userId, source, conversationId })
            return response.result
        },
        waitForApproval,
        storePendingGate,
        eventEmitter,
        log,
    })
    const emailTools = emailEnabled && !dryRun && !discoveryOnly
        ? agentWorkerTools.createEmailTools({
            sendEmail: ({ to, subject, body, gateId }) => ctx.apiClient.sendAgentEmail({ conversationId, runId, platformId, userId, to, subject, body, gateId }),
            eventEmitter,
            userEmail,
            waitForApproval,
            onGateOpened: storePendingGate,
        })
        : {}

    const allTools = { ...localTools, ...displayTools, ...crossProjectTools, ...webTools, ...thinkingTools, ...phaseTools, ...buildPlanTools, ...emailTools, ...(mcpTools as Record<string, typeof localTools[keyof typeof localTools]>) }
    return source === AgentRunSource.CHAT ? allTools : omit(allTools, UNATTENDED_FORBIDDEN_TOOLS)
}

async function streamChunksToClient({ result, ctx, userId, conversationId, runId, log, abortSignal, onStreamIdle }: {
    result: ReturnType<typeof streamText>
    ctx: JobContext
    userId: string
    conversationId: string
    runId?: string
    log: JobContext['log']
    abortSignal: AbortSignal
    onStreamIdle: (reason: 'idle' | 'tool' | 'reasoning') => void
}): Promise<void> {
    let chunkBuffer: unknown[] = []
    let flushTimer: ReturnType<typeof setTimeout> | null = null

    const flushChunks = async () => {
        if (chunkBuffer.length === 0) return
        const batch = chunkBuffer
        chunkBuffer = []
        log.debug({ chunkCount: batch.length }, 'Flushing chat chunk batch to client')
        await retryWithBackoff({
            fn: () => ctx.apiClient.sendAgentEvent({
                userId, conversationId, runId,
                event: { type: AgentEventType.CHUNK, data: batch },
            }),
            maxAttempts: 2,
            log,
        })
    }

    const uiStream = createUIMessageStream({
        execute: ({ writer: streamWriter }) => {
            streamWriter.merge(toUIMessageStream({ stream: result.stream, sendSources: true }))
        },
    })

    // Idle reporter (monitoring signal, NOT a kill): on every STREAM_IDLE_REPORT_MS of stream
    // silence it reports once and keeps watching, so a turn that has gone quiet ALWAYS produces a
    // signal — whether the silence is expected (a tool call or reasoning block in flight) or
    // unexplained. Reporting on the in-flight paths too is what surfaces a stream that wedges
    // mid-tool or mid-reasoning; otherwise that turn is invisible until the wall-clock backstop.
    // It never aborts — the turn's only hard stop is the wall-clock backstop at the top of this
    // file — and the reason lets the caller log unexplained silence louder than expected quiet.
    let pendingToolCalls = 0
    let reasoningInFlight = false
    let idleTimer: ReturnType<typeof setTimeout> | null = null
    const armIdleReporter = () => {
        if (idleTimer) clearTimeout(idleTimer)
        idleTimer = setTimeout(() => {
            onStreamIdle(pendingToolCalls > 0 ? 'tool' : reasoningInFlight ? 'reasoning' : 'idle')
            armIdleReporter()
        }, STREAM_IDLE_REPORT_MS)
    }

    const reader = uiStream.getReader()
    const abortRace = waitForAbort(abortSignal).then(() => 'aborted' as const)
    armIdleReporter()
    try {
        while (true) {
            const next = await Promise.race([reader.read(), abortRace])
            if (next === 'aborted') break
            const { done, value: chunk } = next
            if (done) break
            armIdleReporter()
            const chunkType = isObject(chunk) && typeof chunk['type'] === 'string' ? chunk['type'] : undefined
            if (chunkType === 'tool-input-available') {
                pendingToolCalls++
            }
            else if (chunkType === 'tool-output-available' || chunkType === 'tool-output-error' || chunkType === 'tool-output-denied') {
                pendingToolCalls = Math.max(0, pendingToolCalls - 1)
            }
            else if (chunkType === 'reasoning-start') {
                reasoningInFlight = true
            }
            else if (chunkType === 'reasoning-end') {
                reasoningInFlight = false
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
    model: ReturnType<typeof agentAiUtils.createChatModel>
    userMessage: string
    previousUiMessages: unknown[]
    log: JobContext['log']
    conversationId: string
    abortSignal?: AbortSignal
}): Promise<string | undefined> {
    // getAgentConfig includes the just-saved user message, so length 1 = first turn
    const isFirstTurn = previousUiMessages.length === 1
    if (!isFirstTurn) return undefined

    const { data: generatedTitle } = await tryCatch(async () => {
        const { text } = await generateText({
            model,
            abortSignal,
            telemetry: agentAiUtils.buildTelemetry({ functionId: 'agent-title' }),
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

async function retryWithBackoff({ fn, maxAttempts = RETRY_MAX_ATTEMPTS, description = 'Operation', throwOnExhausted = false, log }: {
    fn: () => Promise<unknown>
    maxAttempts?: number
    description?: string
    throwOnExhausted?: boolean
    log?: { warn: (obj: Record<string, unknown>, msg: string) => void }
}): Promise<void> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const { error } = await tryCatch(fn)
        if (!error) return
        if (attempt === maxAttempts) {
            log?.warn({ error, attempt }, `[executeAgentRun] ${description} failed after every attempt`)
            if (throwOnExhausted) {
                throw error
            }
            return
        }
        await delayWithJitter(RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1))
    }
}


export type StepOutcome =
    | { success: true, output: string }
    | { success: false, error: string }
