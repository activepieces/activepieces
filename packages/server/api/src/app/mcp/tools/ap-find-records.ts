import { isNil, Permission } from '@activepieces/core-utils'
import { Filter, FilterOperator, McpToolDefinition, ProjectScopedMcpServer } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { fieldService } from '../../tables/field/field.service'
import { recordService } from '../../tables/record/record.service'
import { mcpUtils } from './mcp-utils'
import { tableToolInput } from './table-tool-input'
import { resolveInternalTableId, tableNotFoundError } from './table-utils'

const DEFAULT_LIMIT = 10
const PREVIEW_VALUE_LENGTH = 200

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

const VALUELESS_OPERATORS = new Set<FilterOperator>([FilterOperator.EXISTS, FilterOperator.NOT_EXISTS])

const operatorSchema = z.enum(OPERATOR_VALUES)

const findRecordsInput = z.object({
    tableId: z.string().describe('The table ID. Use ap_list_tables to find it.'),
    filters: z.array(z.object({
        fieldName: z.string().describe('Field name (or field id) to filter on'),
        operator: operatorSchema.describe('Filter operator'),
        value: z.string().optional().describe('Filter value (required for all operators except exists/not_exists)'),
    })).optional().describe('Optional filters. All filters are combined with AND logic.'),
    fields: z.array(z.string()).optional().describe('Field names (or ids) to return. Omit for all fields.'),
    limit: z.number().min(1).max(500).optional().describe(`Max records to return (default ${DEFAULT_LIMIT}, max 500)`),
    fullValues: z.boolean().optional().describe(`Return full cell values instead of truncating at ${PREVIEW_VALUE_LENGTH} chars`),
})

export const apFindRecordsTool = (mcp: ProjectScopedMcpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_find_records',
        permission: Permission.READ_TABLE,
        description: `Query records from a table with optional AND filters. Returns a compact preview (default ${DEFAULT_LIMIT} records, long values truncated) and whether more match; pass fields to pick columns. Operators: eq, neq, gt, gte, lt, lte, co, exists, not_exists.`,
        inputSchema: findRecordsInput.shape,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        execute: async (args) => {
            try {
                const { tableId, filters, fields: requestedFields, limit, fullValues } = findRecordsInput.parse(args)
                const effectiveLimit = limit ?? DEFAULT_LIMIT

                const resolvedTableId = await resolveInternalTableId({ projectId: mcp.projectId, tableId })
                if (isNil(resolvedTableId)) {
                    return tableNotFoundError(tableId)
                }

                const tableFields = await fieldService.getAll({ projectId: mcp.projectId, tableId: resolvedTableId })
                const filterList = filters ?? []
                const { fieldMap, errors } = tableToolInput.resolveFieldKeys({
                    fields: tableFields,
                    keys: [...filterList.map(f => f.fieldName), ...(requestedFields ?? [])],
                })
                const valueErrors = filterList
                    .filter(f => !VALUELESS_OPERATORS.has(f.operator) && f.value === undefined)
                    .map(f => `Filter on "${f.fieldName}" with operator "${f.operator}" requires a value.`)
                if (errors.length > 0 || valueErrors.length > 0) {
                    return { content: [{ type: 'text', text: `❌ Filter error:\n${[...errors, ...valueErrors].join('\n')}` }] }
                }

                const resolvedFilters = filterList.flatMap(f => {
                    const field = fieldMap.get(f.fieldName)
                    if (isNil(field)) {
                        return []
                    }
                    return [Filter.parse({ fieldId: field.id, operator: f.operator, value: f.value })]
                })

                const result = await recordService.list({
                    tableId: resolvedTableId,
                    projectId: mcp.projectId,
                    filters: resolvedFilters.length > 0 ? resolvedFilters : null,
                    limit: effectiveLimit + 1,
                    cursorRequest: null,
                    fields: tableFields,
                })
                const hasMore = result.data.length > effectiveLimit

                if (result.data.length === 0) {
                    return {
                        content: [{ type: 'text', text: 'No records found.' }],
                        structuredContent: { records: [], count: 0, hasMore: false },
                    }
                }

                const selectedFieldIds = isNil(requestedFields) || requestedFields.length === 0
                    ? null
                    : new Set(requestedFields.flatMap(k => fieldMap.get(k)?.id ?? []))
                const maxValueLength = fullValues ? Number.MAX_SAFE_INTEGER : PREVIEW_VALUE_LENGTH
                const records = result.data.slice(0, effectiveLimit).map(r => ({
                    id: r.id,
                    cells: Object.fromEntries(
                        Object.entries(r.cells)
                            .filter(([fieldId]) => isNil(selectedFieldIds) || selectedFieldIds.has(fieldId))
                            .map(([fieldId, c]) => [c.fieldName ?? fieldId, tableToolInput.truncateValue({ value: c.value, max: maxValueLength })]),
                    ),
                }))

                const lines = records.map(r => `- ${r.id}: ${Object.entries(r.cells).map(([k, v]) => `${k}=${isNil(v) ? '(empty)' : String(v)}`).join(' | ')}`)
                const moreNote = hasMore ? '\n\nMore records match. Raise limit or narrow with filters.' : ''
                return {
                    content: [{
                        type: 'text',
                        text: `Showing ${records.length} record(s):\n${lines.join('\n')}${moreNote}`,
                    }],
                    structuredContent: { records, count: records.length, hasMore },
                }
            }
            catch (err) {
                log.error({ error: err, project: { id: mcp.projectId } }, 'ap_find_records failed')
                return mcpUtils.mcpToolError('Failed to find records', err)
            }
        },
    }
}
