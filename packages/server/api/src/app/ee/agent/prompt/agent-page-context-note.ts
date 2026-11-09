import { isNil } from '@activepieces/core-utils'
import { AgentPageContext } from '@activepieces/shared'

function build({ pageContext }: { pageContext: AgentPageContext | undefined }): string | null {
    if (isNil(pageContext)) {
        return null
    }
    const label = isNil(pageContext.label) ? '' : ` "${pageContext.label}"`
    const step = isNil(pageContext.stepName) ? '' : `, step "${pageContext.stepName}" selected`
    return `${PAGE_CONTEXT_NOTE_PREFIX} The user is looking at ${pageContext.kind}${label} (id ${pageContext.id}) in project ${pageContext.projectId}${step}.`
}

function isNote(text: string): boolean {
    return text.startsWith(PAGE_CONTEXT_NOTE_PREFIX)
}

export const agentPageContextNote = { build, isNote }

const PAGE_CONTEXT_NOTE_PREFIX = '[Page context]'
