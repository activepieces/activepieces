import { Cursor, Permission } from '@activepieces/core-utils'
import { FolderDto, McpToolDefinition, ProjectScopedMcpServer } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowFolderService } from '../../flows/folder/folder.service'
import { mcpUtils } from './mcp-utils'

export const apListFoldersTool = (mcp: ProjectScopedMcpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_list_folders',
        permission: Permission.READ_FLOW,
        description: 'List the folders in the current project with how many flows and tables each holds. Use it to reuse an existing folder name instead of creating a near-duplicate.',
        inputSchema: {},
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        execute: async () => {
            try {
                const folders = (await listAllFolders({ projectId: mcp.projectId, log })).map((folder) => ({
                    id: folder.id,
                    displayName: folder.displayName,
                    numberOfFlows: folder.numberOfFlows,
                    numberOfTables: folder.numberOfTables,
                }))
                if (folders.length === 0) {
                    return {
                        content: [{ type: 'text', text: 'No folders in this project. Create one with ap_create_folder.' }],
                        structuredContent: { folders, count: 0 },
                    }
                }
                const lines = folders.map((f) => `- ${f.displayName} (id: ${f.id}): ${plural({ count: f.numberOfFlows, noun: 'flow' })}, ${plural({ count: f.numberOfTables, noun: 'table' })}`)
                return {
                    content: [{ type: 'text', text: `✅ ${plural({ count: folders.length, noun: 'folder' })}:\n${lines.join('\n')}` }],
                    structuredContent: { folders, count: folders.length },
                }
            }
            catch (err) {
                return mcpUtils.mcpToolError('Folder listing failed', err)
            }
        },
    }
}

async function listAllFolders({ projectId, log }: { projectId: string, log: FastifyBaseLogger }): Promise<FolderDto[]> {
    const folders: FolderDto[] = []
    let cursor: Cursor | null = null
    do {
        const page = await flowFolderService(log).list({ projectId, cursorRequest: cursor, limit: PAGE_SIZE })
        folders.push(...page.data)
        cursor = page.next
    } while (cursor !== null)
    return folders
}

function plural({ count, noun }: { count: number, noun: string }): string {
    return `${count} ${noun}${count === 1 ? '' : 's'}`
}

const PAGE_SIZE = 100
