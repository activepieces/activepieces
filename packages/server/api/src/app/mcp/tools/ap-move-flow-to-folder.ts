import { isNil, Permission } from '@activepieces/core-utils'
import { FlowOperationRequest, FlowOperationType, McpToolContext, McpToolDefinition } from '@activepieces/shared'
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
                if (isNil(folderName) === (uncategorized !== true)) {
                    return { content: [{ type: 'text', text: '❌ Pass exactly one of folderName or uncategorized=true.' }], isError: true }
                }
                const [flow, platformId] = await Promise.all([
                    flowService(log).getOnePopulated({ id: flowId, projectId: mcp.projectId }),
                    projectService(log).getPlatformId(mcp.projectId),
                ])
                if (isNil(flow)) {
                    return { content: [{ type: 'text', text: '❌ Flow not found' }], isError: true }
                }
                const target = isNil(folderName) ? UNCATEGORIZED : await getOrCreateFolder({ projectId: mcp.projectId, folderName, log })
                if (flow.folderId === target.folderId) {
                    return {
                        content: [{ type: 'text', text: `✅ Flow "${flow.version.displayName}" is already ${describeTarget(target)}.` }],
                        structuredContent: { flowId: flow.id, ...target, moved: false },
                    }
                }
                const operation: FlowOperationRequest = { type: FlowOperationType.CHANGE_FOLDER, request: { folderId: target.folderId } }
                await flowService(log).update({ id: flow.id, projectId: mcp.projectId, userId, previousFlow: flow, platformId, operation })
                return {
                    content: [{ type: 'text', text: `✅ Flow "${flow.version.displayName}" moved ${isNil(target.folderId) ? 'out of its folder' : `to folder "${target.folderName}"`}${target.created ? ' (new folder)' : ''}.` }],
                    structuredContent: { flowId: flow.id, ...target, moved: true },
                }
            }
            catch (err) {
                return mcpUtils.mcpToolError('Flow move failed', err)
            }
        },
    }
}

async function getOrCreateFolder({ projectId, folderName, log }: { projectId: string, folderName: string, log: FastifyBaseLogger }): Promise<MoveTarget> {
    const folders = flowFolderService(log)
    const existing = await folders.getOneByDisplayNameCaseInsensitive({ projectId, displayName: folderName })
    const folder = existing ?? await folders.upsert({ projectId, request: { projectId, displayName: folderName } })
    return { folderId: folder.id, folderName: folder.displayName, created: isNil(existing) }
}

function describeTarget(target: MoveTarget): string {
    return isNil(target.folderId) ? 'in no folder' : `in folder "${target.folderName}"`
}

const UNCATEGORIZED: MoveTarget = { folderId: null, folderName: null, created: false }

type MoveTarget = {
    folderId: string | null
    folderName: string | null
    created: boolean
}
