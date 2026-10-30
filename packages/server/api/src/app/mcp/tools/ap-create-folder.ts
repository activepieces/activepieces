import { Permission } from '@activepieces/core-utils'
import { McpToolDefinition, ProjectScopedMcpServer } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowFolderService } from '../../flows/folder/folder.service'
import { mcpUtils } from './mcp-utils'

const createFolderInput = z.object({
    folderName: mcpUtils.FOLDER_NAME_SCHEMA.unwrap().describe('The folder name, e.g. the solution being built ("Order intake")'),
})

export const apCreateFolderTool = (mcp: ProjectScopedMcpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_create_folder',
        permission: Permission.WRITE_FLOW,
        description: 'Create a folder to hold one solution\'s flows and tables, or get it if a folder with that name already exists. Call it once before building a solution of several flows and tables, then pass the same folderName to ap_create_flow, ap_build_flow and ap_create_table.',
        inputSchema: createFolderInput.shape,
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        execute: async (args) => {
            try {
                const { folderName } = createFolderInput.parse(args)
                const folder = await flowFolderService(log).upsert({
                    projectId: mcp.projectId,
                    request: { projectId: mcp.projectId, displayName: folderName },
                })
                return {
                    content: [{ type: 'text', text: `✅ Folder "${folder.displayName}" is ready (id: ${folder.id}). Pass folderName "${folder.displayName}" when creating this solution's flows and tables.` }],
                    structuredContent: { folderId: folder.id, folderName: folder.displayName },
                }
            }
            catch (err) {
                return mcpUtils.mcpToolError('Failed to create folder', err)
            }
        },
    }
}
