import { AIUsageFeature, createAIModel } from '@activepieces/common-ai'
import { rejectedPromiseHandler } from '@activepieces/server-shared'
import {
    EngineResponseStatus,
    ExecuteActionResponse,
    isNil,
    McpFlowRunMetadata,
    McpFlowTool,
    McpPieceRunMetadata,
    McpPieceTool,
    McpRunStatus,
    McpTool,
    mcpToolNaming,
    McpToolType,
    McpTrigger,
    TelemetryEventName,
    WorkerJobType,
} from '@activepieces/shared'       
import { openai } from '@ai-sdk/openai'
import { LanguageModelV2 } from '@ai-sdk/provider'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { FastifyBaseLogger } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { EngineHelperResponse } from 'server-worker'
import { z } from 'zod'
import { accessTokenManager } from '../../authentication/lib/access-token-manager'
import { domainHelper } from '../../ee/custom-domains/domain-helper'
import { flowService } from '../../flows/flow/flow.service'
import { telemetry } from '../../helper/telemetry.utils'
import { pieceMetadataService } from '../../pieces/piece-metadata-service'
import { projectService } from '../../project/project-service'
import { triggerSourceService } from '../../trigger/trigger-source/trigger-source-service'
import { WebhookFlowVersionToRun } from '../../webhooks/webhook-handler'
import { webhookService } from '../../webhooks/webhook.service'
import { userInteractionWatcher } from '../../workers/user-interaction-watcher'
import { mcpRunService } from '../mcp-run/mcp-run.service'
import { mcpUtils } from '../mcp-utils'
import { toolInputsResolver } from '../tool/tool-inputs-resolver'


export async function createMcpServer({
    logger,
    projectId,
    tools,
}: CreateMcpServerRequest): Promise<CreateMcpServerResponse> {
    const server = new McpServer({
        name: 'Activepieces',
        version: '1.0.0',
    })

    const platformId = await projectService.getPlatformId(projectId)
    const addedToolPromise = tools.map(tool => {
        switch (tool.type) {
            case McpToolType.PIECE: {
                return addPieceToServer(server, tool, projectId, platformId, logger)
            }
            case McpToolType.FLOW: {
                return addFlowToServer(server, tool, projectId, logger)
            }
        }
    })
    await Promise.all(addedToolPromise)
    return { server }
}

async function initializeOpenAIModel({
    platformId,
    projectId,
    mcpId,
}: {
    platformId: string
    projectId: string
    mcpId: string
}): Promise<LanguageModelV2> {
    const model = 'gpt-4.1'
    const baseURL = await domainHelper.getPublicApiUrl({
        path: '/v1/ai-providers/proxy/openai',
        platformId,
    })

    const engineToken = await accessTokenManager.generateEngineToken({
        platformId,
        projectId,
    })

    return createAIModel({
        providerName: 'openai',
        modelInstance: openai(model),
        engineToken,
        baseURL,
        metadata: {
            feature: AIUsageFeature.MCP,
            mcpid: mcpId,
        },
    })
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
            try {
                const aiModel = await initializeOpenAIModel({
                    platformId,
                    projectId,
                    mcpId: mcpTool.mcpId,
                })
                
                const auth = !isNil(toolPieceMetadata.connectionExternalId) ? `{{connections['${toolPieceMetadata.connectionExternalId}']}}` : undefined
                
                const parsedInputs = await toolInputsResolver.resolve({
                    auth,
                    userInstructions: params.instructions,
                    actionName: toolPieceMetadata.actionName,
                    pieceName: toolPieceMetadata.pieceName,
                    pieceVersion: toolPieceMetadata.pieceVersion,
                    aiModel,
                    projectId,
                    platformId,
                    preDefinedInputs: {},
                })

                const result = await userInteractionWatcher(logger)
                    .submitAndWaitForResponse<EngineHelperResponse<ExecuteActionResponse>>({
                    jobType: WorkerJobType.EXECUTE_TOOL,
                    platformId,
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

                await saveMcpRunOrSkip({
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
                    logger,
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
                await saveMcpRunOrSkip({
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
                    logger,
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
                saveSampleData: await triggerSourceService(logger).existsByFlowId({
                    flowId,
                    simulate: true,
                }),
                payload: originalParams,
                execute: true,
                failParentOnFailure: false,
            })

            trackToolCall({ mcpId: mcpTool.mcpId, toolName, projectId, logger })
            const success = isOkSuccess(response.status)

            await saveMcpRunOrSkip({
                mcpId: mcpTool.mcpId,
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
                logger,
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

async function saveMcpRunOrSkip({ mcpId, toolId, projectId, metadata, input, output, status, logger }: SaveMcpRunParams) {
    if (mcpId.startsWith('flow:')) {
        return
    }
    await mcpRunService(logger).create({ mcpId, toolId, projectId, metadata, input, output, status })
}



type TrackToolCallParams = {
    mcpId: string
    toolName: string
    projectId: string
    logger: FastifyBaseLogger
}

type SaveMcpRunParams = {
    mcpId: string
    toolId: string
    projectId: string
    metadata: McpPieceRunMetadata | McpFlowRunMetadata
    input: Record<string, unknown>
    output: Record<string, unknown>
    status: McpRunStatus
    logger: FastifyBaseLogger
}

type CreateMcpServerRequest = {
    projectId: string
    tools: McpTool[]
    logger: FastifyBaseLogger
}

type CreateMcpServerResponse = {
    server: McpServer
}