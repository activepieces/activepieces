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
            clonedSteps[stepName] = await trimStepOutput(stepOutput)
        }
        // TThe above code could trim data in different steps, but their total size could still be too big
        return trimStepsUntilSizeLimit(clonedSteps)
    },
}


async function trimStepOutput(stepOutput: StepOutput): Promise<StepOutput> {
    const modified: StepOutput = JSON.parse(JSON.stringify(stepOutput))
    modified.input = await applyFunctionToValues(modified.input, trim)
    switch (modified.type) {
        case ActionType.BRANCH:
        case TriggerType.EMPTY:
        case TriggerType.PIECE:
        case ActionType.CODE:
        case ActionType.PIECE:
            modified.output = await applyFunctionToValues(modified.output, trim)
            break
        case ActionType.LOOP_ON_ITEMS: {
            const loopItem = modified.output
            if (loopItem) {
                const newIterations = [];
                for (const iteration of loopItem.iterations) {
                    const trimmedIteration = await loggingUtils.trimExecution(iteration);
                    newIterations.push(trimmedIteration);
                }
                loopItem.item = await applyFunctionToValues(loopItem.item, trim)
            }
            break
        }
    }
    modified.errorMessage = await applyFunctionToValues(modified.errorMessage, trim)
    return modified
}

async function trimStepsUntilSizeLimit(steps: Record<string, StepOutput>): Promise<Record<string, StepOutput>> {
    const clonedSteps = { ...steps }
    const entries = Object.entries(steps).sort(bySizeDesc)
    let i = 0
    while (i < entries.length && sizeof(clonedSteps) > MAX_SINGLE_SIZE_FOR_SINGLE_ENTRY) {
        const [stepName, stepOutput] = entries[i]
        clonedSteps[stepName] = await emptyStepOutputAndPreserveStructure(stepOutput)
        i += 1
    }
    return clonedSteps
}

async function emptyStepOutputAndPreserveStructure(stepOutput: StepOutput): Promise<StepOutput> {
    const modified: StepOutput = JSON.parse(JSON.stringify(stepOutput))
    modified.input = TRUNCATION_TEXT_PLACEHOLDER
    switch (modified.type) {
        case ActionType.BRANCH:
        case TriggerType.EMPTY:
        case TriggerType.PIECE:
        case ActionType.CODE:
        case ActionType.PIECE:
            modified.output = TRUNCATION_TEXT_PLACEHOLDER
            break
        case ActionType.LOOP_ON_ITEMS: {
            const loopItem = modified.output
            if (loopItem) {
                const newIterations = [];
                for (const iteration of loopItem.iterations) {
                    const newTrimmedIteration: Record<string, StepOutput> = {}
                    for (const key in iteration) {
                        newTrimmedIteration[key] = await emptyStepOutputAndPreserveStructure(iteration[key])
                    }
                    newIterations.push(newTrimmedIteration);
                }
                loopItem.item = TRUNCATION_TEXT_PLACEHOLDER

            }
            break
        }
    }
    modified.errorMessage = TRUNCATION_TEXT_PLACEHOLDER
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
