import { ActionBase, PropertyType } from '@activepieces/pieces-framework'
import { rejectedPromiseHandler, UserInteractionJobType } from '@activepieces/server-shared'
import {
    assertNotNullOrUndefined,
    EngineResponseStatus,
    ExecuteActionResponse,
    isNil,
    McpPieceToolData,
    McpRunStatus,
    McpTool,
    mcpToolNaming,
    McpToolType,
    McpTrigger,
    PiecePackage,
    TelemetryEventName,
} from '@activepieces/shared'
import { createOpenAI } from '@ai-sdk/openai'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { generateText, LanguageModelV1 } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { EngineHelperPropResult, EngineHelperResponse } from 'server-worker'
import { z } from 'zod'
import { accessTokenManager } from '../../authentication/lib/access-token-manager'
import { domainHelper } from '../../ee/custom-domains/domain-helper'
import { flowService } from '../../flows/flow/flow.service'
import { telemetry } from '../../helper/telemetry.utils'
import { getPiecePackageWithoutArchive, pieceMetadataService } from '../../pieces/piece-metadata-service'
import { projectService } from '../../project/project-service'
import { WebhookFlowVersionToRun } from '../../webhooks/webhook-handler'
import { webhookSimulationService } from '../../webhooks/webhook-simulation/webhook-simulation-service'
import { webhookService } from '../../webhooks/webhook.service'
import { userInteractionWatcher } from '../../workers/user-interaction-watcher'
import { mcpRunService } from '../mcp-run/mcp-run.service'
import { mcpService } from '../mcp-service'
import { mcpPropertyToZod } from '../mcp-utils'

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

    const toolActionsNames = Object.keys(pieceMetadata.actions).filter(action => toolPieceMetadata.actionNames.includes(action))
    for (const action of toolActionsNames) {
        const actionMetadata = pieceMetadata.actions[action]
        const actionName = mcpToolNaming.fixTool(actionMetadata.displayName, mcpTool.id, McpToolType.PIECE)

        const toolSchema = {
            instructions: z.string().describe('The instructions to follow when executing the tool'),
        }
        server.tool(
            actionName,
            actionMetadata.description,
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
                const parsedInputs = await parseActionParametersFromInstructions({
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
    const toolName = mcpToolNaming.fixTool(mcpTool.flowId!, mcpTool.id, McpToolType.FLOW)
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


async function initializeOpenAIModel({
    platformId,
    projectId,
}: InitializeOpenAIModelParams): Promise<LanguageModelV1> {
    const model = 'gpt-4o-mini'
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

async function parseActionParametersFromInstructions({
    actionMetadata,
    toolPieceMetadata,
    userInstructions,    
    piecePackage,
    platformId,
    projectId,
    logger,
}: ParseActionParametersParams): Promise<Record<string, unknown>> {
    const pieceConnectionExternalId = `{{connections['${toolPieceMetadata.connectionExternalId}']}}`
    assertNotNullOrUndefined(pieceConnectionExternalId, 'Tool has no connection with the piece, please try to add a connection to the tool')

    const aiModel = await initializeOpenAIModel({
        platformId,
        projectId,
    })

    const actionProperties = actionMetadata.props
    const actionPropertiesEntries = Object.entries(actionProperties)

    const parsedParameters = await actionPropertiesEntries.reduce(async (accPromise, [propertyName, propertyDefinition]) => {
        const acc = await accPromise
        const needsDynamicResolution = propertyDefinition.type === PropertyType.DYNAMIC || 
            propertyDefinition.type === PropertyType.DROPDOWN || 
            propertyDefinition.type === PropertyType.MULTI_SELECT_DROPDOWN
        
        let dynamicPropertySchema = 'N/A'
        
        if (needsDynamicResolution) {
            const propertyResolutionResult = await userInteractionWatcher(logger)
                .submitAndWaitForResponse<EngineHelperResponse<EngineHelperPropResult>>({
                jobType: UserInteractionJobType.EXECUTE_PROPERTY,
                projectId,
                propertyName,
                actionOrTriggerName: actionMetadata.name,
                input: acc,
                piece: piecePackage,
                sampleData: {},
            })
            dynamicPropertySchema = JSON.stringify(propertyResolutionResult.result, null, 2)
        }

        const parameterExtractionPrompt = `
You are an expert at understanding API schemas and filling out properties based on user instructions.

TASK: Fill out the property "${propertyName}" based on the user's instructions.

USER INSTRUCTIONS:
${userInstructions}

PROPERTY DETAILS:
- ${JSON.stringify(propertyDefinition, null, 2)}

PROPERTY SCHEMA:
${dynamicPropertySchema}

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
- If the property is not required, return SKIP_PROPERTY if the user does not provide a value
- Use actual values from user instructions when available

CONTEXT:
- Previously filled properties: ${JSON.stringify(acc, null, 2)}

INSTRUCTIONS:
1. Extract the property value from user instructions
2. For required properties without clear instructions, use defaults or make reasonable assumptions
3. Return raw values for simple types, valid JSON for complex types

RESPONSE FORMAT:
- Return only the value (raw for simple types, JSON for complex types)
- No explanations or additional text

Respond with ONLY the value, no explanations or additional text.`

        const aiResponse = await generateText({
            model: aiModel,
            prompt: parameterExtractionPrompt,
        })
        
        let extractedValue = aiResponse.text.trim()
        try {
            extractedValue = JSON.parse(aiResponse.text)
        }
        catch {
            if (extractedValue === 'SKIP_PROPERTY') {
                return acc
            }
        }

        return {
            ...acc,
            [propertyName]: extractedValue,
        }
    }, Promise.resolve({ 'auth': pieceConnectionExternalId }))

    return parsedParameters
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

type ParseActionParametersParams = {
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
    logger: FastifyBaseLogger
}

type CreateMcpServerResponse = {
    server: McpServer
}
