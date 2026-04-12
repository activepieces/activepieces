import { FieldType, isNil, McpServer, McpToolDefinition, Permission } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { fieldService } from '../../tables/field/field.service'
import { mcpToolError } from './mcp-utils'
import { fieldTypeSchema, formatFieldInfo } from './table-utils'

const manageFieldsInput = z.object({
    tableId: z.string().describe('The table ID'),
    operation: z.enum(['ADD', 'UPDATE', 'DELETE']).describe('ADD a new field, UPDATE (rename) an existing field, or DELETE a field'),
    fieldId: z.string().optional().describe('The field ID (required for UPDATE and DELETE). Use ap_list_tables to find it.'),
    name: z.string().optional().describe('Field name (required for ADD and UPDATE)'),
    type: fieldTypeSchema.optional().describe('Field type (required for ADD only)'),
    options: z.array(z.string()).optional().describe('Dropdown options (required for ADD with STATIC_DROPDOWN type)'),
})

export const apManageFieldsTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_manage_fields',
        permission: Permission.WRITE_TABLE,
        description: 'Add, rename, or delete fields (columns) on a table. Use ap_list_tables to see existing fields and their IDs. Max 100 fields per table.',
        inputSchema: manageFieldsInput.shape,
        annotations: { destructiveHint: false, idempotentHint: false, openWorldHint: false },
        execute: async (args) => {
            try {
                const { tableId, operation, fieldId, name, type, options } = manageFieldsInput.parse(args)

                switch (operation) {
                    case 'ADD': {
                        if (isNil(name)) {
                            return { content: [{ type: 'text', text: '❌ name is required for ADD operation' }] }
                        }
                        if (isNil(type)) {
                            return { content: [{ type: 'text', text: '❌ type is required for ADD operation' }] }
                        }
                        if (type === FieldType.STATIC_DROPDOWN && (isNil(options) || options.length === 0)) {
                            return { content: [{ type: 'text', text: '❌ options are required for STATIC_DROPDOWN type' }] }
                        }

                        const request = type === FieldType.STATIC_DROPDOWN
                            ? { name, type, tableId, data: { options: (options ?? []).map(v => ({ value: v })) } }
                            : { name, type, tableId }

                        const field = await fieldService.create({
                            projectId: mcp.projectId,
                            request,
                        })
                        return { content: [{ type: 'text', text: `✅ Field added: ${formatFieldInfo(field)}` }] }
                    }
                    case 'UPDATE': {
                        if (isNil(fieldId)) {
                            return { content: [{ type: 'text', text: '❌ fieldId is required for UPDATE operation' }] }
                        }
                        if (isNil(name)) {
                            return { content: [{ type: 'text', text: '❌ name is required for UPDATE operation' }] }
                        }
                        const existing = await fieldService.getById({ id: fieldId, projectId: mcp.projectId })
                        if (existing.tableId !== tableId) {
                            return { content: [{ type: 'text', text: `❌ Field (id: ${fieldId}) does not belong to table (id: ${tableId})` }] }
                        }
                        const field = await fieldService.update({
                            id: fieldId,
                            projectId: mcp.projectId,
                            request: { name },
                        })
                        return { content: [{ type: 'text', text: `✅ Field renamed: ${formatFieldInfo(field)}` }] }
                    }
                    case 'DELETE': {
                        if (isNil(fieldId)) {
                            return { content: [{ type: 'text', text: '❌ fieldId is required for DELETE operation' }] }
                        }
                        const toDelete = await fieldService.getById({ id: fieldId, projectId: mcp.projectId })
                        if (toDelete.tableId !== tableId) {
                            return { content: [{ type: 'text', text: `❌ Field (id: ${fieldId}) does not belong to table (id: ${tableId})` }] }
                        }
                        await fieldService.delete({
                            id: fieldId,
                            projectId: mcp.projectId,
                        })
                        return { content: [{ type: 'text', text: `✅ Field "${toDelete.name}" deleted successfully.` }] }
                    }
                }
            }
            catch (err) {
                log.error({ err, projectId: mcp.projectId }, 'ap_manage_fields failed')
                return mcpToolError('Field operation failed', err)
            }
        },
    }
}
