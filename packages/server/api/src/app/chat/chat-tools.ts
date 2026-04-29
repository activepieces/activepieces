import { tool } from 'ai'
import { z } from 'zod'

const titleSchema = z.object({
    title: z.string().min(1).max(100).describe('A short title (3-6 words) summarizing the conversation topic'),
})

const planSchema = z.object({
    entries: z.array(z.object({
        content: z.string().describe('Description of the step'),
        status: z.enum(['pending', 'in_progress', 'completed']).describe('Current status of the step'),
    })).min(1).max(20),
})

function createChatTools({ onSessionTitle, onPlanUpdate }: ChatToolCallbacks) {
    return {
        ap_set_session_title: tool({
            description: 'Set the conversation title. Call this after your first response to name the conversation based on the topic discussed.',
            inputSchema: titleSchema,
            execute: async (input) => {
                onSessionTitle(input.title)
                return { success: true }
            },
        }),
        ap_update_plan: tool({
            description: 'REQUIRED before executing any multi-step task. Create a step-by-step plan that shows the user what you will do. Call this BEFORE calling other tools when the task involves building automations, creating tables with data, or troubleshooting. Each entry has a status: pending, in_progress, or completed. Update the plan as you complete steps.',
            inputSchema: planSchema,
            execute: async (input) => {
                onPlanUpdate(input.entries)
                return { success: true }
            },
        }),
    }
}

type ChatToolCallbacks = {
    onSessionTitle: (title: string) => void
    onPlanUpdate: (entries: Array<{ content: string, status: 'pending' | 'in_progress' | 'completed' }>) => void
}

export { createChatTools }
