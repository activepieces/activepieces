import { PropertyType } from '@activepieces/pieces-framework'
import { rejectedPromiseHandler, UserInteractionJobType } from '@activepieces/server-shared'
import {
    EngineResponseStatus,
    ExecuteActionResponse,
    isNil,
    McpRunStatus,
    McpTool,
    mcpToolNaming,
    McpToolType,
    McpTrigger,
    TelemetryEventName,
} from '@activepieces/shared'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { FastifyBaseLogger } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { EngineHelperResponse } from 'server-worker'
import { flowService } from '../../flows/flow/flow.service'
import { telemetry } from '../../helper/telemetry.utils'
import { pieceMetadataService } from '../../pieces/piece-metadata-service'
import { projectService } from '../../project/project-service'
import { WebhookFlowVersionToRun } from '../../webhooks/webhook-handler'
import { webhookSimulationService } from '../../webhooks/webhook-simulation/webhook-simulation-service'
import { webhookService } from '../../webhooks/webhook.service'
import { userInteractionWatcher } from '../../workers/user-interaction-watcher'
import { mcpRunService } from '../mcp-run/mcp-run.service'
import { mcpService } from '../mcp-service'
import { mcpPropertyToZod, piecePropertyToZod } from '../mcp-utils'

export async function createMcpServer({
    mcpId,
    logger,
}: CreateMcpServerRequest): Promise<CreateMcpServerResponse> {
    const server = new McpServer({
        name: 'Activepieces',
        version: '1.0.0',
    })

    const mcp = await mcpService(logger).getOrThrow({ mcpId })
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
    mcpTool: McpTool,
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

    const filteredAction = Object.keys(pieceMetadata.actions).filter(action => toolPieceMetadata.actionNames.includes(action))
    for (const action of filteredAction) {
        const actionMetadata = pieceMetadata.actions[action]
        const actionName = mcpToolNaming.fixTool(actionMetadata.displayName, mcpTool.id, McpToolType.PIECE)

        const actionSchema = Object.fromEntries(
            Object.entries(actionMetadata.props)
                .filter(([_key, prop]) => prop.type !== PropertyType.MARKDOWN)
                .map(([key, prop]) => [key, piecePropertyToZod(prop)]),
        )
        server.tool(
            actionName,
            actionMetadata.description,
            actionSchema,
            async (params) => {
                const defaultValues = Object.fromEntries(
                    Object.entries(actionMetadata.props)
                        .filter(([_key, prop]) => !isNil(prop.defaultValue))
                        .map(([key, prop]) => [key, prop.defaultValue]),
                )
                const pieceConnectionExternalId = !isNil(toolPieceMetadata.connectionExternalId) ? `{{connections['${toolPieceMetadata.connectionExternalId}']}}` : undefined
                const parsedInputs = {
                    ...defaultValues,
                    ...params,
                    auth: pieceConnectionExternalId,
                }
                const result = await userInteractionWatcher(logger)
                    .submitAndWaitForResponse<EngineHelperResponse<ExecuteActionResponse>>({
                    jobType: UserInteractionJobType.EXECUTE_TOOL,
                    actionName: action,
                    pieceName: toolPieceMetadata.pieceName,
                    pieceVersion: toolPieceMetadata.pieceVersion,
                    packageType: pieceMetadata.packageType,
                    pieceType: pieceMetadata.pieceType,
                    input: parsedInputs,
                    projectId,
                })

                trackToolCall({ mcpId: mcpTool.mcpId, toolName: actionName, projectId, logger })
                const success = result.status === EngineResponseStatus.OK && result.result.success

                await mcpRunService(logger).create({
                    mcpId: mcpTool.mcpId,
                    toolId: mcpTool.id,
                    projectId,
                    metadata: {
                        pieceName: toolPieceMetadata.pieceName,
                        pieceVersion: toolPieceMetadata.pieceVersion,
                        actionName: action,
                    },
                    input: params,
                    output: result.result.output as Record<string, unknown>,
                    status: success ? McpRunStatus.SUCCESS : McpRunStatus.FAILED,
                })

                if (success) {
                    return {
                        content: [{
                            type: 'text',
                            text: `✅ Successfully executed ${actionName}\n\n` +
                                `Output:\n\`\`\`json\n${JSON.stringify(result.result.output, null, 2)}\n\`\`\``,
                        }],
                    }
                }
                else {
                    return {
                        content: [{
                            type: 'text',
                            text: `❌ Error executing ${actionName}\n\n` +
                                `Error details:\n\`\`\`\n${result.standardError || 'Unknown engine error occurred'}\n\`\`\``,
                        }],
                    }
                }
            },
        )
    }
}

async function addFlowToServer(
    server: McpServer,
    mcpTool: McpTool,
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
    const flowToolName = mcpTool.flow ? mcpTool.flow.version.displayName : mcpTool.flowId!
    const toolName = mcpToolNaming.fixTool(flowToolName, mcpTool.id, McpToolType.FLOW)
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
            mcpPropertyToZod(prop),
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


type TrackToolCallParams = {
    mcpId: string
    toolName: string
    projectId: string
    logger: FastifyBaseLogger
}

type CreateMcpServerRequest = {
    mcpId: string
    logger: FastifyBaseLogger
}

type CreateMcpServerResponse = {
    server: McpServer
}
