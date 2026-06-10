import { PiecePropertyMap, PropertyType } from '@activepieces/pieces-framework'
import {
    EngineResponse,
    EngineResponseStatus,
    isNil,
    isObject,
    McpToolDefinition,
    ProjectScopedMcpServer,
    WorkerJobType,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { getPiecePackageWithoutArchive } from '../../pieces/metadata/piece-metadata-service'
import { projectService } from '../../project/project-service'
import { userInteractionWatcher } from '../../workers/user-interaction-watcher'
import { mcpUtils } from './mcp-utils'

const RESOLVE_TIMEOUT_MS = 30_000
const { withTimeout } = mcpUtils

export const apResolvePropertyOptionsTool = (mcp: ProjectScopedMcpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_resolve_property_options',
        description: 'Resolve dropdown options for a single piece property. Returns the available options with labels and values (IDs). Use this to discover valid values for DROPDOWN fields (e.g. Slack channels, Google Sheets, email labels). Always use the `value` from the returned options, not the `label`.',
        inputSchema: resolvePropertyOptionsInput.shape,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        execute: async (args) => {
            try {
                const { pieceName, actionOrTriggerName, type, propertyName, auth, input: providedInput, searchValue } = resolvePropertyOptionsInput.parse(args)

                const lookup = await mcpUtils.lookupPieceComponent({
                    pieceName,
                    componentName: actionOrTriggerName,
                    componentType: type,
                    projectId: mcp.projectId,
                    log,
                })
                if (lookup.error) {
                    return lookup.error
                }

                const { piece, component, pieceName: normalized } = lookup
                const propDef = component.props[propertyName]
                if (isNil(propDef)) {
                    return {
                        content: [{ type: 'text', text: `❌ Property "${propertyName}" not found on ${normalized}/${actionOrTriggerName}. Use ap_get_piece_props to see available properties.` }],
                    }
                }

                const project = await projectService(log).getOneOrThrow(mcp.projectId)

                const piecePackage = await getPiecePackageWithoutArchive(log, project.platformId, { pieceName: normalized, pieceVersion: piece.version })

                const input: Record<string, unknown> = {
                    ...(providedInput ?? {}),
                    ...(auth ? { auth: `{{connections['${auth}']}}` } : {}),
                }

                const result = await withTimeout({
                    promise: userInteractionWatcher.submitAndWaitForResponse<EngineResponse<{
                        options: Array<{ label: string, value: unknown }> | PiecePropertyMap
                        disabled?: boolean
                    }>>({
                        jobType: WorkerJobType.EXECUTE_PROPERTY,
                        platformId: project.platformId,
                        projectId: mcp.projectId,
                        flowVersion: undefined,
                        propertyName,
                        actionOrTriggerName,
                        input,
                        sampleData: {},
                        searchValue,
                        piece: piecePackage,
                    }, log),
                    ms: RESOLVE_TIMEOUT_MS,
                })

                if (result.status !== EngineResponseStatus.OK || isNil(result.response?.options)) {
                    return {
                        content: [{ type: 'text', text: `⚠️ Could not resolve options for "${propertyName}". You may use the value the user provided directly — it may work at runtime. However, the dropdown in the flow editor will appear unset. Mention this to the user.` }],
                    }
                }

                const { options } = result.response

                if (propDef.type === PropertyType.DYNAMIC && isObject(options) && !Array.isArray(options)) {
                    const dynamicFields = mcpUtils.buildPropSummaries(options as PiecePropertyMap)
                    return {
                        content: [{ type: 'text', text: `✅ Dynamic fields for "${propertyName}":\n${JSON.stringify(dynamicFields, null, 2)}` }],
                        structuredContent: { propertyName, options: dynamicFields, count: dynamicFields.length },
                    }
                }

                const optionsArray = extractOptionsArray(options)

                if (optionsArray !== null) {
                    const mapped = optionsArray.map((o: { label: string, value: unknown }) => ({ label: String(o.label ?? ''), value: o.value }))
                    if (mapped.length === 0) {
                        return {
                            content: [{ type: 'text', text: `⚠️ No options found for "${propertyName}". The account may have no items. You may use the value the user provided directly, but the dropdown in the flow editor will appear unset.` }],
                            structuredContent: { propertyName, options: [], count: 0 },
                        }
                    }
                    return {
                        content: [{ type: 'text', text: `✅ Options for "${propertyName}" (${mapped.length} found). IMPORTANT: Use the "value" field (the ID), NOT the "label", when setting this property.\n${JSON.stringify(mapped, null, 2)}` }],
                        structuredContent: { propertyName, options: mapped, count: mapped.length },
                    }
                }

                log.warn({ propertyName, optionsType: typeof options, options }, 'ap_resolve_property_options: unrecognized options format')
                return {
                    content: [{ type: 'text', text: `⚠️ Could not parse options for "${propertyName}". You may use the value the user provided directly — it may work at runtime.` }],
                }
            }
            catch (err) {
                const message = err instanceof Error ? err.message : String(err)
                return {
                    content: [{ type: 'text', text: `⚠️ Options resolution timed out for "${(args as Record<string, unknown>).propertyName ?? 'unknown'}": ${message}. You may use the user-provided value directly — it often works at runtime. The dropdown in the flow editor may appear unset; mention this to the user.` }],
                }
            }
        },
    }
}

function extractOptionsArray(options: unknown): Array<{ label: string, value: unknown }> | null {
    if (Array.isArray(options)) return options

    if (isObject(options) && !Array.isArray(options)) {
        const obj = options as Record<string, unknown>
        if (Array.isArray(obj.options)) {
            return obj.options as Array<{ label: string, value: unknown }>
        }
    }

    return null
}

const resolvePropertyOptionsInput = z.object({
    pieceName: z.string().describe('The piece name (e.g. "@activepieces/piece-slack").'),
    actionOrTriggerName: z.string().describe('The action or trigger name (e.g. "send_channel_message").'),
    type: z.enum(['action', 'trigger']).describe('Whether this is an action or trigger.'),
    propertyName: z.string().describe('The exact property name to resolve options for (e.g. "channel").'),
    auth: z.string().describe('Connection externalId — required to resolve options from the user\'s account.'),
    input: z.record(z.string(), z.unknown()).optional().describe('Values for parent properties that this field depends on (refreshers).'),
    searchValue: z.string().optional().describe('Search/filter term to narrow results for large dropdown lists (e.g., "sales" to find sales-related channels).'),
})
