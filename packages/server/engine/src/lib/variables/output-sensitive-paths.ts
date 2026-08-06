import { isNil } from '@activepieces/core-utils'
import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework'

export function collectSensitiveOutputPaths(outputSchema: OutputSchema | undefined, rawOutput: unknown): string[] | undefined {
    if (isNil(outputSchema) || isNil(outputSchema.fields) || outputSchema.fields.length === 0) {
        return undefined
    }
    const paths = walkFields({ fields: outputSchema.fields, rawValue: rawOutput, prefix: '' })
    return paths.length > 0 ? paths : undefined
}

function walkFields({ fields, rawValue, prefix }: WalkParams): string[] {
    return fields.flatMap((field) => walkField({ field, rawValue, prefix }))
}

function walkField({ field, rawValue, prefix }: { field: OutputSchemaField, rawValue: unknown, prefix: string }): string[] {
    const currentPath = prefix === '' ? field.key : `${prefix}.${field.key}`
    if (field.sensitive) {
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
    if (isNil(value) || typeof value !== 'object') return undefined
    return (value as Record<string, unknown>)[key]
}

type WalkParams = {
    fields: OutputSchemaField[]
    rawValue: unknown
    prefix: string
}
