import { flowStructureUtil, FlowTrigger, Step } from '@activepieces/core-execution'
import { deepEquals, isObject, prune } from '@activepieces/core-utils'

const IGNORED_SETTING_KEYS = new Set(['sampleData', 'inputUiInfo', 'propertySettings'])
const MAX_VALUE_LENGTH = 80

function takeSnapshot({ trigger, versionId }: { trigger: FlowTrigger, versionId: string }): FlowSnapshot {
    const steps = flowStructureUtil.getAllSteps(trigger)
    return {
        versionId,
        order: steps.map((step) => step.name),
        steps: Object.fromEntries(steps.map((step) => [step.name, stepContent(step)])),
    }
}

function diff({ before, after }: { before: FlowSnapshot, after: FlowSnapshot }): FlowStepChange[] {
    const removed = before.order
        .filter((name) => !(name in after.steps))
        .map((name) => ({ stepName: name, displayName: before.steps[name].displayName, kind: 'removed' as const, fields: [] }))
    const added = after.order
        .filter((name) => !(name in before.steps))
        .map((name) => ({ stepName: name, displayName: after.steps[name].displayName, kind: 'added' as const, fields: [] }))
    const changed = after.order
        .filter((name) => name in before.steps)
        .map((name) => ({ stepName: name, displayName: after.steps[name].displayName, kind: 'changed' as const, fields: changedFields({ before: before.steps[name], after: after.steps[name] }) }))
        .filter((change) => change.fields.length > 0)
    const moved = movedStepNames({ before, after })
        .filter((name) => !changed.some((change) => change.stepName === name))
        .map((name) => ({ stepName: name, displayName: after.steps[name].displayName, kind: 'moved' as const, fields: [] }))
    return [...removed, ...added, ...changed, ...moved]
}

function describe({ changes, flowId }: { changes: FlowStepChange[], flowId: string }): string {
    const lines = changes.map((change) => {
        const label = `${change.stepName} (${change.displayName})`
        switch (change.kind) {
            case 'added':
                return `- ${label} was added`
            case 'removed':
                return `- ${label} was deleted`
            case 'moved':
                return `- ${label} was moved`
            case 'changed':
                return `- ${label}: ${change.fields.map((field) => `${field.path} ${formatValue(field.before)} → ${formatValue(field.after)}`).join('; ')}`
        }
    })
    return [`The user edited flow ${flowId} in the builder since you last looked at it:`, ...lines].join('\n')
}

function stepContent(step: Step): FlowStepSnapshot {
    const settings = Object.fromEntries(Object.entries(step.settings).filter(([key]) => !IGNORED_SETTING_KEYS.has(key)))
    return {
        displayName: step.displayName,
        type: step.type,
        skip: 'skip' in step ? step.skip === true : false,
        settings,
    }
}

function changedFields({ before, after }: { before: FlowStepSnapshot, after: FlowStepSnapshot }): FlowFieldChange[] {
    const top = (['displayName', 'type', 'skip'] as const)
        .filter((key) => !isSameValue({ a: before[key], b: after[key] }))
        .map((key) => ({ path: key, before: before[key], after: after[key] }))
    return [...top, ...objectFieldChanges({ before: before.settings, after: after.settings, prefix: '' })]
}

function objectFieldChanges({ before, after, prefix }: { before: Record<string, unknown>, after: Record<string, unknown>, prefix: string }): FlowFieldChange[] {
    const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])]
    return keys.flatMap((key) => {
        const path = `${prefix}${key}`
        const beforeValue = before[key]
        const afterValue = after[key]
        if (isSameValue({ a: beforeValue, b: afterValue })) {
            return []
        }
        if (key === 'input' && isObject(beforeValue) && isObject(afterValue)) {
            return objectFieldChanges({ before: beforeValue, after: afterValue, prefix: 'input.' })
        }
        return [{ path, before: beforeValue, after: afterValue }]
    })
}

function movedStepNames({ before, after }: { before: FlowSnapshot, after: FlowSnapshot }): string[] {
    const beforeOrder = before.order.filter((name) => name in after.steps)
    const afterOrder = after.order.filter((name) => name in before.steps)
    return afterOrder.filter((name, index) => {
        const previousNow = afterOrder[index - 1]
        const previousBefore = beforeOrder[beforeOrder.indexOf(name) - 1]
        return previousNow !== previousBefore
    })
}

function formatValue(value: unknown): string {
    if (value === undefined) {
        return '(empty)'
    }
    const text = typeof value === 'string' ? `"${value}"` : JSON.stringify(prune(value)) ?? 'undefined'
    return text.length > MAX_VALUE_LENGTH ? `${text.slice(0, MAX_VALUE_LENGTH)}…` : text
}

function isSameValue({ a, b }: { a: unknown, b: unknown }): boolean {
    return deepEquals({ a: prune(a), b: prune(b) })
}

export const flowStepDiff = {
    takeSnapshot,
    diff,
    describe,
}

export type FlowStepSnapshot = {
    displayName: string
    type: string
    skip: boolean
    settings: Record<string, unknown>
}

export type FlowSnapshot = {
    versionId: string
    order: string[]
    steps: Record<string, FlowStepSnapshot>
}

export type FlowFieldChange = {
    path: string
    before: unknown
    after: unknown
}

export type FlowStepChange = {
    stepName: string
    displayName: string
    kind: 'added' | 'removed' | 'changed' | 'moved'
    fields: FlowFieldChange[]
}
