import { FlowAction } from '../actions/action'
import { FlowTrigger } from '../triggers/trigger'

function prune(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(prune)
    }
    if (typeof value === 'object' && value !== null) {
        const prunedEntries = Object.entries(value)
            .map(([key, entryValue]) => [key, prune(entryValue)] as const)
            .filter(([, entryValue]) => entryValue !== undefined)
        if (prunedEntries.length === 0) {
            return undefined
        }
        return Object.fromEntries(prunedEntries)
    }
    return value
}

function deepEquals({ a, b }: DeepEqualsParams): boolean {
    if (a === b) {
        return true
    }
    if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
        return false
    }
    if (Array.isArray(a) || Array.isArray(b)) {
        return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((item, index) => deepEquals({ a: item, b: b[index] }))
    }
    const aRecord: Record<string, unknown> = { ...a }
    const bRecord: Record<string, unknown> = { ...b }
    const aKeys = Object.keys(aRecord)
    const bKeys = Object.keys(bRecord)
    return aKeys.length === bKeys.length && aKeys.every((key) => deepEquals({ a: aRecord[key], b: bRecord[key] }))
}

function contentOf(step: FlowAction | FlowTrigger): Record<string, unknown> {
    const settings: Record<string, unknown> = { ...(step.settings ?? {}) }
    const input = settings['input']
    delete settings['input']
    delete settings['sampleData']
    delete settings['customLogoUrl']
    return {
        type: step.type,
        input: input ?? {},
        optionSettings: prune(settings),
    }
}

function preserveLastUpdatedDate<T extends FlowAction | FlowTrigger>({ existingStep, updatedStep }: PreserveLastUpdatedDateParams<T>): T {
    const contentChanged = !deepEquals({ a: contentOf(existingStep), b: contentOf(updatedStep) })
    if (contentChanged) {
        return updatedStep
    }
    return {
        ...updatedStep,
        lastUpdatedDate: existingStep.lastUpdatedDate,
    }
}

export const updateStepUtil = {
    preserveLastUpdatedDate,
}

type DeepEqualsParams = {
    a: unknown
    b: unknown
}

type PreserveLastUpdatedDateParams<T extends FlowAction | FlowTrigger> = {
    existingStep: FlowAction | FlowTrigger
    updatedStep: T
}
