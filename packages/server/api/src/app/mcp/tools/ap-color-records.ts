import { isNil, Permission } from '@activepieces/core-utils'
import { McpToolDefinition, ProjectScopedMcpServer, SetRecordColorsRequest, TableColor } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { recordService } from '../../tables/record/record.service'
import { mcpUtils } from './mcp-utils'
import { resolveFieldNamesForTable, resolveInternalTableId, tableNotFoundError } from './table-utils'

const PALETTE_KEYS = Object.values(TableColor)
const PALETTE_HINT = PALETTE_KEYS.map((key) => key.toLowerCase()).join(', ')

const colorRecordsInput = z.object({
    tableId: z.string().describe('The table ID'),
    recordIds: z.array(z.string()).min(1).describe('The record IDs to color — pass the FULL array in ONE call (no per-row loop). Get them from the Active-context excerpt (the `[id …]` tag on each row) or ap_find_records.'),
    color: z.string().describe(`A palette color: ${PALETTE_KEYS.map((key) => key.toLowerCase()).join(', ')}. Use "none" to remove color. Colors are a fixed curated palette — these names only, never hex.`),
    field: z.string().optional().describe('Optional field NAME. Omit to tint the WHOLE ROW (preferred for "highlight these rows"). Provide it to tint only that one column\'s cell in each row.'),
    displayName: z.string().optional().describe('Short label for the action pill (e.g. "Color 4 overdue rows red").'),
})

function parseColor(input: string): TableColor | null | undefined {
    const normalized = input.trim().toUpperCase()
    if (normalized === 'NONE' || normalized === '') {
        return null
    }
    return PALETTE_KEYS.find((key) => key === normalized)
}

export const apColorRecordsTool = (mcp: ProjectScopedMcpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_color_records',
        permission: Permission.WRITE_TABLE,
        description: `Color table rows or cells to encode meaning — status, priority, grouping (e.g. "color the overdue rows red", "highlight Acme green"). Pass the full recordIds array and ONE color; omit \`field\` to tint whole rows (preferred), or name a \`field\` to tint just that column's cell in each row. Colors come from a fixed curated palette (${PALETTE_HINT}) — use these names only, never hex; "none" clears. For different colors, make one call per color group. Color is presentational only — it is NOT a data column, so never read, sort, or filter on it. Rows tint live in the Stage.`,
        inputSchema: colorRecordsInput.shape,
        annotations: { destructiveHint: false, idempotentHint: true, openWorldHint: false },
        execute: async (args) => {
            try {
                const { tableId, recordIds, color, field } = colorRecordsInput.parse(args)

                const parsedColor = parseColor(color)
                if (parsedColor === undefined) {
                    return { content: [{ type: 'text', text: `❌ Unknown color "${color}". Use one of: ${PALETTE_HINT}, or "none" to clear.` }] }
                }

                const resolvedTableId = await resolveInternalTableId({ projectId: mcp.projectId, tableId })
                if (isNil(resolvedTableId)) {
                    return tableNotFoundError(tableId)
                }

                let request: SetRecordColorsRequest
                if (isNil(field)) {
                    request = {
                        tableId: resolvedTableId,
                        records: recordIds.map((recordId) => ({ recordId, color: parsedColor })),
                    }
                }
                else {
                    const { fieldMap, errors } = await resolveFieldNamesForTable(mcp.projectId, resolvedTableId, [field])
                    if (errors.length > 0) {
                        return { content: [{ type: 'text', text: `❌ Field resolution error:\n${errors.join('\n')}` }] }
                    }
                    const fieldId = fieldMap.get(field)!
                    request = {
                        tableId: resolvedTableId,
                        cells: recordIds.map((recordId) => ({ recordId, fieldId, color: parsedColor })),
                    }
                }

                const updated = await recordService.setColors({
                    tableId: resolvedTableId,
                    projectId: mcp.projectId,
                    request,
                })

                const target = isNil(field) ? `${updated.length} row(s)` : `${updated.length} ${field} cell(s)`
                const summary = isNil(parsedColor)
                    ? `✅ Cleared color on ${target}.`
                    : `✅ Colored ${target} ${parsedColor.toLowerCase()}.`
                return { content: [{ type: 'text', text: summary }] }
            }
            catch (err) {
                log.error({ error: err, project: { id: mcp.projectId } }, 'ap_color_records failed')
                return mcpUtils.mcpToolError('Failed to color records', err)
            }
        },
    }
}
