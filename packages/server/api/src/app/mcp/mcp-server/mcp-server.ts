import { ActionBase, InputPropertyMap, PieceMetadataModel, PropertyType } from '@activepieces/pieces-framework'
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
import { createOpenAI } from '@ai-sdk/openai'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { generateText } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { EngineHelperPropResult, EngineHelperResponse } from 'server-worker'
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

                const pieceMetadata = await pieceMetadataService(logger).getOrThrow({
                    name: toolPieceMetadata.pieceName,
                    version: toolPieceMetadata.pieceVersion,
                    projectId,
                    platformId,
                })
                const pieceConnectionExternalId = !isNil(toolPieceMetadata.connectionExternalId) ? `{{connections['${toolPieceMetadata.connectionExternalId}']}}` : undefined
                const initialParams = { ...defaultValues, ...params, auth: pieceConnectionExternalId ?? undefined }
                const resolvedParams = await resolveParameters({
                    initialParams,
                    actionMetadata,
                    pieceMetadata,
                    projectId,
                    platformId,
                    logger,
                    actionName: action,
                })

                const parsedInputs = {
                    ...resolvedParams,
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

async function resolveParameters({
    initialParams,
    actionMetadata,
    pieceMetadata,
    projectId,
    platformId,
    logger,
    actionName,
}: ResolveParametersParams): Promise<Record<string, unknown>> {
    let currentParams = { ...initialParams }
    let hasChanges = true
    let iterationCount = 0
    const maxIterations = 10
    
    while (hasChanges && iterationCount < maxIterations) {
        hasChanges = false
        iterationCount++
        
        for (const [propName, prop] of Object.entries(actionMetadata.props)) {
            if (prop.type === PropertyType.DYNAMIC || 
                prop.type === PropertyType.DROPDOWN || 
                prop.type === PropertyType.MULTI_SELECT_DROPDOWN) {
                
                const refreshers = 'refreshers' in prop ? prop.refreshers : []
                const shouldResolve = refreshers.length > 0 && 
                    refreshers.some(refresher => currentParams[refresher] !== undefined)

                if (shouldResolve) {
                    try {
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
                        const propertyResult = await userInteractionWatcher(logger)
                            .submitAndWaitForResponse<EngineHelperResponse<EngineHelperPropResult>>({
                            jobType: UserInteractionJobType.EXECUTE_PROPERTY,
                            projectId,
                            propertyName: propName,
                            actionOrTriggerName: actionName,
                            input: currentParams,
                            piece: piecePackage,
                            sampleData: {},
                        })
                        if (propertyResult.status === EngineResponseStatus.OK && 
                            propertyResult.result.type === PropertyType.DYNAMIC) {
                            
                            const dynamicProps = propertyResult.result.options as InputPropertyMap
                            
                            const newParams = await mergeUserInputWithSchema(
                                propName,
                                currentParams, 
                                dynamicProps, 
                                projectId, 
                                platformId, 
                                logger,
                            )
                            
                            if (JSON.stringify(newParams) !== JSON.stringify(currentParams)) {
                                currentParams = newParams
                                hasChanges = true
                            }
                        }
                    }
                    catch (error) {
                        logger.warn(`Failed to resolve dynamic property ${propName}: ${error}`)
                    }
                }
            }
        }
    }
  
    return currentParams
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

async function mergeUserInputWithSchema(
    propName: string,
    input: Record<string, unknown>, 
    schema: InputPropertyMap, 
    projectId: string, 
    platformId: string, 
    logger: FastifyBaseLogger,
): Promise<Record<string, unknown>> {
    try {
        const baseUrl = await domainHelper.getPublicApiUrl({
            path: '/v1/ai-providers/proxy/openai/v1/',
            platformId,
        })
        
        const apiKey = await accessTokenManager.generateEngineToken({
            platformId,
            projectId,
        })
        
        const openai = createOpenAI({
            baseURL: baseUrl,
            apiKey,
        })

        const systemPrompt = `You are a JSON generator. Your task is to merge user input with a JSON schema and return ONLY valid JSON.

IMPORTANT: Return ONLY the JSON object, no explanations, no markdown formatting, no code blocks.

Rules:
- Preserve user values exactly
- Fill missing fields with sensible defaults
- For arrays: use [] if empty, populate if context suggests
- For objects: recursively apply same logic
- Return only valid JSON matching schema exactly
- DO NOT RECURSIVELY FILL THE SAME PROPERTY WITH THE SAME VALUE

Schema: ${JSON.stringify(schema, null, 2)}
Input: ${JSON.stringify(input, null, 2)}

Return ONLY the JSON:`

        const result = await generateText({
            model: openai('gpt-4o'),
            prompt: systemPrompt,
        })

        const aiResponse = result.text.trim()
        
        let parsedResult: Record<string, unknown>
        try {
            parsedResult = JSON.parse(aiResponse)
        }
        catch {
            const jsonMatch = aiResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
            if (jsonMatch) {
                try {
                    parsedResult = JSON.parse(jsonMatch[1])
                }
                catch {
                    throw new Error('Could not parse AI response as JSON, even from code blocks')
                }
            }
            else {
                const jsonObjectMatch = aiResponse.match(/\{[\s\S]*\}/)
                if (jsonObjectMatch) {
                    try {
                        parsedResult = JSON.parse(jsonObjectMatch[0]) as Record<string, unknown>
                    }
                    catch {
                        throw new Error('Could not parse AI response as JSON')
                    }
                }
                else {
                    throw new Error('Could not parse AI response as JSON')
                }
            }
        }

        return {
            ...input,
            [propName]: parsedResult,   
        }

    }
    catch (error) {
        logger.warn({
            projectId,
            platformId,
            error,
            input,
            schema,
            propName,
        }, 'AI merging failed, falling back to original logic')

        return input
    }
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

type ResolveParametersParams = {
    initialParams: Record<string, unknown>
    actionMetadata: ActionBase
    pieceMetadata: PieceMetadataModel
    projectId: string
    platformId: string
    logger: FastifyBaseLogger
    actionName: string
}