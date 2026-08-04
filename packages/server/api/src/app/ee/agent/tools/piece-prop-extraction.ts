import { FieldControlMode, PredefinedInputsStructure } from '@activepieces/core-piece-types'
import { isObject, isString } from '@activepieces/core-utils'
import { PieceProperty, PiecePropertyMap, PropertyType } from '@activepieces/pieces-framework'
import { z } from 'zod'

const UNFILLABLE_TYPES = [
    PropertyType.BASIC_AUTH,
    PropertyType.OAUTH2,
    PropertyType.CUSTOM_AUTH,
    PropertyType.OIDC,
    PropertyType.CUSTOM,
    PropertyType.MARKDOWN,
]

function sortPropertiesByDependencies(properties: PiecePropertyMap): string[][] {
    const inDegree: Record<string, number> = {}
    const graph: Record<string, string[]> = {}
    const depth: Record<string, number> = {}

    for (const [key, property] of Object.entries(properties)) {
        const refreshers = 'refreshers' in property && Array.isArray(property.refreshers) ? property.refreshers : []
        for (const refresher of refreshers) {
            if (isNilProperty(properties[refresher])) {
                continue
            }
            inDegree[key] = (inDegree[key] ?? 0) + 1
            graph[refresher] = graph[refresher] ?? []
            graph[refresher].push(key)
        }
        inDegree[key] = inDegree[key] ?? 0
        graph[key] = graph[key] ?? []
    }

    const queue = Object.entries(inDegree).filter(([, degree]) => degree === 0).map(([name]) => name)
    for (const property of queue) {
        depth[property] = 0
    }

    while (queue.length > 0) {
        const current = queue.shift() as string
        for (const neighbor of graph[current] ?? []) {
            inDegree[neighbor] -= 1
            if (inDegree[neighbor] === 0) {
                queue.push(neighbor)
                depth[neighbor] = depth[current] + 1
            }
        }
    }

    const waves: string[][] = []
    for (const [property, depthValue] of Object.entries(depth)) {
        waves[depthValue] = waves[depthValue] ?? []
        waves[depthValue].push(property)
    }
    return waves.filter((wave) => !isNilProperty(wave))
}

function normalizeAuth(auth: unknown): unknown {
    if (!isObject(auth)) {
        return auth
    }
    const values = Object.values(auth)
    if (values.length === 1 && isString(values[0])) {
        return values[0]
    }
    return auth
}

function pinnedValues({ predefinedInput }: { predefinedInput?: PredefinedInputsStructure }): Record<string, unknown> {
    const pinned: Record<string, unknown> = {}
    const auth = normalizeAuth(predefinedInput?.auth)
    if (auth) {
        pinned.auth = auth
    }
    for (const [propertyName, field] of Object.entries(predefinedInput?.fields ?? {})) {
        if (field.mode === FieldControlMode.CHOOSE_YOURSELF) {
            pinned[propertyName] = field.value
        }
        else if (field.mode === FieldControlMode.LEAVE_EMPTY) {
            pinned[propertyName] = undefined
        }
    }
    return pinned
}

function propertyToSchema({ property, resolveDynamic }: {
    property: PieceProperty
    resolveDynamic: DynamicSchemaResolver
}): z.ZodTypeAny {
    const schema = baseSchemaFor({ property, resolveDynamic })
    const described = property.description ? schema.describe(property.description) : schema
    return property.required ? described : described.nullable()
}

function baseSchemaFor({ property, resolveDynamic }: {
    property: PieceProperty
    resolveDynamic: DynamicSchemaResolver
}): z.ZodTypeAny {
    switch (property.type) {
        case PropertyType.SHORT_TEXT:
        case PropertyType.LONG_TEXT:
        case PropertyType.MARKDOWN:
        case PropertyType.DATE_TIME:
        case PropertyType.FILE:
        case PropertyType.COLOR:
        case PropertyType.CUSTOM:
            return z.string()
        case PropertyType.DROPDOWN:
        case PropertyType.STATIC_DROPDOWN:
            return z.union([z.string(), z.number(), z.object({}).loose()])
        case PropertyType.MULTI_SELECT_DROPDOWN:
        case PropertyType.STATIC_MULTI_SELECT_DROPDOWN:
            return z.union([z.array(z.string()), z.array(z.object({}).loose())])
        case PropertyType.NUMBER:
            return z.number()
        case PropertyType.CHECKBOX:
            return z.boolean()
        case PropertyType.OBJECT:
            return z.object({}).loose()
        case PropertyType.JSON:
            return z.union([z.object({}).loose(), z.array(z.unknown())])
        case PropertyType.ARRAY:
            return z.array(property.properties
                ? objectSchemaFor({ properties: property.properties, resolveDynamic })
                : z.union([z.string(), z.number(), z.boolean(), z.object({}).loose()]))
        case PropertyType.DYNAMIC:
            return resolveDynamic({ property })
        default:
            throw new Error(`Unsupported property type: ${property.type}`)
    }
}

function objectSchemaFor({ properties, resolveDynamic }: {
    properties: Record<string, PieceProperty>
    resolveDynamic: DynamicSchemaResolver
}): z.ZodTypeAny {
    const shape: Record<string, z.ZodTypeAny> = {}
    for (const [key, value] of Object.entries(properties)) {
        shape[key] = propertyToSchema({ property: value, resolveDynamic })
    }
    return z.object(shape)
}

function buildExtractionWaves({ properties, predefinedInput, resolveDynamic }: {
    properties: PiecePropertyMap
    predefinedInput?: PredefinedInputsStructure
    resolveDynamic?: DynamicSchemaResolver
}): ExtractionWave[] {
    const pinned = pinnedValues({ predefinedInput })
    const resolve = resolveDynamic ?? (() => z.object({}).loose())
    const alreadyKnown = new Set(Object.keys(pinned))

    return sortPropertiesByDependencies(properties)
        .map((names) => {
            const shape: Record<string, z.ZodTypeAny> = {}
            for (const name of names) {
                const property = properties[name]
                if (isNilProperty(property) || UNFILLABLE_TYPES.includes(property.type) || alreadyKnown.has(name)) {
                    continue
                }
                shape[name] = propertyToSchema({ property, resolveDynamic: resolve })
            }
            return { propertyNames: Object.keys(shape), schema: z.object(shape).strict() }
        })
        .filter((wave) => wave.propertyNames.length > 0)
}

function isNilProperty(value: unknown): boolean {
    return value === undefined || value === null
}

export const piecePropExtraction = {
    sortPropertiesByDependencies,
    buildExtractionWaves,
    pinnedValues,
    normalizeAuth,
}

export type DynamicSchemaResolver = (params: { property: PieceProperty }) => z.ZodTypeAny

export type ExtractionWave = {
    propertyNames: string[]
    schema: z.ZodObject
}
