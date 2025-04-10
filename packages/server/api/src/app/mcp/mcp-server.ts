import { PieceProperty, PropertyType } from '@activepieces/pieces-framework'
import { UserInteractionJobType } from '@activepieces/server-shared'
import { EngineResponseStatus, ExecuteActionResponse, ExecuteTriggerResponse, FlowStatus, isNil, TriggerHookType, TriggerType } from '@activepieces/shared'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import { FastifyBaseLogger, FastifyReply } from 'fastify'
import { EngineHelperResponse } from 'server-worker'
import { z } from 'zod'
import { flowService } from '../flows/flow/flow.service'
import { flowVersionService } from '../flows/flow-version/flow-version.service'
import { pieceMetadataService } from '../pieces/piece-metadata-service'
import { projectService } from '../project/project-service'
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
            uniqueActions.add(action.name)
            server.tool(
                action.name,
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
    })

    logger.error('flows')
    logger.error(flows)

    const publishedFlows = flows.data.filter((flow) => 
        flow.status === FlowStatus.ENABLED && 
        flow.publishedVersionId && 
        flow.version.trigger.type === TriggerType.PIECE &&
        flow.version.trigger.settings.pieceName === '@activepieces/piece-mcp',
    )

    logger.error('publishedFlows')
    logger.error(publishedFlows)

    for (const flow of publishedFlows) {
        const flowVersion = await flowVersionService(logger).getFlowVersionOrThrow({
            flowId: flow.id,
            versionId: flow.publishedVersionId as string,
        })

        const triggerSettings = flowVersion.trigger.settings as {
            pieceName: string
            triggerName: string
            input: {
                toolName?: string
                toolDescription?: string
                inputSchema?: Record<string, PieceProperty>
            }
        }
        const toolName = ('flow_' + triggerSettings.input?.toolName) || `flow_${flow.id}`
        const toolDescription = triggerSettings.input?.toolDescription || flow.version.displayName
        const inputSchema = triggerSettings.input?.inputSchema || {}

        server.tool(
            toolName,
            toolDescription,
            Object.fromEntries(
                Object.entries(inputSchema).map(([key, prop]) =>
                    [key, piecePropertyToZod(prop as PieceProperty)],
                ),
            ),
            async (params) => {
                // how to send params to the trigger?
                const result = await userInteractionWatcher(logger).submitAndWaitForResponse<EngineHelperResponse<ExecuteTriggerResponse<TriggerHookType.RUN>>>({
                    jobType: UserInteractionJobType.EXECUTE_TRIGGER_HOOK,
                    hookType: TriggerHookType.RUN,
                    flowVersion,
                    test: false,
                    projectId,
                })

                if (result.status === EngineResponseStatus.OK) {
                    return {
                        content: [{
                            type: 'text',
                            text: `✅ Successfully executed flow ${flow.version.displayName}\n\n\`\`\`json\n${JSON.stringify(result.result, null, 2)}\n\`\`\``,
                        }],
                    }
                }
                else {
                    return {
                        content: [{
                            type: 'text',
                            text: `❌ Error executing flow ${flow.version.displayName}\n\n\`\`\`\n${result.standardError || 'Unknown error occurred'}\n\`\`\``,
                        }],
                    }
                }
            },
        )
    }

    return { server, transport }
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

