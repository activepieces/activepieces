import { PredefinedInputsStructure } from '@activepieces/core-piece-types'
import { isNil, omit, spreadIfDefined } from '@activepieces/core-utils'
import { PiecePropertyMap, PropertyType } from '@activepieces/pieces-framework'
import { generateText, JSONParseError, LanguageModel, NoObjectGeneratedError, Output, zodSchema } from 'ai'
import { z } from 'zod'
import { PropertyResolutionResult } from '../../../mcp/tools/mcp-utils'
import { DynamicSchemaResolver, pieceInputPlan } from './piece-input-plan'

const MAX_DYNAMIC_DEPTH = 3

const CHOOSABLE_TYPES = [
    PropertyType.DROPDOWN,
    PropertyType.STATIC_DROPDOWN,
    PropertyType.MULTI_SELECT_DROPDOWN,
    PropertyType.STATIC_MULTI_SELECT_DROPDOWN,
]

async function fillInput({ action, instruction, predefinedInput, ports }: FillInputParams): Promise<Record<string, unknown>> {
    const { pinned, waves } = pieceInputPlan.plan({ properties: action.properties, predefinedInput })
    const resolveDynamic = dynamicResolverAtDepth({ action, ports, depth: 1 })

    let resolvedInput: Record<string, unknown> = { ...pinned }
    for (const propertyNames of waves) {
        const [schema, choices] = await Promise.all([
            pieceInputPlan.schemaForWave({ properties: action.properties, propertyNames, resolvedInput, resolveDynamic }),
            choicesFor({ action, propertyNames, resolvedInput, ports }),
        ])
        const filled = await ports.completeObject({
            schema,
            prompt: extractionPrompt({ instruction, propertyNames, resolvedInput, choices }),
        })
        resolvedInput = { ...resolvedInput, ...filled }
    }
    return resolvedInput
}

function dynamicResolverAtDepth({ action, ports, depth }: { action: PieceActionInputs, ports: FillInputPorts, depth: number }): DynamicSchemaResolver {
    return async ({ propertyName, resolvedInput }) => {
        if (depth > MAX_DYNAMIC_DEPTH) {
            throw pieceInputPlan.unresolvable(`"${propertyName}" nests dynamic fields more than ${MAX_DYNAMIC_DEPTH} levels deep`)
        }
        const result = await resolveFor({ action, ports, propertyName, resolvedInput })
        if (result.status !== 'dynamic') {
            throw pieceInputPlan.unresolvable(`Could not resolve the sub-fields of "${propertyName}": ${result.status === 'failed' ? result.message : 'the piece returned options rather than fields'}`)
        }
        return pieceInputPlan.schemaForProperties({
            properties: result.props,
            resolvedInput,
            resolveDynamic: dynamicResolverAtDepth({ action, ports, depth: depth + 1 }),
        })
    }
}

async function choicesFor({ action, propertyNames, resolvedInput, ports }: {
    action: PieceActionInputs
    propertyNames: string[]
    resolvedInput: Record<string, unknown>
    ports: FillInputPorts
}): Promise<Record<string, unknown[]>> {
    const choosable = propertyNames.filter((name) => CHOOSABLE_TYPES.includes(action.properties[name].type))
    const resolved = await Promise.all(choosable.map(async (propertyName) => {
        const result = await resolveFor({ action, ports, propertyName, resolvedInput }).catch(() => null)
        return result?.status === 'options' ? ([propertyName, result.options] as const) : null
    }))
    return Object.fromEntries(resolved.filter((entry) => !isNil(entry)))
}

function resolveFor({ action, ports, propertyName, resolvedInput }: {
    action: PieceActionInputs
    ports: FillInputPorts
    propertyName: string
    resolvedInput: Record<string, unknown>
}): Promise<PropertyResolutionResult> {
    return ports.resolveProperty({
        propertyName,
        actionOrTriggerName: action.name,
        input: omit(resolvedInput, ['auth']),
        ...spreadIfDefined('auth', action.connectionExternalId),
    })
}

function extractionPrompt({ instruction, propertyNames, resolvedInput, choices }: {
    instruction: string
    propertyNames: string[]
    resolvedInput: Record<string, unknown>
    choices: Record<string, unknown[]>
}): string {
    const known = omit(resolvedInput, ['auth'])
    return [
        `Fill in the inputs "${propertyNames.join('", "')}" for an action the user asked to run.`,
        '',
        'WHAT THE USER ASKED FOR:',
        instruction,
        ...Object.keys(known).length === 0 ? [] : ['', 'ALREADY DECIDED, stay consistent with these:', JSON.stringify(known, null, 2)],
        ...Object.keys(choices).length === 0 ? [] : ['', 'ALLOWED VALUES, pick from these and send the value, not the label:', JSON.stringify(choices, null, 2)],
        '',
        'RULES:',
        '- Every required input must be present. Infer a sensible value from the instruction rather than leaving it out.',
        '- Leave an optional input null when the instruction says nothing about it. Do not invent values.',
        '- Dates and times are ISO 8601, for example 2026-08-04T09:00:00.000Z.',
    ].join('\n')
}

function modelCompleter(model: LanguageModel): CompleteObject {
    return async ({ schema, prompt }) => {
        const { output } = await generateText({
            model,
            prompt,
            output: Output.object({ schema: zodSchema(schema) }),
        }).catch(recoverFencedJson)

        if (!isRecord(output)) {
            throw pieceInputPlan.unresolvable('The model did not return an object for the action inputs')
        }
        return output
    }
}

function recoverFencedJson(error: unknown): { output: unknown } {
    const text = NoObjectGeneratedError.isInstance(error) && JSONParseError.isInstance(error.cause) ? error.text : undefined
    if (isNil(text) || !text.startsWith('```json') || !text.endsWith('```')) {
        throw error
    }
    return { output: JSON.parse(text.slice('```json'.length, -'```'.length)) }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export const pieceInputFiller = {
    fillInput,
    modelCompleter,
}

export type PieceActionInputs = {
    name: string
    properties: PiecePropertyMap
    connectionExternalId?: string
}

export type ResolveProperty = (params: {
    propertyName: string
    actionOrTriggerName: string
    input: Record<string, unknown>
    auth?: string
}) => Promise<PropertyResolutionResult>

export type CompleteObject = (params: { schema: z.ZodObject, prompt: string }) => Promise<Record<string, unknown>>

export type FillInputPorts = {
    resolveProperty: ResolveProperty
    completeObject: CompleteObject
}

export type FillInputParams = {
    action: PieceActionInputs
    instruction: string
    predefinedInput?: PredefinedInputsStructure
    ports: FillInputPorts
}
