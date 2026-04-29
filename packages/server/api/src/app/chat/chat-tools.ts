import { tool } from 'ai'
import { z } from 'zod'

const titleSchema = z.object({
    title: z.string().min(1).max(100).describe('A short title (3-6 words) summarizing the conversation topic'),
})

const confirmationSchema = z.object({
    message: z.string().describe('Brief description of what will happen (1-2 sentences)'),
    actions: z.array(z.object({
        description: z.string().describe('Short action description (e.g. "Delete 5 records from Leads table")'),
        destructive: z.boolean().describe('True if this action deletes or modifies existing data'),
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
        ap_confirm_action: tool({
            description: 'Ask the user to confirm before executing destructive or irreversible actions. MUST be called before: deleting records, deleting tables, deleting flows, disabling flows, or any bulk modification. Show what will happen and wait for approval. Do NOT proceed until the user confirms.',
            inputSchema: confirmationSchema,
            execute: async (input) => {
                return { waitingForConfirmation: true, actions: input.actions }
            },
        }),
    }
}

export { createChatTools }
