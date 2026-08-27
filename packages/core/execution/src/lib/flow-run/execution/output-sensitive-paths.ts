import { escapeSensitivePathSegment, isNil } from '@activepieces/core-utils'

export function collectSensitiveOutputPaths(outputSchema: SensitiveOutputSchema | undefined, rawOutput: unknown): string[] | undefined {
    const fields = outputSchema?.fields
    if (isNil(fields) || fields.length === 0 || !schemaHasSensitiveFields(fields)) {
        return undefined
    }
    const paths = walkFields({ fields, rawValue: rawOutput, prefix: '' })
    return paths.length > 0 ? paths : undefined
}

export function outputSchemaHasSensitiveFields(outputSchema: SensitiveOutputSchema | undefined): boolean {
    const fields = outputSchema?.fields
    return !isNil(fields) && fields.length > 0 && schemaHasSensitiveFields(fields)
}

function schemaHasSensitiveFields(fields: SensitiveOutputField[]): boolean {
    return fields.some((field) =>
        field.sensitive ||
        (!isNil(field.children) && schemaHasSensitiveFields(field.children)) ||
        (!isNil(field.listItems) && schemaHasSensitiveFields(field.listItems)),
    )
}

function walkFields({ fields, rawValue, prefix }: WalkParams): string[] {
    return fields.flatMap((field) => walkField({ field, rawValue, prefix }))
}

function walkField({ field, rawValue, prefix }: { field: SensitiveOutputField, rawValue: unknown, prefix: string }): string[] {
    const encodedKey = escapeSensitivePathSegment(field.key)
    const currentPath = prefix === '' ? encodedKey : `${prefix}.${encodedKey}`
    if (field.sensitive) {
        if (isNil(readAt(rawValue, field.key))) {
            console.warn(`[collectSensitiveOutputPaths] "${currentPath}" is declared sensitive in the output schema but is missing from the actual output; redaction for this path will be a no-op`)
        }
        return [currentPath]
    }
    const nested = readAt(rawValue, field.key)
    if (field.dynamicKey && field.children && field.children.length > 0) {
        if (!isRecord(nested)) {
            return []
        }
        return Object.keys(nested).flatMap((mapKey) => walkFields({
            fields: field.children!,
            rawValue: nested[mapKey],
            prefix: `${currentPath}.${escapeSensitivePathSegment(mapKey)}`,
        }))
    }
    const childPaths = field.children && field.children.length > 0
        ? walkFields({ fields: field.children, rawValue: nested, prefix: currentPath })
        : []
    const itemPaths = field.listItems && field.listItems.length > 0 && Array.isArray(nested)
        ? nested.flatMap((item, index) => walkFields({
            fields: field.listItems!,
            rawValue: item,
            prefix: `${currentPath}.${index}`,
        }))
        : []
    return [...childPaths, ...itemPaths]
}

function readAt(value: unknown, key: string): unknown {
    return isRecord(value) && Object.hasOwn(value, key) ? value[key] : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return !isNil(value) && typeof value === 'object'
}

type WalkParams = {
    fields: SensitiveOutputField[]
    rawValue: unknown
    prefix: string
}

export type SensitiveOutputField = {
    key: string
    sensitive?: boolean
    dynamicKey?: boolean
    children?: SensitiveOutputField[]
    listItems?: SensitiveOutputField[]
}

export type SensitiveOutputSchema = {
    fields: SensitiveOutputField[]
}
