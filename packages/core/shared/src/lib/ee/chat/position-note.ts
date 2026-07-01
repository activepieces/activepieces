import { ActiveStageContext } from '@activepieces/core-execution'

function positionLabel(context: ActiveStageContext): string {
    const base = context.name?.trim() || `the ${context.type} page`
    const focusLabel = context.focus?.label?.trim()
    return focusLabel ? `${base} · ${focusLabel}` : base
}

// Same resource (page/flow/table/project), ignoring which item is selected — used
// to phrase "(from X)": across resources X is the previous resource, within the
// same resource X is the previously-selected item.
function isSameResource(a: ActiveStageContext, b: ActiveStageContext): boolean {
    return a.type === b.type && a.id === b.id && a.projectId === b.projectId
}

// Same position down to the selected item (cell/step/range). Mirrors the web
// activeContextUtils.isSameForMarker so the agent's history trail and the visible
// transcript markers agree on when a position "changed".
function isSamePosition(a: ActiveStageContext, b: ActiveStageContext): boolean {
    if (!isSameResource(a, b)) {
        return false
    }
    return (a.focus?.ref ?? '') === (b.focus?.ref ?? '') && (a.focus?.label ?? '') === (b.focus?.label ?? '')
}

// The inline position marker baked into the user's turn in the LLM history so the
// agent re-reads where the user was when they sent each message. It is the SAME
// fact the user sees above their message in the transcript: printed on the first
// positioned message and whenever the position (page or selected item) changed,
// silent when unchanged. Returns '' when there's nothing to print.
function buildPositionHistoryLine({ activeContext, previousContext }: {
    activeContext?: ActiveStageContext
    previousContext?: ActiveStageContext
}): string {
    if (!activeContext) {
        return ''
    }
    const label = positionLabel(activeContext)
    if (!previousContext) {
        return `📍 User is on ${label}`
    }
    if (isSamePosition(previousContext, activeContext)) {
        return ''
    }
    const from = isSameResource(previousContext, activeContext)
        ? previousContext.focus?.label?.trim()
        : previousContext.name?.trim() || `the ${previousContext.type} page`
    return from
        ? `📍 User moved to ${label} (from ${from})`
        : `📍 User moved to ${label}`
}

export const chatPositionUtils = {
    positionLabel,
    isSameResource,
    isSamePosition,
    buildPositionHistoryLine,
}
