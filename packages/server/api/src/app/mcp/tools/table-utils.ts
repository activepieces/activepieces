import { Field, FieldType, McpToolResult, PopulatedRecord, tryCatch } from '@activepieces/shared'
import { z } from 'zod'
import { fieldService } from '../../tables/field/field.service'
import { tableService } from '../../tables/table/table.service'

export async function resolveInternalTableId({ projectId, tableId }: { projectId: string, tableId: string }): Promise<string | null> {
    const byId = await tryCatch(() => tableService.getOneOrThrow({ projectId, id: tableId }))
    if (!byId.error) {
        return byId.data.id
    }
    const byExternalId = await tryCatch(() => tableService.getOneByExternalIdOrThrow({ projectId, externalId: tableId }))
    if (!byExternalId.error) {
        return byExternalId.data.id
    }
    return null
}

export function tableNotFoundError(tableId: string): McpToolResult {
    return { content: [{ type: 'text', text: `❌ Table "${tableId}" not found. Use ap_list_tables to see available tables.` }] }
}

export async function resolveFieldNamesForTable(
    projectId: string,
    tableId: string,
    fieldNames: string[],
): Promise<{ fields: Field[], fieldMap: Map<string, string>, errors: string[] }> {
    const fields = await fieldService.getAll({ projectId, tableId })
    const { fieldMap, errors } = resolveFieldNameToId(fields, fieldNames)
    return { fields, fieldMap, errors }
}

export function resolveFieldNameToId(
    fields: Field[],
    fieldNames: string[],
): { fieldMap: Map<string, string>, errors: string[] } {
    const nameToField = new Map<string, Field>()
    const duplicates = new Set<string>()

    for (const field of fields) {
        const lower = field.name.toLowerCase()
        if (nameToField.has(lower)) {
            duplicates.add(lower)
        }
        else {
            nameToField.set(lower, field)
        }
    }

    const fieldMap = new Map<string, string>()
    const errors: string[] = []

    for (const name of fieldNames) {
        const lower = name.toLowerCase()
        if (duplicates.has(lower)) {
            errors.push(`Duplicate field name "${name}". Rename one of them using ap_manage_fields before proceeding.`)
        }
        else if (!nameToField.has(lower)) {
            errors.push(`Field "${name}" not found. Available fields: ${fields.map(f => f.name).join(', ')}`)
        }
        else {
            fieldMap.set(name, nameToField.get(lower)!.id)
        }
    }

    return { fieldMap, errors }
}

export function formatPopulatedRecord(record: PopulatedRecord): string {
    const lines = [`  Record ID: ${record.id}`]
    for (const cell of Object.values(record.cells)) {
        lines.push(`    ${cell.fieldName}: ${cell.value ?? '(empty)'}`)
    }
    return lines.join('\n')
}

export function formatFieldInfo(field: Field): string {
    if (field.type === FieldType.STATIC_DROPDOWN) {
        const options = field.data.options.map(o => o.value).join(', ')
        return `${field.name} (id: ${field.id}, type: ${field.type}, options: ${options})`
    }
    return `${field.name} (id: ${field.id}, type: ${field.type})`
}

export const FIELD_TYPE_VALUES = [
    FieldType.TEXT,
    FieldType.NUMBER,
    FieldType.DATE,
    FieldType.STATIC_DROPDOWN,
] as const

export const fieldTypeSchema = z.enum(FIELD_TYPE_VALUES)
