import { isNil } from '@activepieces/core-utils'
import { StepOutputType } from '@activepieces/shared'
import { utils } from '../utils'

function recursiveSizeof(value: unknown): number {
    if (value === null || value === undefined) {
        return utils.sizeof(value)
    }
    if (Array.isArray(value)) {
        let total = 2
        for (const item of value) {
            total += recursiveSizeof(item) + 1
        }
        return total
    }
    if (typeof value === 'object') {
        const obj = value as Record<string, unknown>
        if (obj.outputType === StepOutputType.SLICE && isSliceRefShape(obj.output)) {
            return sizeofStepShell(obj) + obj.output.size
        }
        let total = 2
        for (const [key, child] of Object.entries(obj)) {
            total += utils.sizeof(key) + 1 + recursiveSizeof(child) + 1
        }
        return total
    }
    return utils.sizeof(value)
}

function sizeofStepShell(step: Record<string, unknown>): number {
    let total = 2
    for (const [key, child] of Object.entries(step)) {
        if (key === 'output') {
            continue
        }
        total += utils.sizeof(key) + 1 + recursiveSizeof(child) + 1
    }
    return total
}

function isSliceRefShape(value: unknown): value is { size: number } {
    return (
        typeof value === 'object' &&
        value !== null &&
        typeof (value as { size?: unknown }).size === 'number'
    )
}

function upsertStepDelta({ stepName, previousStep, nextStep }: UpsertStepDeltaParams): number {
    if (isNil(previousStep)) {
        return utils.sizeof(stepName) + 2 + recursiveSizeof(nextStep)
    }
    return sizeDelta({ previous: previousStep, next: nextStep })
}

function sizeDelta({ previous, next }: SizeDeltaParams): number {
    if (previous === next) {
        return 0
    }
    if (Array.isArray(previous) && Array.isArray(next)) {
        return arraySizeDelta({ previous, next })
    }
    if (isWalkableObject(previous) && isWalkableObject(next)) {
        return objectSizeDelta({ previous, next })
    }
    return recursiveSizeof(next) - recursiveSizeof(previous)
}

function arraySizeDelta({ previous, next }: { previous: unknown[], next: unknown[] }): number {
    const shared = Math.min(previous.length, next.length)
    let delta = 0
    for (let i = 0; i < shared; i++) {
        delta += sizeDelta({ previous: previous[i], next: next[i] })
    }
    for (let i = shared; i < next.length; i++) {
        delta += recursiveSizeof(next[i]) + 1
    }
    for (let i = shared; i < previous.length; i++) {
        delta -= recursiveSizeof(previous[i]) + 1
    }
    return delta
}

function objectSizeDelta({ previous, next }: { previous: Record<string, unknown>, next: Record<string, unknown> }): number {
    const previousEntries = new Map(Object.entries(previous))
    const nextKeys = new Set(Object.keys(next))
    let delta = 0
    for (const [key, child] of Object.entries(next)) {
        if (previousEntries.has(key)) {
            delta += sizeDelta({ previous: previousEntries.get(key), next: child })
        }
        else {
            delta += utils.sizeof(key) + 1 + recursiveSizeof(child) + 1
        }
    }
    for (const [key, child] of previousEntries) {
        if (!nextKeys.has(key)) {
            delta -= utils.sizeof(key) + 1 + recursiveSizeof(child) + 1
        }
    }
    return delta
}

function isWalkableObject(value: unknown): value is Record<string, unknown> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return false
    }
    const isSliceStep = 'outputType' in value && value.outputType === StepOutputType.SLICE && 'output' in value && isSliceRefShape(value.output)
    return !isSliceStep
}

export const sizeofUtils = {
    recursiveSizeof,
    upsertStepDelta,
}

type SizeDeltaParams = {
    previous: unknown
    next: unknown
}

type UpsertStepDeltaParams = {
    stepName: string
    previousStep: unknown
    nextStep: unknown
}
