import {
    apId,
    ChatAgentEventType,
    ChatStreamWriter,
    SendChatEventRequest,
} from '@activepieces/shared'
import { tool, ToolSet } from 'ai'
import { z } from 'zod'

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

function createDisplayTools({ writer }: { writer: ChatStreamWriter }): ToolSet {
    return {
        ap_show_connection_required: tool({
            description: 'Display a card prompting the user to connect a service. Use when no connection exists for a required piece.',
            inputSchema: z.object({
                piece: z.string().describe('Piece short name (e.g. "gmail", "slack")'),
                displayName: z.string().describe('Human-readable name (e.g. "Gmail", "Slack")'),
                status: z.enum(['missing', 'error']).optional().describe('Set to "error" when connection exists but needs reconnecting'),
            }),
            execute: async (input) => {
                writer.write({ type: 'data-connection-required', data: input, transient: true })
                return { displayed: true }
            },
        }),

        ap_show_connection_picker: tool({
            description: 'Display a card for the user to choose between multiple connections for a piece.',
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
            execute: async (input) => {
                writer.write({ type: 'data-connection-picker', data: input, transient: true })
                return { displayed: true }
            },
        }),

        ap_show_project_picker: tool({
            description: 'Display a card for the user to select a project to work in.',
            inputSchema: z.object({
                suggestedProjects: z.array(z.object({
                    name: z.string().describe('Project display name'),
                    id: z.string().describe('Project ID'),
                })).min(1),
            }),
            execute: async (input) => {
                writer.write({ type: 'data-project-picker', data: input, transient: true })
                return { displayed: true }
            },
        }),

        ap_show_questions: tool({
            description: 'Display a multi-question form to gather structured input from the user.',
            inputSchema: z.object({
                questions: z.array(z.object({
                    title: z.string().optional().describe('Section title'),
                    question: z.string().describe('The question text'),
                    type: z.enum(['choice', 'text']).describe('choice = radio/select, text = free input'),
                    options: z.array(z.string()).optional().describe('Options for choice-type questions'),
                    placeholder: z.string().optional().describe('Placeholder for text-type questions'),
                })).min(1),
            }),
            execute: async (input) => {
                writer.write({ type: 'data-questions', data: input, transient: true })
                return { displayed: true }
            },
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

function createCrossProjectTools({ executeTool }: {
    executeTool: (toolName: string, toolInput: Record<string, unknown>) => Promise<unknown>
}): ToolSet {
    return {
        ap_discover_action_auth: tool({
            description: 'Check what authentication a piece needs and find available connections. Call this BEFORE ap_run_one_time_action to determine if auth is needed.',
            inputSchema: z.object({
                pieceName: z.string().describe('Piece name, e.g. "@activepieces/piece-gmail"'),
            }),
            execute: async (input) => {
                return executeTool('ap_discover_action_auth', input)
            },
        }),

        ap_run_one_time_action: tool({
            description: 'Execute a piece action once. Use ap_discover_action_auth first to check if auth is needed. If the action requires auth, provide connectionExternalId and projectId.',
            inputSchema: z.object({
                pieceName: z.string().describe('Piece name, e.g. "@activepieces/piece-gmail"'),
                actionName: z.string().describe('Action to run, e.g. "gmail_search_mail"'),
                input: z.record(z.string(), z.unknown()).optional().describe('Input for the action'),
                connectionExternalId: z.string().optional().describe('externalId of the connection to use'),
                projectId: z.string().optional().describe('Project ID where the connection lives'),
            }),
            execute: async (input) => {
                return executeTool('ap_run_one_time_action', input)
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

function createPlanTools({ writer, onPlanApproved, waitForApproval }: {
    writer: ChatStreamWriter
    onPlanApproved: () => void
    waitForApproval: (gateId: string) => Promise<boolean>
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
                const approved = await waitForApproval(gateId)
                if (approved) {
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
}
