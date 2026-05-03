import { isNil } from '@activepieces/shared'
import { tool } from 'ai'
import { z } from 'zod'

const titleSchema = z.object({
    title: z.string().min(1).max(100).describe('A short title (3-6 words) summarizing the conversation topic'),
})

const selectProjectSchema = z.object({
    projectId: z.string().describe('The ID of the project to scope to. Must be one of the projects listed in the system prompt.'),
    reason: z.string().describe('Brief explanation of what you plan to do in this project.'),
})

function createChatTools({ onSessionTitle, onSelectProject, onDeselectProject, currentProjectId, availableProjectIds }: CreateChatToolsParams) {
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
            description: 'Select a project to work in. This scopes the conversation to a specific project, giving you access to its tools (create flows, list connections, manage tables, etc.). The user can also select a project from the dropdown in the chat UI. Call this when the user wants to build or modify automations and no project is currently selected.',
            inputSchema: selectProjectSchema,
            execute: async (input) => {
                if (!availableProjectIds.includes(input.projectId)) {
                    return { success: false, error: `Project ${input.projectId} is not accessible. Available projects: ${availableProjectIds.join(', ')}` }
                }
                await onSelectProject(input.projectId)
                return { success: true, message: `Now working in project ${input.projectId}. You have access to project tools. Proceed with: ${input.reason}` }
            },
        }),
        ap_deselect_project: tool({
            description: 'Clear the project context and return to general chat mode. Call this when the user is done working in the current project.',
            inputSchema: z.object({}),
            execute: async () => {
                if (isNil(currentProjectId)) {
                    return { success: false, error: 'No project is currently selected.' }
                }
                await onDeselectProject()
                return { success: true, message: 'Project context cleared. You no longer have access to project tools.' }
            },
        }),
    }
}

type CreateChatToolsParams = {
    onSessionTitle: (title: string) => void
    onSelectProject: (projectId: string) => Promise<void>
    onDeselectProject: () => Promise<void>
    currentProjectId: string | null
    availableProjectIds: string[]
}

export { createChatTools }
