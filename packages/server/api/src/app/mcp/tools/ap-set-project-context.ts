import { isNil, McpToolDefinition } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { projectService } from '../../project/project-service'
import { userService } from '../../user/user-service'
import { mcpProjectSelection, ProjectSelectionScope } from '../mcp-project-selection'

export const apSetProjectContextTool = ({ platformId, userId, selectionScope, log }: {
    platformId: string
    userId: string
    selectionScope: ProjectSelectionScope
    log: FastifyBaseLogger
}): McpToolDefinition => ({
    title: 'ap_set_project_context',
    description: 'Set or clear the active project context. All tools require a project context to operate. Call with a projectId to select a project, or without to clear the selection. Always returns the list of available projects.',
    inputSchema: {
        projectId: z.string().optional().describe('The project ID to select. Omit to clear the current selection and list available projects.'),
    },
    annotations: {
        readOnlyHint: false,
        idempotentHint: true,
    },
    execute: async (args: Record<string, unknown>) => {
        const projectId = args.projectId as string | undefined

        const user = await userService(log).getOneOrFail({ id: userId })
        const projects = await projectService(log).getAllForUser({
            platformId,
            userId,
            isPrivileged: userService(log).isUserPrivileged(user),
        })

        if (!isNil(projectId) && projectId !== '') {
            const targetProject = projects.find(p => p.id === projectId)
            if (!targetProject) {
                const projectList = projects.map(p => `- ${p.displayName} (${p.id})`).join('\n')
                return {
                    content: [{
                        type: 'text' as const,
                        text: `Project not found or you don't have access to it.\n\nAvailable projects:\n${projectList}`,
                    }],
                }
            }
            await mcpProjectSelection.set({ scope: selectionScope, projectId })
            const projectList = projects.map(p => {
                const marker = p.id === projectId ? '>' : ' '
                return `${marker} ${p.displayName} (${p.id})`
            }).join('\n')
            return {
                content: [{
                    type: 'text' as const,
                    text: `Project context set to "${targetProject.displayName}".\n\nAll tools will now operate on this project. Use ap_set_project_context without a projectId to clear the selection.\n\nAvailable projects:\n${projectList}`,
                }],
            }
        }

        await mcpProjectSelection.clear(selectionScope)
        const projectList = projects.map(p => `- ${p.displayName} (${p.id})`).join('\n')
        return {
            content: [{
                type: 'text' as const,
                text: `Project context cleared.\n\nAvailable projects:\n${projectList}\n\nUse ap_set_project_context with a projectId to select one.`,
            }],
        }
    },
})
