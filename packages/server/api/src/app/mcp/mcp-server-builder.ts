import { FlowStatus, isNil, McpProperty, McpPropertyType, McpToolDefinition, mcpToolNameUtils, McpTrigger, Permission, PopulatedMcpServer, ProjectScopedMcpServer, TelemetryEventName } from '@activepieces/shared'
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { rejectedPromiseHandler } from '../helper/promise-handler'
import { telemetry } from '../helper/telemetry.utils'
import { WebhookFlowVersionToRun, webhookService } from '../webhooks/webhook.service'
import { ALLOW_ALL, PermissionChecker, resolvePermissionChecker } from './mcp-permissions'
import { mcpProjectSelection } from './mcp-project-selection'
import { activepiecesTools, ALL_CONTROLLABLE_TOOL_NAMES, LOCKED_TOOL_NAMES } from './tools'
import { apSetProjectContextTool } from './tools/ap-set-project-context'

const MCP_SERVER_INSTRUCTIONS = `## Activepieces MCP Server

### Workflow
1. Discover: ap_list_pieces, ap_list_connections, ap_list_ai_models
2. Schema: ap_get_piece_props (get field names/types before configuring)
3. Build: ap_build_flow (one call for new flows) OR ap_create_flow → ap_update_trigger → ap_add_step (granular)
4. Validate: ap_validate_flow
5. Publish: ap_lock_and_publish → ap_change_flow_status

### Key patterns
- **Auth**: ap_list_connections → get \`externalId\` → pass as \`auth\` param on ap_update_step/ap_update_trigger.
- **Step refs**: \`{{stepName.field}}\` — no \`.output.\` in the path (e.g. \`{{trigger.body.email}}\`, \`{{step_1.id}}\`).
- **Step names**: \`trigger\`, \`step_1\`, \`step_2\`, etc. Use ap_flow_structure to see all names.
- **Piece names**: full format (e.g. "@activepieces/piece-slack") for ap_add_step/ap_update_trigger. Short names work for lookup tools.
- **Modifying steps**: use ap_update_step/ap_update_trigger. Never delete+recreate — loses sample data.
- **CODE steps**: export a \`code\` fn; access inputs via \`inputs.key\`.
- **Tables**: use field names, not IDs.`

export async function buildMcpServer({ mcp, userId, log, resolveProjectMcp }: {
    mcp: PopulatedMcpServer
    userId: string | null
    log: FastifyBaseLogger
    resolveProjectMcp?: (projectId: string) => Promise<PopulatedMcpServer>
}): Promise<McpServer> {
    const projectId = mcp.projectId

    const server = new McpServer({
        name: 'Activepieces',
        title: 'Activepieces',
        version: '1.0.0',
        websiteUrl: 'https://activepieces.com',
        description: 'Automation and workflow MCP server by Activepieces',
        icons: [
            {
                src: 'https://cdn.activepieces.com/brand/logo.svg',
                mimeType: 'image/svg+xml',
            },
            {
                src: 'https://cdn.activepieces.com/brand/logo-192.png',
                mimeType: 'image/png',
                sizes: ['192x192'],
            },
        ],
    }, {
        instructions: MCP_SERVER_INSTRUCTIONS,
    })

    if (projectId) {
        const permissionChecker = userId
            ? await resolvePermissionChecker({ userId, projectId, log })
            : ALLOW_ALL
        registerFlowTools({ server, mcp, projectId, permissionChecker, log })
        registerStaticTools({ server, mcp, projectId, permissionChecker, log })
    }
    else if (!isNil(mcp.platformId) && !isNil(userId) && !isNil(resolveProjectMcp)) {
        registerPlatformTools({ server, mcp, platformId: mcp.platformId, userId, resolveProjectMcp, log })
    }
    else {
        registerPlaceholderTools(server)
    }

    registerEmptyResourcesAndPrompts(server)
    return server
}

function registerPlatformTools({ server, mcp, platformId, userId, resolveProjectMcp, log }: {
    server: McpServer
    mcp: PopulatedMcpServer
    platformId: string
    userId: string
    resolveProjectMcp: (projectId: string) => Promise<PopulatedMcpServer>
    log: FastifyBaseLogger
}): void {
    const contextTool = apSetProjectContextTool({ platformId, userId, log })
    server.registerTool(contextTool.title, buildToolConfig(contextTool), (args: Record<string, unknown>) => contextTool.execute(args))

    const templateMcp: ProjectScopedMcpServer = { ...mcp, projectId: platformId }
    const allTools = activepiecesTools(templateMcp, log)
    const disabledToolSet = new Set(mcp.disabledTools ?? [])
    const tools = allTools.filter(t => LOCKED_TOOL_NAMES.includes(t.title) || !disabledToolSet.has(t.title))

    tools.forEach((tool) => {
        server.registerTool(tool.title, buildToolConfig(tool), async (args: Record<string, unknown>) => {
            const selectedProjectId = mcpProjectSelection.get({ platformId, userId })
            if (isNil(selectedProjectId)) {
                return {
                    content: [{
                        type: 'text' as const,
                        text: 'No project selected. Use ap_set_project_context to select a project first.',
                    }],
                }
            }
            const projectMcp = await resolveProjectMcp(selectedProjectId)
            const projectScopedMcp: ProjectScopedMcpServer = { ...projectMcp, projectId: selectedProjectId }
            const permissionChecker = await resolvePermissionChecker({ userId, projectId: selectedProjectId, log })
            const realTools = activepiecesTools(projectScopedMcp, log)
            const realTool = realTools.find(t => t.title === tool.title)
            if (isNil(realTool)) {
                return {
                    content: [{ type: 'text' as const, text: `Tool "${tool.title}" is not available for this project.` }],
                }
            }
            const execute = permissionChecker.wrapExecute({ execute: realTool.execute, permission: realTool.permission, toolTitle: realTool.title })
            return execute(args)
        })
    })
}

function registerFlowTools({ server, mcp, projectId, permissionChecker, log }: RegisterToolsParams): void {
    const enabledFlows = mcp.flows.filter((flow) => flow.status === FlowStatus.ENABLED)
    for (const flow of enabledFlows) {
        const mcpTrigger = flow.version.trigger.settings as McpTrigger
        const mcpInputs = mcpTrigger.input?.inputSchema ?? []
        const zodFromInputSchema = Object.fromEntries(mcpInputs.map((property) => [property.name, mcpPropertyToZod(property)]))

        const baseName = (mcpTrigger.input?.toolName ?? flow.version.displayName) + '_' + flow.id.substring(0, 4)
        const toolName = mcpToolNameUtils.createToolName(baseName)
        const toolDescription: string = mcpTrigger.input?.toolDescription ?? ''

        const flowPermissionError = permissionChecker.check(Permission.WRITE_RUN, toolName)
        server.registerTool(toolName, { title: toolName, description: toolDescription, inputSchema: zodFromInputSchema }, async (args: Record<string, unknown>) => {
            if (flowPermissionError) {
                return flowPermissionError
            }

            const returnsResponse = mcpTrigger.input?.returnsResponse
            const response = await webhookService.handleWebhook({
                data: () => Promise.resolve({
                    body: {},
                    method: 'POST',
                    headers: {},
                    queryParams: {},
                }),
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

            rejectedPromiseHandler(telemetry(log).trackProject(projectId, {
                name: TelemetryEventName.MCP_TOOL_CALLED,
                payload: { mcpId: projectId, toolName },
            }), log)

            const text = isOkay
                ? `✅ Successfully executed flow ${flow.version.displayName}\n\nOutput:\n\`\`\`json\n${JSON.stringify(response, null, 2)}\n\`\`\``
                : `❌ Error executing flow ${flow.version.displayName}\n\nError details:\n\`\`\`json\n${JSON.stringify(response, null, 2) || 'Unknown error occurred'}\n\`\`\``

            return { content: [{ type: 'text' as const, text }] }
        })
    }
}

function registerStaticTools({ server, mcp, projectId, permissionChecker, log }: RegisterToolsParams): void {
    const allTools = activepiecesTools({ ...mcp, projectId }, log)
    const disabledToolSet = new Set(mcp.disabledTools ?? [])
    const tools = allTools.filter(t => LOCKED_TOOL_NAMES.includes(t.title) || !disabledToolSet.has(t.title))

    tools.forEach((tool) => {
        const execute = permissionChecker.wrapExecute({ execute: tool.execute, permission: tool.permission, toolTitle: tool.title })
        server.registerTool(tool.title, buildToolConfig(tool), (args: Record<string, unknown>) => execute(args))
    })
}

function registerPlaceholderTools(server: McpServer): void {
    const allToolNames = [...LOCKED_TOOL_NAMES, ...ALL_CONTROLLABLE_TOOL_NAMES]
    allToolNames.forEach((toolName) => {
        server.registerTool(toolName, {
            title: toolName,
            description: `${toolName} — requires a project to be selected first.`,
        }, async () => ({
            content: [{ type: 'text' as const, text: `No project selected. Please select a project from the dropdown in the chat input area before using ${toolName}.` }],
        }))
    })
}

function mcpPropertyToZod(property: McpProperty): z.ZodTypeAny {
    const base = (() => {
        switch (property.type) {
            case McpPropertyType.TEXT:
            case McpPropertyType.DATE:
                return z.string()
            case McpPropertyType.NUMBER:
                return z.number()
            case McpPropertyType.BOOLEAN:
                return z.boolean()
            case McpPropertyType.ARRAY:
                return z.array(z.string())
            case McpPropertyType.OBJECT:
                return z.record(z.string(), z.string())
            default:
                return z.unknown()
        }
    })()
    const described = property.description ? base.describe(property.description) : base
    return property.required ? described : described.nullish()
}

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

function buildToolConfig(tool: McpToolDefinition): Record<string, unknown> {
    return {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema,
        annotations: tool.annotations,
    }
}

type RegisterToolsParams = {
    server: McpServer
    mcp: PopulatedMcpServer
    projectId: string
    permissionChecker: PermissionChecker
    log: FastifyBaseLogger
}
