import { ActionBase } from '@activepieces/pieces-framework'
import {
    isNil,
    PiecePackage,
    spreadIfDefined,
} from '@activepieces/shared'
import { LanguageModelV2 } from '@ai-sdk/provider'
import { type Schema as AiSchema, generateObject } from 'ai'
import { z, ZodRawShape } from 'zod'
import { system } from '../../helper/system/system'
import { getPiecePackageWithoutArchive, pieceMetadataService } from '../../pieces/piece-metadata-service'
import { toolUtils } from './tool-utils'

const logger = system.globalLogger()

export const toolInputsResolver = {
    async resolve(params: ResolveToolInputsParams): Promise<Record<string, unknown>> {
        const { pieceName, pieceVersion, actionName, auth, userInstructions, projectId, platformId, aiModel, preDefinedInputs } = params

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

        return extractActionParametersFromUserInstructions({
            actionMetadata,
            auth,
            userInstructions,
            piecePackage,
            projectId,
            aiModel,
            preDefinedInputs,
        })
    },
}

async function extractActionParametersFromUserInstructions({
    actionMetadata,
    auth,
    userInstructions,
    piecePackage,
    projectId,
    aiModel,
    preDefinedInputs,
}: ExtractActionParametersParams): Promise<Record<string, unknown>> {
    const actionProperties = actionMetadata.props
    const depthToPropertyMap = toolUtils.sortPropertiesByDependencies(actionProperties)

    const extractedParameters = await Object.entries(depthToPropertyMap).reduce<Promise<Record<string, unknown>>>(
        async (accumulatedParametersPromise, [_, propertyNames]) => {
            const accumulatedParameters = {
                ...(await accumulatedParametersPromise),
                ...spreadIfDefined('auth', auth),
                ...preDefinedInputs,
            }

            const parameterExtractionPrompt = toolUtils.buildParameterExtractionPrompt({
                propertyNames: propertyNames.filter(propertyName => !preDefinedInputs[propertyName]),
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
                        propertySchemaValues: {
                            ...propertySchemaValues,
                            ...preDefinedInputs,
                        },
                    }),
                })

                return {
                    ...accumulatedParameters,
                    ...(extractedParameters as Record<string, unknown>),
                    ...spreadIfDefined('auth', auth),
                    ...preDefinedInputs,
                }
            }
            catch (error) {
                logger.error({ error }, 'FailedToExtractParametersFromAI')
                throw error
            }
        }, 
        Promise.resolve({ ...spreadIfDefined('auth', auth), ...preDefinedInputs }),
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
    preDefinedInputs: Record<string, unknown>
}

export type ResolveToolInputsParams = {
    pieceName: string
    pieceVersion: string
    actionName: string
    auth: string | undefined
    userInstructions: string
    projectId: string
    platformId: string
    aiModel: LanguageModelV2
    preDefinedInputs: Record<string, unknown>
}
