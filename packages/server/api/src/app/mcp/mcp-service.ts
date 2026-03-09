import { apId, FlowStatus, FlowTriggerType, FlowVersionState, isNil, MCP_TRIGGER_PIECE_NAME, McpProperty, McpPropertyType, McpServer as McpServerSchema, McpServerStatus, mcpToolNameUtils, McpTrigger, PopulatedFlow, PopulatedMcpServer, TelemetryEventName } from '@activepieces/shared'
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { repoFactory } from '../core/db/repo-factory'
import { flowService } from '../flows/flow/flow.service'
import { rejectedPromiseHandler } from '../helper/promise-handler'
import { telemetry } from '../helper/telemetry.utils'
import { WebhookFlowVersionToRun, webhookService } from '../webhooks/webhook.service'
import { McpServerEntity } from './mcp-entity'

export const mcpServerRepository = repoFactory(McpServerEntity)

export const mcpServerService = (log: FastifyBaseLogger) => {
    return {
        getPopulatedByProjectId: async (projectId: string): Promise<PopulatedMcpServer> => {
            const mcp = await mcpServerService(log).getByProjectId(projectId)
            const flows = await listFlows(mcp, log)
            return {
                ...mcp,
                flows,
            }
        },
        getByProjectId: async (projectId: string): Promise<McpServerSchema> => {
            const mcpServer = await mcpServerRepository().findOneBy({ projectId })
            if (isNil(mcpServer)) {
                await mcpServerRepository().upsert({
                    id: apId(),
                    status: McpServerStatus.DISABLED,
                    projectId,
                    token: apId(72),
                }, ['projectId'])
                return mcpServerRepository().findOneByOrFail({ projectId })
            }
            return mcpServer
        },
        rotateToken: async ({ projectId }: RotateTokenRequest): Promise<PopulatedMcpServer> => {
            const mcp = await mcpServerService(log).getByProjectId(projectId)
            await mcpServerRepository().update(mcp.id, {
                token: apId(72),
            })
            return mcpServerService(log).getPopulatedByProjectId(projectId)
        },
        update: async ({ projectId, status }: UpdateParams) => {
            const mcp = await mcpServerService(log).getByProjectId(projectId)
            await mcpServerRepository().update(mcp.id, {
                status,
            })
            return mcpServerService(log).getPopulatedByProjectId(projectId)
        },
        buildServer: async ({ mcp }: BuildServerRequest): Promise<McpServer> => {
            const server = new McpServer({
                name: 'Activepieces',
                title: 'Activepieces',
                version: '1.0.0',
                websiteUrl: 'https://activepieces.com',
                description: 'Automation and workflow MCP server by Activepieces',
                icons: [
                    {
                        src: 'https://cdn.activepieces.com/pieces/activepieces.png',
                        mimeType: 'image/png',
                        sizes: ['48x48', '96x96'],
                    },
                ],
            })
            const enabledFlows = mcp.flows.filter((flow) => flow.status === FlowStatus.ENABLED)
            for (const flow of enabledFlows) {
                const mcpTrigger = flow.version.trigger.settings as McpTrigger
                const mcpInputs = mcpTrigger.input?.inputSchema ?? []
                const zodFromInputSchema = Object.fromEntries(mcpInputs.map((property) => [property.name, mcpPropertyToZod(property)]))
                
                const baseName = (mcpTrigger.input?.toolName ?? flow.version.displayName) + '_' + flow.id.substring(0, 4)
                const toolName = mcpToolNameUtils.createToolName(baseName)
                const toolDescription: string = mcpTrigger.input?.toolDescription ?? ''

                server.tool(toolName, toolDescription, zodFromInputSchema, { title: toolName }, async (args) => {

                    const returnsResponse = mcpTrigger.input?.returnsResponse
                    const response = await webhookService.handleWebhook({
                        data: () => {
                            return Promise.resolve({
                                body: {},
                                method: 'POST',
                                headers: {},
                                queryParams: {},
                            })
                        },
                        logger: log,
                        flowId: flow.id,
                        async: !returnsResponse,
                        flowVersionToRun: WebhookFlowVersionToRun.LOCKED_FALL_BACK_TO_LATEST,
                        saveSampleData: false,
                        payload: args,
                        execute: true,
                        failParentOnFailure: false,
                    })
                    const isOkay = Math.floor(response.status / 100) === 2

                    rejectedPromiseHandler(telemetry(log).trackProject(mcp.projectId, {
                        name: TelemetryEventName.MCP_TOOL_CALLED,
                        payload: {
                            mcpId: mcp.projectId,
                            toolName,
                        },
                    }), log)
                    
                    if (isOkay) {
                        return {
                            content: [{
                                type: 'text',
                                text: `✅ Successfully executed flow ${flow.version.displayName}\n\n` +
                                    `Output:\n\`\`\`json\n${JSON.stringify(response, null, 2)}\n\`\`\``,
                            }],
                        }
                    }
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `❌ Error executing flow ${flow.version.displayName}\n\n` +
                                    `Error details:\n\`\`\`json\n${JSON.stringify(response, null, 2) || 'Unknown error occurred'}\n\`\`\``,
                            },
                        ],
                    }
                })
            }

            registerEmptyResourcesAndPrompts(server)
            return server
        },
    }
}


async function listFlows(mcp: McpServerSchema, logger: FastifyBaseLogger): Promise<PopulatedFlow[]> {
    const flows = await flowService(logger).list({
        projectIds: [mcp.projectId],
        limit: 1000000,
        cursorRequest: null,
        versionState: FlowVersionState.DRAFT,
        includeTriggerSource: false,
    })
    return flows.data.filter((flow) => flow.version.trigger.type === FlowTriggerType.PIECE && flow.version.trigger.settings.pieceName === MCP_TRIGGER_PIECE_NAME)
}

function mcpPropertyToZod(property: McpProperty): z.ZodTypeAny {
    let schema: z.ZodTypeAny

    switch (property.type) {
        case McpPropertyType.TEXT:
        case McpPropertyType.DATE:
            schema = z.string()
            break
        case McpPropertyType.NUMBER:
            schema = z.number()
            break
        case McpPropertyType.BOOLEAN:
            schema = z.boolean()
            break
        case McpPropertyType.ARRAY:
            schema = z.array(z.string())
            break
        case McpPropertyType.OBJECT:
            schema = z.record(z.string(), z.string())
            break
        default:
            schema = z.unknown()
    }

    if (property.description) {
        schema = schema.describe(property.description)
    }

    return property.required ? schema : schema.nullish()
}

/**
 * Registers resources/list and prompts/list so they return empty lists.
 * 
 * - Resources: register a resource template with an empty list.
 * - Prompts: register an empty prompt so the handler is set and returns [].
 * 
 * Claude Desktop (mcp-remote) does not support prompts/list, so we register an empty prompt.
 */
function registerEmptyResourcesAndPrompts(server: McpServer): void {
    server.registerResource(
        '_',
        new ResourceTemplate('activepieces://empty', {
            list: async () => ({ resources: [] }),
        }),
        {},
        async () => ({ contents: [] }),
    )
    server.registerPrompt('_', {}, () => ({ messages: [] }))
}



type BuildServerRequest = {
    mcp: PopulatedMcpServer
}

type RotateTokenRequest = {
    projectId: string
}

type UpdateParams = {
    status: McpServerStatus
    projectId: string
}