import { isNil } from '@activepieces/core-utils'
import { Field, FieldType } from '@activepieces/shared'
import { z } from 'zod'

function normalizeFieldType(raw: string): FieldType | null {
    const key = raw.trim().toLowerCase().replace(/[\s-]+/g, '_')
    return FIELD_TYPE_ALIASES[key] ?? null
}

function normalizeCreateFields(fields: CreateTableFieldsInput): NormalizeCreateFieldsResult {
    const errors = fields
        .filter((f) => isNil(normalizeFieldType(f.type)))
        .map((f) => `Field "${f.name}" has unknown type "${f.type}". Valid types: ${Object.values(FieldType).join(', ')}.`)
    const normalized = fields.flatMap((f) => {
        const type = normalizeFieldType(f.type)
        return isNil(type) ? [] : [{ name: f.name.trim(), type, options: f.options }]
    })
    return { fields: normalized, errors }
}

function resolveFieldKeys({ fields, keys }: { fields: Field[], keys: string[] }): ResolveFieldKeysResult {
    const resolved = keys.map((key) => ({ key, matches: matchField({ fields, key }) }))
    const unknown = resolved.filter((r) => r.matches.length === 0).map((r) => r.key)
    const ambiguous = resolved.filter((r) => r.matches.length > 1).map((r) => r.key)
    const errors = [
        ...(unknown.length > 0
            ? [`Unknown field(s): ${unknown.map((k) => `"${k}"`).join(', ')}. Valid fields: ${describeFields(fields)}.`]
            : []),
        ...ambiguous.map((k) => `Field name "${k}" matches more than one field. Use the field id instead, or rename one with ap_manage_fields.`),
    ]
    const fieldMap = new Map(resolved.filter((r) => r.matches.length === 1).map((r) => [r.key, r.matches[0]]))
    return { fieldMap, errors }
}

function stringifyCellValue(value: CellInputValue): string | null {
    if (isNil(value)) {
        return null
    }
    return typeof value === 'string' ? value : String(value)
}

function truncateValue({ value, max }: { value: unknown, max: number }): unknown {
    if (typeof value !== 'string' || value.length <= max) {
        return value
    }
    return `${value.slice(0, max)}… (+${value.length - max} chars)`
}

function describeFields(fields: Field[]): string {
    return fields.map((f) => `${f.name} (${f.type})`).join(', ')
}

function matchField({ fields, key }: { fields: Field[], key: string }): Field[] {
    const byId = fields.filter((f) => f.id === key || f.externalId === key)
    if (byId.length > 0) {
        return byId
    }
    const lower = key.trim().toLowerCase()
    return fields.filter((f) => f.name.trim().toLowerCase() === lower)
}

const FIELD_TYPE_ALIASES: Record<string, FieldType> = {
    text: FieldType.TEXT,
    string: FieldType.TEXT,
    str: FieldType.TEXT,
    varchar: FieldType.TEXT,
    long_text: FieldType.TEXT,
    short_text: FieldType.TEXT,
    email: FieldType.TEXT,
    url: FieldType.TEXT,
    phone: FieldType.TEXT,
    number: FieldType.NUMBER,
    numeric: FieldType.NUMBER,
    int: FieldType.NUMBER,
    integer: FieldType.NUMBER,
    float: FieldType.NUMBER,
    double: FieldType.NUMBER,
    decimal: FieldType.NUMBER,
    currency: FieldType.NUMBER,
    date: FieldType.DATE,
    datetime: FieldType.DATETIME,
    date_time: FieldType.DATETIME,
    timestamp: FieldType.DATETIME,
    static_dropdown: FieldType.STATIC_DROPDOWN,
    dropdown: FieldType.STATIC_DROPDOWN,
    select: FieldType.STATIC_DROPDOWN,
    single_select: FieldType.STATIC_DROPDOWN,
    enum: FieldType.STATIC_DROPDOWN,
}

const cellInputValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()])

const createTableFieldsSchema = z.array(z.object({
    name: z.string().describe('Field name'),
    type: z.string().describe('TEXT, NUMBER, DATE, DATETIME or STATIC_DROPDOWN (case-insensitive; aliases like string, integer, dropdown work)'),
    options: z.array(z.string()).optional().describe('Dropdown options (required for STATIC_DROPDOWN)'),
}))

export const tableToolInput = {
    normalizeFieldType,
    normalizeCreateFields,
    resolveFieldKeys,
    stringifyCellValue,
    truncateValue,
    describeFields,
    cellInputValueSchema,
    createTableFieldsSchema,
}

export type CellInputValue = z.infer<typeof cellInputValueSchema>
export type CreateTableFieldsInput = z.infer<typeof createTableFieldsSchema>

type NormalizeCreateFieldsResult = {
    fields: Array<{ name: string, type: FieldType, options: string[] | undefined }>
    errors: string[]
}

type ResolveFieldKeysResult = {
    fieldMap: Map<string, Field>
    errors: string[]
}
