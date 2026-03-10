import { rejectedPromiseHandler } from '@activepieces/server-common'
import { FlowStatus, FlowTriggerType, FlowVersionState, MCP_TRIGGER_PIECE_NAME, McpProperty, McpPropertyType, mcpToolNameUtils, McpTrigger, PopulatedFlow, PopulatedMcpServer, TelemetryEventName } from '@activepieces/shared'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowService } from '../../flows/flow/flow.service'
import { telemetry } from '../../helper/telemetry.utils'
import { WebhookFlowVersionToRun } from '../../webhooks/webhook-handler'
import { webhookService } from '../../webhooks/webhook.service'

export async function registerFlowTools(
    server: McpServer,
    mcp: PopulatedMcpServer,
    log: FastifyBaseLogger,
): Promise<void> {
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

            rejectedPromiseHandler(telemetry(log).trackProject(flow.projectId, {
                name: TelemetryEventName.MCP_TOOL_CALLED,
                payload: {
                    mcpId: mcp.id,
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
}

export async function listFlows(projectIds: string[], logger: FastifyBaseLogger): Promise<PopulatedFlow[]> {
    if (projectIds.length === 0) {
        return []
    }
    const flows = await flowService(logger).list({
        projectIds,
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
