import { isNil, tryCatch } from '@activepieces/core-utils'
import { ChatMention, ChatMentionType, FlowAction, FlowActionType, flowStructureUtil, FlowTrigger, FlowTriggerType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { appConnectionService } from '../../app-connection/app-connection-service/app-connection-service'
import { flowService } from '../../flows/flow/flow.service'
import { mcpUtils } from '../../mcp/tools/mcp-utils'
import { formatFieldInfo } from '../../mcp/tools/table-utils'
import { pieceMetadataService } from '../../pieces/metadata/piece-metadata-service'
import { fieldService } from '../../tables/field/field.service'
import { recordService } from '../../tables/record/record.service'
import { tableService } from '../../tables/table/table.service'

const MAX_FLOW_STEPS = 25
const MAX_TABLE_FIELDS = 15
const MAX_SAMPLE_ROWS = 5
const MAX_CELL_CHARS = 100
const MAX_PIECE_COMPONENTS = 8
const MAX_CONNECTIONS_PER_PIECE = 10
const GLOBAL_BLOCK_CHAR_CEILING = 8000

async function resolveFlowLines({ id, projectId, log }: ResolveOneParams): Promise<string[]> {
    const flow = await flowService(log).getOnePopulated({ id, projectId, removeSampleData: true, removeConnectionsName: true })
    if (isNil(flow)) {
        return [unavailableLine('flow', id)]
    }
    const allSteps = flowStructureUtil.getAllSteps(flow.version.trigger)
    const shown = allSteps.slice(0, MAX_FLOW_STEPS)
    const stepLines = shown.map((step) => `    - ${step.displayName}${describeStep(step)}`)
    const moreNote = allSteps.length > shown.length ? [`    - …and ${allSteps.length - shown.length} more step(s)`] : []
    return [
        `- Flow "${flow.version.displayName}" (id: ${flow.id}) — ${flow.status}, ${flow.publishedVersionId ? 'published' : 'draft'}`,
        `  Steps (${allSteps.length}):`,
        ...stepLines,
        ...moreNote,
    ]
}

async function resolveTableLines({ id, projectId }: ResolveOneParams): Promise<string[]> {
    const tableResult = await tryCatch(() => tableService.getOneOrThrow({ projectId, id }))
    if (tableResult.error) {
        return [unavailableLine('table', id)]
    }
    const table = tableResult.data
    const fields = await fieldService.getAll({ projectId, tableId: id })
    const shownFields = fields.slice(0, MAX_TABLE_FIELDS)
    const fieldLines = shownFields.map((f) => `    - ${formatFieldInfo(f)}`)
    const moreFields = fields.length > shownFields.length ? [`    - …and ${fields.length - shownFields.length} more field(s)`] : []

    const records = await recordService.list({ tableId: id, projectId, limit: MAX_SAMPLE_ROWS, fields, cursorRequest: null, filters: null })
    const rowLines = records.data.length > 0
        ? records.data.map((record, i) => `    ${i + 1}. ${formatRecord(record)}`)
        : ['    (no records yet)']

    return [
        `- Table "${table.name}" (id: ${table.id}, externalId: ${table.externalId})`,
        `  Fields (${fields.length}):`,
        ...fieldLines,
        ...moreFields,
        `  Sample rows (first ${records.data.length}):`,
        ...rowLines,
    ]
}

async function resolveAppLines({ id, projectId, platformId, log }: ResolveOneParams): Promise<string[]> {
    const pieceName = mcpUtils.normalizePieceName(id) ?? id
    const piece = await pieceMetadataService(log).get({ name: pieceName, projectId, platformId })
    if (isNil(piece)) {
        return [unavailableLine('app', id)]
    }
    const actions = Object.values(piece.actions).map((a) => a.displayName)
    const triggers = Object.values(piece.triggers).map((t) => t.displayName)

    const connectionsResult = await tryCatch(() => appConnectionService(log).list({
        projectId,
        platformId,
        pieceName,
        displayName: undefined,
        status: undefined,
        cursorRequest: null,
        scope: undefined,
        externalIds: undefined,
        limit: MAX_CONNECTIONS_PER_PIECE,
    }))
    const connections = connectionsResult.error ? [] : connectionsResult.data.data

    return [
        `- App "${piece.displayName}" (${pieceName})`,
        `  Actions (${actions.length}): ${summarizeComponents(actions)}`,
        `  Triggers (${triggers.length}): ${summarizeComponents(triggers)}`,
        connections.length > 0
            ? `  Connected accounts (${connections.length}): ${connections.map((c) => `${c.displayName} (${c.status})`).join(', ')}`
            : '  Connected accounts: none yet — offer to connect inline if a task needs this app.',
    ]
}

async function resolveMentionsNote({ mentions, projectId, platformId, log }: {
    mentions: ChatMention[]
    projectId: string
    platformId: string
    log: FastifyBaseLogger
}): Promise<string> {
    if (mentions.length === 0) {
        return ''
    }
    const resolved = await Promise.all(mentions.map(async (mention) => {
        const result = await tryCatch(() => resolveOne({ mention, projectId, platformId, log }))
        if (result.error) {
            log.warn({ mention: { type: mention.type } }, '[mentionContext] Failed to resolve a mention')
            return [unavailableLine(mention.type, mention.id)]
        }
        return result.data
    }))

    const header = [
        '\n\n## Mentioned resources (this message)',
        'The user explicitly attached these resources to their message via @-mention. Treat them as the authoritative subject of the request — use, modify, or answer about them directly without re-discovering or asking which one they meant. Data shown here is project-scoped ground truth (a sample, not the full dataset; use the data tools for complete records).',
    ]
    const body = resolved.flat()
    const note = [...header, ...body].join('\n')
    if (note.length > GLOBAL_BLOCK_CHAR_CEILING) {
        return note.slice(0, GLOBAL_BLOCK_CHAR_CEILING) + '\n[truncated — use the data tools for full detail]'
    }
    return note
}

function resolveOne({ mention, projectId, platformId, log }: { mention: ChatMention } & Omit<ResolveOneParams, 'id'>): Promise<string[]> {
    const params: ResolveOneParams = { id: mention.id, projectId, platformId, log }
    switch (mention.type) {
        case ChatMentionType.FLOW:
            return resolveFlowLines(params)
        case ChatMentionType.TABLE:
            return resolveTableLines(params)
        case ChatMentionType.APP:
            return resolveAppLines(params)
    }
}

function describeStep(step: FlowAction | FlowTrigger): string {
    if (step.type === FlowActionType.PIECE) {
        return formatPieceDetail({ pieceName: step.settings.pieceName, op: step.settings.actionName })
    }
    if (step.type === FlowTriggerType.PIECE) {
        return formatPieceDetail({ pieceName: step.settings.pieceName, op: step.settings.triggerName })
    }
    return ` (${step.type})`
}

function formatPieceDetail({ pieceName, op }: { pieceName?: string, op?: string }): string {
    const piece = isNil(pieceName) ? undefined : mcpUtils.normalizePieceName(pieceName) ?? pieceName
    const detail = [piece, op].filter((v) => !isNil(v)).join(' · ')
    return detail.length > 0 ? ` (${detail})` : ''
}

function formatRecord(record: { cells: Record<string, { value: unknown, fieldName: string }> }): string {
    return Object.values(record.cells)
        .map((cell) => `${cell.fieldName}: ${truncateCell(cell.value)}`)
        .join(' | ')
}

function truncateCell(value: unknown): string {
    const str = typeof value === 'string' ? value : JSON.stringify(value ?? '')
    return str.length > MAX_CELL_CHARS ? str.slice(0, MAX_CELL_CHARS) + '…' : str
}

function summarizeComponents(names: string[]): string {
    if (names.length === 0) {
        return 'none'
    }
    const shown = names.slice(0, MAX_PIECE_COMPONENTS)
    const suffix = names.length > shown.length ? `, …+${names.length - shown.length} more` : ''
    return shown.join(', ') + suffix
}

function unavailableLine(type: string, id: string): string {
    return `- (${type} "${id}" is no longer available in this project)`
}

export const mentionContext = {
    resolveMentionsNote,
}

type ResolveOneParams = {
    id: string
    projectId: string
    platformId: string
    log: FastifyBaseLogger
}
