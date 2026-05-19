import { ChatStreamWriter } from '@activepieces/shared'
import { tool, ToolSet } from 'ai'
import { z } from 'zod'

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
            description: 'Display a multi-question form to gather structured input from the user. Use this instead of asking questions in prose — it renders as an interactive form.',
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
            description: 'Display quick reply suggestion buttons below your message. Use for suggesting next actions, not for gathering information.',
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

const DISPLAY_TOOL_NAMES = new Set([
    'ap_show_connection_required',
    'ap_show_connection_picker',
    'ap_show_project_picker',
    'ap_show_questions',
    'ap_show_quick_replies',
])

function isDisplayTool(name: string): boolean {
    return DISPLAY_TOOL_NAMES.has(name)
}

export const chatDisplayTools = {
    create: createDisplayTools,
    isDisplayTool,
    DISPLAY_TOOL_NAMES,
}
