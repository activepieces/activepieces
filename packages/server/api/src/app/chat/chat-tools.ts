import { tool } from 'ai'
import { z } from 'zod'

const titleSchema = z.object({
    title: z.string().min(1).max(100).describe('A short title (3-6 words) summarizing the conversation topic'),
})

const planSchema = z.object({
    entries: z.array(z.object({
        content: z.string().describe('Description of the step'),
        status: z.enum(['pending', 'in_progress', 'completed']).describe('Current status of the step'),
    })).min(1).max(5),
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
            description: 'Show a brief execution plan. Keep entries short (3-8 words, e.g. "Check connections", "Build flow", "Configure trigger"). Max 5 entries. Call once at start, update statuses as you progress. Do NOT add new entries on retries.',
            inputSchema: planSchema,
            execute: async () => {
                return { success: true }
            },
        }),
    }
}

export { createChatTools }
