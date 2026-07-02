import { isNil, Permission, tryCatch } from '@activepieces/core-utils'
import { McpToolDefinition, ProjectScopedMcpServer } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { recordService } from '../../tables/record/record.service'
import { mcpUtils } from './mcp-utils'
import { resolveFieldNamesForTable, resolveInternalTableId, tableNotFoundError } from './table-utils'

const updateRecordsInput = z.object({
    tableId: z.string().describe('The table ID'),
    recordIds: z.array(z.string()).min(1).describe('The record IDs to update — pass the FULL array in ONE call (no per-row loop). Get them from the Active-context excerpt (the `[id …]` tag on each row) or ap_find_records.'),
    fields: z.record(z.string(), z.string()).describe('Object mapping field names to new values, applied to EVERY listed record. Only specified fields are changed. Example: {"Category": "DevTools"}'),
    displayName: z.string().optional().describe('Short label for the action pill (e.g. "Set Category=DevTools on 4 rows").'),
})

export const apUpdateRecordsTool = (mcp: ProjectScopedMcpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_update_records',
        permission: Permission.WRITE_TABLE,
        description: 'Set the same field value(s) on MANY rows at once — the bulk sibling of ap_update_record. Pass the full recordIds array and one fields object; every listed row gets those values. Use this for "set these to X", "update rows 2-5", "mark the selected ones …" — one call, the rows animate live in the Stage. For different values per row, use separate ap_update_record calls. This (or ap_update_record) is the ONLY way to edit table rows — never via ap_run_code or fetch().',
        inputSchema: updateRecordsInput.shape,
        annotations: { destructiveHint: false, idempotentHint: true, openWorldHint: false },
        execute: async (args) => {
            try {
                const { tableId, recordIds, fields: fieldValues } = updateRecordsInput.parse(args)

                const fieldNames = Object.keys(fieldValues)
                if (fieldNames.length === 0) {
                    return { content: [{ type: 'text', text: '❌ No fields provided to update.' }] }
                }

                const resolvedTableId = await resolveInternalTableId({ projectId: mcp.projectId, tableId })
                if (isNil(resolvedTableId)) {
                    return tableNotFoundError(tableId)
                }

                const { fieldMap, errors } = await resolveFieldNamesForTable(mcp.projectId, resolvedTableId, fieldNames)
                if (errors.length > 0) {
                    return { content: [{ type: 'text', text: `❌ Field resolution error:\n${errors.join('\n')}` }] }
                }

                const cells = Object.entries(fieldValues).map(([fieldName, value]) => ({
                    fieldId: fieldMap.get(fieldName)!,
                    value,
                }))

                const failed: { id: string, error: string }[] = []
                const unverified: string[] = []
                let updatedCount = 0
                for (const recordId of recordIds) {
                    const { data: updatedRecord, error } = await tryCatch(() => recordService.update({
                        id: recordId,
                        projectId: mcp.projectId,
                        request: { tableId: resolvedTableId, cells },
                    }))
                    if (error || isNil(updatedRecord)) {
                        failed.push({ id: recordId, error: error instanceof Error ? error.message : String(error) })
                        continue
                    }
                    updatedCount++
                    const reflectsNewValues = cells.every(({ fieldId, value }) => {
                        const cell = updatedRecord.cells[fieldId]
                        return !isNil(cell) && String(cell.value ?? '').trim() === String(value ?? '').trim()
                    })
                    if (!reflectsNewValues) {
                        unverified.push(recordId)
                    }
                }

                const verifiedCount = updatedCount - unverified.length
                const summary = unverified.length === 0
                    ? `✅ Updated ${updatedCount} of ${recordIds.length} record(s) — set ${fieldNames.join(', ')} (read back and verified).`
                    : `✅ Updated ${updatedCount} of ${recordIds.length} record(s) — set ${fieldNames.join(', ')}. Verified ${verifiedCount}; ${unverified.length} did NOT reflect the new value on read-back (${unverified.join(', ')}) — recheck before reporting these as done.`
                const failureNote = failed.length > 0
                    ? `\n⚠️ ${failed.length} could not be updated (skipped): ${failed.map((f) => f.id).join(', ')}.`
                    : ''
                return {
                    content: [{ type: 'text', text: `${summary}${failureNote}` }],
                    structuredContent: {
                        requested: recordIds.length,
                        succeeded: updatedCount,
                        verified: verifiedCount,
                        failed: failed.length,
                        unverifiedIds: unverified,
                        failedIds: failed.map((f) => f.id),
                    },
                }
            }
            catch (err) {
                log.error({ error: err, project: { id: mcp.projectId } }, 'ap_update_records failed')
                return mcpUtils.mcpToolError('Failed to update records', err)
            }
        },
    }
}
