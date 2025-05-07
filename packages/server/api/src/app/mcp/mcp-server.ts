import { PropertyType } from '@activepieces/pieces-framework'
import { UserInteractionJobType } from '@activepieces/server-shared'
import { EngineResponseStatus, ExecuteActionResponse, fixSchemaNaming, FlowStatus, FlowVersionState, GetFlowVersionForWorkerRequestType, isNil, McpPieceStatus, McpPieceWithConnection, McpTrigger, TriggerType } from '@activepieces/shared'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import { FastifyBaseLogger, FastifyReply } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { EngineHelperResponse } from 'server-worker'
import { flowService } from '../flows/flow/flow.service'
import { pieceMetadataService } from '../pieces/piece-metadata-service'
import { projectService } from '../project/project-service'
import { webhookSimulationService } from '../webhooks/webhook-simulation/webhook-simulation-service'
import { webhookService } from '../webhooks/webhook.service'
import { userInteractionWatcher } from '../workers/user-interaction-watcher'
import { mcpService } from './mcp-service'
import { MAX_TOOL_NAME_LENGTH, mcpPropertyToZod, piecePropertyToZod } from './mcp-utils'

export async function createMcpServer({
    mcpId,
    reply,
    logger,
}: CreateMcpServerRequest): Promise<CreateMcpServerResponse> {
    const transport = new SSEServerTransport('/api/v1/mcp/messages', reply.raw)
    const server = new McpServer({
        name: 'Activepieces',
        version: '1.0.0',
    })

    await addPiecesToServer(server, mcpId, logger)
    await addFlowsToServer(server, mcpId, logger)

    return { server, transport }
}

async function addPiecesToServer(
    server: McpServer,
    mcpId: string,
    logger: FastifyBaseLogger,
): Promise<void> {
    const mcp = await mcpService(logger).getOrThrow({ mcpId })
    const projectId = mcp.projectId
    const platformId = await projectService.getPlatformId(projectId)

    // filter out pieces that are not enabled
    const enabledPieces = mcp.pieces.filter((piece) => piece.status === McpPieceStatus.ENABLED)

    // Get all pieces with their connections
    const pieces = await Promise.all(enabledPieces.map(async (piece: McpPieceWithConnection) => {
        return pieceMetadataService(logger).getOrThrow({
            name: piece.pieceName,
            version: undefined,
            projectId,
            platformId,
        })
    }))

    const uniqueActions = new Set<string>()
    pieces.flatMap(piece => {
        return Object.values(piece.actions).map(action => {
            if (uniqueActions.has(action.name)) {
                return
            }
            
            // Find matching piece in mcp pieces
            const mcpPiece = mcp.pieces.find(p => p.pieceName === piece.name)
            const pieceConnectionExternalId = mcpPiece?.connection?.externalId
            
            const actionName = fixSchemaNaming(`${piece.name.split('piece-')[1]}-${action.name}`).slice(0, MAX_TOOL_NAME_LENGTH)
            uniqueActions.add(actionName)
            
            server.tool(
                actionName,
                action.description,
                Object.fromEntries(
                    Object.entries(action.props).filter(([_key, prop]) => 
                        prop.type !== PropertyType.MARKDOWN,
                    ).map(([key, prop]) =>
                        [key, piecePropertyToZod(prop)],
                    ),
                ),
                async (params) => {
                    const parsedInputs = {
                        ...params,
                        ...Object.fromEntries(
                            Object.entries(action.props)
                                .filter(([key, prop]) => !isNil(prop.defaultValue) && isNil(params[key]))
                                .map(([key, prop]) => [key, prop.defaultValue]),
                        ),
                        ...(pieceConnectionExternalId ? { auth: `{{connections['${pieceConnectionExternalId}']}}` } : {}),
                    }
                    
                    const result = await userInteractionWatcher(logger).submitAndWaitForResponse<EngineHelperResponse<ExecuteActionResponse>>({
                        jobType: UserInteractionJobType.EXECUTE_TOOL,
                        actionName: action.name,
                        pieceName: piece.name,
                        pieceVersion: piece.version,
                        packageType: piece.packageType,
                        pieceType: piece.pieceType,
                        input: parsedInputs,
                        projectId,
                    })

                    if (result.status === EngineResponseStatus.OK) {
                        return {
                            content: [{
                                type: 'text',
                                text: `✅ Successfully executed ${action.displayName}\n\n` +
                                    `${action.description}\n\n` +
                                    `\`\`\`json\n${JSON.stringify(result.result, null, 2)}\n\`\`\``,
                            }],
                        }
                    }
                    else {
                        return {
                            content: [{
                                type: 'text',
                                text: `❌ Error executing ${action.displayName}\n\n` +
                                    `${action.description}\n\n` +
                                    `\`\`\`\n${result.standardError || 'Unknown error occurred'}\n\`\`\``,
                            }],
                        }
                    }
                },
            )
        })
    })
}

async function addFlowsToServer(
    server: McpServer,
    mcpId: string,
    logger: FastifyBaseLogger,
): Promise<void> {
    const mcp = await mcpService(logger).getOrThrow({ mcpId })
    const projectId = mcp.projectId

    const flows = await flowService(logger).list({ 
        projectId,
        cursorRequest: null,
        limit: 100,
        folderId: undefined,
        status: [FlowStatus.ENABLED],
        name: undefined,
        versionState: FlowVersionState.LOCKED,
    })

    const mcpFlows = flows.data.filter((flow) => 
        flow.version.trigger.type === TriggerType.PIECE &&
        flow.version.trigger.settings.pieceName === '@activepieces/piece-mcp',
    )

    for (const flow of mcpFlows) {
        const triggerSettings = flow.version.trigger.settings as McpTrigger
        const toolName = fixSchemaNaming('flow-' + triggerSettings.input?.toolName).slice(0, MAX_TOOL_NAME_LENGTH)
        const toolDescription = triggerSettings.input?.toolDescription
        const inputSchema = triggerSettings.input?.inputSchema
        const returnsResponse = triggerSettings.input?.returnsResponse


        const paramNameMapping = Object.fromEntries(
            inputSchema.map((prop) => {
                const transformedName = fixSchemaNaming(prop.name)
                return [transformedName, prop.name]
            }),
        )

        const zodFromInputSchema = Object.fromEntries(
            inputSchema.map((prop) => [
                fixSchemaNaming(prop.name),
                mcpPropertyToZod(prop),
            ]),
        )

        server.tool(
            toolName,
            toolDescription,
            zodFromInputSchema,
            async (params) => { 
                // Transform parameter names back to original names for the payload
                const originalParams = Object.fromEntries(
                    Object.entries(params).map(([key, value]) => {
                        const originalName = paramNameMapping[key]
                        return [originalName || key, value]
                    }),
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
                    flowId: flow.id,
                    async: !returnsResponse,
                    flowVersionToRun: GetFlowVersionForWorkerRequestType.LOCKED,
                    saveSampleData: await webhookSimulationService(logger).exists(
                        flow.id,
                    ),
                    payload: originalParams,
                    execute: true,
                })
                if (response.status !== StatusCodes.OK) {
                    return {
                        content: [{
                            type: 'text',
                            text: `❌ Error executing flow ${flow.version.displayName}\n\n\`\`\`\n${JSON.stringify(response, null, 2) || 'Unknown error occurred'}\n\`\`\``,
                        }],
                    }
                }
                return {
                    content: [{
                        type: 'text',
                        text: `✅ Successfully executed flow ${flow.version.displayName}\n\n\`\`\`json\n${JSON.stringify(response, null, 2)}\n\`\`\``,
                    }],
                }
            },
        )
    }
}

export type CreateMcpServerRequest = {
    mcpId: string
    reply: FastifyReply
    logger: FastifyBaseLogger
}
export type CreateMcpServerResponse = {
    server: McpServer
    transport: SSEServerTransport
}