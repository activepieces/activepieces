import { isNil, isObject, spreadIfDefined, tryCatch } from '@activepieces/core-utils'
import { PiecePropertyMap } from '@activepieces/pieces-framework'
import { AppConnectionStatus, EngineResponse, EngineResponseStatus, FlowVersion, McpToolDefinition, ProjectScopedMcpServer, SampleDataFileType, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { appConnectionService } from '../../app-connection/app-connection-service/app-connection-service'
import { flowService } from '../../flows/flow/flow.service'
import { sampleDataService } from '../../flows/step-run/sample-data.service'
import { getPiecePackageWithoutArchive } from '../../pieces/metadata/piece-metadata-service'
import { userInteractionWatcher } from '../../workers/user-interaction-watcher'
import { mcpUtils, PropertyResolutionResult, PropSummary } from './mcp-utils'
import { pieceExpertise } from './piece-expertise'

export const apGetPiecePropsTool = (mcp: ProjectScopedMcpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_get_piece_props',
        description: 'Get the input schema for a piece action or trigger, plus AI guidance for using it: an AI-written description of what it does, an idempotency hint, and — when available — the output field paths it produces (for triggers, also derived from sample data). Use the AI description to pick the right action; when output fields are listed, reference them directly downstream as {{step[\'output\'].path}}. Pass auth to resolve dynamic dropdowns and dynamic property sub-fields (e.g. Custom API Call url/body fields).',
        inputSchema: getPiecePropsInput.shape,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        execute: async (args) => {
            try {
                const { pieceName, actionOrTriggerName, type, auth, flowId, input: providedInput } = getPiecePropsInput.parse(args)

                const platformId = await mcpUtils.resolvePlatformId({ mcp, log })
                const projectId = mcpUtils.isProjectScoped(mcp) ? mcp.projectId : undefined
                const lookup = await mcpUtils.lookupPieceComponent({
                    pieceName,
                    componentName: actionOrTriggerName,
                    componentType: type,
                    projectId,
                    platformId,
                    log,
                })
                if (lookup.error) {
                    return lookup.error
                }

                const { piece, component, pieceName: normalized } = lookup
                const label = type === 'action' ? 'Action' : 'Trigger'
                const props = mcpUtils.buildPropSummaries(component.props)
                const requiresAuth = component.requireAuth && !isNil(piece.auth)

                const hasRealProject = mcpUtils.isProjectScoped(mcp)
                let authHint: AuthHint | undefined
                if (hasRealProject && requiresAuth && auth) {
                    const authOwnership = await validateAuthOwnership({ auth, pieceName: normalized, projectId: mcp.projectId, platformId, log })
                    if (authOwnership) {
                        return authOwnership
                    }
                }
                if (requiresAuth && !auth) {
                    if (hasRealProject) {
                        authHint = await discoverAvailableConnections({ pieceName: normalized, projectId: mcp.projectId, platformId, log })
                    }
                    else {
                        authHint = { message: 'Select a project with ap_set_project_context to see available connections.', connections: [] }
                    }
                }

                if (hasRealProject) {
                    await resolvePropertyOptions({
                        props,
                        componentProps: component.props,
                        pieceName: normalized,
                        pieceVersion: piece.version,
                        actionOrTriggerName,
                        auth,
                        flowId,
                        providedInput: providedInput ?? {},
                        projectId: mcp.projectId,
                        platformId,
                        log,
                    })
                }

                const requiredInputs = mcpUtils.buildRequiredInputs(props)
                const exampleInput = mcpUtils.buildExampleInput(props)

                const aiMetadata = component.aiMetadata
                const cardinality = type === 'action'
                    ? mcpUtils.classifyActionCardinality({ actionName: component.name, description: component.description, aiDescription: aiMetadata?.description })
                    : 'other'
                const declaredOutputFields = component.outputSchema?.fields
                    ? mcpUtils.flattenOutputSchemaFields(component.outputSchema.fields)
                    : []
                const sampleOutputFields = declaredOutputFields.length === 0 && type === 'trigger' && !isNil(component.sampleData)
                    ? mcpUtils.deriveFieldPathsFromSample(component.sampleData)
                    : []
                const outputFields = declaredOutputFields.length > 0 ? declaredOutputFields : sampleOutputFields
                const outputFieldsSource = declaredOutputFields.length > 0 ? 'declared' : 'sample'

                const textResult = {
                    piece: normalized,
                    name: component.name,
                    displayName: component.displayName,
                    description: component.description,
                    requiresAuth,
                    ...(authHint && { authHint }),
                    props,
                }
                const structured = {
                    piece: normalized,
                    name: component.name,
                    displayName: component.displayName,
                    description: component.description,
                    requiresAuth,
                    cardinality,
                    ...spreadIfDefined('expertNotes', pieceExpertise.getNotes({ pieceName: normalized, actionName: component.name })),
                    ...(aiMetadata && { aiMetadata }),
                    ...(component.outputSchema && { outputSchema: component.outputSchema }),
                    ...(outputFields.length > 0 && { outputFields, outputFieldsSource }),
                    props,
                    requiredInputs,
                    exampleInput,
                }

                const descLine = component.description ? `\nDescription: ${component.description}\n` : ''
                const aiHintLine = aiMetadata?.description ? `AI hint: ${aiMetadata.description}\n` : ''
                const idempotentLine = typeof aiMetadata?.idempotent === 'boolean'
                    ? `Idempotent: ${aiMetadata.idempotent}\n`
                    : ''
                const returnsLine = cardinality === 'enumerate'
                    ? 'Returns: a LIST of records — use this for "list / all / every / how many" requests. Leave optional filters empty to get everything, or pass a filter to narrow.\n'
                    : cardinality === 'single'
                        ? 'Returns: a SINGLE record — use this when you have an id or a uniquely-identifying value, NOT to enumerate many.\n'
                        : ''
                const outputHeader = outputFieldsSource === 'declared'
                    ? '📤 Output fields this step produces'
                    : '📤 Output fields (from this trigger\'s sample data)'
                const outputSection = outputFields.length > 0
                    ? `\n\n${outputHeader} — reference them directly as {{<stepName>['output'].<path>}}:\n${outputFields.map(p => `- ${p}`).join('\n')}`
                    : ''
                const requiredLine = requiredInputs.provideNow.length > 0 || requiredInputs.needsResolution.length > 0
                    ? `\nRequired now: ${requiredInputs.provideNow.join(', ') || '(none)'}.${requiredInputs.needsResolution.length > 0 ? ` Resolve first (ap_resolve_property_options): ${requiredInputs.needsResolution.join(', ')}.` : ''}`
                    : '\nNo required inputs.'
                const exampleSection = `\n\n🧪 Example input (fill the placeholders, then pass to ap_execute_action):\n${JSON.stringify(exampleInput, null, 2)}`
                return {
                    content: [{ type: 'text', text: `✅ ${label} schema for "${normalized}/${actionOrTriggerName}":${descLine}${aiHintLine}${idempotentLine}${returnsLine}${requiredLine}\n${JSON.stringify(textResult, null, 2)}${outputSection}${exampleSection}` }],
                    structuredContent: structured,
                }
            }
            catch (err) {
                return mcpUtils.mcpToolError('Failed to get piece props', err)
            }
        },
    }
}

async function resolvePropertyOptions({ props, componentProps, pieceName, pieceVersion, actionOrTriggerName, auth, flowId, providedInput, projectId, platformId, log }: ResolvePropertyOptionsParams): Promise<void> {
    const resolvableProps = mcpUtils.findResolvableProps({ props, componentProps, auth, providedInput })
    if (resolvableProps.length === 0) {
        return
    }

    const flow = flowId ? await flowService(log).getOnePopulated({ id: flowId, projectId }) : null

    const [piecePackage, sampleData] = await Promise.all([
        getPiecePackageWithoutArchive(log, platformId, { pieceName, pieceVersion }),
        flow
            ? sampleDataService(log).getSampleDataForFlow(projectId, flow.version, SampleDataFileType.OUTPUT)
            : Promise.resolve({} as Record<string, unknown>),
    ])
    const flowVersion: FlowVersion | undefined = flow?.version

    // Resolve the full dependent chain in one pass (base → table → fields), seeding each result so
    // dependent dropdowns unlock — instead of one round-trip per field. The engine call is the
    // injected resolveOne; the loop itself lives in mcpUtils (unit-tested without the engine).
    const resolveOne = async ({ prop, input }: { prop: { name: string }, input: Record<string, unknown> }): Promise<PropertyResolutionResult> => {
        const engineInput: Record<string, unknown> = { ...input, ...(auth ? { auth: `{{connections['${auth}']}}` } : {}) }
        const { data: result, error } = await tryCatch(() => withTimeout({
            promise: userInteractionWatcher.submitAndWaitForResponse<EngineResponse<{
                options: Array<{ label: string, value: unknown }> | PiecePropertyMap
                disabled?: boolean
            }>>({
                jobType: WorkerJobType.EXECUTE_PROPERTY,
                platformId,
                projectId,
                flowVersion,
                propertyName: prop.name,
                actionOrTriggerName,
                input: engineInput,
                sampleData,
                searchValue: undefined,
                piece: piecePackage,
            }, log),
            ms: PROPERTY_TIMEOUT_MS,
        }))
        if (error || result.status !== EngineResponseStatus.OK || isNil(result.response?.options)) {
            return { status: 'failed', message: error instanceof Error ? error.message : 'Could not resolve options' }
        }
        const { options } = result.response
        if (isObject(options) && !Array.isArray(options)) {
            return { status: 'dynamic', props: options }
        }
        return { status: 'options', options: options.map((o) => ({ label: o.label, value: o.value })) }
    }

    await mcpUtils.resolveTransitively({ props, componentProps, auth, providedInput, resolveOne })
}

async function discoverAvailableConnections({ pieceName, projectId, platformId, log }: {
    pieceName: string
    projectId: string
    platformId: string
    log: FastifyBaseLogger
}): Promise<AuthHint> {
    try {
        const connections = await appConnectionService(log).list({
            projectId,
            platformId,
            pieceName,
            cursorRequest: null,
            scope: undefined,
            displayName: undefined,
            status: [AppConnectionStatus.ACTIVE],
            limit: 10,
            externalIds: undefined,
        })
        const active = connections.data
            .map(c => ({ externalId: c.externalId, displayName: c.displayName }))
        if (active.length > 0) {
            return { message: 'Pass one as the auth param.', connections: active }
        }
        return { message: 'No connections found. Set up in UI or use ap_setup_guide.', connections: [] }
    }
    catch (err) {
        log.debug({ error: err, piece: { name: pieceName } }, 'Failed to discover connections')
        return { message: 'Use ap_list_connections to find connections.', connections: [] }
    }
}

async function validateAuthOwnership({ auth, pieceName, projectId, platformId, log }: {
    auth: string
    pieceName: string
    projectId: string
    platformId: string
    log: FastifyBaseLogger
}): Promise<{ content: [{ type: 'text', text: string }] } | null> {
    try {
        const connections = await appConnectionService(log).list({
            projectId,
            platformId,
            pieceName,
            cursorRequest: null,
            scope: undefined,
            displayName: undefined,
            status: undefined,
            limit: 1,
            externalIds: [auth],
        })
        const match = connections.data[0]
        if (!match) {
            return {
                content: [{
                    type: 'text',
                    text: `⚠️ Connection "${auth}" does not belong to piece "${pieceName}". Use ap_list_connections to find the correct connection for this piece.`,
                }],
            }
        }
    }
    catch {
        // If lookup fails, proceed anyway — don't block the user
    }
    return null
}

const { withTimeout } = mcpUtils

const getPiecePropsInput = z.object({
    pieceName: z.string().describe('The piece name (e.g. "@activepieces/piece-slack"). Use ap_research_pieces to get valid values.'),
    actionOrTriggerName: z.string().describe('The action or trigger name (e.g. "send_channel_message"). Use ap_research_pieces with pieceNames to get valid values.'),
    type: z.enum(['action', 'trigger']).describe('Whether to look up an action or a trigger.'),
    auth: z.string().optional().describe('Connection externalId from ap_list_connections. When provided, dynamic dropdowns and dynamic property sub-fields are resolved via your account.'),
    flowId: z.string().optional().describe('Flow ID for resolving dependent dropdowns that need step context. Optional — most dropdowns work without it.'),
    input: z.record(z.string(), z.unknown()).optional().describe('Known input values to resolve dependent dynamic properties.'),
})

const PROPERTY_TIMEOUT_MS = 30_000

type ResolvePropertyOptionsParams = {
    props: PropSummary[]
    componentProps: PiecePropertyMap
    pieceName: string
    pieceVersion: string
    actionOrTriggerName: string
    auth: string | undefined
    flowId: string | undefined
    providedInput: Record<string, unknown>
    projectId: string
    platformId: string
    log: FastifyBaseLogger
}

type AuthHint = {
    message: string
    connections: Array<{ externalId: string, displayName: string }>
}
