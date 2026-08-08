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
    const nextSize = recursiveSizeof(nextStep)
    if (isNil(previousStep)) {
        return utils.sizeof(stepName) + 2 + nextSize
    }
    return nextSize - recursiveSizeof(previousStep)
}

export const sizeofUtils = {
    recursiveSizeof,
    upsertStepDelta,
}

type UpsertStepDeltaParams = {
    stepName: string
    previousStep: unknown
    nextStep: unknown
}
