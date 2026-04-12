import { ActivepiecesError, ApEdition, apId, ErrorCode, FlowStatus, FlowTriggerType, FlowVersionState, isNil, MCP_TRIGGER_PIECE_NAME, McpProperty, McpPropertyType, McpServer as McpServerSchema, McpServerStatus, McpToolDefinition, mcpToolNameUtils, McpTrigger, Permission, PopulatedFlow, PopulatedMcpServer, spreadIfNotUndefined, TelemetryEventName } from '@activepieces/shared'
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { repoFactory } from '../core/db/repo-factory'
import { getPrincipalRoleOrThrow } from '../ee/authentication/project-role/rbac-middleware'
import { flowService } from '../flows/flow/flow.service'
import { rejectedPromiseHandler } from '../helper/promise-handler'
import { system } from '../helper/system/system'
import { telemetry } from '../helper/telemetry.utils'
import { WebhookFlowVersionToRun, webhookService } from '../webhooks/webhook.service'
import { McpServerEntity } from './mcp-entity'
import { activepiecesTools, ALL_CONTROLLABLE_TOOL_NAMES, LOCKED_TOOL_NAMES } from './tools'

const EDITION_REQUIRES_RBAC = [ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(system.getEdition())

const MCP_SERVER_INSTRUCTIONS = `## Activepieces MCP Server — Agent Workflow Guide

### Recommended workflow
1. **Discover**: ap_list_pieces (find pieces), ap_list_connections (find auth), ap_list_ai_models (find AI providers)
2. **Schema**: ap_get_piece_props (get exact field names/types before configuring)
3. **Build**: ap_create_flow → ap_update_trigger → ap_add_step → ap_update_step
4. **Validate**: ap_validate_step_config (check a step config) or ap_validate_flow (check the whole flow)
5. **Publish**: ap_lock_and_publish → ap_change_flow_status

### Key patterns
- **Auth**: Use ap_list_connections to get the \`externalId\`, then pass it as the \`auth\` parameter on ap_update_step or ap_update_trigger.
- **Step references**: Use \`{{stepName.output.field}}\` in input values to reference data from previous steps (e.g. \`{{trigger.output.body.email}}\`, \`{{step_1.output.id}}\`).
- **Step names**: Steps are named \`trigger\`, \`step_1\`, \`step_2\`, etc. Use ap_flow_structure to see all step names and valid insertion points.
- **Piece names**: Use the full format (e.g. "@activepieces/piece-slack") for ap_add_step and ap_update_trigger. Short names like "slack" are accepted by lookup tools (ap_list_connections, ap_get_piece_props, ap_validate_step_config).
- **CODE steps**: Set sourceCode (must export a \`run\` function) and input (key-value pairs accessible via \`inputs.key\`).
- **Tables**: Use field names (not IDs) when inserting or querying records.`

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
                    enabledTools: ALL_CONTROLLABLE_TOOL_NAMES,
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
        update: async ({ projectId, status, enabledTools }: UpdateParams) => {
            const mcp = await mcpServerService(log).getByProjectId(projectId)
            const patch = {
                ...spreadIfNotUndefined('status', status),
                ...spreadIfNotUndefined('enabledTools', enabledTools),
            }
            if (Object.keys(patch).length > 0) {
                await mcpServerRepository().update(mcp.id, patch)
            }
            return mcpServerService(log).getPopulatedByProjectId(projectId)
        },
        buildServer: async ({ mcp, userId }: BuildServerRequest): Promise<McpServer> => {
            const permissionChecker = await resolvePermissionChecker({ userId, projectId: mcp.projectId, log })

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
            const enabledFlows = mcp.flows.filter((flow) => flow.status === FlowStatus.ENABLED)
            for (const flow of enabledFlows) {
                const mcpTrigger = flow.version.trigger.settings as McpTrigger
                const mcpInputs = mcpTrigger.input?.inputSchema ?? []
                const zodFromInputSchema = Object.fromEntries(mcpInputs.map((property) => [property.name, mcpPropertyToZod(property)]))

                const baseName = (mcpTrigger.input?.toolName ?? flow.version.displayName) + '_' + flow.id.substring(0, 4)
                const toolName = mcpToolNameUtils.createToolName(baseName)
                const toolDescription: string = mcpTrigger.input?.toolDescription ?? ''

                const flowPermissionError = permissionChecker.check(Permission.WRITE_RUN, toolName)
                server.tool(toolName, toolDescription, zodFromInputSchema, { title: toolName }, async (args) => {
                    if (flowPermissionError) {
                        return flowPermissionError
                    }

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
            
            const allTools = activepiecesTools(mcp, log)
            const enabledControllable = new Set(mcp.enabledTools ?? ALL_CONTROLLABLE_TOOL_NAMES)
            const tools = allTools.filter(t => LOCKED_TOOL_NAMES.includes(t.title) || enabledControllable.has(t.title))
            tools.forEach((tool) => {
                const execute = permissionChecker.wrapExecute({ execute: tool.execute, permission: tool.permission, toolTitle: tool.title })
                server.registerTool(tool.title, { title: tool.title, description: tool.description, inputSchema: tool.inputSchema, annotations: tool.annotations }, (args: Record<string, unknown>) => execute(args))
            })

            registerEmptyResourcesAndPrompts(server)
            return server
        },
    }
}


export async function resolvePermissionChecker({ userId, projectId, log }: { userId: string, projectId: string, log: FastifyBaseLogger }): Promise<PermissionChecker> {
    const allowAll: PermissionChecker = {
        check: () => null,
        wrapExecute: ({ execute }) => execute,
    }
    if (!EDITION_REQUIRES_RBAC) {
        return allowAll
    }

    let userPermissions: string[]
    try {
        const role = await getPrincipalRoleOrThrow(userId, projectId, log)
        userPermissions = role.permissions ?? []
    }
    catch (err) {
        if (err instanceof ActivepiecesError && err.error.code === ErrorCode.AUTHORIZATION) {
            return buildChecker((permission, toolTitle) => {
                if (isNil(permission)) {
                    return null
                }
                return noRoleError(toolTitle)
            })
        }
        throw err
    }

    const permissionSet = new Set(userPermissions)
    return buildChecker((permission, toolTitle) => {
        if (isNil(permission) || permissionSet.has(permission)) {
            return null
        }
        return missingPermissionError(permission, toolTitle)
    })
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

function buildChecker(check: PermissionChecker['check']): PermissionChecker {
    return {
        check,
        wrapExecute: ({ execute, permission, toolTitle }) => {
            const error = check(permission, toolTitle)
            if (isNil(error)) {
                return execute
            }
            return async () => error
        },
    }
}

function noRoleError(toolTitle: string): McpToolErrorResult {
    return {
        content: [{ type: 'text' as const, text: `❌ Permission denied: no role found for this user in the project. Cannot execute "${toolTitle}".` }],
        isError: true,
    }
}

function missingPermissionError(permission: Permission, toolTitle: string): McpToolErrorResult {
    return {
        content: [{ type: 'text' as const, text: `❌ Permission denied: your role does not have the "${permission}" permission required to use "${toolTitle}".` }],
        isError: true,
    }
}

type PermissionChecker = {
    check: (permission: Permission | undefined, toolTitle: string) => McpToolErrorResult | null
    wrapExecute: (params: { execute: McpToolDefinition['execute'], permission: Permission | undefined, toolTitle: string }) => McpToolDefinition['execute']
}

type McpToolErrorResult = {
    content: Array<{ type: 'text', text: string }>
    isError: boolean
}

type BuildServerRequest = {
    mcp: PopulatedMcpServer
    userId: string
}

type RotateTokenRequest = {
    projectId: string
}

type UpdateParams = {
    status?: McpServerStatus
    projectId: string
    enabledTools?: string[]
}
