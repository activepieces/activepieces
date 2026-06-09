import {
    ActionPreviewEvent,
    ActionReceiptEvent,
    BatchItemResult,
    ChatAgentEventType,
    chatToolClassification,
    isObject,
    SendChatEventRequest,
    ToolApprovalRequestEvent,
    ToolProgressEvent,
    tryCatch,
} from '@activepieces/shared'
import { tool, ToolExecutionOptions, ToolSet } from 'ai'
import { z } from 'zod'

const MAX_BATCH_SIZE = 100
const TOOL_EXECUTION_TIMEOUT_MS = 5 * 60 * 1_000

async function withToolTimeout<T>({ fn, timeoutMs, toolName }: {
    fn: (signal: AbortSignal) => Promise<T>
    timeoutMs: number
    toolName: string
}): Promise<T> {
    const abortController = new AbortController()
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    const timeoutPromise = new Promise<never>((_resolve, reject) => {
        timeoutId = setTimeout(() => {
            abortController.abort()
            reject(new Error(`Tool "${toolName}" timed out after ${timeoutMs / 1_000} seconds. The operation took too long to complete. You may retry with different parameters or skip this step.`))
        }, timeoutMs)
    })
    try {
        return await Promise.race([fn(abortController.signal), timeoutPromise])
    }
    finally {
        if (timeoutId !== undefined) {
            clearTimeout(timeoutId)
        }
    }
}

function createEventEmitter({ sendEvent, userId, conversationId, log }: {
    sendEvent: (input: SendChatEventRequest) => Promise<void>
    userId: string
    conversationId: string
    log?: { warn: (obj: Record<string, unknown>, msg: string) => void }
}): ChatEventEmitter {
    const sendWithRetry = async ({ event, maxAttempts }: { event: SendChatEventRequest['event'], maxAttempts: number }) => {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            const { error } = await tryCatch(() => sendEvent({ userId, conversationId, event }))
            if (!error) return
            if (attempt === maxAttempts) {
                log?.warn({ err: error, attempt, eventType: event.type }, 'Event delivery failed after retries')
                return
            }
            const delayMs = attempt === 1 ? 200 : 1_000
            await new Promise((resolve) => setTimeout(resolve, delayMs))
        }
    }

    return {
        emitToolProgress(data: ToolProgressEvent): void {
            void sendWithRetry({
                event: { type: ChatAgentEventType.TOOL_PROGRESS, data },
                maxAttempts: 2,
            })
        },
        emitToolApprovalRequest(data: ToolApprovalRequestEvent): void {
            void sendWithRetry({
                event: { type: ChatAgentEventType.TOOL_APPROVAL_REQUEST, data },
                maxAttempts: 3,
            })
        },
        emitActionPreview(data: ActionPreviewEvent): void {
            void sendWithRetry({
                event: { type: ChatAgentEventType.ACTION_PREVIEW, data },
                maxAttempts: 3,
            })
        },
        emitActionReceipt(data: ActionReceiptEvent): void {
            void sendWithRetry({
                event: { type: ChatAgentEventType.ACTION_RECEIPT, data },
                maxAttempts: 2,
            })
        },
    }
}

function createDisplayTools({ waitForApproval, displayToolTimeoutMs, onConnectionSelected, onGateOpened }: {
    waitForApproval: (params: { gateId: string, timeoutMs?: number }) => Promise<{ approved: boolean, payload?: Record<string, unknown> }>
    displayToolTimeoutMs: number
    onConnectionSelected?: (params: { pieceName: string, connectionExternalId: string, label: string, projectId: string }) => Promise<void>
    onGateOpened?: (params: { gateId: string, toolName: string, displayName: string, toolInput: Record<string, unknown> }) => Promise<void>
}): ToolSet {
    function blockingExecute({ dismissMessage, successKey, toolName }: {
        dismissMessage: string
        successKey: string
        toolName: string
    }) {
        return async (input: Record<string, unknown>, options: ToolExecutionOptions) => {
            if (onGateOpened) {
                await tryCatch(() => onGateOpened({
                    gateId: options.toolCallId,
                    toolName,
                    displayName: typeof input['displayName'] === 'string' ? input['displayName'] : toolName,
                    toolInput: input,
                }))
            }
            const decision = await waitForApproval({ gateId: options.toolCallId, timeoutMs: displayToolTimeoutMs })
            if (!decision.approved) {
                return { dismissed: true, message: dismissMessage }
            }
            return { [successKey]: true, ...decision.payload }
        }
    }

    return {
        ap_show_connection_required: tool({
            description: 'Display a card prompting the user to connect a service. Use when no connection exists for a required piece. After the user connects, briefly confirm before proceeding.',
            inputSchema: z.object({
                piece: z.string().describe('Piece short name (e.g. "gmail", "slack")'),
                displayName: z.string().describe('Human-readable name (e.g. "Gmail", "Slack")'),
                status: z.enum(['missing', 'error']).optional().describe('Set to "error" when connection exists but needs reconnecting'),
            }),
            execute: blockingExecute({ dismissMessage: 'User dismissed the connection request.', successKey: 'connected', toolName: 'ap_show_connection_required' }),
        }),

        ap_show_connection_picker: tool({
            description: 'Display a card for the user to choose between multiple connections for a piece. The system manages connection details — just provide the piece name. After selection, briefly confirm which account the user chose before proceeding.',
            inputSchema: z.object({
                piece: z.string().describe('Piece short name'),
                displayName: z.string().describe('Human-readable piece name'),
            }),
            execute: async (input, options) => {
                if (onGateOpened) {
                    await tryCatch(() => onGateOpened({
                        gateId: options.toolCallId,
                        toolName: 'ap_show_connection_picker',
                        displayName: input.displayName,
                        toolInput: input as unknown as Record<string, unknown>,
                    }))
                }
                const decision = await waitForApproval({ gateId: options.toolCallId, timeoutMs: displayToolTimeoutMs })
                if (!decision.approved) {
                    return { dismissed: true, message: 'User dismissed the connection picker.' }
                }
                const payload = decision.payload ?? {}
                const connectionExternalId = payload['connectionExternalId']
                const label = payload['label']
                const projectId = payload['projectId']
                if (typeof connectionExternalId === 'string' && onConnectionSelected) {
                    const stripped = input.piece.startsWith('piece-') ? input.piece.slice('piece-'.length) : input.piece
                    const pieceName = input.piece.startsWith('@') ? input.piece : `@activepieces/piece-${stripped.replace(/_/g, '-')}`
                    await onConnectionSelected({
                        pieceName,
                        connectionExternalId,
                        label: typeof label === 'string' ? label : connectionExternalId,
                        projectId: typeof projectId === 'string' ? projectId : '',
                    })
                }
                return { selected: true, label: typeof label === 'string' ? label : 'Connected' }
            },
        }),

        ap_show_project_picker: tool({
            description: 'Display a card for the user to select a project to work in. After selection, briefly confirm which project the user chose before proceeding.',
            inputSchema: z.object({
                suggestedProjects: z.array(z.object({
                    name: z.string().describe('Project display name'),
                    id: z.string().describe('Project ID'),
                })).min(1),
            }),
            execute: blockingExecute({ dismissMessage: 'User dismissed the project picker.', successKey: 'selected', toolName: 'ap_show_project_picker' }),
        }),

        ap_show_questions: tool({
            description: 'Display a multi-question form to gather structured input from the user. After the user answers, briefly acknowledge their responses before proceeding.',
            inputSchema: z.object({
                questions: z.array(z.object({
                    title: z.string().optional().describe('Section title'),
                    question: z.string().describe('The question text'),
                    type: z.enum(['choice', 'text']).describe('choice = radio/select, text = free input'),
                    options: z.array(z.string()).optional().describe('Options for choice-type questions'),
                    placeholder: z.string().optional().describe('Placeholder for text-type questions'),
                })).min(1),
            }),
            execute: blockingExecute({ dismissMessage: 'User dismissed the questions form.', successKey: 'answered', toolName: 'ap_show_questions' }),
        }),

        ap_show_quick_replies: tool({
            description: 'Display quick reply suggestion buttons below your message.',
            inputSchema: z.object({
                replies: z.array(z.string().max(80)).min(1).max(5).describe('Short suggestion texts'),
            }),
            execute: async () => {
                return { displayed: true }
            },
        }),
    }
}

function createLocalTools({ onSetProjectContext, projects }: {
    onSetProjectContext: (projectId: string | null) => Promise<void>
    projects: Array<{ id: string, displayName: string, type: string }>
}): ToolSet {
    const availableProjectIds = new Set(projects.map((p) => p.id))

    return {
        ap_select_project: tool({
            description: 'Select a project to work in. All subsequent tool calls will operate on this project.',
            inputSchema: z.object({
                projectId: z.string().describe('The project ID to switch to'),
            }),
            execute: async (input) => {
                if (!availableProjectIds.has(input.projectId)) {
                    return { success: false, error: `Project ${input.projectId} is not accessible.` }
                }
                const project = projects.find((p) => p.id === input.projectId)
                await onSetProjectContext(input.projectId)
                return { success: true, message: `Now working in project ${project?.displayName ?? input.projectId}.` }
            },
        }),

        ap_deselect_project: tool({
            description: 'Clear project context. Useful when working across multiple projects.',
            inputSchema: z.object({}),
            execute: async () => {
                await onSetProjectContext(null)
                return { success: true, message: 'Project context cleared.' }
            },
        }),
    }
}

function createCrossProjectTools({ executeTool, eventEmitter, waitForApproval }: {
    executeTool: (toolName: string, toolInput: Record<string, unknown>) => Promise<unknown>
    eventEmitter: ChatEventEmitter
    waitForApproval: (params: { gateId: string, timeoutMs?: number }) => Promise<{ approved: boolean }>
}): ToolSet {
    const executeWithTimeout = (toolName: string, toolInput: Record<string, unknown>) =>
        withToolTimeout({
            fn: () => executeTool(toolName, toolInput),
            timeoutMs: TOOL_EXECUTION_TIMEOUT_MS,
            toolName,
        })

    return {
        ap_discover_action_auth: tool({
            description: 'Check what authentication a piece needs and find available connections. Call this BEFORE ap_execute_action to determine if auth is needed.',
            inputSchema: z.object({
                title: z.string().optional().describe('Short human-friendly label for the tool card, e.g. "Check Gmail Auth", "Verify Slack Connection"'),
                pieceName: z.string().describe('Piece name, e.g. "@activepieces/piece-gmail"'),
            }),
            execute: async (input) => {
                return executeWithTimeout('ap_discover_action_auth', input)
            },
        }),

        ap_execute_action: tool({
            description: 'Execute a piece action once or in batch. Use ap_discover_action_auth first to check if auth is needed. The system manages connections automatically after the user selects one. For batch execution, provide an items array where each element is a complete input object for one invocation.',
            inputSchema: z.object({
                title: z.string().optional().describe('Short human-friendly label for the tool card, e.g. "Search Emails", "Send Message", "Create Record"'),
                pieceName: z.string().describe('Piece name, e.g. "@activepieces/piece-gmail"'),
                actionName: z.string().describe('Action to run, e.g. "gmail_search_mail"'),
                input: z.record(z.string(), z.unknown()).optional().describe('Input for the action (single-item mode)'),
                items: z.array(z.record(z.string(), z.unknown())).max(MAX_BATCH_SIZE).optional().describe('Array of input objects for batch execution. Each element is a complete input for one invocation. Max 100 items.'),
                description: z.string().optional().describe('Human-readable label for batch progress card, e.g. "Sending birthday messages"'),
                needsConfirmation: z.boolean().optional().describe('Set to true for write/destructive/external actions that should be confirmed by the user before execution. Always true for: send, post, delete, create, update, forward, reply actions.'),
            }),
            execute: async (toolInput, options) => {
                const isBatch = toolInput.items && toolInput.items.length > 0
                const needsPreview = chatToolClassification.requiresActionPreview({
                    actionName: toolInput.actionName,
                    needsConfirmation: toolInput.needsConfirmation,
                })

                if (needsPreview) {
                    const previewData: ActionPreviewEvent = {
                        toolCallId: options.toolCallId,
                        pieceName: toolInput.pieceName,
                        actionName: toolInput.actionName,
                        actionDisplayName: toolInput.title ?? toolInput.actionName,
                        input: toolInput.input ?? {},
                        isBatch: !!isBatch,
                        batchCount: isBatch ? toolInput.items!.length : undefined,
                        batchSamples: isBatch ? toolInput.items!.slice(0, 3) : undefined,
                    }
                    eventEmitter.emitActionPreview(previewData)
                    const decision = await waitForApproval({ gateId: options.toolCallId })
                    if (!decision.approved) {
                        return { content: [{ type: 'text', text: 'Action cancelled by user.' }] }
                    }
                }

                if (isBatch) {
                    return executeBatchAction({
                        executeWithTimeout,
                        eventEmitter,
                        toolCallId: options.toolCallId,
                        pieceName: toolInput.pieceName,
                        actionName: toolInput.actionName,
                        items: toolInput.items!,
                        description: toolInput.description,
                    })
                }
                const result = await executeWithTimeout('ap_execute_action', toolInput)
                const resultObj = isObject(result) ? result as Record<string, unknown> : {}
                const meta = isObject(resultObj['_meta']) ? resultObj['_meta'] as Record<string, unknown> : undefined
                eventEmitter.emitActionReceipt({
                    toolCallId: options.toolCallId,
                    actionDisplayName: toolInput.title ?? toolInput.actionName,
                    pieceName: toolInput.pieceName,
                    connectionLabel: typeof meta?.['connectionLabel'] === 'string' ? meta['connectionLabel'] : undefined,
                    status: isSuccessResult(result) ? 'success' : 'failed',
                    output: result,
                    errorMessage: !isSuccessResult(result) ? extractResultText(result) : undefined,
                    timestamp: new Date().toISOString(),
                })
                return result
            },
        }),

        ap_list_across_projects: tool({
            description: 'List resources across ALL user projects at once. Use instead of switching project context for cross-project queries.',
            inputSchema: z.object({
                title: z.string().optional().describe('Short human-friendly label for the tool card, e.g. "List Flows", "Find Connections", "Check Recent Runs"'),
                resource: z.enum(['flows', 'tables', 'runs', 'connections']).describe('The type of resource to list'),
                status: z.string().optional().describe('Filter by status'),
            }),
            execute: async (input) => {
                return executeWithTimeout('ap_list_across_projects', input)
            },
        }),
    }
}

async function executeBatchAction({ executeWithTimeout, eventEmitter, toolCallId, pieceName, actionName, items, description }: {
    executeWithTimeout: (toolName: string, toolInput: Record<string, unknown>) => Promise<unknown>
    eventEmitter: ChatEventEmitter
    toolCallId: string
    pieceName: string
    actionName: string
    items: Record<string, unknown>[]
    description?: string
}): Promise<unknown> {
    const total = items.length
    const label = description ?? `Processing ${total} ${total === 1 ? 'item' : 'items'}`
    const results: BatchItemResult[] = []
    let succeeded = 0
    let failed = 0

    function pushProgress({ done }: { done: boolean }): void {
        eventEmitter.emitToolProgress({
            toolCallId,
            data: {
                label,
                total,
                completed: results.length,
                succeeded,
                failed,
                done,
                results: done ? results : [],
            },
        })
    }

    const CONSECUTIVE_FAILURE_LIMIT = 3
    let consecutiveFailures = 0

    pushProgress({ done: false })

    for (let i = 0; i < items.length; i++) {
        const { data: result, error } = await tryCatch(() => executeWithTimeout('ap_execute_action', {
            pieceName,
            actionName,
            input: items[i],
        }))
        if (error) {
            failed++
            consecutiveFailures++
            results.push({ index: i, success: false, error: error.message })
        }
        else if (isSuccessResult(result)) {
            succeeded++
            consecutiveFailures = 0
            results.push({ index: i, success: true, output: result })
        }
        else {
            failed++
            consecutiveFailures++
            results.push({ index: i, success: false, error: extractResultText(result) })
        }

        const stoppedEarly = consecutiveFailures >= CONSECUTIVE_FAILURE_LIMIT
        const isLast = i === items.length - 1
        pushProgress({ done: isLast || stoppedEarly })

        if (stoppedEarly) break
    }

    const failureSummary = failed > 0
        ? results
            .filter((r) => !r.success)
            .map((r) => `#${r.index + 1}: ${r.error ?? 'unknown error'}`)
            .join('\n')
        : ''

    const batchProgress = {
        label,
        total,
        completed: results.length,
        succeeded,
        failed,
        done: true,
        results,
    }

    const skipped = total - results.length

    return {
        content: [{
            type: 'text',
            text: `Batch complete: ${succeeded}/${total} succeeded, ${failed} failed.`
                + (skipped > 0 ? ` Stopped early after ${CONSECUTIVE_FAILURE_LIMIT} consecutive failures (${skipped} items skipped).` : '')
                + (failed > 0 ? `\n\nFailed items:\n${failureSummary}` : ''),
        }],
        batchProgress,
    }
}

function isSuccessResult(result: unknown): boolean {
    if (!isObject(result)) return false
    if (result['success'] === false) return false
    if (result['isError'] === true) return false
    if (Array.isArray(result['content'])) {
        const first = result['content'][0]
        const text = isObject(first) && typeof first['text'] === 'string' ? first['text'] : ''
        return !text.startsWith('❌') && !text.startsWith('⏳')
    }
    return false
}

function extractResultText(result: unknown): string {
    if (typeof result === 'string') return result
    if (!isObject(result)) return JSON.stringify(result)
    if (typeof result['error'] === 'string') return result['error']
    if (Array.isArray(result['content'])) {
        return result['content']
            .filter((c): c is Record<string, unknown> & { text: string } => isObject(c) && typeof c['text'] === 'string')
            .map((c) => c.text)
            .join('\n')
    }
    return JSON.stringify(result)
}

function createPlanTools({ onPlanApproved, waitForApproval }: {
    onPlanApproved: () => void
    waitForApproval: (params: { gateId: string, timeoutMs?: number }) => Promise<{ approved: boolean }>
}): ToolSet {
    return {
        ap_request_plan_approval: tool({
            description: 'Request user approval for a multi-step plan before executing destructive operations.',
            inputSchema: z.object({
                title: z.string().optional().describe('Short human-friendly label for the tool card, e.g. "Review Automation Plan", "Approve Setup"'),
                planSummary: z.string().describe('A brief 1-3 sentence summary of what you will do'),
                steps: z.array(z.string()).describe('List of concrete actions'),
            }),
            execute: async (_input, options) => {
                const decision = await waitForApproval({ gateId: options.toolCallId })
                if (decision.approved) {
                    onPlanApproved()
                    return { success: true, message: 'Plan approved by the user. Execute each step in order now. Call ap_update_plan to update step statuses as you work.' }
                }
                return { success: false, message: 'Plan rejected by user. Do not proceed.' }
            },
        }),

        ap_update_plan: tool({
            description: 'Update the status of plan steps. Call this before starting each step (status: executing) and after completing it (status: done or error).',
            inputSchema: z.object({
                updates: z.array(z.object({
                    stepIndex: z.number().describe('Zero-based index of the step in the plan'),
                    status: z.enum(['pending', 'executing', 'done', 'error']).describe('New status for this step'),
                })).min(1),
            }),
            execute: async () => {
                return { success: true }
            },
        }),
    }
}

function createThinkingTools(): ToolSet {
    return {
        ap_update_thinking_status: tool({
            description: 'Update the current thinking status displayed to the user. Call this before each tool call to explain what you are about to do in a short human-readable label.',
            inputSchema: z.object({
                status: z.string().describe('Short human-readable label for the current step, e.g. "Searching for Gmail flows", "Creating flow trigger"'),
            }),
            execute: async () => {
                return { success: true }
            },
        }),
    }
}

export type ChatEventEmitter = {
    emitToolProgress(data: ToolProgressEvent): void
    emitToolApprovalRequest(data: ToolApprovalRequestEvent): void
    emitActionPreview(data: ActionPreviewEvent): void
    emitActionReceipt(data: ActionReceiptEvent): void
}

export const chatWorkerTools = {
    createEventEmitter,
    createDisplayTools,
    createLocalTools,
    createCrossProjectTools,
    createPlanTools,
    createThinkingTools,
    isSuccessResult,
    extractResultText,
    withToolTimeout,
    TOOL_EXECUTION_TIMEOUT_MS,
}
