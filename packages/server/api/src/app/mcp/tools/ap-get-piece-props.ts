import { isNil, isObject, spreadIfDefined, tryCatch } from '@activepieces/core-utils'
import { PiecePropertyMap } from '@activepieces/pieces-framework'
import { toolResultView } from '@activepieces/server-utils'
import { AppConnectionStatus, EngineResponse, EngineResponseStatus, FlowVersion, McpToolDefinition, ProjectScopedMcpServer, SampleDataFileType, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { ArrayContains, In } from 'typeorm'
import { z } from 'zod'
import { appConnectionService, appConnectionsRepo } from '../../app-connection/app-connection-service/app-connection-service'
import { flowService } from '../../flows/flow/flow.service'
import { sampleDataService } from '../../flows/step-run/sample-data.service'
import { getPiecePackageWithoutArchive } from '../../pieces/metadata/piece-metadata-service'
import { userInteractionWatcher } from '../../workers/user-interaction-watcher'
import { mcpUtils, PropertyResolutionResult, PropSummary } from './mcp-utils'
import { pieceExpertise } from './piece-expertise'

async function describeComponent({ mcp, request, platformId, log }: {
    mcp: ProjectScopedMcpServer
    request: ComponentRequest
    platformId: string
    log: FastifyBaseLogger
}): Promise<ComponentDescription> {
    const { pieceName, actionOrTriggerName, type, auth, flowId, input: providedInput } = request
    const projectId = mcpUtils.isProjectScoped(mcp) ? mcp.projectId : undefined
    const lookupByName = (componentName: string) => mcpUtils.lookupPieceComponent({ pieceName, componentName, componentType: type, projectId, platformId, log })
    const firstLookup = await lookupByName(actionOrTriggerName)
    const lookup = isNil(firstLookup.closestName) ? firstLookup : await lookupByName(firstLookup.closestName)
    if (lookup.error) {
        return lookup.error
    }

    const { piece, component, pieceName: normalized } = lookup
    const label = type === 'action' ? 'Action' : 'Trigger'
    const props = mcpUtils.buildPropSummaries(component.props)
    const requiresAuth = component.requireAuth && !isNil(piece.auth)

    const hasRealProject = mcpUtils.isProjectScoped(mcp)
    if (hasRealProject && requiresAuth && auth) {
        const authOwnership = await validateAuthOwnership({ auth, pieceName: normalized, projectId: mcp.projectId, platformId, log })
        if (authOwnership) {
            return authOwnership
        }
    }

    if (hasRealProject) {
        await resolvePropertyOptions({
            props,
            componentProps: component.props,
            pieceName: normalized,
            pieceVersion: piece.version,
            actionOrTriggerName: component.name,
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
    const declaredOutputFields = component.outputSchema?.fields
        ? mcpUtils.flattenOutputSchemaFields(component.outputSchema.fields)
        : []
    const sampleOutputFields = declaredOutputFields.length === 0 && type === 'trigger' && !isNil(component.sampleData)
        ? mcpUtils.deriveFieldPathsFromSample(component.sampleData)
        : []
    const outputFields = declaredOutputFields.length > 0 ? declaredOutputFields : sampleOutputFields
    const outputFieldsSource = declaredOutputFields.length > 0 ? 'declared' : 'sample'
    const wholeOutput = outputFields.length === 0 && component.outputSchema
        ? mcpUtils.describeWholeOutputSchema(component.outputSchema)
        : null
    const sampleOutput = type === 'trigger' ? compactSample(component.sampleData) : undefined

    const expertNotes = pieceExpertise.getNotes({ pieceName: normalized, actionName: component.name })
    const cardinality = mcpUtils.classifyActionCardinality(component.name)
    const textResult = {
        piece: normalized,
        name: component.name,
        displayName: component.displayName,
        description: component.description,
        requiresAuth,
        props: props.map(propForText),
    }
    const structured = {
        piece: normalized,
        name: component.name,
        displayName: component.displayName,
        description: component.description,
        requiresAuth,
        cardinality,
        ...spreadIfDefined('expertNotes', expertNotes),
        ...(aiMetadata && { aiMetadata }),
        ...(component.outputSchema && { outputSchema: component.outputSchema }),
        ...(outputFields.length > 0 && { outputFields, outputFieldsSource }),
        ...(wholeOutput && { wholeOutput }),
        ...spreadIfDefined('sampleOutput', sampleOutput),
        props,
        requiredInputs,
        exampleInput,
    }

    const descLine = component.description ? `\nDescription: ${component.description}\n` : ''
    const aiHintLine = aiMetadata?.description ? `AI hint: ${aiMetadata.description}\n` : ''
    const expertLine = isNil(expertNotes) ? '' : `Expert notes: ${expertNotes}\n`
    const cardinalityLine = cardinality === 'other' ? '' : `Returns: ${cardinality === 'enumerate' ? 'a list of items' : 'one item'}\n`
    const idempotentLine = typeof aiMetadata?.idempotent === 'boolean'
        ? `Idempotent: ${aiMetadata.idempotent}\n`
        : ''
    const outputHeader = outputFieldsSource === 'declared'
        ? '📤 Output fields this step produces'
        : '📤 Output fields (from this trigger\'s sample data)'
    const arrayPathHint = outputFields.some(path => path.includes('[]'))
        ? '\nNote: `[]` marks an array — replace it with an index. A path starting with `[]` means the output itself is the array, e.g. {{<stepName>[\'output\'][0].row}}.'
        : ''
    const outputSection = outputFields.length > 0
        ? `\n\n${outputHeader} — reference them directly as {{<stepName>['output'].<path>}}:\n${outputFields.map(p => `- ${p}`).join('\n')}${arrayPathHint}`
        : wholeOutput
            ? `\n\n📤 Output: the entire step output IS the value — ${wholeOutput}. Reference it as {{<stepName>['output']}} (no field path).`
            : ''
    const sampleSection = isNil(sampleOutput) ? '' : `\n\n🧾 Sample payload this trigger emits:\n${sampleOutput}`
    const requiredLine = requiredInputs.provideNow.length > 0 || requiredInputs.needsResolution.length > 0
        ? `\nRequired now: ${requiredInputs.provideNow.join(', ') || '(none)'}.${requiredInputs.needsResolution.length > 0 ? ` Resolve first (ap_resolve_property_chain): ${requiredInputs.needsResolution.join(', ')}.` : ''}`
        : '\nNo required inputs.'
    const exampleSection = `\n\n🧪 Example input (fill the placeholders, then pass to ap_execute_action):\n${JSON.stringify(exampleInput, null, 2)}`
    return {
        content: [{ type: 'text', text: `✅ ${label} schema for "${normalized}/${component.name}":${descLine}${aiHintLine}${expertLine}${cardinalityLine}${idempotentLine}${requiredLine}\n${JSON.stringify(textResult)}${outputSection}${sampleSection}${exampleSection}` }],
        structuredContent: structured,
        ...(requiresAuth && { authPiece: normalized }),
    }
}

async function describeConnections({ mcp, platformId, results, log }: {
    mcp: ProjectScopedMcpServer
    platformId: string
    results: ComponentDescription[]
    log: FastifyBaseLogger
}): Promise<{ text: string, byPiece?: Record<string, PieceConnection[]> }> {
    const pieceNames = [...new Set(results.flatMap((result) => isNil(result.authPiece) ? [] : [result.authPiece]))]
    if (pieceNames.length === 0) {
        return { text: '' }
    }
    if (!mcpUtils.isProjectScoped(mcp)) {
        return { text: '🔌 Select a project with ap_set_project_context to see available connections.' }
    }
    const { data: byPiece, error } = await tryCatch(() => pieceConnections.listForPieces({ projectId: mcp.projectId, platformId, pieceNames }))
    if (error) {
        log.debug({ error, piece: { name: pieceNames.join(',') } }, 'Failed to list connections for piece props')
        return { text: '🔌 Use ap_list_connections to find connections.' }
    }
    return { text: pieceConnections.formatSection({ connectionsByPiece: byPiece }), byPiece }
}

function compactSample(sampleData: unknown): string | undefined {
    if (isNil(sampleData)) {
        return undefined
    }
    const json = JSON.stringify(sampleData)
    return isNil(json) || json.length <= 2 ? undefined : mcpUtils.truncate(json, MAX_SAMPLE_CHARS)
}

function propForText(prop: PropSummary): PropSummary & { optionsTotal?: number } {
    const capped = !isNil(prop.options) && prop.options.length > MAX_TEXT_OPTIONS
    return {
        ...prop,
        ...spreadIfDefined('options', capped ? prop.options?.slice(0, MAX_TEXT_OPTIONS) : prop.options),
        ...(capped ? { optionsTotal: prop.options?.length, note: `First ${MAX_TEXT_OPTIONS} of ${prop.options?.length} options. Pass the label the user said to ap_build_flow, or find one with ap_resolve_property_chain and match.` } : {}),
        ...spreadIfDefined('dynamicFields', prop.dynamicFields?.map(propForText)),
        ...spreadIfDefined('items', prop.items?.map(propForText)),
    }
}

function resultText(result: ComponentDescription): string {
    return toolResultView.textOf(result) ?? ''
}

export const apGetPiecePropsTool = (mcp: ProjectScopedMcpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_get_piece_props',
        description: 'Get the input schema of one or several piece actions/triggers (pass several as items in ONE call), with AI guidance, output field paths (reference as {{step[\'output\'].path}}), a sample payload for triggers, and the project connections for each piece that needs auth. Pass auth to resolve dynamic dropdowns and dynamic sub-fields.',
        inputSchema: getPiecePropsInput.shape,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
        execute: async (args) => {
            try {
                const parsed = getPiecePropsInput.parse(args)
                const platformId = await mcpUtils.resolvePlatformId({ mcp, log })
                if (!isNil(parsed.items) && parsed.items.length > 0) {
                    const results = await Promise.all(parsed.items.map((item) => describeComponent({ mcp, request: item, platformId, log })))
                    const connections = await describeConnections({ mcp, platformId, results, log })
                    return {
                        content: [{ type: 'text', text: [...results.map(resultText), connections.text].filter((part) => part.length > 0).join('\n\n---\n\n') }],
                        structuredContent: {
                            results: results.map((result) => result.structuredContent ?? { error: resultText(result) }),
                            ...spreadIfDefined('connections', connections.byPiece),
                        },
                    }
                }
                const single = componentRequest.safeParse(parsed)
                if (!single.success) {
                    return { content: [{ type: 'text', text: '❌ Pass pieceName, actionOrTriggerName and type for one action, or a list of them as items.' }] }
                }
                const { authPiece, ...result } = await describeComponent({ mcp, request: single.data, platformId, log })
                if (isNil(authPiece)) {
                    return result
                }
                const connections = await describeConnections({ mcp, platformId, results: [{ ...result, authPiece }], log })
                return {
                    content: [{ type: 'text', text: [resultText(result), connections.text].filter((part) => part.length > 0).join('\n\n') }],
                    structuredContent: { ...result.structuredContent, ...spreadIfDefined('connections', connections.byPiece) },
                }
            }
            catch (err) {
                return mcpUtils.mcpToolError('Failed to get piece props', err)
            }
        },
    }
}

export const pieceConnections = {
    listForPieces,
    groupByPiece,
    formatSection,
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
            ? sampleDataService(log).getSampleDataForFlow({
                projectId,
                flowVersion: flow.version,
                type: SampleDataFileType.OUTPUT,
                referencedBy: providedInput,
            })
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

async function listForPieces({ projectId, platformId, pieceNames }: {
    projectId: string
    platformId: string
    pieceNames: string[]
}): Promise<ConnectionsByPiece> {
    if (pieceNames.length === 0) {
        return {}
    }
    const rows = await appConnectionsRepo().find({
        select: { externalId: true, displayName: true, status: true, pieceName: true },
        where: { platformId, projectIds: ArrayContains([projectId]), pieceName: In(pieceNames) },
        order: { pieceName: 'ASC', created: 'DESC' },
        take: MAX_ROWS,
    })
    return groupByPiece({ pieceNames, connections: rows })
}

function groupByPiece({ pieceNames, connections }: { pieceNames: string[], connections: ConnectionRow[] }): ConnectionsByPiece {
    return Object.fromEntries(pieceNames.map((pieceName) => [
        pieceName,
        connections
            .filter((connection) => connection.pieceName === pieceName)
            .slice(0, MAX_PER_PIECE)
            .map(({ externalId, displayName, status }) => ({ externalId, displayName, status })),
    ]))
}

function formatSection({ connectionsByPiece }: { connectionsByPiece: ConnectionsByPiece }): string {
    const lines = Object.entries(connectionsByPiece).map(([pieceName, connections]) => {
        if (connections.length === 0) {
            return `- ${pieceName}: none yet. The user must connect an account before this piece can run.`
        }
        const listed = connections.map((connection) => `"${connection.displayName}" = ${connection.externalId}${connection.status === AppConnectionStatus.ACTIVE ? '' : ` (${connection.status})`}`)
        return `- ${pieceName}: ${listed.join('; ')}`
    })
    return lines.length === 0 ? '' : `🔌 Project connections (externalId is the auth value; use the one the user picked):\n${lines.join('\n')}`
}

const { withTimeout } = mcpUtils

const MAX_BATCH_ITEMS = 10

const componentRequest = z.object({
    pieceName: z.string().describe('The piece name (e.g. "@activepieces/piece-slack"). Use ap_research_pieces to get valid values.'),
    actionOrTriggerName: z.string().describe('The action or trigger name (e.g. "send_channel_message"). Use ap_research_pieces with pieceNames to get valid values.'),
    type: z.enum(['action', 'trigger']).describe('Whether to look up an action or a trigger.'),
    auth: z.string().optional().describe('Connection externalId from ap_list_connections. When provided, dynamic dropdowns and dynamic property sub-fields are resolved via your account.'),
    flowId: z.string().optional().describe('Flow ID for resolving dependent dropdowns that need step context. Optional — most dropdowns work without it.'),
    input: z.record(z.string(), z.unknown()).optional().describe('Known input values to resolve dependent dynamic properties.'),
})

const getPiecePropsInput = componentRequest.partial().extend({
    items: z.array(componentRequest).min(1).max(MAX_BATCH_ITEMS).optional().describe(`Several actions/triggers to describe in one call (up to ${MAX_BATCH_ITEMS}), e.g. the trigger and every action of a flow you are about to build. Use this instead of one call per action; each item takes the same fields as a single lookup.`),
})

const PROPERTY_TIMEOUT_MS = 30_000

const MAX_SAMPLE_CHARS = 1500

const MAX_TEXT_OPTIONS = 25

const MAX_ROWS = 100

const MAX_PER_PIECE = 10

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

type ComponentRequest = z.infer<typeof componentRequest>

type ComponentDescription = {
    content: Array<{ type: 'text', text: string }>
    structuredContent?: Record<string, unknown>
    authPiece?: string
}

type ConnectionRow = {
    externalId: string
    displayName: string
    status: AppConnectionStatus
    pieceName: string
}

type PieceConnection = Omit<ConnectionRow, 'pieceName'>

type ConnectionsByPiece = Record<string, PieceConnection[]>
