import { isNil, Permission } from '@activepieces/core-utils'
import { Filter, FilterOperator, McpToolDefinition, ProjectScopedMcpServer } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { recordService } from '../../tables/record/record.service'
import { mcpUtils } from './mcp-utils'
import { resolveFieldNamesForTable, resolveInternalTableId, tableNotFoundError } from './table-utils'

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

const deleteRecordsInput = z.object({
    tableId: z.string().optional().describe('The table ID the records belong to (the "id" from ap_list_tables/ap_find_records). Pass it so the open Stage shows live deletions. Required when using filters.'),
    recordIds: z.array(z.string()).optional().describe('Array of record IDs to delete — pass the FULL array in ONE call (no cap). Use ap_find_records to find them.'),
    filters: z.array(z.object({
        fieldName: z.string().describe('The field name to filter on'),
        operator: operatorSchema.describe('Filter operator'),
        value: z.string().optional().describe('Filter value (required for all operators except exists/not_exists)'),
    })).optional().describe('Delete every row matching these filters (combined with AND) in one server-side operation — no need to fetch ids first. Requires tableId. Filters MUST encode the user\'s actual stated condition. Do NOT fabricate a catch-all predicate (e.g. "exists" on a column that is always populated) to stand in for a positional or count-based selection like "rows 9-12" or "the first 5" — those have no filter form: use ap_find_records to get their ids and pass recordIds instead. To empty the WHOLE table, use ap_clear_table.'),
    displayName: z.string().optional().describe('Short approval prompt shown to the user (e.g. "Delete 3 records from Emails table"). Must include what the action does and the target name.'),
})

export const apDeleteRecordsTool = (mcp: ProjectScopedMcpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_delete_records',
        permission: Permission.WRITE_TABLE,
        description: 'Delete table rows (reversible — restore with ap_restore_records using the ids this returns). Two ways: (1) by id — pass the FULL recordIds array in ONE call (no cap; ap_find_records returns them); or (2) by filters — pass tableId + filters to delete every matching row server-side in one shot (no 500-id paging). A filter that would match EVERY row is rejected — use ap_clear_table to empty the whole table. This is the ONLY way to delete table rows: never script deletion with ap_run_code or fetch().',
        inputSchema: deleteRecordsInput.shape,
        annotations: { destructiveHint: true, openWorldHint: false },
        execute: async (args) => {
            try {
                const { tableId, recordIds, filters } = deleteRecordsInput.parse(args)

                if (filters && filters.length > 0) {
                    if (isNil(tableId)) {
                        return { content: [{ type: 'text', text: '❌ tableId is required when deleting by filters.' }] }
                    }
                    const resolvedTableId = await resolveInternalTableId({ projectId: mcp.projectId, tableId })
                    if (isNil(resolvedTableId)) {
                        return tableNotFoundError(tableId)
                    }

                    const fieldNames = filters.map(f => f.fieldName)
                    const { fieldMap, errors } = await resolveFieldNamesForTable(mcp.projectId, resolvedTableId, fieldNames)
                    for (const filter of filters) {
                        if (filter.operator !== FilterOperator.EXISTS && filter.operator !== FilterOperator.NOT_EXISTS && filter.value === undefined) {
                            errors.push(`Filter on "${filter.fieldName}" with operator "${filter.operator}" requires a value.`)
                        }
                    }
                    if (errors.length > 0) {
                        return { content: [{ type: 'text', text: `❌ Filter error:\n${errors.join('\n')}` }] }
                    }

                    const resolvedFilters: Filter[] = filters.map((f) => {
                        const fieldId = fieldMap.get(f.fieldName)!
                        if (f.operator === FilterOperator.EXISTS || f.operator === FilterOperator.NOT_EXISTS) {
                            return { fieldId, operator: f.operator }
                        }
                        return { fieldId, operator: f.operator, value: f.value! }
                    })

                    const { matched, total } = await recordService.countByFilter({
                        tableId: resolvedTableId,
                        projectId: mcp.projectId,
                        filters: resolvedFilters,
                    })
                    if (total > 0 && matched === total) {
                        return { content: [{ type: 'text', text: `❌ This filter matches all ${total} row(s) in the table — that would empty the whole table, which is almost never what "delete some rows" means. If you really want to empty it, use ap_clear_table. To delete specific rows (e.g. a positional range like "rows 9-12"), look them up with ap_find_records and pass their recordIds.` }] }
                    }

                    const deleted = await recordService.deleteByFilter({
                        tableId: resolvedTableId,
                        projectId: mcp.projectId,
                        filters: resolvedFilters,
                    })

                    const verified = deleted.length === matched
                    const verifyNote = verified
                        ? ' — verified (removed exactly the matching rows).'
                        : ` — ⚠️ expected to remove ${matched} but removed ${deleted.length}; recheck before reporting done.`
                    return {
                        content: [{ type: 'text', text: `✅ Deleted ${deleted.length} of ${matched} matching record(s)${verifyNote} Restore them with ap_restore_records (ids: ${deleted.map((r) => r.id).join(', ')}).` }],
                        structuredContent: { matched, deleted: deleted.length, verified },
                    }
                }

                if (isNil(recordIds) || recordIds.length === 0) {
                    return { content: [{ type: 'text', text: '❌ Provide recordIds or filters to delete.' }] }
                }

                const deleted = await recordService.delete({
                    ids: recordIds,
                    projectId: mcp.projectId,
                })

                const verified = deleted.length === recordIds.length
                const verifyNote = verified
                    ? ''
                    : ` ⚠️ ${recordIds.length - deleted.length} of the ${recordIds.length} requested id(s) were not found/deleted — do not report those as removed.`
                return {
                    content: [{
                        type: 'text',
                        text: `✅ Deleted ${deleted.length} of ${recordIds.length} requested record(s).${verifyNote} Restore them with ap_restore_records (ids: ${deleted.map((r) => r.id).join(', ')}).`,
                    }],
                    structuredContent: { requested: recordIds.length, deleted: deleted.length, verified },
                }
            }
            catch (err) {
                log.error({ error: err, project: { id: mcp.projectId } }, 'ap_delete_records failed')
                return mcpUtils.mcpToolError('Failed to delete records', err)
            }
        },
    }
}
