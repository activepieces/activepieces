import { ApResourceKind, isNil, isObject, Permission, tryCatch } from '@activepieces/core-utils'
import { AgentPageContext, flowStructureUtil } from '@activepieces/shared'
import { ModelMessage, TextPart } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { flowService } from '../../../flows/flow/flow.service'
import { resolvePermissionChecker } from '../../../mcp/mcp-permissions'
import { tableService } from '../../../tables/table/table.service'

async function build({ pageContext, userId, log }: BuildParams): Promise<TextPart | null> {
    if (isNil(pageContext)) {
        return null
    }
    const page = PAGES[pageContext.kind]
    const checker = await resolvePermissionChecker({ userId, projectId: pageContext.projectId, log })
    if (!isNil(checker.check(page.permission, NOTE_PREFIX))) {
        return null
    }
    const description = await page.describe({ pageContext, log })
    return { type: 'text', text: format({ pageContext, description }), providerOptions: NOTE_MARKER }
}

function isNote(part: unknown): boolean {
    return isObject(part)
        && isObject(part.providerOptions)
        && isObject(part.providerOptions.activepieces)
        && part.providerOptions.activepieces.pageContextNote === true
}

function isLatestIn({ note, messages }: { note: TextPart, messages: ModelMessage[] }): boolean {
    return notesIn(messages).at(-1) === note.text
}

function ensureVisible({ note, messages }: { note: TextPart | null, messages: ModelMessage[] }): ModelMessage[] {
    if (isNil(note) || notesIn(messages).includes(note.text)) {
        return messages
    }
    const lastUser = messages.reduce((found, message, index) => message.role === 'user' ? index : found, -1)
    if (lastUser === -1) {
        return messages
    }
    return messages.map((message, index) => index === lastUser && message.role === 'user'
        ? { ...message, content: [note, ...(typeof message.content === 'string' ? [{ type: 'text' as const, text: message.content }] : message.content)] }
        : message)
}

function notesIn(messages: ModelMessage[]): string[] {
    return messages.flatMap((message) => {
        if (message.role !== 'user' || typeof message.content === 'string') {
            return []
        }
        return message.content.flatMap((part) => part.type === 'text' && isNote(part) ? [part.text] : [])
    })
}

function format({ pageContext, description }: { pageContext: AgentPageContext, description: PageDescription }): string {
    const name = isNil(description.name) ? '' : ` ${quote(description.name)}`
    const step = isNil(description.step) ? '' : `, with step ${quote(description.step.displayName)} (${description.step.name}) selected`
    return `${NOTE_PREFIX} When the user sent this message, they were looking at ${pageContext.kind}${name} (id ${pageContext.id}) in project ${pageContext.projectId}${step}. They may be on another page now.`
}

async function describeFlow({ pageContext: { id, projectId, stepName }, log }: DescribeParams): Promise<PageDescription> {
    const { data: flow } = await tryCatch(() => flowService(log).getOnePopulated({ id, projectId }))
    if (isNil(flow)) {
        return UNKNOWN_PAGE
    }
    const step = isNil(stepName) ? undefined : flowStructureUtil.getStep(stepName, flow.version.trigger)
    return {
        name: flow.version.displayName,
        step: isNil(step) ? null : { name: step.name, displayName: step.displayName },
    }
}

async function describeTable({ pageContext: { id, projectId } }: DescribeParams): Promise<PageDescription> {
    const { data: table } = await tryCatch(() => tableService.getOneOrThrow({ id, projectId }))
    return { name: table?.name ?? null, step: null }
}

function quote(text: string): string {
    const capped = text.length > MAX_NAME_LENGTH ? `${text.slice(0, MAX_NAME_LENGTH)}…` : text
    return JSON.stringify(capped)
}

const PAGES: Record<ApResourceKind, PageKind> = {
    [ApResourceKind.FLOW]: { permission: Permission.READ_FLOW, describe: describeFlow },
    [ApResourceKind.TABLE]: { permission: Permission.READ_TABLE, describe: describeTable },
}

const NOTE_PREFIX = '[Page context]'

const NOTE_MARKER = { activepieces: { pageContextNote: true } }

const MAX_NAME_LENGTH = 100

const UNKNOWN_PAGE: PageDescription = { name: null, step: null }

type BuildParams = {
    pageContext: AgentPageContext | undefined
    userId: string
    log: FastifyBaseLogger
}

type DescribeParams = {
    pageContext: AgentPageContext
    log: FastifyBaseLogger
}

type PageKind = {
    permission: Permission
    describe: (params: DescribeParams) => Promise<PageDescription>
}

type PageDescription = {
    name: string | null
    step: { name: string, displayName: string } | null
}

export const agentPageContextNote = { build, isNote, isLatestIn, ensureVisible }
