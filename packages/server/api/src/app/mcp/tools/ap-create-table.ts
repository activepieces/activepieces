import { apId, Permission } from '@activepieces/core-utils'
import { FieldType, McpToolDefinition, ProjectScopedMcpServer } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { fieldService } from '../../tables/field/field.service'
import { tableService } from '../../tables/table/table.service'
import { mcpUtils } from './mcp-utils'
import { tableToolInput } from './table-tool-input'
import { formatFieldInfo } from './table-utils'

const createTableInput = z.object({
    name: z.string().describe('The name of the table'),
    fields: tableToolInput.createTableFieldsSchema.describe('Fields to create as a list of {name, type}, e.g. [{"name":"Email","type":"TEXT"}]. Max 100.'),
    folderName: mcpUtils.FOLDER_NAME_SCHEMA,
})

export const apCreateTableTool = (mcp: ProjectScopedMcpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_create_table',
        permission: Permission.WRITE_TABLE,
        description: 'Create a new table with fields given as [{name, type}]. Types (case-insensitive): TEXT, NUMBER, DATE, DATETIME, STATIC_DROPDOWN (needs options). Returns field ids keyed by field name. DATE and DATETIME both hold an ISO-8601 UTC timestamp; DATETIME additionally shows and edits the time of day.',
        inputSchema: createTableInput.shape,
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
        execute: async (args) => {
            try {
                const { name, fields: rawFields, folderName } = createTableInput.parse(args)
                const { fields, errors } = tableToolInput.normalizeCreateFields(rawFields)
                if (errors.length > 0) {
                    return { content: [{ type: 'text', text: `❌ ${errors.join('\n')}` }] }
                }

                for (const field of fields) {
                    if (field.type === FieldType.STATIC_DROPDOWN && (!field.options || field.options.length === 0)) {
                        return { content: [{ type: 'text', text: `❌ Field "${field.name}" is STATIC_DROPDOWN but no options provided.` }] }
                    }
                }

                const folder = await mcpUtils.resolveFolder({ projectId: mcp.projectId, folderName, log })
                if (folder.error) {
                    return folder.error
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
                        folderId: folder.folderId,
                    },
                })

                const createdFields = await fieldService.getAll({
                    projectId: mcp.projectId,
                    tableId: table.id,
                })

                const fieldLines = createdFields.map(f => `  - ${formatFieldInfo(f)}`).join('\n')
                const fieldIds = Object.fromEntries(createdFields.map(f => [f.name, f.id]))
                const fieldExternalIds = Object.fromEntries(createdFields.map(f => [f.name, f.externalId]))
                return {
                    content: [{
                        type: 'text',
                        text: `✅ Table "${name}" created (id: ${table.id}, externalId: ${table.externalId})${mcpUtils.folderSuffix(folder.folderName)}\nFields:\n${fieldLines}\nfieldIds: ${JSON.stringify(fieldIds)}\nfieldExternalIds (Tables piece step values keys): ${JSON.stringify(fieldExternalIds)}\n\nℹ️ Use "id" with the record/field tools; use "externalId" as table_id when configuring a Tables piece step in a flow.`,
                    }],
                    structuredContent: {
                        id: table.id,
                        externalId: table.externalId,
                        name: table.name,
                        folderName: folder.folderName ?? null,
                        fields: createdFields.map(f => ({ id: f.id, externalId: f.externalId, name: f.name, type: f.type })),
                        fieldIds,
                        fieldExternalIds,
                    },
                }
            }
            catch (err) {
                log.error({ error: err, project: { id: mcp.projectId } }, 'ap_create_table failed')
                return mcpUtils.mcpToolError('Failed to create table', err)
            }
        },
    }
}
