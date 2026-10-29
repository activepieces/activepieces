import { isNil, Permission } from '@activepieces/core-utils'
import { FlowOperationRequest, FlowOperationType, Folder, McpToolContext, McpToolDefinition } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowService } from '../../flows/flow/flow.service'
import { flowFolderService } from '../../flows/folder/folder.service'
import { projectService } from '../../project/project-service'
import { mcpUtils } from './mcp-utils'

const moveFlowToFolderInput = z.object({
    flowId: z.string().describe('The id of the flow to move'),
    folderName: mcpUtils.FOLDER_NAME_SCHEMA.describe('The folder to move the flow into. An existing folder is matched case-insensitively; a new one is created when no folder has this name.'),
    uncategorized: z.boolean().optional().describe('true to take the flow out of its folder'),
})

export const apMoveFlowToFolderTool = ({ mcp, userId }: McpToolContext, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_move_flow_to_folder',
        permission: Permission.WRITE_FLOW,
        description: 'Move a flow into a folder, creating the folder when no folder has that name, or take it out of its folder with uncategorized=true. Pass exactly one of folderName or uncategorized.',
        inputSchema: moveFlowToFolderInput.shape,
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        execute: async (args) => {
            try {
                const { flowId, folderName, uncategorized } = moveFlowToFolderInput.parse(args)
                const toFolder = !isNil(folderName)
                const toUncategorized = uncategorized === true
                if (toFolder === toUncategorized) {
                    return { content: [{ type: 'text', text: '❌ Pass exactly one of folderName or uncategorized=true.' }], isError: true }
                }
                const flow = await flowService(log).getOnePopulated({ id: flowId, projectId: mcp.projectId })
                if (isNil(flow)) {
                    return { content: [{ type: 'text', text: '❌ Flow not found' }], isError: true }
                }
                const folder = isNil(folderName) ? null : await getOrCreateFolder({ projectId: mcp.projectId, folderName, log })
                const folderId = folder?.id ?? null
                const moved = flow.folderId !== folderId
                if (moved) {
                    const platformId = await projectService(log).getPlatformId(mcp.projectId)
                    const operation: FlowOperationRequest = { type: FlowOperationType.CHANGE_FOLDER, request: { folderId } }
                    await flowService(log).update({ id: flow.id, projectId: mcp.projectId, userId, previousFlow: flow, platformId, operation })
                }
                return {
                    content: [{ type: 'text', text: `✅ Flow "${flow.version.displayName}" ${describeOutcome({ moved, folderName: folder?.displayName })}.` }],
                    structuredContent: { flowId: flow.id, folderId, folderName: folder?.displayName ?? null, moved },
                }
            }
            catch (err) {
                return mcpUtils.mcpToolError('Flow move failed', err)
            }
        },
    }
}

async function getOrCreateFolder({ projectId, folderName, log }: { projectId: string, folderName: string, log: FastifyBaseLogger }): Promise<Pick<Folder, 'id' | 'displayName'>> {
    const existing = await flowFolderService(log).getOneByDisplayNameCaseInsensitive({ projectId, displayName: folderName })
    return existing ?? flowFolderService(log).upsert({ projectId, request: { projectId, displayName: folderName } })
}

function describeOutcome({ moved, folderName }: { moved: boolean, folderName: string | undefined }): string {
    if (isNil(folderName)) {
        return moved ? 'moved out of its folder' : 'is already in no folder'
    }
    return moved ? `moved to folder "${folderName}"` : `is already in folder "${folderName}"`
}
