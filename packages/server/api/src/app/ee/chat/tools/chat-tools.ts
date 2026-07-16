import { isNil, isObject, parseToJsonIfPossible, Permission, spreadIfDefined, tryCatch } from '@activepieces/core-utils'
import { chatAiUtils } from '@activepieces/server-utils'
import { AppConnectionStatus, AppConnectionType, chatToolClassification, FileCompression, FileType, FlowRunStatus, FlowStatus, Project, RunEnvironment } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { appConnectionService } from '../../../app-connection/app-connection-service/app-connection-service'
import { fileService } from '../../../file/file.service'
import { filesService } from '../../../file/files-service'
import { flowService } from '../../../flows/flow/flow.service'
import { flowRunService } from '../../../flows/flow-run/flow-run-service'
import { resolvePermissionChecker } from '../../../mcp/mcp-permissions'
import { formatFlowLine } from '../../../mcp/tools/ap-list-flows'
import { AdhocOffload, executeAdhocAction, executeAdhocCode, formatRunSummary } from '../../../mcp/tools/flow-run-utils'
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
const MAX_PRODUCED_FILES = 10
const MAX_PRODUCED_FILE_BYTES = 25 * 1024 * 1024
const MAX_RESULT_TEXT_CHARS = 20_000
const LARGE_RESULT_OFFLOAD_BYTES = 64 * 1024
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

async function checkWriteRunPermission({ userId, projectId, toolName, log }: {
    userId: string
    projectId: string
    toolName: string
    log: FastifyBaseLogger
}): Promise<string | null> {
    const checker = await resolvePermissionChecker({ userId, projectId, log })
    const denial = checker.check(Permission.WRITE_RUN, toolName)
    return isNil(denial) ? null : denial.content.map((part) => part.text).join(' ')
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
            const normalizedPiece = mcpUtils.normalizePieceName(toolInput.pieceName as string) ?? (toolInput.pieceName as string)
            // Sticky connection: if the user already chose a connection for this piece this
            // conversation, reuse it instead of popping another picker for the next action.
            if (conversationId) {
                const selected = await chatApprovalGate.getSelectedConnection({ conversationId, pieceName: normalizedPiece })
                if (selected) {
                    return {
                        alreadyConnected: true,
                        piece: normalizedPiece,
                        auth: selected.externalId,
                        connectionLabel: selected.label,
                        note: 'A connection for this piece was already selected this conversation — pass this auth and do NOT show another connection picker.',
                    }
                }
            }
            const discoveryResult = await findConnectionsForPiece({ pieceName: toolInput.pieceName as string, projects, platformId, log })

            if (conversationId && 'pickConnection' in discoveryResult && discoveryResult.pickConnection) {
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
            return runChatAdhocAction({ toolInput, projects, availableProjectIds, conversationId, platformId, userId, requireWritePermission: true, log })
        }
        case 'ap_run_code': {
            return runChatCode({ toolInput, projects, platformId, userId, conversationId, log })
        }
        case 'ap_explore_data': {
            const actionName = toolInput.actionName as string
            const exploreInput = isObject(toolInput.input) ? toolInput.input as Record<string, unknown> : undefined
            if (!chatToolClassification.isReadOnlyActionCall({ actionName, input: exploreInput })) {
                return chatToolClassification.readOnlyRejection(actionName)
            }
            return runChatAdhocAction({ toolInput, projects, availableProjectIds, conversationId, platformId, userId, log })
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

// A large successful read (e.g. a 1.4MB Attio query) is persisted as a .json file and replaced in
// the model context with a compact shape preview + the fileId. The agent then processes the FULL
// data in ap_run_code (inputFileIds → inputs.data) — the blob never floods the context.
function buildAdhocOffload({ projectId, platformId, pieceName, actionName, log }: {
    projectId: string
    platformId?: string
    pieceName: string
    actionName: string
    log: FastifyBaseLogger
}): AdhocOffload | undefined {
    if (isNil(platformId)) {
        return undefined
    }
    return {
        thresholdBytes: LARGE_RESULT_OFFLOAD_BYTES,
        handle: async ({ payload, byteSize, label, statusNote }) => {
            const json = JSON.stringify(payload, null, 2)
            const fileName = `${pieceName.replace('@activepieces/piece-', '')}-${actionName}.json`
            const { data: saved, error } = await tryCatch(() => fileService(log).save({
                projectId,
                platformId,
                data: Buffer.from(json, 'utf8'),
                size: Buffer.byteLength(json, 'utf8'),
                type: FileType.FLOW_STEP_FILE,
                fileName,
                compression: FileCompression.NONE,
                metadata: { mimetype: 'application/json' },
            }))
            if (error || isNil(saved)) {
                log.warn({ error, pieceName, actionName }, '[chat] large-result offload failed; falling back to inline truncation')
                return null
            }
            return chatAiUtils.buildLargeResultPreview({ payload, byteSize, fileId: saved.id, label, statusNote })
        },
    }
}

async function runChatAdhocAction({ toolInput, projects, availableProjectIds, conversationId, platformId, userId, requireWritePermission, log }: {
    toolInput: Record<string, unknown>
    projects: Project[]
    availableProjectIds: string[]
    conversationId?: string
    platformId?: string
    userId: string
    requireWritePermission?: boolean
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
    if (requireWritePermission) {
        const denial = await checkWriteRunPermission({ userId, projectId: resolvedProjectId, toolName: 'ap_execute_action', log })
        if (denial) {
            return { success: false, error: denial }
        }
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
        ...spreadIfDefined('offload', buildAdhocOffload({ projectId: resolvedProjectId, platformId, pieceName: normalizedPiece, actionName, log })),
        log,
    })

    if (typeof result === 'object' && result !== null) {
        const resultObj = result as Record<string, unknown>
        const structured = isObject(resultObj.structuredContent) ? resultObj.structuredContent as Record<string, unknown> : undefined
        const errorSummary = typeof structured?.errorSummary === 'string' ? structured.errorSummary : undefined
        if (isNil(connectionLabel) && isNil(errorSummary)) {
            return result
        }
        return {
            ...resultObj,
            _meta: {
                ...spreadIfDefined('connectionLabel', connectionLabel),
                ...spreadIfDefined('errorSummary', errorSummary),
                pieceName: normalizedPiece,
            },
        }
    }
    return result
}

async function runChatCode({ toolInput, projects, platformId, userId, conversationId, log }: {
    toolInput: Record<string, unknown>
    projects: Project[]
    platformId: string
    userId: string
    conversationId?: string
    log: FastifyBaseLogger
}): Promise<RunCodeToolResult> {
    const code = typeof toolInput.code === 'string' ? toolInput.code : undefined
    if (isNil(code) || code.trim().length === 0) {
        return { text: '❌ `code` is required and must be a non-empty string.', producedFiles: [] }
    }
    const packageJson = typeof toolInput.packageJson === 'string' ? toolInput.packageJson : undefined

    let projectId = projects[0]?.id
    if (conversationId) {
        const conversation = await chatHelpers.getConversationOrThrow({ id: conversationId, platformId, userId })
        if (conversation.projectId && projects.some((p) => p.id === conversation.projectId)) {
            projectId = conversation.projectId
        }
    }
    if (isNil(projectId)) {
        return { text: '❌ No projects available. Create a project first.', producedFiles: [] }
    }
    const denial = await checkWriteRunPermission({ userId, projectId, toolName: 'ap_run_code', log })
    if (denial) {
        return { text: `❌ ${denial}`, producedFiles: [] }
    }

    const baseInput = isObject(toolInput.input) ? toolInput.input as Record<string, unknown> : {}
    const inputFileIds = Array.isArray(toolInput.inputFileIds)
        ? toolInput.inputFileIds.filter((id): id is string => typeof id === 'string')
        : []
    const inputFiles: { name: string, mimeType: string, base64: string }[] = []
    for (const fileId of inputFileIds) {
        const { data: file, error: lookupError } = await tryCatch(() => fileService(log).getFileOrThrow({ fileId, type: FileType.FLOW_STEP_FILE }))
        // Confine to the current conversation's project, not just the platform — otherwise a
        // model-supplied fileId from another project on the same platform could be read.
        if (lookupError || isNil(file) || file.platformId !== platformId || file.projectId !== projectId) {
            return { text: `❌ Couldn't load attachment ${fileId}. If this is an image you generated, pass its URL into the code and fetch() it instead of using inputFileIds.`, producedFiles: [] }
        }
        const { data: fileData, error: dataError } = await tryCatch(() => fileService(log).getDataOrThrow({ projectId: file.projectId ?? undefined, fileId, type: FileType.FLOW_STEP_FILE }))
        if (dataError || isNil(fileData)) {
            return { text: `❌ Couldn't read attachment ${fileId}.`, producedFiles: [] }
        }
        const mimeType = isObject(fileData.metadata) && typeof fileData.metadata.mimetype === 'string' ? fileData.metadata.mimetype : 'application/octet-stream'
        inputFiles.push({ name: fileData.fileName ?? fileId, mimeType, base64: fileData.data.toString('base64') })
    }
    const jsonValues = inputFiles
        .filter((f) => f.mimeType.includes('json') || f.name.toLowerCase().endsWith('.json'))
        .map((f) => parseToJsonIfPossible(Buffer.from(f.base64, 'base64').toString('utf8')))
        .filter((v) => isObject(v) || Array.isArray(v))
    const input: Record<string, unknown> = { ...baseInput }
    if (inputFiles.length > 0) {
        input.files = inputFiles
    }
    // JSON attachments (e.g. an offloaded large tool result) are parsed and handed over as
    // `inputs.data` so the agent can process them in two lines instead of base64-decoding by hand.
    if (jsonValues.length > 0 && baseInput.data === undefined) {
        input.data = jsonValues.length === 1 ? jsonValues[0] : jsonValues
    }

    const result = await executeAdhocCode({ projectId, code, packageJson, input, log })

    if (result.status !== 'succeeded') {
        const reason = result.status === 'timeout' ? 'Code is still running after 120s.' : result.errorMessage ?? 'Code execution failed.'
        return { text: `❌ ${reason}`, producedFiles: [] }
    }

    return persistProducedFiles({ output: result.output, projectId, platformId, log })
}

function extractFilesFromOutput(output: unknown): { files: RawProducedFile[], rest: unknown } {
    if (!isObject(output) || !Array.isArray(output.files)) {
        return { files: [], rest: output }
    }
    const files = output.files.filter((f): f is RawProducedFile =>
        isObject(f) && typeof f.name === 'string' && typeof f.mimeType === 'string' && typeof f.base64 === 'string')
    const rest: Record<string, unknown> = { ...output }
    delete rest.files
    return { files, rest }
}

function decodeBase64(value: string): Buffer | undefined {
    const stripped = value.replace(/^data:[^;]+;base64,/, '')
    const buffer = Buffer.from(stripped, 'base64')
    return buffer.length > 0 ? buffer : undefined
}

async function persistProducedFiles({ output, projectId, platformId, log }: {
    output: unknown
    projectId: string
    platformId: string
    log: FastifyBaseLogger
}): Promise<RunCodeToolResult> {
    const { files, rest } = extractFilesFromOutput(output)
    const producedFiles: ProducedFile[] = []
    for (const file of files.slice(0, MAX_PRODUCED_FILES)) {
        const buffer = decodeBase64(file.base64)
        if (isNil(buffer) || buffer.length > MAX_PRODUCED_FILE_BYTES) {
            continue
        }
        const saved = await fileService(log).save({
            projectId,
            platformId,
            data: buffer,
            size: buffer.length,
            type: FileType.FLOW_STEP_FILE,
            fileName: file.name,
            compression: FileCompression.NONE,
            metadata: { mimetype: file.mimeType },
        })
        const url = await filesService.constructReadUrl({ fileId: saved.id, fileType: saved.type, platformId })
        producedFiles.push({ fileId: saved.id, url, mediaType: file.mimeType, fileName: file.name, byteSize: buffer.length })
    }
    return { text: buildCodeResultText({ rest, producedFiles }), producedFiles }
}

function buildCodeResultText({ rest, producedFiles }: { rest: unknown, producedFiles: ProducedFile[] }): string {
    const fileNote = producedFiles.length > 0
        ? `Returned ${producedFiles.length} file(s) to the user: ${producedFiles.map((f) => f.fileName).join(', ')}.`
        : ''
    const hasRest = !isNil(rest) && !(isObject(rest) && Object.keys(rest).length === 0)
    if (!hasRest) {
        return fileNote.length > 0 ? `✅ Code ran. ${fileNote}` : '✅ Code ran (no output returned).'
    }
    const outStr = typeof rest === 'string' ? rest : JSON.stringify(rest)
    const truncated = outStr.length > MAX_RESULT_TEXT_CHARS ? `${outStr.slice(0, MAX_RESULT_TEXT_CHARS)}… (truncated)` : outStr
    return ['✅ Code ran.', truncated, fileNote].filter((s) => s.length > 0).join('\n\n')
}

function resolveConnectionInfo({ status, type, value }: { status: AppConnectionStatus, type: AppConnectionType, value: unknown }): { status: AppConnectionStatus, grantedScopes: string[] } {
    if (!OAUTH_TYPES.has(type) || !isObject(value)) {
        return { status, grantedScopes: [] }
    }
    const grantedScopes = typeof value['scope'] === 'string' ? value['scope'].split(/\s+/).filter(Boolean) : []
    if (status !== AppConnectionStatus.ACTIVE) {
        return { status, grantedScopes }
    }
    const hasRefreshToken = typeof value['refresh_token'] === 'string' && value['refresh_token'].length > 0
    if (hasRefreshToken) {
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

type RawProducedFile = {
    name: string
    mimeType: string
    base64: string
}

type ProducedFile = {
    fileId: string
    url: string
    mediaType: string
    fileName: string
    byteSize: number
}

type RunCodeToolResult = {
    text: string
    producedFiles: ProducedFile[]
}

export { executeCrossProjectTool, findConnectionsForPiece }
