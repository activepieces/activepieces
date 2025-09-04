import { ActionBase, PieceProperty, PiecePropertyMap, PropertyType } from '@activepieces/pieces-framework'

import { isNil, PiecePackage, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { EngineHelperPropResult, EngineHelperResponse } from 'server-worker'
import { z } from 'zod' 
import { projectService } from '../../project/project-service'
import { userInteractionWatcher } from '../../workers/user-interaction-watcher'
import { mcpUtils } from '../mcp-utils'

const PARAMETER_EXTRACTION_PROMPT_TEMPLATE = `
You are an expert at understanding API schemas and filling out properties based on user instructions.

TASK: Fill out the properties "{propertyNames}" based on the user's instructions.

USER INSTRUCTIONS:
{userInstructions}

IMPORTANT:
- For dropdown, multi-select dropdown, and static dropdown properties, YOU MUST SELECT VALUES FROM THE PROVIDED OPTIONS ARRAY ONLY.
- For array properties, YOU MUST SELECT VALUES FROM THE PROVIDED OPTIONS ARRAY ONLY.
- For dynamic properties, YOU MUST SELECT VALUES FROM THE PROVIDED OPTIONS ARRAY ONLY.
- THE OPTIONS ARRAY WILL BE [{ label: string, value: string | object }]. YOU MUST SELECT THE value FIELD FROM THE OPTION OBJECT.
- For DATE_TIME properties, return date strings in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)
- Use actual values from the user instructions to determine the correct value for each property, either as a hint for selecting options from dropdowns or to fill in the property if possible.
- Must include all required properties, even if the user does not provide a value. If a required field is missing, look up the correct value or provide a reasonable default—otherwise, the task may fail.
- IMPORTANT: If a property is not required and you do not have any information to fill it, you MUST skip it.
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

function sortPropertiesByDependencies(properties: PiecePropertyMap): Record<number, string[]> {
    const inDegree: Record<string, number> = {}
    const graph: Record<string, string[]> = {}
    const depth: Record<string, number> = {}
    
    Object.entries(properties).forEach(([key, property]) => {
        const hasRefreshers = 'refreshers' in property && property.refreshers && property.refreshers.length > 0
        if (hasRefreshers) {
            for (const refresher of property.refreshers) {
                if (isNil(properties[refresher])) {
                    continue
                }
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


async function buildZodSchemaForPieceProperty({ property, logger, input, projectId, propertyName, actionMetadata, piecePackage }: BuildZodSchemaForPiecePropertyParams): Promise<BuildZodSchemaForPiecePropertyResult> {    
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
                        propertyName: key,
                        actionMetadata,
                        piecePackage,
                    })).schema,
                ]),
            )
            let arraySchema: z.ZodTypeAny = z.array(z.object(Object.fromEntries(entries)))
            if (!property.required) {
                arraySchema = arraySchema.nullish()
            }
            return { schema: arraySchema, value: property }
        }
        let arraySchema: z.ZodTypeAny = z.array(z.string())
        if (!property.required) {
            arraySchema = arraySchema.nullish()
        }
        return { schema: arraySchema, value: property }
    }

    const needsRuntimeResolution = property.type === PropertyType.DYNAMIC || property.type === PropertyType.DROPDOWN || property.type === PropertyType.MULTI_SELECT_DROPDOWN
    if (!needsRuntimeResolution) {
        const propertySchema = mcpUtils.piecePropertyToZod(property)
        return {
            schema: propertySchema,
            value: property,
        }
    }

    const platformId = await projectService.getPlatformId(projectId)
    const resolvedPropertyData = await userInteractionWatcher(logger)
        .submitAndWaitForResponse<EngineHelperResponse<EngineHelperPropResult>>({
        jobType: WorkerJobType.EXECUTE_PROPERTY,
        platformId,
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
        const optionsSchema =  await Promise.all(
            Object.entries(options).map(async ([key, value]) => [
                key, 
                (await buildZodSchemaForPieceProperty({
                    property: value,
                    logger,
                    input,
                    projectId,
                    propertyName: key,
                    actionMetadata,
                    piecePackage,
                })).schema,
            ]),
        )
        const optionsSchemaEntries = Object.fromEntries(optionsSchema)
        const dynamicSchema: z.ZodTypeAny = z.object(optionsSchemaEntries)
        return {
            schema: dynamicSchema,
            value: resolvedPropertyData.result,
        }
    }

    return {
        schema: mcpUtils.piecePropertyToZod(property),
        value: options,
    }
}

export const toolUtils = {
    buildParameterExtractionPrompt,
    buildFinalExtractionPrompt,
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
}

type BuildZodSchemaForPiecePropertyResult = {
    schema: z.ZodTypeAny | null
    value: unknown
}