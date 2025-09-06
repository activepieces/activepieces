import { ActionBase } from '@activepieces/pieces-framework'
import {
    ExecuteActionResponse,
    isNil,
    PiecePackage,
    spreadIfDefined,
    WorkerJobType,
} from '@activepieces/shared'
import { LanguageModelV2 } from '@ai-sdk/provider'
import { type Schema as AiSchema, generateObject } from 'ai'
import { EngineHelperResponse } from 'server-worker'
import { z, ZodRawShape } from 'zod'
import { system } from '../../helper/system/system'
import { getPiecePackageWithoutArchive, pieceMetadataService } from '../../pieces/piece-metadata-service'
import { userInteractionWatcher } from '../../workers/user-interaction-watcher'
import { toolUtils } from './tool-utils'

const logger = system.globalLogger()

export const toolExecutor = {
    async execute(params: ExecuteToolParams): Promise<ExecuteToolResult> {
        const { pieceName, pieceVersion, actionName, auth, userInstructions, projectId, platformId, aiModel } = params

        const pieceMetadata = await pieceMetadataService(logger).getOrThrow({
            name: pieceName,
            version: pieceVersion,
            projectId,
            platformId,
        })
        const actionMetadata = pieceMetadata.actions[actionName]

        const piecePackage = await getPiecePackageWithoutArchive(
            logger, 
            projectId, 
            platformId, 
            {
                pieceName: pieceMetadata.name,
                pieceVersion: pieceMetadata.version,
            },
        )

        const parsedInputs = await extractActionParametersFromUserInstructions({
            actionMetadata,
            auth,
            userInstructions,
            piecePackage,
            projectId,
            aiModel,
        })

        const result = await userInteractionWatcher(logger)
            .submitAndWaitForResponse<EngineHelperResponse<ExecuteActionResponse>>({
            jobType: WorkerJobType.EXECUTE_TOOL,
            platformId,
            actionName, 
            pieceName,
            pieceVersion,
            packageType: piecePackage.packageType,
            pieceType: piecePackage.pieceType,
            input: parsedInputs,
            projectId,
        })

        return { result, parsedInputs }
    },
}

async function extractActionParametersFromUserInstructions({
    actionMetadata,
    auth,
    userInstructions,
    piecePackage,
    projectId,
    aiModel,
}: ExtractActionParametersParams): Promise<Record<string, unknown>> {
    const actionProperties = actionMetadata.props
    const depthToPropertyMap = toolUtils.sortPropertiesByDependencies(actionProperties)

    const extractedParameters = await Object.entries(depthToPropertyMap).reduce<Promise<Record<string, unknown>>>(
        async (accumulatedParametersPromise, [_, propertyNames]) => {
            const accumulatedParameters = {
                ...(await accumulatedParametersPromise),
                ...spreadIfDefined('auth', auth),
            }

            const parameterExtractionPrompt = toolUtils.buildParameterExtractionPrompt({
                propertyNames,
                userInstructions,
            })

            const propertySchemas = (await Promise.all(propertyNames.map(async propertyName => {
                const result = await toolUtils.buildZodSchemaForPieceProperty({
                    property: actionProperties[propertyName],
                    logger,
                    input: accumulatedParameters,
                    projectId,
                    propertyName,
                    actionMetadata,
                    piecePackage,
                })
                return { propertyName, ...result }
            }))).filter(schema => schema !== null)

            const schemaObject: ZodRawShape = Object.fromEntries(
                propertySchemas
                    .map(({ propertyName, schema }) => [propertyName, schema!]),
            )

            const propertySchemaValues = propertySchemas.map(({ value }) => value).filter(value => value !== null)

            try {
                const { object: extractedParameters } = await generateObject({
                    model: aiModel,
                    schema: z.object(schemaObject) as unknown as AiSchema,
                    prompt: toolUtils.buildFinalExtractionPrompt({
                        parameterExtractionPrompt,
                        propertySchemaValues,
                    }),
                })

                return {
                    ...accumulatedParameters,
                    ...(extractedParameters as Record<string, unknown>),
                    ...spreadIfDefined('auth', auth),
                }
            }
            catch (error) {
                logger.error({ error }, 'FailedToExtractParametersFromAI')
                throw error
            }
        }, 
        Promise.resolve({ ...spreadIfDefined('auth', auth) }),
    )

    const nonNullExtractedParameters = Object.fromEntries(
        Object.entries(extractedParameters).filter(([_, value]) => !isNil(value)),
    )
    return nonNullExtractedParameters
}  

type ExtractActionParametersParams = {
    actionMetadata: ActionBase
    userInstructions: string
    piecePackage: PiecePackage
    auth: string | undefined
    projectId: string
    aiModel: LanguageModelV2
}

export type ExecuteToolParams = {
    pieceName: string
    pieceVersion: string
    actionName: string
    auth: string | undefined
    userInstructions: string
    projectId: string
    platformId: string
    aiModel: LanguageModelV2
}

export type ExecuteToolResult = {
    result: EngineHelperResponse<ExecuteActionResponse>
    parsedInputs: Record<string, unknown>
}
