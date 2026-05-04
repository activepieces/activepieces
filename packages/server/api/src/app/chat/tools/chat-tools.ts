import { tool } from 'ai'
import { z } from 'zod'

const titleSchema = z.object({
    title: z.string().min(1).max(100).describe('A short title (3-6 words) summarizing the conversation topic'),
})

const projectContextSchema = z.object({
    projectId: z.string().nullable().describe('The project ID to work in, or null to clear the current selection.'),
    reason: z.string().optional().describe('Brief explanation of what you plan to do in this project.'),
})

function createChatTools({ onSessionTitle, onSetProjectContext, availableProjectIds }: CreateChatToolsParams) {
    return {
        ap_set_session_title: tool({
            description: 'Set the conversation title. Call this after your first response to name the conversation based on the topic discussed.',
            inputSchema: titleSchema,
            execute: async (input) => {
                onSessionTitle(input.title)
                return { success: true }
            },
        }),
        ap_select_project: tool({
            description: 'Set or clear the active project context. With a projectId, scopes the conversation to that project and gives access to its tools (create flows, list connections, manage tables, etc.). With null, clears the selection. The user can also select a project from the dropdown in the chat UI.',
            inputSchema: projectContextSchema,
            execute: async (input) => {
                if (input.projectId === null) {
                    await onSetProjectContext(null)
                    return { success: true, message: 'Project context cleared.' }
                }
                if (!availableProjectIds.includes(input.projectId)) {
                    return { success: false, error: `Project ${input.projectId} is not accessible. Available projects: ${availableProjectIds.join(', ')}` }
                }
                await onSetProjectContext(input.projectId)
                const reason = input.reason ? ` Proceed with: ${input.reason}` : ''
                return { success: true, message: `Now working in project ${input.projectId}.${reason}` }
            },
        }),
    }
}

type CreateChatToolsParams = {
    onSessionTitle: (title: string) => void
    onSetProjectContext: (projectId: string | null) => Promise<void>
    availableProjectIds: string[]
}

export { createChatTools }
