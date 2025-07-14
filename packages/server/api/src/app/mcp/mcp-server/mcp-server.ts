import { ActionBase } from '@activepieces/pieces-framework'
import { rejectedPromiseHandler, UserInteractionJobType } from '@activepieces/server-shared'
import {
    assertNotNullOrUndefined,
    EngineResponseStatus,
    ExecuteActionResponse,
    isNil,
    McpFlowTool,
    McpPieceTool,
    McpPieceToolData,
    McpRunStatus,
    mcpToolNaming,
    McpToolType,
    McpTrigger,
    PiecePackage,
    TelemetryEventName,
} from '@activepieces/shared'
import { createOpenAI } from '@ai-sdk/openai'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { generateObject, LanguageModelV1 } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { EngineHelperResponse } from 'server-worker'
import { z, ZodRawShape } from 'zod'
import { accessTokenManager } from '../../authentication/lib/access-token-manager'
import { flowService } from '../../flows/flow/flow.service'
import { domainHelper } from '../../helper/domain-helper'
import { telemetry } from '../../helper/telemetry.utils'
import { getPiecePackageWithoutArchive, pieceMetadataService } from '../../pieces/piece-metadata-service'
import { projectService } from '../../project/project-service'
import { WebhookFlowVersionToRun } from '../../webhooks/webhook-handler'
import { webhookSimulationService } from '../../webhooks/webhook-simulation/webhook-simulation-service'
import { webhookService } from '../../webhooks/webhook.service'
import { userInteractionWatcher } from '../../workers/user-interaction-watcher'
import { mcpRunService } from '../mcp-run/mcp-run.service'
import { mcpService } from '../mcp-service'
import { mcpUtils } from '../mcp-utils'



export async function createMcpServer({
    mcpId,
    logger,
    projectId,
}: CreateMcpServerRequest): Promise<CreateMcpServerResponse> {
    const server = new McpServer({
        name: 'Activepieces',
        version: '1.0.0',
    })

    const mcp = await mcpService(logger).getOrThrow({ mcpId, projectId })
    const platformId = await projectService.getPlatformId(mcp.projectId)
    const addedToolPromise = mcp.tools.map(tool => {
        switch (tool.type) {
            case McpToolType.PIECE: {
                return addPieceToServer(server, tool, mcp.projectId, platformId, logger)
            }
            case McpToolType.FLOW: {
                return addFlowToServer(server, tool, mcpId, mcp.projectId, logger)
            }
        }
    })
    await Promise.all(addedToolPromise)
    return { server }
}

async function addPieceToServer(
    server: McpServer,
    mcpTool: McpPieceTool,
    projectId: string,
    platformId: string,
    logger: FastifyBaseLogger,
): Promise<void> {
    const toolPieceMetadata = mcpTool.pieceMetadata

    if (isNil(toolPieceMetadata)) {
        return
    }
    const pieceMetadata = await pieceMetadataService(logger).getOrThrow({
        name: toolPieceMetadata.pieceName,
        version: toolPieceMetadata.pieceVersion,
        projectId,
        platformId,
    })

    const actionMetadata = pieceMetadata.actions[toolPieceMetadata.actionName]
    const toolActionName = mcpToolNaming.fixTool(actionMetadata.name, mcpTool.id, McpToolType.PIECE)
    const toolSchema = {
        instructions: z.string().describe(
            'Provide clear instructions for what you want this tool to do. Include any specific parameters, values, or requirements needed.',
        ),
    }
    const toolDescription = `
    This tool is used to execute the ${actionMetadata.name} (${actionMetadata.displayName}) action for the piece: ${pieceMetadata.name} (${pieceMetadata.displayName}).
    ${actionMetadata.description}
    `
    server.tool(
        toolActionName,
        toolDescription,
        toolSchema,
        async (params) => {
            const piecePackage = await getPiecePackageWithoutArchive(
                logger,
                projectId,
                platformId,
                {
                    packageType: pieceMetadata.packageType,
                    pieceName: pieceMetadata.name,
                    pieceVersion: pieceMetadata.version,
                    pieceType: pieceMetadata.pieceType,
                },
            )
            try {
                const parsedInputs = await extractActionParametersFromUserInstructions({
                    actionMetadata,
                    toolPieceMetadata,
                    userInstructions: params.instructions,
                    piecePackage,
                    platformId,
                    projectId,
                    logger,
                })

                const result = await userInteractionWatcher(logger)
                    .submitAndWaitForResponse<EngineHelperResponse<ExecuteActionResponse>>({
                    jobType: UserInteractionJobType.EXECUTE_TOOL,
                    actionName: toolPieceMetadata.actionName,
                    pieceName: toolPieceMetadata.pieceName,
                    pieceVersion: toolPieceMetadata.pieceVersion,
                    packageType: pieceMetadata.packageType,
                    pieceType: pieceMetadata.pieceType,
                    input: parsedInputs,
                    projectId,
                })

                trackToolCall({ mcpId: mcpTool.mcpId, toolName: toolActionName, projectId, logger })
                const success = result.status === EngineResponseStatus.OK && result.result.success

                await mcpRunService(logger).create({
                    mcpId: mcpTool.mcpId,
                    toolId: mcpTool.id,
                    projectId,
                    metadata: {
                        pieceName: toolPieceMetadata.pieceName,
                        pieceVersion: toolPieceMetadata.pieceVersion,
                        actionName: toolPieceMetadata.actionName,
                    },
                    input: params,
                    output: result.result.output as Record<string, unknown>,
                    status: success ? McpRunStatus.SUCCESS : McpRunStatus.FAILED,
                })

                if (success) {
                    return {
                        success: true,
                        content: [{
                            type: 'text',
                            text: `${JSON.stringify(result.result.output, null, 2)}`,
                        }],
                        resolvedFields: parsedInputs,
                    }
                }
                else {
                    return {
                        success: false,
                        content: [{
                            type: 'text',
                            text: `${JSON.stringify(result.standardError || result.result.output || { error: 'Unknown engine error occurred' }, null, 2)}`,
                        }],
                        resolvedFields: parsedInputs,
                    }
                }
            }
            catch (error) {
                const isOpenAIProviderNotConnected = error instanceof Error && (error.name === 'AI_RetryError' || error.name === 'AI_APICallError')
                const errorMessage = isOpenAIProviderNotConnected ? 'Please check if you have connected your OpenAI provider to Activepieces.' : JSON.stringify(error, null, 2)
                await mcpRunService(logger).create({
                    mcpId: mcpTool.mcpId,
                    toolId: mcpTool.id,
                    projectId,
                    metadata: {
                        pieceName: toolPieceMetadata.pieceName,
                        pieceVersion: toolPieceMetadata.pieceVersion,
                        actionName: toolPieceMetadata.actionName,
                    },
                    input: params,
                    output: { error: errorMessage },
                    status: McpRunStatus.FAILED,
                })

                return {
                    success: false,
                    content: [{
                        type: 'text',
                        text: errorMessage,
                    }],
                }
            }
        },
    )
}

async function addFlowToServer(
    server: McpServer,
    mcpTool: McpFlowTool,
    mcpId: string,
    projectId: string,
    logger: FastifyBaseLogger,
): Promise<void> {
    const flowId = mcpTool.flowId
    if (isNil(flowId)) {
        return
    }
    const populatedFlow = await flowService(logger).getOnePopulated({ id: flowId, projectId })
    if (isNil(populatedFlow)) {
        return
    }

    const triggerSettings = populatedFlow.version.trigger.settings as McpTrigger
    const toolName = mcpToolNaming.fixTool(populatedFlow.version.displayName, mcpTool.id, McpToolType.FLOW)
    const toolDescription = triggerSettings.input?.toolDescription
    const inputSchema = triggerSettings.input?.inputSchema
    const returnsResponse = triggerSettings.input?.returnsResponse

    const paramNameMapping = Object.fromEntries(
        inputSchema.map(prop => [
            mcpToolNaming.fixProperty(prop.name),
            prop.name,
        ]),
    )

    const zodFromInputSchema = Object.fromEntries(
        inputSchema.map(prop => [
            mcpToolNaming.fixProperty(prop.name),
            mcpUtils.mcpPropertyToZod(prop),
        ]),
    )
    server.tool(
        toolName,
        toolDescription,
        zodFromInputSchema,
        async (params) => {
            const originalParams = Object.fromEntries(
                Object.entries(params).map(([key, value]) => [
                    paramNameMapping[key] || key,
                    value,
                ]),
            )

            const response = await webhookService.handleWebhook({
                data: () => {
                    return Promise.resolve({
                        body: {},
                        method: 'POST',
                        headers: {},
                        queryParams: {},
                    })
                },
                logger,
                flowId: populatedFlow.id,
                async: !returnsResponse,
                flowVersionToRun: WebhookFlowVersionToRun.LOCKED_FALL_BACK_TO_LATEST,
                saveSampleData: await webhookSimulationService(logger).exists(flowId),
                payload: originalParams,
                execute: true,
            })

            trackToolCall({ mcpId, toolName, projectId, logger })
            const success = isOkSuccess(response.status)

            await mcpRunService(logger).create({
                mcpId,
                toolId: mcpTool.id,
                projectId,
                metadata: {
                    flowId: populatedFlow.id,
                    flowVersionId: populatedFlow.version.id,
                    name: populatedFlow.version.displayName,
                },
                input: params,
                output: response,
                status: response.status === StatusCodes.OK ? McpRunStatus.SUCCESS : McpRunStatus.FAILED,
            })

            if (success) {
                return {
                    content: [{
                        type: 'text',
                        text: `✅ Successfully executed flow ${populatedFlow.version.displayName}\n\n` +
                            `Output:\n\`\`\`json\n${JSON.stringify(response, null, 2)}\n\`\`\``,
                    }],
                }
            }
            else {
                return {
                    content: [{
                        type: 'text',
                        text: `❌ Error executing flow ${populatedFlow.version.displayName}\n\n` +
                            `Error details:\n\`\`\`json\n${JSON.stringify(response, null, 2) || 'Unknown error occurred'}\n\`\`\``,
                    }],
                }
            }
        })

}


async function initializeOpenAIModel({
    platformId,
    projectId,
}: InitializeOpenAIModelParams): Promise<LanguageModelV1> {
    const model = 'gpt-4o'
    const baseUrl = await domainHelper.getPublicApiUrl({
        path: '/v1/ai-providers/proxy/openai/v1/',
        platformId,
    })

    const apiKey = await accessTokenManager.generateEngineToken({
        platformId,
        projectId,
    })

    return  createOpenAI({
        baseURL: baseUrl,
        apiKey,
    }).chat(model)
}



async function extractActionParametersFromUserInstructions({
    actionMetadata,
    toolPieceMetadata,
    userInstructions,
    piecePackage,
    platformId,
    projectId,
    logger,
}: ExtractActionParametersParams): Promise<Record<string, unknown>> {
    const connectionReference = `{{connections['${toolPieceMetadata.connectionExternalId}']}}`
    assertNotNullOrUndefined(connectionReference, 'Tool has no connection with the piece, please try to add a connection to the tool')

    const aiModel = await initializeOpenAIModel({
        platformId,
        projectId,
    })

    const actionProperties = actionMetadata.props
    const depthToPropertyMap = mcpUtils.sortPropertiesByDependencies(actionProperties)

    const extractedParameters = await Object.entries(depthToPropertyMap).reduce(
        async (accumulatedParametersPromise, [_, propertyNames]) => {
            const accumulatedParameters = {
                ...(await accumulatedParametersPromise),
                'auth': connectionReference,
            }

            const parameterExtractionPrompt = mcpUtils.buildParameterExtractionPrompt({
                propertyNames,
                userInstructions,
            })

            const propertySchemas = (await Promise.all(propertyNames.map(async propertyName => {
                const result = await mcpUtils.buildZodSchemaForPieceProperty({
                    property: actionProperties[propertyName],
                    logger,
                    input: accumulatedParameters,
                    projectId,
                    propertyName,
                    actionMetadata,
                    piecePackage,
                    depth: 0,
                })
                return { propertyName, ...result }
            }))).filter(({ schema }) => schema !== null)

            const schemaObject: ZodRawShape = Object.fromEntries(
                propertySchemas
                    .map(({ propertyName, schema }) => [propertyName, schema!]),
            )

            const propertySchemaValues = propertySchemas.map(({ value }) => value).filter(value => value !== null)

            try {
                const { object: extractedValue } = await generateObject({
                    model: aiModel,
                    schema: z.object(schemaObject),
                    prompt: mcpUtils.buildFinalExtractionPrompt({
                        parameterExtractionPrompt,
                        propertySchemaValues,
                    }),
                })

                const extractedParameters = Object.fromEntries(
                    Object.entries(extractedValue).map(([key, value]) => [key, value[key]]),
                )

                return {
                    ...accumulatedParameters,
                    ...extractedParameters,
                    'auth': connectionReference,
                }
            }
            catch (error) {
                logger.error({ error }, 'FailedToExtractParametersFromAI')
                throw error
            }
        },
        Promise.resolve({ 'auth': connectionReference }),
    )

    return extractedParameters
}

function isOkSuccess(status: number) {
    return Math.floor(status / 100) === 2
}

function trackToolCall({ mcpId, toolName, projectId, logger }: TrackToolCallParams) {
    rejectedPromiseHandler(telemetry(logger).trackProject(projectId, {
        name: TelemetryEventName.MCP_TOOL_CALLED,
        payload: {
            mcpId,
            toolName,
        },
    }), logger)
}

type ExtractActionParametersParams = {
    actionMetadata: ActionBase
    toolPieceMetadata: McpPieceToolData
    userInstructions: string
    piecePackage: PiecePackage
    platformId: string
    projectId: string
    logger: FastifyBaseLogger
}


type InitializeOpenAIModelParams = {
    platformId: string
    projectId: string
}

type TrackToolCallParams = {
    mcpId: string
    toolName: string
    projectId: string
    logger: FastifyBaseLogger
}

type CreateMcpServerRequest = {
    mcpId: string
    projectId: string
    logger: FastifyBaseLogger
}

type CreateMcpServerResponse = {
    server: McpServer
}
