import { ActionBase } from '@activepieces/pieces-framework'
import { UserInteractionJobType } from '@activepieces/server-shared'
import {
    ExecuteActionResponse,
    isNil,
    PiecePackage,
    spreadIfDefined,
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

export class ToolExecution {
    private readonly projectId: string
    private readonly platformId: string
    private readonly aiModel: LanguageModelV2

    constructor({ projectId, platformId, aiModel }: ToolExecutionConstructorParams) {
        this.projectId = projectId
        this.platformId = platformId
        this.aiModel = aiModel
    }

    async execute(params: ExecuteToolParams): Promise<ExecuteToolResult> {
        const { pieceName, pieceVersion, actionName, auth, userInstructions } = params

        const pieceMetadata = await pieceMetadataService(logger).getOrThrow({
            name: pieceName,
            version: pieceVersion,
            projectId: this.projectId,
            platformId: this.platformId,
        })
        const actionMetadata = pieceMetadata.actions[actionName]

        const piecePackage = await getPiecePackageWithoutArchive(
            logger, 
            this.projectId, 
            this.platformId, 
            {
                pieceName: pieceMetadata.name,
                pieceVersion: pieceMetadata.version,
            },
        )

        const parsedInputs = await this.extractActionParametersFromUserInstructions({
            actionMetadata,
            auth,
            userInstructions,
            piecePackage,
        })

        const result = await userInteractionWatcher(logger)
            .submitAndWaitForResponse<EngineHelperResponse<ExecuteActionResponse>>({
            jobType: UserInteractionJobType.EXECUTE_TOOL,
            actionName,
            pieceName,
            pieceVersion,
            packageType: piecePackage.packageType,
            pieceType: piecePackage.pieceType,
            input: parsedInputs,
            projectId: this.projectId,
        })

        return { result, parsedInputs }
    }

    private async extractActionParametersFromUserInstructions({
        actionMetadata,
        auth,
        userInstructions,
        piecePackage,
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
                        projectId: this.projectId,
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
                        model: this.aiModel,
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
}

type ExtractActionParametersParams = {
    actionMetadata: ActionBase
    userInstructions: string
    piecePackage: PiecePackage
    auth: string | undefined
}

export type ExecuteToolParams = {
    pieceName: string
    pieceVersion: string
    actionName: string
    auth: string | undefined
    userInstructions: string
}

export type ExecuteToolResult = {
    result: EngineHelperResponse<ExecuteActionResponse>
    parsedInputs: Record<string, unknown>
}

type ToolExecutionConstructorParams = {
    projectId: string
    platformId: string
    aiModel: LanguageModelV2
}