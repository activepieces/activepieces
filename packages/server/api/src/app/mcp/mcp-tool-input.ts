import { McpProperty, McpPropertyType, mcpToolNameUtils } from '@activepieces/shared'
import { z } from 'zod'

export const mcpToolInput = {
    modelKeyByPropertyName({ properties }: { properties: McpProperty[] }): Map<string, string> {
        const propertyNames = new Set(properties.map((property) => property.name))
        const taken = new Set<string>()
        return properties.reduce((keys, property, index) => {
            const candidate = mcpToolNameUtils.toProviderSafeIdentifier({ name: property.name, fallback: positionalKey(index) })
            const claimedByAnotherField = new Set([...taken, ...propertyNames].filter((claimed) => claimed !== property.name))
            const key = deduplicate({ candidate, taken: claimedByAnotherField })
            taken.add(key)
            return keys.set(property.name, key)
        }, new Map<string, string>())
    },

    modelInputShape({ properties }: { properties: McpProperty[] }): Record<string, z.ZodTypeAny> {
        const keys = mcpToolInput.modelKeyByPropertyName({ properties })
        return Object.fromEntries(properties.map((property) => {
            const key = keys.get(property.name) ?? property.name
            return [key, describeForModel({ property, key })]
        }))
    },

    toFlowPayload({ properties, modelArgs }: { properties: McpProperty[], modelArgs: Record<string, unknown> }): Record<string, unknown> {
        const keys = mcpToolInput.modelKeyByPropertyName({ properties })
        const declared = properties.flatMap((property) => {
            const key = keys.get(property.name) ?? property.name
            const suppliedKey = [key, property.name].find((candidate) => candidate in modelArgs)
            return suppliedKey === undefined ? [] : [[property.name, modelArgs[suppliedKey], suppliedKey] as const]
        })
        return Object.fromEntries(declared.map(([name, value]) => [name, value] as const))
    },

    propertyToZod(property: McpProperty): z.ZodTypeAny {
        const base = (() => {
            switch (property.type) {
                case McpPropertyType.TEXT:
                case McpPropertyType.DATE:
                    return z.string()
                case McpPropertyType.NUMBER:
                    return z.number()
                case McpPropertyType.BOOLEAN:
                    return z.boolean()
                case McpPropertyType.ARRAY:
                    return z.array(z.string())
                case McpPropertyType.OBJECT:
                    return z.record(z.string(), z.string())
                default:
                    return z.unknown()
            }
        })()
        const described = property.description ? base.describe(property.description) : base
        return property.required ? described : described.nullish()
    },
}

function positionalKey(index: number): string {
    return `field_${index + 1}`
}

function deduplicate({ candidate, taken }: { candidate: string, taken: Set<string> }): string {
    if (!taken.has(candidate)) {
        return candidate
    }
    for (let suffix = 2; ; suffix++) {
        const next = `${candidate.slice(0, MAX_KEY_LENGTH - String(suffix).length - 1)}_${suffix}`
        if (!taken.has(next)) {
            return next
        }
    }
}

function describeForModel({ property, key }: { property: McpProperty, key: string }): z.ZodTypeAny {
    const base = mcpToolInput.propertyToZod(property)
    return key === property.name ? base : base.meta({ title: property.name })
}

const MAX_KEY_LENGTH = 64
