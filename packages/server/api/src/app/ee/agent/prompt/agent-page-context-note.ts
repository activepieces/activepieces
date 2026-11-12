import { isNil, tryCatch } from '@activepieces/core-utils'
import { AgentPageContext, flowStructureUtil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowService } from '../../../flows/flow/flow.service'
import { tableService } from '../../../tables/table/table.service'

async function build({ pageContext, log }: BuildParams): Promise<string | null> {
    if (isNil(pageContext)) {
        return null
    }
    const resource = await resolveResource({ pageContext, log })
    const name = isNil(resource.name) ? '' : ` ${quoted(resource.name)}`
    const step = isNil(resource.step) ? '' : `, with step ${quoted(resource.step.displayName)} (${resource.step.name}) selected`
    return `${PAGE_CONTEXT_NOTE_PREFIX} When the user sent this message, they were looking at ${pageContext.kind}${name} (id ${pageContext.id}) in project ${pageContext.projectId}${step}. They may be on another page now.`
}

function isNote(text: string): boolean {
    return text.startsWith(PAGE_CONTEXT_NOTE_PREFIX)
}

async function resolveResource({ pageContext, log }: { pageContext: AgentPageContext, log: FastifyBaseLogger }): Promise<ResolvedResource> {
    const { id, projectId, stepName } = pageContext
    switch (pageContext.kind) {
        case 'flow': {
            const { data: flow } = await tryCatch(() => flowService(log).getOnePopulated({ id, projectId }))
            if (isNil(flow)) {
                return { name: null, step: null }
            }
            const step = isNil(stepName) ? undefined : flowStructureUtil.getStep(stepName, flow.version.trigger)
            return {
                name: flow.version.displayName,
                step: isNil(step) ? null : { name: step.name, displayName: step.displayName },
            }
        }
        case 'table': {
            const { data: table } = await tryCatch(() => tableService.getOneOrThrow({ id, projectId }))
            return { name: table?.name ?? null, step: null }
        }
    }
}

function quoted(text: string): string {
    const capped = text.length > MAX_NAME_LENGTH ? `${text.slice(0, MAX_NAME_LENGTH)}…` : text
    return JSON.stringify(capped)
}

const PAGE_CONTEXT_NOTE_PREFIX = '[Page context]'

const MAX_NAME_LENGTH = 100

type BuildParams = {
    pageContext: AgentPageContext | undefined
    log: FastifyBaseLogger
}

type ResolvedResource = {
    name: string | null
    step: { name: string, displayName: string } | null
}

export const agentPageContextNote = { build, isNote }
