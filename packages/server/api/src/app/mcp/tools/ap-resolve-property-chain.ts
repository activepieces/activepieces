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
import { userInteractionWatcher } from '../../workers/user-interaction-watcher'
import { mcpUtils, PropSummary } from './mcp-utils'

const { withTimeout, RESOLVE_TIMEOUT_MS } = mcpUtils

export const apResolvePropertyChainTool = (mcp: ProjectScopedMcpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_resolve_property_chain',
        description: 'Resolve a chain of dependent dropdown properties in one call. For actions with cascading fields (e.g. Spreadsheet → Sheet → Columns), this resolves each property sequentially, feeding each selected value into the next resolution. Pass `selectedValue` for properties whose value you already know; the tool stops and returns options when it hits a property without a `selectedValue`. Always use `value` from returned options, not `label`.',
        inputSchema: resolvePropertyChainInput.shape,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        execute: async (args) => {
            try {
                const { pieceName, actionOrTriggerName, type, propertyChain, auth, currentInput: providedInput } = resolvePropertyChainInput.parse(args)

                const platformId = await mcpUtils.resolvePlatformId({ mcp, log })

                const lookup = await mcpUtils.lookupPieceComponent({
                    pieceName,
                    componentName: actionOrTriggerName,
                    componentType: type,
                    projectId: mcp.projectId,
                    platformId,
                    log,
                })
                if (lookup.error) {
                    return lookup.error
                }

                const { piece, component, pieceName: normalized } = lookup

                const firstPropDef = component.props[propertyChain[0].propertyName]
                if (isNil(firstPropDef)) {
                    return {
                        content: [{ type: 'text', text: `❌ Property "${propertyChain[0].propertyName}" not found on ${normalized}/${actionOrTriggerName}. Use ap_get_piece_props to see available properties.` }],
                    }
                }
                const piecePackage = await getPiecePackageWithoutArchive(log, platformId, { pieceName: normalized, pieceVersion: piece.version })

                const resolvedProperties: ResolvedProperty[] = []
                const accumulatedInput: Record<string, unknown> = {
                    ...(providedInput ?? {}),
                    ...(auth ? { auth: `{{connections['${auth}']}}` } : {}),
                }

                for (const chainItem of propertyChain) {
                    const propDef = component.props[chainItem.propertyName]
                    if (isNil(propDef)) {
                        return {
                            content: [{ type: 'text', text: `❌ Property "${chainItem.propertyName}" not found on ${normalized}/${actionOrTriggerName}. Use ap_get_piece_props to see available properties.` }],
                        }
                    }

                    let result: EngineResponse<{ options: Array<{ label: string, value: unknown }> | PiecePropertyMap, disabled?: boolean }>
                    try {
                        result = await withTimeout({
                            promise: userInteractionWatcher.submitAndWaitForResponse<EngineResponse<{
                                options: Array<{ label: string, value: unknown }> | PiecePropertyMap
                                disabled?: boolean
                            }>>({
                                jobType: WorkerJobType.EXECUTE_PROPERTY,
                                platformId,
                                projectId: mcp.projectId,
                                flowVersion: undefined,
                                propertyName: chainItem.propertyName,
                                actionOrTriggerName,
                                input: accumulatedInput,
                                sampleData: {},
                                searchValue: undefined,
                                piece: piecePackage,
                            }, log),
                            ms: RESOLVE_TIMEOUT_MS,
                        })
                    }
                    catch (err) {
                        const message = err instanceof Error ? err.message : String(err)
                        resolvedProperties.push({
                            propertyName: chainItem.propertyName,
                            options: [],
                            resolved: false,
                            error: `Timed out resolving "${chainItem.propertyName}": ${message}`,
                        })
                        break
                    }

                    if (result.status !== EngineResponseStatus.OK || isNil(result.response?.options)) {
                        resolvedProperties.push({
                            propertyName: chainItem.propertyName,
                            options: [],
                            resolved: false,
                            error: `Could not resolve options for "${chainItem.propertyName}".`,
                        })
                        break
                    }

                    const { options } = result.response

                    if (propDef.type === PropertyType.DYNAMIC && isObject(options) && !Array.isArray(options)) {
                        const dynamicFields = mcpUtils.buildPropSummaries(options as PiecePropertyMap)
                        resolvedProperties.push({
                            propertyName: chainItem.propertyName,
                            dynamicFields,
                            resolved: true,
                        })
                        break
                    }

                    const optionsArray = mcpUtils.extractOptionsArray(options)
                    if (optionsArray === null) {
                        resolvedProperties.push({
                            propertyName: chainItem.propertyName,
                            options: [],
                            resolved: false,
                            error: `Unrecognized options format for "${chainItem.propertyName}".`,
                        })
                        break
                    }

                    const mapped = optionsArray.map((o) => ({ label: String(o.label ?? ''), value: o.value }))

                    if (!isNil(chainItem.selectedValue)) {
                        accumulatedInput[chainItem.propertyName] = chainItem.selectedValue
                        resolvedProperties.push({
                            propertyName: chainItem.propertyName,
                            optionCount: mapped.length,
                            selectedValue: chainItem.selectedValue,
                            resolved: true,
                        })
                        continue
                    }

                    resolvedProperties.push({
                        propertyName: chainItem.propertyName,
                        options: mapped,
                        resolved: false,
                    })
                    break
                }

                const summary = resolvedProperties.map((rp) => {
                    if (rp.error) {
                        return `⚠️ ${rp.propertyName}: ${rp.error}`
                    }
                    if (rp.dynamicFields) {
                        return `✅ ${rp.propertyName}: ${rp.dynamicFields.length} dynamic fields resolved`
                    }
                    if (rp.resolved) {
                        return `✅ ${rp.propertyName}: selected "${String(rp.selectedValue)}" (${rp.optionCount ?? 0} options available)`
                    }
                    return `⏸ ${rp.propertyName}: ${rp.options?.length ?? 0} options available — select a value to continue. IMPORTANT: Use the "value" field (the ID), NOT the "label".`
                }).join('\n')

                return {
                    content: [{ type: 'text', text: summary }],
                    structuredContent: { resolvedProperties },
                }
            }
            catch (err) {
                const message = err instanceof Error ? err.message : String(err)
                return {
                    content: [{ type: 'text', text: `⚠️ Property chain resolution failed: ${message}` }],
                }
            }
        },
    }
}

const resolvePropertyChainInput = z.object({
    pieceName: z.string().describe('The piece name (e.g. "@activepieces/piece-google-sheets").'),
    actionOrTriggerName: z.string().describe('The action or trigger name (e.g. "insert_row").'),
    type: z.enum(['action', 'trigger']).describe('Whether this is an action or trigger.'),
    propertyChain: z.array(z.object({
        propertyName: z.string().describe('The property name to resolve (e.g. "spreadsheet_id", "sheet_id", "columns").'),
        selectedValue: z.unknown().optional().describe('Value to use for this property. If provided, the tool uses it and continues to the next property. If omitted, the tool returns available options and stops.'),
    })).min(1).max(10).describe('Ordered list of properties to resolve (max 10). Each property is resolved using the values of all prior properties as context.'),
    auth: z.string().describe('Connection externalId — required to resolve options from the user\'s account.'),
    currentInput: z.record(z.string(), z.unknown()).optional().describe('Additional input values already known (e.g. from prior configuration).'),
})

type ResolvedProperty = {
    propertyName: string
    options?: Array<{ label: string, value: unknown }>
    optionCount?: number
    dynamicFields?: PropSummary[]
    selectedValue?: unknown
    resolved: boolean
    error?: string
}
