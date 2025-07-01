import { ActionBase, PieceProperty, PiecePropertyMap, PropertyType } from '@activepieces/pieces-framework'

import { UserInteractionJobType } from '@activepieces/server-shared'
import { McpProperty, McpPropertyType, PiecePackage } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { EngineHelperPropResult, EngineHelperResponse } from 'server-worker'
import { z } from 'zod' 
import { userInteractionWatcher } from '../workers/user-interaction-watcher'

const PARAMETER_EXTRACTION_PROMPT_TEMPLATE = `
You are an expert at understanding API schemas and filling out properties based on user instructions.

TASK: Fill out the properties "{propertyNames}" based on the user's instructions.

USER INSTRUCTIONS:
{userInstructions}

IMPORTANT:
- For DYNAMIC properties, for each value, wrap the keys inside the options property inside an object with the same property name, and assign the array to the property name. For example, if the property is "values", return: { "values": [ { ...optionKeys }, ... ] }.
- For dropdown properties, select values from the provided options array only
- For ARRAY properties with nested properties (like A, B, C), return: [{"A": "value1", "B": "value2", "C": "value3"}]
- Must include all required properties, even if the user does not provide a value
- For CHECKBOX properties, return true or false
- For SHORT_TEXT and LONG_TEXT properties, return string values
- For NUMBER properties, return numeric values
- For DATE_TIME properties, return date strings in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)
- Use actual values from user instructions when available

`



function buildParameterExtractionPrompt({
    propertyNames,
    userInstructions,
}: BuildParameterExtractionPromptParams): string {
    return PARAMETER_EXTRACTION_PROMPT_TEMPLATE
        .replace('{propertyNames}', propertyNames.join(', '))
        .replace('{userInstructions}', userInstructions)
}

function buildFinalExtractionPrompt({
    parameterExtractionPrompt,
    propertySchemaValues,
}: BuildFinalExtractionPromptParams): string {
    return `
    ${parameterExtractionPrompt}

    YOU MUST USE THESE VALUES TO FILL OUT THE PROPERTIES ACCORDING TO USER INSTRUCTIONS:
    ${JSON.stringify(propertySchemaValues, null, 2)}

    IF NO VALUE IS PROVIDED FOR A PROPERTY, RETURN DEFAULT VALUES WHICH WILL MATCH THE SCHEMA.
    `
}

function mcpPropertyToZod(property: McpProperty): z.ZodTypeAny {
    let schema: z.ZodTypeAny

    switch (property.type) {
        case McpPropertyType.TEXT:
        case McpPropertyType.DATE:
            schema = z.string()
            break
        case McpPropertyType.NUMBER:
            schema = z.number()
            break
        case McpPropertyType.BOOLEAN:
            schema = z.boolean()
            break
        case McpPropertyType.ARRAY:
            schema = z.array(z.string())
            break
        case McpPropertyType.OBJECT:
            schema = z.record(z.string(), z.string())
            break
        default:
            schema = z.unknown()
    }

    if (property.description) {
        schema = schema.describe(property.description)
    }

    return property.required ? schema : schema.optional()
}

function piecePropertyToZod(property: PieceProperty): z.ZodTypeAny {
    let schema: z.ZodTypeAny

    switch (property.type) {
        case PropertyType.SHORT_TEXT:
        case PropertyType.LONG_TEXT:
        case PropertyType.DATE_TIME:
            schema = z.string()
            break
        case PropertyType.NUMBER:
            schema = z.number()
            break
        case PropertyType.CHECKBOX:
            schema = z.boolean()
            break
        case PropertyType.ARRAY:
            schema = z.array(z.unknown())
            break
        case PropertyType.OBJECT:
        case PropertyType.JSON:
            schema = z.record(z.string(), z.unknown())
            break
        case PropertyType.MULTI_SELECT_DROPDOWN:
            schema = z.array(z.string())
            break
        case PropertyType.DROPDOWN:
            schema = z.string()
            break
        default:
            schema = z.unknown()
    }

    if (property.defaultValue) {
        schema = schema.default(property.defaultValue)
    }

    if (property.description) {
        schema = schema.describe(property.description)
    }

    return property.required ? schema : schema.optional()
}


function sortPropertiesByDependencies(properties: PiecePropertyMap): Record<number, string[]> {
    const inDegree: Record<string, number> = {}
    const graph: Record<string, string[]> = {}
    const depth: Record<string, number> = {}
    
    Object.entries(properties).forEach(([key, property]) => {
        const hasRefreshers = 'refreshers' in property && property.refreshers && property.refreshers.length > 0
        if (hasRefreshers) {
            for (const refresher of property.refreshers) {
                inDegree[key] = (inDegree[key] || 0) + 1
                graph[refresher] = graph[refresher] ?? []
                graph[refresher].push(key)
            }   
        }
        inDegree[key] = inDegree[key] ?? 0
        graph[key] = graph[key] ?? []
    })

    // Topological sort
    const order: string[] = []
    const queue = Object.entries(inDegree)
        .filter(([, degree]) => degree === 0)
        .map(([name]) => name)

    queue.forEach(property => depth[property] = 0)
    
    while (queue.length > 0) {
        const current = queue.shift()!
        order.push(current)
        
        const neighbors = graph[current] || []
        neighbors.forEach(neighbor => {
            inDegree[neighbor]--
            if (inDegree[neighbor] === 0) {
                queue.push(neighbor)
                depth[neighbor] = depth[current] + 1
            }
        })
    }

    const depthToPropertyMap: Record<number, string[]> = {}
    for (const [property, depthValue] of Object.entries(depth)) {
        depthToPropertyMap[depthValue] = depthToPropertyMap[depthValue] ?? []
        depthToPropertyMap[depthValue].push(property)
    }
    
    return depthToPropertyMap
}


async function buildZodSchemaForPieceProperty({ property, logger, input, projectId, propertyName, actionMetadata, piecePackage, depth = 0 }: BuildZodSchemaForPiecePropertyParams): Promise<BuildZodSchemaForPiecePropertyResult> {    
    if (property.type === PropertyType.ARRAY) {
        const hasProperties = property.properties && Object.keys(property.properties).length > 0
        if (hasProperties) {
            const entries = await Promise.all(
                Object.entries(property.properties ?? {}).map(async ([key, value]) => [
                    key,
                    (await buildZodSchemaForPieceProperty({
                        property: value,
                        logger,
                        input,
                        projectId,
                        propertyName,
                        actionMetadata,
                        piecePackage,
                        depth: depth + 1,
                    })).schema,
                ]),
            )
            const schema = depth === 0 ? z.object({ [propertyName]: z.array(z.object(Object.fromEntries(entries))) }) : z.array(z.object(Object.fromEntries(entries)))
            return { schema, value: property }
        }
        const schema = z.object({ [propertyName]: z.array(z.string()) })
        return { schema, value: property }
    }

    const needsRuntimeResolution = property.type === PropertyType.DYNAMIC || property.type === PropertyType.DROPDOWN || property.type === PropertyType.MULTI_SELECT_DROPDOWN
    if (!needsRuntimeResolution) {
        const schema = depth === 0 ? z.object({ [propertyName]: piecePropertyToZod(property) }) : piecePropertyToZod(property)
        return {
            schema,
            value: property,
        }
    }

    const resolvedPropertyData = await userInteractionWatcher(logger)
        .submitAndWaitForResponse<EngineHelperResponse<EngineHelperPropResult>>({
        jobType: UserInteractionJobType.EXECUTE_PROPERTY,
        projectId,
        propertyName,
        actionOrTriggerName: actionMetadata.name,
        input,
        piece: piecePackage,
        sampleData: {},
    })

    const options = resolvedPropertyData.result.options
    const hasOptions = options && (Array.isArray(options) ? options.length > 0 : Object.keys(options).length > 0)

    if (!hasOptions) {
        return {
            schema: null,
            value: null,
        }
    }

    if (property.type === PropertyType.DYNAMIC) {
        const dynamicSchema: z.ZodTypeAny = z.object(Object.fromEntries(
            await Promise.all(
                Object.entries(options).map(async ([key, value]) => [
                    key, 
                    (await buildZodSchemaForPieceProperty({
                        property: value,
                        logger,
                        input,
                        projectId,
                        propertyName,
                        actionMetadata,
                        piecePackage,
                        depth: depth + 1,
                    })).schema,
                ]),
            )))
        return {
            schema: z.object({ [propertyName]: dynamicSchema }),
            value: resolvedPropertyData.result,
        }
    }

    return {
        schema: z.object({ [propertyName]: piecePropertyToZod(property) }),
        value: options,
    }
}

export const mcpUtils = {
    buildParameterExtractionPrompt,
    buildFinalExtractionPrompt,
    mcpPropertyToZod,
    piecePropertyToZod,
    sortPropertiesByDependencies,
    buildZodSchemaForPieceProperty,
}


type BuildParameterExtractionPromptParams = {
    propertyNames: string[]
    userInstructions: string
}

type BuildFinalExtractionPromptParams = {
    parameterExtractionPrompt: string
    propertySchemaValues: unknown
}

type BuildZodSchemaForPiecePropertyParams = {
    property: PieceProperty
    logger: FastifyBaseLogger
    input: Record<string, unknown>
    projectId: string
    propertyName: string
    actionMetadata: ActionBase
    piecePackage: PiecePackage
    depth: number
}

type BuildZodSchemaForPiecePropertyResult = {
    schema: z.ZodTypeAny | null
    value: unknown
}