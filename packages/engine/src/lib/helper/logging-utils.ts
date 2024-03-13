import { ActionType, StepOutput, TriggerType, applyFunctionToValues } from '@activepieces/shared'
import sizeof from 'object-sizeof'
import { isMemoryFilePath } from '../services/files.service'

const TRUNCATION_TEXT_PLACEHOLDER = '(truncated)'
const MAX_SINGLE_SIZE_FOR_SINGLE_ENTRY = 1024 * 1024

export const loggingUtils = {
    async trimExecution(steps: Record<string, StepOutput>): Promise<Record<string, StepOutput>> {
        const clonedSteps = { ...steps }
        for (const stepName in steps) {
            const stepOutput = steps[stepName]
            clonedSteps[stepName] = await trimStepOutput(stepOutput, 'trim')
        }
        // The above code could trim data in different steps, but their total size could still be too large.
        return emptyStepsUntilSizeLimit(clonedSteps)
    },
}

async function trimStepOutput(stepOutput: StepOutput, mode: 'trim' | 'empty'): Promise<StepOutput> {
    const modified: StepOutput = JSON.parse(JSON.stringify(stepOutput))
    modified.input = await trimOrEmpty(mode, modified.input)
    switch (modified.type) {
        case ActionType.BRANCH:
        case TriggerType.EMPTY:
        case TriggerType.PIECE:
        case ActionType.CODE:
        case ActionType.PIECE:
            modified.output = await trimOrEmpty(mode, modified.output)
            break
        case ActionType.LOOP_ON_ITEMS: {
            const loopItem = modified.output
            if (loopItem) {
                loopItem.iterations = await trimIterations(loopItem.iterations, mode)
                loopItem.item = await applyFunctionToValues(loopItem.item, trim)
            }
            break
        }
    }
    modified.errorMessage = await trimOrEmpty(mode, modified.errorMessage)
    return modified
}

async function trimOrEmpty(mode: 'trim' | 'empty', output: unknown): Promise<unknown> {
    switch (mode) {
        case 'trim':
            return applyFunctionToValues(output, trim)
        case 'empty':
            return TRUNCATION_TEXT_PLACEHOLDER
    }
}

async function trimIterations(iterations: Record<string, StepOutput>[], mode: 'trim' | 'empty'): Promise<Record<string, StepOutput>[]> {
    const newIterations = []
    for (const iteration of iterations) {
        let trimmedIteration: Record<string, StepOutput> = {}
        switch (mode) {
            case 'empty':
                for (const key in iteration) {
                    trimmedIteration[key] = await trimStepOutput(iteration[key], mode)
                }
                break
            case 'trim':
                trimmedIteration = await loggingUtils.trimExecution(iteration)
                break
        }
        newIterations.push(trimmedIteration)
    }
    return newIterations
}


async function emptyStepsUntilSizeLimit(steps: Record<string, StepOutput>): Promise<Record<string, StepOutput>> {
    const clonedSteps = { ...steps }
    const entries = Object.entries(steps).sort(bySizeDesc)
    let i = 0
    while (i < entries.length && sizeof(clonedSteps) > MAX_SINGLE_SIZE_FOR_SINGLE_ENTRY) {
        const [stepName, stepOutput] = entries[i]
        clonedSteps[stepName] = await trimStepOutput(stepOutput, 'empty')
        i += 1
    }
    return clonedSteps
}

const trim = async (obj: unknown): Promise<unknown> => {
    if (isMemoryFilePath(obj)) {
        return TRUNCATION_TEXT_PLACEHOLDER
    }

    if (objectExceedMaxSize(obj) && isObject(obj)) {
        const objectEntries = Object.entries(obj).sort(bySizeDesc)
        let i = 0

        while (i < objectEntries.length && objectEntriesExceedMaxSize(objectEntries)) {
            const key = objectEntries[i][0]
            obj[key] = TRUNCATION_TEXT_PLACEHOLDER
            i += 1
        }
    }

    if (!objectExceedMaxSize(obj)) {
        return obj
    }

    return TRUNCATION_TEXT_PLACEHOLDER
}

const objectEntriesExceedMaxSize = (objectEntries: [string, unknown][]): boolean => {
    const obj = Object.fromEntries(objectEntries)
    return objectExceedMaxSize(obj)
}

const objectExceedMaxSize = (obj: unknown): boolean => {
    return sizeof(obj) > MAX_SINGLE_SIZE_FOR_SINGLE_ENTRY
}

const isObject = (obj: unknown): obj is Record<string, unknown> => {
    return typeof obj === 'object' && !Array.isArray(obj) && obj !== null
}

const bySizeDesc = (a: [string, unknown], b: [string, unknown]): number => {
    return sizeof(b[1]) - sizeof(a[1])
}
