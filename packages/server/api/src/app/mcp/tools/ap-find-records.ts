import { FilterOperator, McpServer, McpToolDefinition, Permission } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { recordService } from '../../tables/record/record.service'
import { mcpUtils } from './mcp-utils'
import { formatPopulatedRecord, resolveFieldNamesForTable } from './table-utils'

const OPERATOR_VALUES = [
    FilterOperator.EQ,
    FilterOperator.NEQ,
    FilterOperator.GT,
    FilterOperator.GTE,
    FilterOperator.LT,
    FilterOperator.LTE,
    FilterOperator.CO,
    FilterOperator.EXISTS,
    FilterOperator.NOT_EXISTS,
] as const

const operatorSchema = z.enum(OPERATOR_VALUES)

const findRecordsInput = z.object({
    tableId: z.string().describe('The table ID. Use ap_list_tables to find it.'),
    filters: z.array(z.object({
        fieldName: z.string().describe('The field name to filter on'),
        operator: operatorSchema.describe('Filter operator'),
        value: z.string().optional().describe('Filter value (required for all operators except exists/not_exists)'),
    })).optional().describe('Optional filters. All filters are combined with AND logic.'),
    limit: z.number().min(1).max(500).optional().describe('Max records to return (default 50, max 500)'),
})

export const apFindRecordsTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_find_records',
        permission: Permission.READ_TABLE,
        description: 'Query records from a table with optional filtering. Operators: eq, neq, gt, gte, lt, lte, co, exists, not_exists.',
        inputSchema: findRecordsInput.shape,
        annotations: { readOnlyHint: true, openWorldHint: false },
        execute: async (args) => {
            try {
                const { tableId, filters, limit } = findRecordsInput.parse(args)
                const effectiveLimit = limit ?? 50

                let resolvedFilters = null
                let fields = undefined
                if (filters && filters.length > 0) {
                    const fieldNames = filters.map(f => f.fieldName)
                    const resolved = await resolveFieldNamesForTable(mcp.projectId, tableId, fieldNames)
                    fields = resolved.fields

                    for (const filter of filters) {
                        if (filter.operator !== FilterOperator.EXISTS && filter.operator !== FilterOperator.NOT_EXISTS && filter.value === undefined) {
                            resolved.errors.push(`Filter on "${filter.fieldName}" with operator "${filter.operator}" requires a value.`)
                        }
                    }

                    if (resolved.errors.length > 0) {
                        return { content: [{ type: 'text', text: `❌ Filter error:\n${resolved.errors.join('\n')}` }] }
                    }

                    resolvedFilters = filters.map(f => {
                        const fieldId = resolved.fieldMap.get(f.fieldName)!
                        if (f.operator === FilterOperator.EXISTS || f.operator === FilterOperator.NOT_EXISTS) {
                            return { fieldId, operator: f.operator }
                        }
                        return { fieldId, operator: f.operator, value: f.value! }
                    })
                }

                const result = await recordService.list({
                    tableId,
                    projectId: mcp.projectId,
                    filters: resolvedFilters,
                    limit: effectiveLimit,
                    cursorRequest: null,
                    fields,
                })

                if (result.data.length === 0) {
                    return { content: [{ type: 'text', text: 'No records found.' }] }
                }

                const formatted = result.data.map(r => formatPopulatedRecord(r)).join('\n\n')
                return {
                    content: [{
                        type: 'text',
                        text: `Found ${result.data.length} record(s):\n\n${formatted}`,
                    }],
                }
            }
            catch (err) {
                log.error({ err, projectId: mcp.projectId }, 'ap_find_records failed')
                return mcpUtils.mcpToolError('Failed to find records', err)
            }
        },
    }
}
