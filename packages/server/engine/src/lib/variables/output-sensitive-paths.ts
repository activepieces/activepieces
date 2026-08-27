import { isNil } from '@activepieces/core-utils'
import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework'
import { escapeSensitivePathSegment } from '@activepieces/shared'

export function collectSensitiveOutputPaths(outputSchema: OutputSchema | undefined, rawOutput: unknown): string[] | undefined {
    if (isNil(outputSchema) || isNil(outputSchema.fields) || outputSchema.fields.length === 0) {
        return undefined
    }
    if (!schemaHasSensitiveFields(outputSchema.fields)) {
        return undefined
    }
    const paths = walkFields({ fields: outputSchema.fields, rawValue: rawOutput, prefix: '' })
    return paths.length > 0 ? paths : undefined
}

function schemaHasSensitiveFields(fields: OutputSchemaField[]): boolean {
    return fields.some((field) =>
        field.sensitive ||
        (!isNil(field.children) && schemaHasSensitiveFields(field.children)) ||
        (!isNil(field.listItems) && schemaHasSensitiveFields(field.listItems)),
    )
}

function walkFields({ fields, rawValue, prefix }: WalkParams): string[] {
    return fields.flatMap((field) => walkField({ field, rawValue, prefix }))
}

function walkField({ field, rawValue, prefix }: { field: OutputSchemaField, rawValue: unknown, prefix: string }): string[] {
    const encodedKey = escapeSensitivePathSegment(field.key)
    const currentPath = prefix === '' ? encodedKey : `${prefix}.${encodedKey}`
    if (field.sensitive) {
        if (isNil(readAt(rawValue, field.key))) {
            console.warn(`[collectSensitiveOutputPaths] "${currentPath}" is declared sensitive in the output schema but is missing from the actual output; redaction for this path will be a no-op`)
        }
        return [currentPath]
    }
    const nested = readAt(rawValue, field.key)
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
    fields: OutputSchemaField[]
    rawValue: unknown
    prefix: string
}
