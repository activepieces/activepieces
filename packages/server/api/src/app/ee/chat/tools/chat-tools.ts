import { AppConnectionStatus, AppConnectionType, chatToolClassification, DiscoveryBrief, FlowRunStatus, FlowStatus, isNil, isObject, parseToJsonIfPossible, Project, RunEnvironment } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { appConnectionService } from '../../../app-connection/app-connection-service/app-connection-service'
import { flowService } from '../../../flows/flow/flow.service'
import { flowRunService } from '../../../flows/flow-run/flow-run-service'
import { formatFlowLine } from '../../../mcp/tools/ap-list-flows'
import { executeAdhocAction, formatRunSummary } from '../../../mcp/tools/flow-run-utils'
import { mcpUtils } from '../../../mcp/tools/mcp-utils'
import { pieceMetadataService } from '../../../pieces/metadata/piece-metadata-service'
import { tableService } from '../../../tables/table/table.service'
import { chatApprovalGate } from '../chat-approval-gate'
import { chatHelpers } from '../chat-helpers'
import { chatPrompt } from '../prompt/chat-prompt'

const CROSS_PROJECT_CONNECTION_LIMIT = 100
const OAUTH_TYPES: ReadonlySet<AppConnectionType> = new Set([
    AppConnectionType.OAUTH2,
    AppConnectionType.CLOUD_OAUTH2,
    AppConnectionType.PLATFORM_OAUTH2,
])
const CLOCK_SKEW_BUFFER_S = 5 * 60
const CROSS_PROJECT_FLOW_LIMIT = 200
const FLOW_STATUS_VALUES: ReadonlySet<string> = new Set(Object.values(FlowStatus))
const FLOW_RUN_STATUS_VALUES: ReadonlySet<string> = new Set(Object.values(FlowRunStatus))

function toFlowStatus(value?: string): FlowStatus | undefined {
    return value && FLOW_STATUS_VALUES.has(value) ? value as FlowStatus : undefined
}

function toFlowRunStatus(value?: string): FlowRunStatus | undefined {
    return value && FLOW_RUN_STATUS_VALUES.has(value) ? value as FlowRunStatus : undefined
}

function pieceShortName(fullName: string): string {
    return fullName.replace('@activepieces/piece-', '')
}

function pieceDisplayLabel(shortName: string): string {
    return shortName.charAt(0).toUpperCase() + shortName.slice(1)
}

async function findConnectionsForPiece({ pieceName, projects, platformId, log }: {
    pieceName: string
    projects: Project[]
    platformId: string
    log: FastifyBaseLogger
}): Promise<FindConnectionsResult> {
    const normalizedPiece = mcpUtils.normalizePieceName(pieceName) ?? pieceName

    const projectId = projects[0]?.id
    let requiredScopes: string[] = []
    if (projectId) {
        const project = projects[0]
        const piece = await pieceMetadataService(log).get({
            name: normalizedPiece,
            projectId,
            platformId: project.platformId,
        })
        if (piece && isNil(piece.auth)) {
            return { noAuthRequired: true, piece: normalizedPiece }
        }
        if (piece?.auth && !Array.isArray(piece.auth)) {
            const authScope = (piece.auth as Record<string, unknown>)['scope']
            if (Array.isArray(authScope)) {
                requiredScopes = authScope.filter((s): s is string => typeof s === 'string')
            }
        }
    }

    const allConnections = await Promise.all(
        projects.map(async (project) => {
            const result = await appConnectionService(log).list({
                projectId: project.id,
                platformId,
                pieceName: normalizedPiece,
                cursorRequest: null,
                displayName: undefined,
                status: undefined,
                limit: CROSS_PROJECT_CONNECTION_LIMIT,
                scope: undefined,
                externalIds: undefined,
            })
            return result.data.map((c) => {
                const info = resolveConnectionInfo({ status: c.status, type: c.type, value: c.value })
                return {
                    label: c.displayName,
                    externalId: c.externalId,
                    project: chatPrompt.projectDisplayName(project),
                    projectId: project.id,
                    status: info.status,
                    grantedScopes: info.grantedScopes,
                }
            })
        }),
    )

    const flat = allConnections.flat()
    const shortName = pieceShortName(normalizedPiece)
    const displayName = pieceDisplayLabel(shortName)

    if (flat.length === 0) {
        return { needsConnection: true, piece: shortName, displayName, requiredScopes }
    }

    return { pickConnection: true, piece: shortName, displayName, connections: flat, requiredScopes }
}

async function listFlowsAcrossProjects({ projects, status, log }: {
    projects: Project[]
    status?: string
    log: FastifyBaseLogger
}): Promise<{ content: { type: string, text: string }[] }> {
    const validStatus = toFlowStatus(status)
    const statusFilter = validStatus ? [validStatus] : undefined
    const result = await flowService(log).list({
        projectIds: projects.map((p) => p.id),
        cursorRequest: null,
        limit: CROSS_PROJECT_FLOW_LIMIT,
        status: statusFilter,
    })

    const grouped = new Map<string, string[]>()
    for (const flow of result.data) {
        const lines = grouped.get(flow.projectId) ?? []
        lines.push(formatFlowLine(flow))
        grouped.set(flow.projectId, lines)
    }

    const sections = projects.map((project) => {
        const label = chatPrompt.projectDisplayName(project)
        const lines = grouped.get(project.id)
        return lines
            ? `**${label}** (${project.id}):\n${lines.join('\n')}`
            : `**${label}** (${project.id}): No flows found.`
    })

    return { content: [{ type: 'text', text: sections.join('\n\n') }] }
}

async function listConnectionsAcrossProjects({ projects, platformId, log }: {
    projects: Project[]
    platformId: string
    log: FastifyBaseLogger
}): Promise<{ content: { type: string, text: string }[] }> {
    const allConnections = await Promise.all(
        projects.map(async (project) => {
            const result = await appConnectionService(log).list({
                projectId: project.id,
                platformId,
                pieceName: undefined,
                cursorRequest: null,
                displayName: undefined,
                status: undefined,
                limit: CROSS_PROJECT_CONNECTION_LIMIT,
                scope: undefined,
                externalIds: undefined,
            })
            return result.data.map((c) => `- ${c.displayName} (${pieceShortName(c.pieceName)}, ${c.status}) — ${chatPrompt.projectDisplayName(project)}`)
        }),
    )

    const flat = allConnections.flat()
    if (flat.length === 0) {
        return { content: [{ type: 'text', text: 'No connections found across any project.' }] }
    }

    return { content: [{ type: 'text', text: `Found ${flat.length} connection(s):\n${flat.join('\n')}` }] }
}

async function listResourceForProject({ resource, projectId, status, log }: {
    resource: 'tables' | 'runs'
    projectId: string
    status?: string
    log: FastifyBaseLogger
}): Promise<string[]> {
    switch (resource) {
        case 'tables': {
            const result = await tableService.list({
                projectId,
                cursor: undefined,
                limit: 50,
                name: undefined,
                externalIds: undefined,
                folderId: undefined,
                includeRowCount: true,
            })
            return result.data.map((t) => `- ${t.name} (${t.id}) — ${t.rowCount ?? 0} records`)
        }
        case 'runs': {
            const validStatus = toFlowRunStatus(status)
            const result = await flowRunService(log).list({
                projectId,
                flowId: undefined,
                status: validStatus ? [validStatus] : undefined,
                environment: RunEnvironment.PRODUCTION,
                cursor: null,
                limit: 10,
            })
            return result.data.map((run) => formatRunSummary(run))
        }
    }
}

async function executeCrossProjectTool({ toolName, toolInput, platformId, userId, conversationId, log }: {
    toolName: string
    toolInput: Record<string, unknown>
    platformId: string
    userId: string
    conversationId?: string
    log: FastifyBaseLogger
}): Promise<unknown> {
    const projects = await chatHelpers.getUserProjects({ platformId, userId, log })
    const availableProjectIds = projects.map((p) => p.id)

    switch (toolName) {
        case 'ap_discover_action_auth': {
            const discoveryResult = await findConnectionsForPiece({ pieceName: toolInput.pieceName as string, projects, platformId, log })

            if (conversationId && 'pickConnection' in discoveryResult && discoveryResult.pickConnection) {
                const normalizedPiece = mcpUtils.normalizePieceName(toolInput.pieceName as string) ?? (toolInput.pieceName as string)
                await chatApprovalGate.storeAvailableConnections({
                    conversationId,
                    pieceName: normalizedPiece,
                    connections: discoveryResult.connections,
                })
                return {
                    pickConnection: true,
                    piece: discoveryResult.piece,
                    displayName: discoveryResult.displayName,
                    connectionCount: discoveryResult.connections.length,
                    requiredScopes: discoveryResult.requiredScopes,
                }
            }
            return discoveryResult
        }
        case 'ap_execute_action': {
            return runChatAdhocAction({ toolInput, projects, availableProjectIds, conversationId, log })
        }
        case 'ap_explore_data': {
            const actionName = toolInput.actionName as string
            if (!chatToolClassification.isReadActionName(actionName)) {
                return chatToolClassification.readOnlyRejection(actionName)
            }
            return runChatAdhocAction({ toolInput, projects, availableProjectIds, conversationId, log })
        }
        case 'ap_update_brief': {
            if (!conversationId) {
                return { success: false, error: 'No conversation context.' }
            }
            const parsed = DiscoveryBrief.safeParse(toolInput.brief)
            if (!parsed.success) {
                return { success: false, error: 'Invalid brief shape.' }
            }
            await chatHelpers.conversationRepo().update(conversationId, { discoveryBrief: parsed.data })
            return { updated: true }
        }
        case 'ap_remember': {
            const memory = typeof toolInput.memory === 'string' ? toolInput.memory.trim() : ''
            if (!memory) {
                return { success: false, error: 'Empty memory.' }
            }
            await chatHelpers.rememberForUser({ platformId, userId, memory })
            return { remembered: true }
        }
        case 'ap_list_across_projects': {
            const resource = toolInput.resource as string
            const status = toolInput.status as string | undefined
            if (resource === 'flows') {
                return listFlowsAcrossProjects({ projects, status, log })
            }
            if (resource === 'connections') {
                return listConnectionsAcrossProjects({ projects, platformId, log })
            }
            const results = await Promise.all(
                projects.map(async (project) => {
                    const lines = resource === 'tables'
                        ? await listResourceForProject({ resource: 'tables', projectId: project.id, status, log })
                        : await listResourceForProject({ resource: 'runs', projectId: project.id, status, log })
                    return { project, lines }
                }),
            )
            const sections = results.map(({ project, lines }) => {
                const label = chatPrompt.projectDisplayName(project)
                return lines.length > 0
                    ? `**${label}** (${project.id}):\n${lines.join('\n')}`
                    : `**${label}** (${project.id}): None found.`
            })
            return { content: [{ type: 'text', text: sections.join('\n\n') }] }
        }
        default:
            return { error: `Unknown cross-project tool: ${toolName}` }
    }
}

async function runChatAdhocAction({ toolInput, projects, availableProjectIds, conversationId, log }: {
    toolInput: Record<string, unknown>
    projects: Project[]
    availableProjectIds: string[]
    conversationId?: string
    log: FastifyBaseLogger
}): Promise<unknown> {
    const pieceName = toolInput.pieceName as string
    const actionName = toolInput.actionName as string

    const normalizedPiece = mcpUtils.normalizePieceName(pieceName) ?? pieceName
    let connectionExternalId: string | undefined
    let connectionLabel: string | undefined
    let connectionProjectId: string | undefined
    if (conversationId) {
        const selected = await chatApprovalGate.getSelectedConnection({ conversationId, pieceName: normalizedPiece })
        if (selected) {
            connectionExternalId = selected.externalId
            connectionLabel = selected.label
            connectionProjectId = selected.projectId
        }
    }

    const resolvedProjectId = connectionProjectId ?? projects[0]?.id
    if (!resolvedProjectId) {
        return { success: false, error: 'No projects available. Create a project first.' }
    }
    if (connectionProjectId && !availableProjectIds.includes(connectionProjectId)) {
        return { success: false, error: `Project ${connectionProjectId} is not accessible.` }
    }

    let parsedInput = toolInput.input
    if (typeof parsedInput === 'string') {
        const parsed = parseToJsonIfPossible(parsedInput)
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
            parsedInput = parsed as Record<string, unknown>
        }
    }
    const result = await executeAdhocAction({
        projectId: resolvedProjectId,
        pieceName,
        actionName,
        input: parsedInput as Record<string, unknown> | undefined,
        connectionExternalId,
        log,
    })

    if (connectionLabel && typeof result === 'object' && result !== null) {
        return { ...(result as Record<string, unknown>), _meta: { connectionLabel, pieceName: normalizedPiece } }
    }
    return result
}

function resolveConnectionInfo({ status, type, value }: { status: AppConnectionStatus, type: AppConnectionType, value: unknown }): { status: AppConnectionStatus, grantedScopes: string[] } {
    if (!OAUTH_TYPES.has(type) || !isObject(value)) {
        return { status, grantedScopes: [] }
    }
    const grantedScopes = typeof value['scope'] === 'string' ? value['scope'].split(/\s+/).filter(Boolean) : []
    if (status !== AppConnectionStatus.ACTIVE) {
        return { status, grantedScopes }
    }
    const claimedAtS = typeof value['claimed_at'] === 'number' ? value['claimed_at'] : 0
    const expiresInS = typeof value['expires_in'] === 'number' ? value['expires_in'] : 0
    if (claimedAtS > 0 && expiresInS > 0) {
        const expiryMs = (claimedAtS + expiresInS - CLOCK_SKEW_BUFFER_S) * 1000
        if (Date.now() > expiryMs) {
            return { status: AppConnectionStatus.ERROR, grantedScopes }
        }
    }
    return { status, grantedScopes }
}

type ConnectionWithScopes = {
    label: string
    project: string
    externalId: string
    projectId: string
    status: AppConnectionStatus
    grantedScopes: string[]
}

type FindConnectionsResult =
    | { noAuthRequired: true, piece: string }
    | { needsConnection: true, piece: string, displayName: string, requiredScopes: string[] }
    | { pickConnection: true, piece: string, displayName: string, connections: ConnectionWithScopes[], requiredScopes: string[] }

export { executeCrossProjectTool, findConnectionsForPiece }
