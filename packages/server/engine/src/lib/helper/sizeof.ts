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
    return upsertStepDeltaFromSize({ stepName, previousSizeBytes: isNil(previousStep) ? undefined : recursiveSizeof(previousStep), nextSizeBytes: recursiveSizeof(nextStep) })
}

function upsertStepDeltaFromSize({ stepName, previousSizeBytes, nextSizeBytes }: UpsertStepDeltaFromSizeParams): number {
    if (isNil(previousSizeBytes)) {
        return utils.sizeof(stepName) + 2 + nextSizeBytes
    }
    return nextSizeBytes - previousSizeBytes
}

export const sizeofUtils = {
    recursiveSizeof,
    upsertStepDelta,
    upsertStepDeltaFromSize,
}

type UpsertStepDeltaParams = {
    stepName: string
    previousStep: unknown
    nextStep: unknown
}

type UpsertStepDeltaFromSizeParams = {
    stepName: string
    previousSizeBytes: number | undefined
    nextSizeBytes: number
}
