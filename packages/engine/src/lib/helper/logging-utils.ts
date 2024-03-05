import { ActionType, StepOutput, TriggerType, applyFunctionToValues } from '@activepieces/shared'
import sizeof from 'object-sizeof'
import { isMemoryFilePath } from '../services/files.service'

const TRUNCATION_TEXT_PLACEHOLDER = '(truncated)'
const MAX_SINGLE_SIZE_FOR_SINGLE_ENTRY = 512 * 1024

export const loggingUtils = {
    async trimExecution(steps: Record<string, StepOutput>): Promise<Record<string, StepOutput>> {
        const clonedSteps = { ...steps }
        for (const stepName in steps) {
            const stepOutput = steps[stepName]
            clonedSteps[stepName] = await trimStepOutput(stepOutput)
        }
        return clonedSteps
    },
}

async function trimStepOutput(stepOutput: StepOutput): Promise<StepOutput> {
    const modified: StepOutput = JSON.parse(JSON.stringify(stepOutput))
    modified.input = await applyFunctionToValues(modified.input, trim)
    switch (modified.type) {
        case ActionType.BRANCH:
        case TriggerType.EMPTY:
        case TriggerType.PIECE:
            modified.output = await applyFunctionToValues(modified.output, trim)
            break
        case ActionType.LOOP_ON_ITEMS: {
            const loopItem = modified.output
            if (loopItem) {
                loopItem.iterations = await applyFunctionToValues(loopItem.iterations, trim)
                loopItem.item = await applyFunctionToValues(loopItem.item, trim)
            }
            break
        }
        case ActionType.CODE:
        case ActionType.PIECE:
    }
    modified.errorMessage = await applyFunctionToValues(modified.errorMessage, trim)
    return modified
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
