import {
    apId,
    FlowOperationRequest,
    FlowOperationType,
    isNil,
    McpServer,
    McpToolDefinition,
    NoteColorVariant,
    Permission,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowService } from '../../flows/flow/flow.service'
import { projectService } from '../../project/project-service'
import { mcpToolError } from './mcp-utils'

const manageNotesInput = z.object({
    flowId: z.string(),
    operation: z.enum(['ADD', 'UPDATE', 'DELETE']),
    noteId: z.string().optional(),
    content: z.string().optional(),
    color: z.enum(Object.values(NoteColorVariant) as [NoteColorVariant, ...NoteColorVariant[]]).optional(),
    position: z.object({
        x: z.number(),
        y: z.number(),
    }).optional(),
    size: z.object({
        width: z.number(),
        height: z.number(),
    }).optional(),
})

export const apManageNotesTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_manage_notes',
        permission: Permission.WRITE_FLOW,
        description: 'Add, update, or delete canvas notes on a flow. Notes are visual annotations on the flow canvas.',
        inputSchema: {
            flowId: z.string().describe('The id of the flow'),
            operation: z.enum(['ADD', 'UPDATE', 'DELETE']).describe('Operation to perform: ADD a new note, UPDATE an existing note, or DELETE a note'),
            noteId: z.string().optional().describe('The note ID (required for UPDATE and DELETE)'),
            content: z.string().optional().describe('The text content of the note (required for ADD, optional for UPDATE)'),
            color: z.enum(Object.values(NoteColorVariant) as [NoteColorVariant, ...NoteColorVariant[]]).optional().describe('Note color variant (orange, red, green, blue, purple, yellow). Default: yellow'),
            position: z.object({
                x: z.number(),
                y: z.number(),
            }).optional().describe('Position on the canvas (required for ADD, optional for UPDATE)'),
            size: z.object({
                width: z.number(),
                height: z.number(),
            }).optional().describe('Size of the note (optional, defaults to 200x200)'),
        },
        // destructiveHint is false because ADD and UPDATE are the common paths;
        // DELETE is possible but clients shouldn't over-restrict the whole tool.
        annotations: { destructiveHint: false, idempotentHint: false, openWorldHint: false },
        execute: async (args) => {
            const { flowId, operation: op, noteId, content, color, position, size } = manageNotesInput.parse(args)

            const [flow, project] = await Promise.all([
                flowService(log).getOnePopulated({ id: flowId, projectId: mcp.projectId }),
                projectService(log).getOneOrThrow(mcp.projectId),
            ])
            if (isNil(flow)) {
                return { content: [{ type: 'text', text: '❌ Flow not found' }] }
            }

            let operation: FlowOperationRequest

            switch (op) {
                case 'ADD': {
                    if (!content) {
                        return { content: [{ type: 'text', text: '❌ content is required for ADD operation' }] }
                    }
                    const resolvedPosition = position ?? { x: 100, y: 100 }
                    const resolvedSize = size ?? { width: 200, height: 200 }
                    operation = {
                        type: FlowOperationType.ADD_NOTE,
                        request: {
                            id: apId(),
                            content,
                            color: color ?? NoteColorVariant.YELLOW,
                            position: resolvedPosition,
                            size: resolvedSize,
                        },
                    }
                    break
                }
                case 'UPDATE': {
                    if (!noteId) {
                        return { content: [{ type: 'text', text: '❌ noteId is required for UPDATE operation' }] }
                    }
                    const existing = flow.version.notes?.find((n: { id: string }) => n.id === noteId)
                    if (!existing) {
                        return { content: [{ type: 'text', text: `❌ Note "${noteId}" not found` }] }
                    }
                    operation = {
                        type: FlowOperationType.UPDATE_NOTE,
                        request: {
                            id: noteId,
                            content: content ?? existing.content,
                            color: color ?? existing.color,
                            position: position ?? existing.position,
                            size: size ?? existing.size,
                            ownerId: existing.ownerId,
                        },
                    }
                    break
                }
                case 'DELETE': {
                    if (!noteId) {
                        return { content: [{ type: 'text', text: '❌ noteId is required for DELETE operation' }] }
                    }
                    const noteToDelete = flow.version.notes?.find((n: { id: string }) => n.id === noteId)
                    if (!noteToDelete) {
                        return { content: [{ type: 'text', text: `❌ Note "${noteId}" not found` }] }
                    }
                    operation = {
                        type: FlowOperationType.DELETE_NOTE,
                        request: { id: noteId },
                    }
                    break
                }
            }

            try {
                await flowService(log).update({
                    id: flow.id,
                    projectId: mcp.projectId,
                    userId: null,
                    platformId: project.platformId,
                    operation,
                })
                const messages: Record<string, string> = {
                    ADD: '✅ Note added successfully.',
                    UPDATE: '✅ Note updated successfully.',
                    DELETE: '✅ Note deleted successfully.',
                }
                return { content: [{ type: 'text', text: messages[op] }] }
            }
            catch (err) {
                return mcpToolError('Note operation failed', err)
            }
        },
    }
}
