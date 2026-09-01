import { isNil } from '@activepieces/core-utils'
import { SENSITIVE_WHOLE_OUTPUT_PATH } from '../../engine/engine-constants'
import { escapeSensitivePathSegment } from './sensitive-path-utils'

export function collectSensitiveOutputPaths(outputSchema: SensitiveOutputSchema | undefined, rawOutput: unknown): string[] | undefined {
    if (!outputSchemaHasSensitiveFields(outputSchema)) {
        return undefined
    }
    const fields = outputSchema.fields
    const unsupported = findUnsupportedSensitiveShape(fields, rawOutput)
    if (!isNil(unsupported)) {
        console.error(`[collectSensitiveOutputPaths] ${unsupported}; redacting the entire step output as a fail-safe`)
        return [SENSITIVE_WHOLE_OUTPUT_PATH]
    }
    const paths = walkFields({ fields, rawValue: rawOutput, prefix: '' })
    return paths.length > 0 ? paths : undefined
}

export function outputSchemaHasSensitiveFields(outputSchema: SensitiveOutputSchema | undefined): outputSchema is SensitiveOutputSchema {
    const fields = outputSchema?.fields
    return !isNil(fields) && fields.length > 0 && schemaHasSensitiveFields(fields)
}

function findUnsupportedSensitiveShape(fields: SensitiveOutputField[], rawOutput: unknown): string | undefined {
    if (Array.isArray(rawOutput)) {
        return 'the step output is a top-level array, whose schema fields address each item rather than the root'
    }
    const overridden = findValueOverriddenSensitiveField(fields)
    if (!isNil(overridden)) {
        return `field "${overridden}" carries a "value" path override on a sensitive subtree, which the path walker does not resolve`
    }
    return undefined
}

function findValueOverriddenSensitiveField(fields: SensitiveOutputField[]): string | undefined {
    for (const field of fields) {
        const nested = [...field.children ?? [], ...field.listItems ?? []]
        const overridden = !isNil(field.value) && field.value !== field.key
        if (overridden && (field.sensitive || schemaHasSensitiveFields(nested))) {
            return field.key
        }
        const inner = findValueOverriddenSensitiveField(nested)
        if (!isNil(inner)) {
            return inner
        }
    }
    return undefined
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
        return [currentPath]
    }
    const nested = readAt(rawValue, field.key)
    const children = field.children ?? []
    const listItems = field.listItems ?? []
    if (field.dynamicKey && children.length > 0) {
        if (!isIndexable(nested)) {
            return []
        }
        return Object.keys(nested).flatMap((mapKey) => walkFields({
            fields: children,
            rawValue: nested[mapKey],
            prefix: `${currentPath}.${escapeSensitivePathSegment(mapKey)}`,
        }))
    }
    const childPaths = children.length > 0
        ? walkFields({ fields: children, rawValue: nested, prefix: currentPath })
        : []
    const itemPaths = listItems.length > 0 && Array.isArray(nested)
        ? nested.flatMap((item, index) => walkFields({
            fields: listItems,
            rawValue: item,
            prefix: `${currentPath}.${index}`,
        }))
        : []
    return [...childPaths, ...itemPaths]
}

function readAt(value: unknown, key: string): unknown {
    return isIndexable(value) && Object.hasOwn(value, key) ? value[key] : undefined
}

function isIndexable(value: unknown): value is Record<string, unknown> {
    return !isNil(value) && typeof value === 'object'
}

type WalkParams = {
    fields: SensitiveOutputField[]
    rawValue: unknown
    prefix: string
}

export type SensitiveOutputField = {
    key: string
    value?: string
    sensitive?: boolean
    dynamicKey?: boolean
    children?: SensitiveOutputField[]
    listItems?: SensitiveOutputField[]
}

export type SensitiveOutputSchema = {
    fields: SensitiveOutputField[]
}
