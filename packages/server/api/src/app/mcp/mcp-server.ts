import { PieceProperty, PropertyType } from '@activepieces/pieces-framework'
import { UserInteractionJobType } from '@activepieces/server-shared'
import { EngineResponseStatus, ExecuteActionResponse, FlowStatus, FlowVersionState, GetFlowVersionForWorkerRequestType, isNil, MCPProperty, MCPProperyType, TriggerType } from '@activepieces/shared'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import { FastifyBaseLogger, FastifyReply } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { EngineHelperResponse } from 'server-worker'
import { z } from 'zod' 
import { flowService } from '../flows/flow/flow.service'
import { pieceMetadataService } from '../pieces/piece-metadata-service'
import { projectService } from '../project/project-service'
import { webhookSimulationService } from '../webhooks/webhook-simulation/webhook-simulation-service'
import { webhookService } from '../webhooks/webhook.service'
import { userInteractionWatcher } from '../workers/user-interaction-watcher'
import { mcpService } from './mcp-service'

export async function createMcpServer({
    mcpId,
    reply,
    logger,
}: CreateMcpServerRequest): Promise<CreateMcpServerResponse> {
    const mcp = await mcpService(logger).getOrThrow({ mcpId, log: logger })
    const projectId = mcp.projectId
    const platformId = await projectService.getPlatformId(projectId)
    const connections = mcp.connections

    const pieceNames = connections.map((connection) => connection.pieceName)
    const pieces = await Promise.all(pieceNames.map(async (pieceName) => {
        return pieceMetadataService(logger).getOrThrow({
            name: pieceName,
            version: undefined,
            projectId,
            platformId,
        })
    }))

    const transport = new SSEServerTransport('/api/v1/mcp/messages', reply.raw)
    const server = new McpServer({
        name: 'Activepieces',
        version: '1.0.0',
    })

    const uniqueActions = new Set()
    pieces.flatMap(piece =>
        Object.values(piece.actions).map(action => {
            if (uniqueActions.has(action.name)) {
                return
            }
            const pieceConnectionExternalId = connections.find(connection => connection.pieceName === piece.name)?.externalId
            const actionName = `${piece.name.split('piece-')[1]}-${action.name}`.slice(0, 47)
            uniqueActions.add(actionName)
            server.tool(
                actionName,
                action.description,
                Object.fromEntries(
                    Object.entries(action.props).filter(([_key, prop]) => prop.type !== PropertyType.MARKDOWN).map(([key, prop]) =>
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
                        'auth': `{{connections['${pieceConnectionExternalId}']}}`,
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
        }),
    )

    const flows = await flowService(logger).list({ 
        projectId,
        cursorRequest: null,
        limit: 100,
        folderId: undefined,
        status: [FlowStatus.ENABLED],
        name: undefined,
        versionState: FlowVersionState.LOCKED,
    })

    const publishedFlows = flows.data.filter((flow) => 
        flow.status === FlowStatus.ENABLED && 
        flow.publishedVersionId && 
        flow.version.trigger.type === TriggerType.PIECE &&
        flow.version.trigger.settings.pieceName === '@activepieces/piece-mcp',
    )

    for (const flow of publishedFlows) {
        const triggerSettings = flow.version.trigger.settings as {
            pieceName: string
            triggerName: string
            input: {
                toolName: string
                toolDescription: string
                inputSchema: MCPProperty[]
                returnsResponse: boolean
            }
        }
        const toolName = ('flow_' + triggerSettings.input?.toolName).slice(0, 47)
        const toolDescription = triggerSettings.input?.toolDescription
        const inputSchema = triggerSettings.input?.inputSchema
        const returnsResponse = triggerSettings.input?.returnsResponse

        const zodFromInputSchema = Object.fromEntries(
            inputSchema.map((prop) => [prop.name, mcpPropertyToZod(prop)]),
        )

        server.tool(
            toolName,
            toolDescription,
            zodFromInputSchema,
            async (params) => { 
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
                    payload: params,
                })
                if (response.status !== StatusCodes.OK) {
                    return {
                        content: [{
                            type: 'text',
                            text: `❌ Error executing flow ${flow.version.displayName}\n\n\`\`\`\n${response || 'Unknown error occurred'}\n\`\`\``,
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

    return { server, transport }
}


function mcpPropertyToZod(property: MCPProperty): z.ZodTypeAny {
    let schema: z.ZodTypeAny

    switch (property.type) {
        case MCPProperyType.TEXT:
        case MCPProperyType.DATE:
            schema = z.string()
            break
        case MCPProperyType.NUMBER:
            schema = z.number()
            break
        case MCPProperyType.BOOLEAN:
            schema = z.boolean()
            break
        case MCPProperyType.ARRAY:
            schema = z.array(z.unknown())
            break
        case MCPProperyType.OBJECT:
            schema = z.record(z.string(), z.unknown())
            break
        default:
            schema = z.unknown()
    }

    return property.required ? schema : schema.optional()
}

function piecePropertyToZod(property: PieceProperty): z.ZodTypeAny {
    let schema: z.ZodTypeAny

    switch (property.type) {
        case PropertyType.SHORT_TEXT:
        case PropertyType.LONG_TEXT:
        case PropertyType.DATE_TIME:
            schema = z.string()
            break
        case PropertyType.NUMBER:
            schema = z.number()
            break
        case PropertyType.CHECKBOX:
            schema = z.boolean()
            break
        case PropertyType.ARRAY:
            schema = z.array(z.unknown())
            break
        case PropertyType.OBJECT:
        case PropertyType.JSON:
            schema = z.record(z.string(), z.unknown())
            break
        case PropertyType.MULTI_SELECT_DROPDOWN:
            schema = z.array(z.string())
            break
        case PropertyType.DROPDOWN:
            schema = z.string()
            break
        default:
            schema = z.unknown()
    }

    if (property.defaultValue) {
        schema = schema.default(property.defaultValue)
    }

    if (property.description) {
        schema = schema.describe(property.description)
    }

    return property.required ? schema : schema.optional()
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

