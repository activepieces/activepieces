import {
    FlowOperationRequest,
    FlowOperationType,
    FlowTriggerType,
    isNil,
    McpServer,
    McpToolDefinition,
    PieceTrigger,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowService } from '../../flows/flow/flow.service'
import { projectService } from '../../project/project-service'
import { mcpToolError } from './mcp-utils'

const updateTriggerInput = z.object({
    flowId: z.string(),
    pieceName: z.string(),
    pieceVersion: z.string(),
    triggerName: z.string(),
    input: z.record(z.string(), z.unknown()).optional(),
    auth: z.string().optional(),
    displayName: z.string().optional(),
})

export const apUpdateTriggerTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_update_trigger',
        description: 'Set or update the trigger for a flow. Use ap_list_pieces to get valid pieceName, pieceVersion, and triggerName. Use ap_list_connections to get the connection externalId for auth.',
        inputSchema: {
            flowId: z.string().describe('The id of the flow'),
            pieceName: z.string().describe('The piece name for the trigger (e.g. "@activepieces/piece-gmail"). Use ap_list_pieces to get valid values.'),
            pieceVersion: z.string().describe('The piece version (e.g. "~0.1.0"). Use ap_list_pieces to get valid values.'),
            triggerName: z.string().describe('The trigger name within the piece (e.g. "new_email"). Use ap_list_pieces with includeTriggers=true to get valid values.'),
            input: z.record(z.string(), z.unknown()).optional().describe('Input settings for the trigger (key-value pairs). Use `{{stepName.output.field}}` to reference data from previous steps (e.g. `{{trigger.output.body.email}}`, `{{step_1.output.id}}`).'),
            auth: z.string().optional().describe('Connection `externalId` from `ap_list_connections`. The tool wraps it automatically as `{{connections[\'externalId\']}}`.'),
            displayName: z.string().optional().describe('Display name for the trigger step'),
        },
        annotations: { destructiveHint: false, idempotentHint: true, openWorldHint: false },
        execute: async (args) => {
            const { flowId, pieceName, pieceVersion, triggerName, input: rawInput, auth, displayName: rawDisplayName } = updateTriggerInput.parse(args)

            if (auth !== undefined && auth.includes('\'')) {
                return {
                    content: [{ type: 'text', text: '❌ auth value must not contain single quotes. Use the exact externalId from ap_list_connections.' }],
                }
            }

            const input = {
                ...(rawInput ?? {}),
                ...(auth !== undefined && { auth: `{{connections['${auth}']}}` }),
            }
            const displayName = rawDisplayName ?? triggerName

            const [flow, project] = await Promise.all([
                flowService(log).getOnePopulated({ id: flowId, projectId: mcp.projectId }),
                projectService(log).getOneOrThrow(mcp.projectId),
            ])
            if (isNil(flow)) {
                return { content: [{ type: 'text', text: '❌ Flow not found' }] }
            }

            const triggerPayload = {
                name: flow.version.trigger.name,
                displayName,
                valid: false,
                lastUpdatedDate: new Date().toISOString(),
                type: FlowTriggerType.PIECE,
                settings: {
                    pieceName,
                    pieceVersion,
                    triggerName,
                    input,
                    propertySettings: {},
                },
            }

            const parseResult = PieceTrigger.safeParse(triggerPayload)
            if (!parseResult.success) {
                const message = parseResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
                return {
                    content: [{ type: 'text', text: `❌ Invalid trigger: ${message}` }],
                }
            }

            const operation: FlowOperationRequest = {
                type: FlowOperationType.UPDATE_TRIGGER,
                request: parseResult.data,
            }

            try {
                const updatedFlow = await flowService(log).update({
                    id: flow.id,
                    projectId: mcp.projectId,
                    userId: null,
                    platformId: project.platformId,
                    operation,
                })
                const trigger = updatedFlow.version.trigger
                if (!trigger.valid) {
                    return {
                        content: [{
                            type: 'text',
                            text: '⚠️ Trigger updated but still invalid. Check that triggerName is correct and all required inputs are provided. Use ap_list_connections to get a valid connection externalId for auth.',
                        }],
                    }
                }
                return {
                    content: [{ type: 'text', text: `✅ Successfully updated trigger to "${pieceName}/${triggerName}".` }],
                }
            }
            catch (err) {
                return mcpToolError('Trigger update failed', err)
            }
        },
    }
}
