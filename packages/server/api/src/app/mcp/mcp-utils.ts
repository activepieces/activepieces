import { ActionBase, PieceProperty, PiecePropertyMap, PropertyType } from '@activepieces/pieces-framework'

import { UserInteractionJobType } from '@activepieces/server-shared'
import { McpProperty, McpPropertyType, PiecePackage } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { EngineHelperPropResult, EngineHelperResponse } from 'server-worker'
import { z } from 'zod' 
import { userInteractionWatcher } from '../workers/user-interaction-watcher'

const PARAMETER_EXTRACTION_PROMPT_TEMPLATE = `
You are an expert at understanding API schemas and filling out properties based on user instructions.

TASK: Fill out the property "{propertyName}" based on the user's instructions.

USER INSTRUCTIONS:
{userInstructions}

IMPORTANT:
- For DYNAMIC properties, for each value, wrap the keys inside the options property inside an object with the same property name, and assign the array to the property name. For example, if the property is "values", return: { "values": [ { ...optionKeys }, ... ] }.
- For dropdown properties, select values from the provided options array only
- For ARRAY properties with nested properties (like A, B, C), return: [{"A": "value1", "B": "value2", "C": "value3"}]
- Return valid JSON for complex types, raw values for simple types
- Must include all required properties, even if the user does not provide a value
- For CHECKBOX properties, return true or false
- For SHORT_TEXT and LONG_TEXT properties, return string values
- For NUMBER properties, return numeric values
- For DATE_TIME properties, return date strings in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)
- Use actual values from user instructions when available

CONTEXT:
- Previously filled properties: {previouslyFilledProperties}
`



function buildParameterExtractionPrompt({
    propertyName,
    userInstructions,
    previouslyFilledProperties,
}: BuildParameterExtractionPromptParams): string {
    return PARAMETER_EXTRACTION_PROMPT_TEMPLATE
        .replace('{propertyName}', propertyName)
        .replace('{userInstructions}', userInstructions)
        .replace('{previouslyFilledProperties}', JSON.stringify(previouslyFilledProperties, null, 2))
}

function buildFinalExtractionPrompt({
    parameterExtractionPrompt,
    propertySchemaValues,
}: BuildFinalExtractionPromptParams): string {
    return `
    ${parameterExtractionPrompt}

    USE THESE VALUES TO FILL OUT THE PROPERTY ACCORDING TO USER INSTRUCTIONS:
    ${JSON.stringify(propertySchemaValues, null, 2)}
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


function sortPropertiesByDependencies(properties: PiecePropertyMap): string[] {
    const inDegree: Record<string, number> = {}
    const graph: Record<string, string[]> = {}
    
    Object.entries(properties).forEach(([key, property]) => {
        if ('refreshers' in property && property.refreshers) {
            for (const refresher of property.refreshers) {
                inDegree[key] = (inDegree[key] || 0) + 1
                graph[refresher] = graph[refresher] ?? []
                graph[refresher].push(key)
            }   
        }
        else {
            inDegree[key] = inDegree[key] ?? 0
            graph[key] = graph[key] ?? []
        }
    })

    // Topological sort
    const order: string[] = []
    const queue = Object.entries(inDegree)
        .filter(([, degree]) => degree === 0)
        .map(([name]) => name)
    
    while (queue.length > 0) {
        const current = queue.shift()!
        order.push(current)
        
        const neighbors = graph[current] || []
        neighbors.forEach(neighbor => {
            inDegree[neighbor]--
            if (inDegree[neighbor] === 0) {
                queue.push(neighbor)
            }
        })
    }

    return order
}


async function buildZodSchemaForPieceProperty({ property, logger, input, projectId, propertyName, actionMetadata, piecePackage, depth = 0 }: BuildZodSchemaForPiecePropertyParams): Promise<BuildZodSchemaForPiecePropertyResult> {
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

    if (property.type === PropertyType.DYNAMIC) {
        const dynamicSchema: z.ZodTypeAny = z.object(Object.fromEntries(
            await Promise.all(
                Object.entries(resolvedPropertyData.result.options).map(async ([key, value]) => [
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
        value: resolvedPropertyData.result.options,
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
    propertyName: string
    userInstructions: string
    previouslyFilledProperties: unknown
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
    schema: z.ZodTypeAny
    value: unknown
}