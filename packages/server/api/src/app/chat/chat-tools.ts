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

function createChatTools({ onSessionTitle }: { onSessionTitle: (title: string) => void }) {
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
            description: 'Show a step-by-step plan to the user for multi-step tasks. Call this before executing when the task requires 3+ tool calls (building automations, managing tables, troubleshooting). Update the plan as you complete steps.',
            inputSchema: planSchema,
            execute: async () => {
                return { success: true }
            },
        }),
    }
}

export { createChatTools }
