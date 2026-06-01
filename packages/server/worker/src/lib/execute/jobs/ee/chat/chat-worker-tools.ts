import {
    apId,
    BatchItemResult,
    ChatAgentEventType,
    ChatStreamWriter,
    isObject,
    SendChatEventRequest,
    tryCatch,
} from '@activepieces/shared'
import { tool, ToolSet } from 'ai'
import { z } from 'zod'

const MAX_BATCH_SIZE = 100

function createRpcWriterForConversation({ sendEvent, userId, conversationId }: {
    sendEvent: (input: SendChatEventRequest) => Promise<void>
    userId: string
    conversationId: string
}): ChatStreamWriter {
    return {
        write(part: Record<string, unknown>): void {
            sendEvent({
                userId,
                conversationId,
                event: { type: ChatAgentEventType.CHUNK, data: part },
            }).catch(() => {})
        },
    }
}

function createDisplayTools({ writer, waitForApproval, displayToolTimeoutMs }: {
    writer: ChatStreamWriter
    waitForApproval: (params: { gateId: string, timeoutMs?: number }) => Promise<{ approved: boolean, payload?: Record<string, unknown> }>
    displayToolTimeoutMs: number
}): ToolSet {
    function blockingExecute({ dataType, dismissMessage, successKey }: {
        dataType: string
        dismissMessage: string
        successKey: string
    }) {
        return async (input: Record<string, unknown>) => {
            const gateId = apId()
            writer.write({ type: dataType, data: { ...input, gateId }, transient: true })
            const decision = await waitForApproval({ gateId, timeoutMs: displayToolTimeoutMs })
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
            execute: blockingExecute({ dataType: 'data-connection-required', dismissMessage: 'User dismissed the connection request.', successKey: 'connected' }),
        }),

        ap_show_connection_picker: tool({
            description: 'Display a card for the user to choose between multiple connections for a piece. After selection, briefly confirm which account the user chose before proceeding.',
            inputSchema: z.object({
                piece: z.string().describe('Piece short name'),
                displayName: z.string().describe('Human-readable piece name'),
                connections: z.array(z.object({
                    label: z.string().describe('Connection display name'),
                    project: z.string().describe('Project name where this connection lives'),
                    externalId: z.string().describe('Connection externalId for use in subsequent tool calls'),
                    projectId: z.string().describe('Project ID where this connection lives'),
                    status: z.string().describe('Connection status (ACTIVE, ERROR, etc.)'),
                })).min(1),
            }),
            execute: blockingExecute({ dataType: 'data-connection-picker', dismissMessage: 'User dismissed the connection picker.', successKey: 'selected' }),
        }),

        ap_show_project_picker: tool({
            description: 'Display a card for the user to select a project to work in. After selection, briefly confirm which project the user chose before proceeding.',
            inputSchema: z.object({
                suggestedProjects: z.array(z.object({
                    name: z.string().describe('Project display name'),
                    id: z.string().describe('Project ID'),
                })).min(1),
            }),
            execute: blockingExecute({ dataType: 'data-project-picker', dismissMessage: 'User dismissed the project picker.', successKey: 'selected' }),
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
            execute: blockingExecute({ dataType: 'data-questions', dismissMessage: 'User dismissed the questions form.', successKey: 'answered' }),
        }),

        ap_show_quick_replies: tool({
            description: 'Display quick reply suggestion buttons below your message.',
            inputSchema: z.object({
                replies: z.array(z.string().max(80)).min(1).max(5).describe('Short suggestion texts'),
            }),
            execute: async (input) => {
                writer.write({ type: 'data-quick-replies', data: { replies: input.replies }, transient: true })
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

function createCrossProjectTools({ executeTool, writer }: {
    executeTool: (toolName: string, toolInput: Record<string, unknown>) => Promise<unknown>
    writer: ChatStreamWriter
}): ToolSet {
    return {
        ap_discover_action_auth: tool({
            description: 'Check what authentication a piece needs and find available connections. Call this BEFORE ap_execute_action to determine if auth is needed.',
            inputSchema: z.object({
                pieceName: z.string().describe('Piece name, e.g. "@activepieces/piece-gmail"'),
            }),
            execute: async (input) => {
                return executeTool('ap_discover_action_auth', input)
            },
        }),

        ap_execute_action: tool({
            description: 'Execute a piece action once or in batch. Use ap_discover_action_auth first to check if auth is needed. If the action requires auth, provide connectionExternalId and projectId. For batch execution, provide an items array where each element is a complete input object for one invocation.',
            inputSchema: z.object({
                pieceName: z.string().describe('Piece name, e.g. "@activepieces/piece-gmail"'),
                actionName: z.string().describe('Action to run, e.g. "gmail_search_mail"'),
                input: z.record(z.string(), z.unknown()).optional().describe('Input for the action (single-item mode)'),
                items: z.array(z.record(z.string(), z.unknown())).max(MAX_BATCH_SIZE).optional().describe('Array of input objects for batch execution. Each element is a complete input for one invocation. Max 100 items.'),
                description: z.string().optional().describe('Human-readable label for batch progress card, e.g. "Sending birthday messages"'),
                connectionExternalId: z.string().optional().describe('externalId of the connection to use'),
                projectId: z.string().optional().describe('Project ID where the connection lives'),
            }),
            execute: async (toolInput) => {
                if (toolInput.items && toolInput.items.length > 0) {
                    return executeBatchAction({
                        executeTool,
                        writer,
                        pieceName: toolInput.pieceName,
                        actionName: toolInput.actionName,
                        items: toolInput.items,
                        description: toolInput.description,
                        connectionExternalId: toolInput.connectionExternalId,
                        projectId: toolInput.projectId,
                    })
                }
                return executeTool('ap_execute_action', toolInput)
            },
        }),

        ap_list_across_projects: tool({
            description: 'List resources across ALL user projects at once. Use instead of switching project context for cross-project queries.',
            inputSchema: z.object({
                resource: z.enum(['flows', 'tables', 'runs', 'connections']).describe('The type of resource to list'),
                status: z.string().optional().describe('Filter by status'),
            }),
            execute: async (input) => {
                return executeTool('ap_list_across_projects', input)
            },
        }),
    }
}

async function executeBatchAction({ executeTool, writer, pieceName, actionName, items, description, connectionExternalId, projectId }: {
    executeTool: (toolName: string, toolInput: Record<string, unknown>) => Promise<unknown>
    writer: ChatStreamWriter
    pieceName: string
    actionName: string
    items: Record<string, unknown>[]
    description?: string
    connectionExternalId?: string
    projectId?: string
}): Promise<unknown> {
    const batchId = apId()
    const total = items.length
    const label = description ?? `Processing ${total} ${total === 1 ? 'item' : 'items'}`
    const results: BatchItemResult[] = []
    let succeeded = 0
    let failed = 0

    function pushProgress({ done }: { done: boolean }): void {
        writer.write({
            type: 'data-batch-progress',
            id: batchId,
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
        const { data: result, error } = await tryCatch(() => executeTool('ap_execute_action', {
            pieceName,
            actionName,
            input: items[i],
            connectionExternalId,
            projectId,
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

function createPlanTools({ writer, onPlanApproved, waitForApproval }: {
    writer: ChatStreamWriter
    onPlanApproved: () => void
    waitForApproval: (params: { gateId: string, timeoutMs?: number }) => Promise<{ approved: boolean }>
}): ToolSet {
    return {
        ap_request_plan_approval: tool({
            description: 'Request user approval for a multi-step plan before executing destructive operations.',
            inputSchema: z.object({
                planSummary: z.string().describe('A brief 1-3 sentence summary of what you will do'),
                steps: z.array(z.string()).describe('List of concrete actions'),
            }),
            execute: async (input) => {
                const gateId = apId()
                writer.write({
                    type: 'data-plan-approval-request',
                    data: { gateId, planSummary: input.planSummary, steps: input.steps },
                    transient: true,
                })
                const decision = await waitForApproval({ gateId })
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
            execute: async (input) => {
                for (const update of input.updates) {
                    writer.write({ type: 'data-plan-progress', data: update, transient: true })
                }
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

export const chatWorkerTools = {
    createRpcWriterForConversation,
    createDisplayTools,
    createLocalTools,
    createCrossProjectTools,
    createPlanTools,
    createThinkingTools,
    isSuccessResult,
    extractResultText,
}
