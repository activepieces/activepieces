import { apId, FieldType, McpServer, McpToolDefinition } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { fieldService } from '../../tables/field/field.service'
import { tableService } from '../../tables/table/table.service'
import { mcpToolError } from './mcp-utils'
import { fieldTypeSchema, formatFieldInfo } from './table-utils'

const createTableInput = z.object({
    name: z.string().describe('The name of the table'),
    fields: z.array(z.object({
        name: z.string().describe('Field name'),
        type: fieldTypeSchema.describe('Field type'),
        options: z.array(z.string()).optional().describe('Dropdown options (required when type is STATIC_DROPDOWN)'),
    })).describe('Fields to create. Max 100 fields per table.'),
})

export const apCreateTableTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_create_table',
        description: 'Create a new table with an initial set of fields. Field types: TEXT, NUMBER, DATE, STATIC_DROPDOWN (requires options). The new table will be empty — use ap_insert_records to add data.',
        inputSchema: createTableInput.shape,
        annotations: { destructiveHint: false, idempotentHint: false, openWorldHint: false },
        execute: async (args) => {
            try {
                const { name, fields } = createTableInput.parse(args)

                for (const field of fields) {
                    if (field.type === FieldType.STATIC_DROPDOWN && (!field.options || field.options.length === 0)) {
                        return { content: [{ type: 'text', text: `❌ Field "${field.name}" is STATIC_DROPDOWN but no options provided.` }] }
                    }
                }

                const fieldStates = fields.map(f => ({
                    name: f.name,
                    type: f.type,
                    externalId: apId(),
                    data: f.type === FieldType.STATIC_DROPDOWN
                        ? { options: (f.options ?? []).map(v => ({ value: v })) }
                        : null,
                }))

                const table = await tableService.create({
                    projectId: mcp.projectId,
                    request: {
                        projectId: mcp.projectId,
                        name,
                        fields: fieldStates,
                    },
                })

                const createdFields = await fieldService.getAll({
                    projectId: mcp.projectId,
                    tableId: table.id,
                })

                const fieldLines = createdFields.map(f => `  - ${formatFieldInfo(f)}`).join('\n')
                return {
                    content: [{
                        type: 'text',
                        text: `✅ Table "${name}" created (id: ${table.id})\nFields:\n${fieldLines}`,
                    }],
                }
            }
            catch (err) {
                log.error({ err, projectId: mcp.projectId }, 'ap_create_table failed')
                return mcpToolError('Failed to create table', err)
            }
        },
    }
}
