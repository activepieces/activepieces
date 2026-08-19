import { FieldControlMode, PredefinedInputsStructure } from '@activepieces/core-piece-types'
import { ActivepiecesError, ErrorCode, isNil, isObject, isString } from '@activepieces/core-utils'
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

function resolvePinnedInput({ predefinedInput }: { predefinedInput?: PredefinedInputsStructure }): Record<string, unknown> {
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

function orderByDependencies({ properties }: { properties: PiecePropertyMap }): string[][] {
    const remainingDependencies: Record<string, number> = {}
    const dependents: Record<string, string[]> = {}

    for (const name of Object.keys(properties)) {
        remainingDependencies[name] = 0
        dependents[name] = []
    }
    for (const [name, property] of Object.entries(properties)) {
        const refreshers = 'refreshers' in property && Array.isArray(property.refreshers) ? property.refreshers : []
        for (const refresher of refreshers) {
            if (!(refresher in properties)) {
                continue
            }
            remainingDependencies[name] += 1
            dependents[refresher].push(name)
        }
    }

    const waves: string[][] = []
    let wave = Object.keys(remainingDependencies).filter((name) => remainingDependencies[name] === 0)
    while (wave.length > 0) {
        waves.push(wave)
        const next: string[] = []
        for (const name of wave) {
            for (const dependent of dependents[name]) {
                remainingDependencies[dependent] -= 1
                if (remainingDependencies[dependent] === 0) {
                    next.push(dependent)
                }
            }
        }
        wave = next
    }
    return waves
}

function plan({ properties, predefinedInput }: {
    properties: PiecePropertyMap
    predefinedInput?: PredefinedInputsStructure
}): PieceInputPlan {
    const pinned = resolvePinnedInput({ predefinedInput })
    const waves = orderByDependencies({ properties })
        .map((names) => names.filter((name) => !UNFILLABLE_TYPES.includes(properties[name].type) && !(name in pinned)))
        .filter((names) => names.length > 0)
    return { pinned, waves }
}

async function schemaForWave({ properties, propertyNames, resolvedInput, resolveDynamic }: {
    properties: PiecePropertyMap
    propertyNames: string[]
    resolvedInput: Record<string, unknown>
    resolveDynamic: DynamicSchemaResolver
}): Promise<z.ZodObject> {
    const shape = await buildShape({
        properties: Object.fromEntries(propertyNames.map((name) => [name, properties[name]])),
        resolvedInput,
        resolveDynamic,
    })
    return z.object(shape).strict()
}

async function schemaForProperties({ properties, resolvedInput, resolveDynamic }: {
    properties: Record<string, PieceProperty>
    resolvedInput: Record<string, unknown>
    resolveDynamic: DynamicSchemaResolver
}): Promise<z.ZodObject> {
    return z.object(await buildShape({ properties, resolvedInput, resolveDynamic })).loose()
}

async function buildShape({ properties, resolvedInput, resolveDynamic }: {
    properties: Record<string, PieceProperty>
    resolvedInput: Record<string, unknown>
    resolveDynamic: DynamicSchemaResolver
}): Promise<Record<string, z.ZodTypeAny>> {
    const entries = await Promise.all(Object.entries(properties).map(async ([name, property]) => {
        const schema = await schemaForProperty({ propertyName: name, property, resolvedInput, resolveDynamic })
        return [name, schema] as const
    }))
    return Object.fromEntries(entries)
}

async function schemaForProperty({ propertyName, property, resolvedInput, resolveDynamic }: {
    propertyName: string
    property: PieceProperty
    resolvedInput: Record<string, unknown>
    resolveDynamic: DynamicSchemaResolver
}): Promise<z.ZodTypeAny> {
    const schema = await baseSchemaFor({ propertyName, property, resolvedInput, resolveDynamic })
    const described = property.description ? schema.describe(property.description) : schema
    return property.required ? described : described.nullable()
}

async function baseSchemaFor({ propertyName, property, resolvedInput, resolveDynamic }: {
    propertyName: string
    property: PieceProperty
    resolvedInput: Record<string, unknown>
    resolveDynamic: DynamicSchemaResolver
}): Promise<z.ZodTypeAny> {
    switch (property.type) {
        case PropertyType.SHORT_TEXT:
        case PropertyType.LONG_TEXT:
        case PropertyType.RICH_TEXT:
        case PropertyType.MARKDOWN:
        case PropertyType.DATE_TIME:
        case PropertyType.FILE:
        case PropertyType.COLOR:
        case PropertyType.CUSTOM:
            return z.string()
        case PropertyType.DATE_RANGE:
            return z.object({
                preset: z.string().optional(),
                after: z.string().optional(),
                before: z.string().optional(),
            })
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
            return z.array(isNil(property.properties)
                ? z.union([z.string(), z.number(), z.boolean(), z.object({}).loose()])
                : await schemaForProperties({ properties: property.properties, resolvedInput, resolveDynamic }))
        case PropertyType.DYNAMIC:
            return resolveDynamic({ propertyName, resolvedInput })
        case PropertyType.BASIC_AUTH:
        case PropertyType.CUSTOM_AUTH:
        case PropertyType.OAUTH2:
        case PropertyType.OIDC:
        case PropertyType.SECRET_TEXT:
            throw unresolvable(`The model must never be asked to fill a ${property.type} property`)
    }
}

function unresolvable(message: string): ActivepiecesError {
    return new ActivepiecesError({ code: ErrorCode.ENGINE_OPERATION_FAILURE, params: { message } })
}

export const pieceInputPlan = {
    plan,
    schemaForWave,
    schemaForProperties,
    unresolvable,
}

export type DynamicSchemaResolver = (params: {
    propertyName: string
    resolvedInput: Record<string, unknown>
}) => Promise<z.ZodTypeAny>


export type PieceInputPlan = {
    pinned: Record<string, unknown>
    waves: string[][]
}
