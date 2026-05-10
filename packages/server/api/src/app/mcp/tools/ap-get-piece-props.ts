import { PiecePropertyMap, PropertyType } from '@activepieces/pieces-framework'
import {
    AppConnectionStatus,
    EngineResponse,
    EngineResponseStatus,
    FlowVersion,
    isNil,
    isObject,
    McpToolDefinition,
    ProjectScopedMcpServer,
    SampleDataFileType,
    WorkerJobType,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { appConnectionService } from '../../app-connection/app-connection-service/app-connection-service'
import { flowService } from '../../flows/flow/flow.service'
import { sampleDataService } from '../../flows/step-run/sample-data.service'
import { getPiecePackageWithoutArchive } from '../../pieces/metadata/piece-metadata-service'
import { projectService } from '../../project/project-service'
import { userInteractionWatcher } from '../../workers/user-interaction-watcher'
import { mcpUtils, PropSummary } from './mcp-utils'

export const apGetPiecePropsTool = (mcp: ProjectScopedMcpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_get_piece_props',
        description: 'Get the input property schema for a piece action or trigger. Returns field names, types, required/optional, defaults, and options. Pass auth to resolve dynamic dropdowns and dynamic property sub-fields (e.g. Custom API Call url/body fields).',
        inputSchema: getPiecePropsInput.shape,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        execute: async (args) => {
            try {
                const { pieceName, actionOrTriggerName, type, auth, flowId, input: providedInput } = getPiecePropsInput.parse(args)

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
                const label = type === 'action' ? 'Action' : 'Trigger'
                const props = mcpUtils.buildPropSummaries(component.props)
                const requiresAuth = component.requireAuth && !isNil(piece.auth)

                let authHint: AuthHint | undefined
                if (requiresAuth && auth) {
                    const authOwnership = await validateAuthOwnership({ auth, pieceName: normalized, projectId: mcp.projectId, log })
                    if (authOwnership) {
                        return authOwnership
                    }
                }
                if (requiresAuth && !auth) {
                    authHint = await discoverAvailableConnections({ pieceName: normalized, projectId: mcp.projectId, log })
                }

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
                    log,
                })

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
                    props,
                }

                const descLine = component.description ? `\nDescription: ${component.description}\n` : ''
                return {
                    content: [{ type: 'text', text: `✅ ${label} schema for "${normalized}/${actionOrTriggerName}":${descLine}\n${JSON.stringify(textResult, null, 2)}` }],
                    structuredContent: structured,
                }
            }
            catch (err) {
                return mcpUtils.mcpToolError('Failed to get piece props', err)
            }
        },
    }
}

async function resolvePropertyOptions({ props, componentProps, pieceName, pieceVersion, actionOrTriggerName, auth, flowId, providedInput, projectId, log }: ResolvePropertyOptionsParams): Promise<void> {
    const resolvableProps = mcpUtils.findResolvableProps({ props, componentProps, auth, providedInput })
    if (resolvableProps.length === 0) {
        return
    }

    const [project, flow] = await Promise.all([
        projectService(log).getOneOrThrow(projectId),
        flowId ? flowService(log).getOnePopulated({ id: flowId, projectId }) : Promise.resolve(null),
    ])

    const [piecePackage, sampleData] = await Promise.all([
        getPiecePackageWithoutArchive(log, project.platformId, { pieceName, pieceVersion }),
        flow
            ? sampleDataService(log).getSampleDataForFlow(projectId, flow.version, SampleDataFileType.OUTPUT)
            : Promise.resolve({} as Record<string, unknown>),
    ])
    const flowVersion: FlowVersion | undefined = flow?.version

    const input: Record<string, unknown> = {
        ...providedInput,
        ...(auth ? { auth: `{{connections['${auth}']}}` } : {}),
    }

    await Promise.all(resolvableProps.map(async (prop) => {
        try {
            const result = await withTimeout({
                promise: userInteractionWatcher.submitAndWaitForResponse<EngineResponse<{
                    options: Array<{ label: string, value: unknown }> | PiecePropertyMap
                    disabled?: boolean
                }>>({
                    jobType: WorkerJobType.EXECUTE_PROPERTY,
                    platformId: project.platformId,
                    projectId,
                    flowVersion,
                    propertyName: prop.name,
                    actionOrTriggerName,
                    input,
                    sampleData,
                    searchValue: undefined,
                    piece: piecePackage,
                }, log),
                ms: PROPERTY_TIMEOUT_MS,
            })

            if (result.status !== EngineResponseStatus.OK || isNil(result.response?.options)) {
                return
            }

            const { options } = result.response
            if (prop.type === PropertyType.DYNAMIC && isObject(options) && !Array.isArray(options)) {
                prop.dynamicFields = mcpUtils.buildPropSummaries(options)
                prop.note = undefined
            }
            else if (Array.isArray(options)) {
                prop.options = options.map((o: { label: string, value: unknown }) => ({ label: o.label, value: o.value }))
                prop.note = undefined
            }
        }
        catch (err) {
            log.warn({ err, propertyName: prop.name }, 'Failed to resolve property options — dropdown will be empty. Try calling ap_get_piece_props again with auth.')
        }
    }))
}

async function discoverAvailableConnections({ pieceName, projectId, log }: {
    pieceName: string
    projectId: string
    log: FastifyBaseLogger
}): Promise<AuthHint> {
    try {
        const project = await projectService(log).getOneOrThrow(projectId)
        const connections = await appConnectionService(log).list({
            projectId,
            platformId: project.platformId,
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
        log.debug({ err, pieceName }, 'Failed to discover connections')
        return { message: 'Use ap_list_connections to find connections.', connections: [] }
    }
}

async function validateAuthOwnership({ auth, pieceName, projectId, log }: {
    auth: string
    pieceName: string
    projectId: string
    log: FastifyBaseLogger
}): Promise<{ content: [{ type: 'text', text: string }] } | null> {
    try {
        const project = await projectService(log).getOneOrThrow(projectId)
        const connections = await appConnectionService(log).list({
            projectId,
            platformId: project.platformId,
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
    pieceName: z.string().describe('The piece name (e.g. "@activepieces/piece-slack"). Use ap_list_pieces to get valid values.'),
    actionOrTriggerName: z.string().describe('The action or trigger name (e.g. "send_channel_message"). Use ap_list_pieces with includeActions=true or includeTriggers=true to get valid values.'),
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
    log: FastifyBaseLogger
}

type AuthHint = {
    message: string
    connections: Array<{ externalId: string, displayName: string }>
}
