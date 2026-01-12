import { isObject, StepOutput } from '@activepieces/shared'
import { getPathKey } from '../handler/context/flow-execution-context'
import { StepExecutionPath } from '../handler/context/step-execution-path'
import { utils } from '../utils'

const TRUNCATION_TEXT_PLACEHOLDER = '(truncated)'
const ERROR_OFFSET = 256 * 1024
const DEFAULT_MAX_LOG_SIZE_FOR_TESTING = '10'
const MAX_LOG_SIZE = Number(process.env.AP_MAX_FILE_SIZE_MB ?? DEFAULT_MAX_LOG_SIZE_FOR_TESTING)
const MAX_SIZE_FOR_ALL_ENTRIES = MAX_LOG_SIZE - ERROR_OFFSET
const SIZE_OF_TRUNCATION_TEXT_PLACEHOLDER = utils.sizeof(TRUNCATION_TEXT_PLACEHOLDER)
const nonTruncatableKeys = ['status', 'duration', 'type']

type TrimResponse = {
    steps: Record<string, StepOutput>
    stepsSize: Map<string, number>
}

export const loggingUtils = {
    trimExecutionInput(steps: Record<string, StepOutput>, stepsSize: Map<string, number>, path: StepExecutionPath['path']): TrimResponse {
        const totalJsonSize = getTotalStepsSize(stepsSize)
        if (!jsonExceedMaxSize(totalJsonSize)) {
            return { steps, stepsSize }
        }

        const descendingSortedSteps = Array.from(stepsSize.entries()).sort((a, b) => b[1] - a[1]).map(([key]) => key)
        return trimStepInputs(steps, descendingSortedSteps, stepsSize, path)
    },
}

function getTotalStepsSize(stepsSize: Map<string, number>): number {
    return Array.from(stepsSize.values()).reduce((acc, size) => acc + size, 0)
}

function trimStepInputs(
    steps: Record<string, StepOutput>,
    descendingSortedSteps: string[],
    stepsSize: Map<string, number>,
    path: StepExecutionPath['path'],
): TrimResponse {
    let totalSize = getTotalStepsSize(stepsSize)

    for (const pathKey of descendingSortedSteps) {
        if (!jsonExceedMaxSize(totalSize)) {
            break
        }

        const stepName = pathKey.split('.')[0]
        const step = steps[stepName]
        if (step?.input) {
            const inputBefore = step.input
            const stepSize = utils.sizeof(step)
            let truncateResult: { input: unknown, newTotalSize: number, newStepSize: number } | null = null

            if (isObject(inputBefore)) {
                truncateResult = truncateObject(inputBefore, totalSize, stepSize)
            }
            else if (Array.isArray(inputBefore)) {
                truncateResult = truncateArray(inputBefore, totalSize, stepSize)
            }
            else if (typeof inputBefore === 'string') {
                truncateResult = truncateString(inputBefore, totalSize, stepSize)
            }

            if (truncateResult) {
                step.input = truncateResult.input
                totalSize = truncateResult.newTotalSize

                stepsSize.set(getPathKey(stepName, path), truncateResult.newStepSize)
            }
        }
    }

    return { steps, stepsSize }
}

type TruncateResponse<T> = {
    input: T
    newTotalSize: number
    newStepSize: number
}

type TruncateHelper<T> = (input: T, totalSize: number, stepSize: number) => TruncateResponse<T>

const truncateObject: TruncateHelper<Record<string, unknown>> = (json, totalSize, stepSize) => {
    const entries = Object.entries(json)
    const descendingSortedEntries = entries.sort((a, b) => utils.sizeof(b[1]) - utils.sizeof(a[1]))

    let newTotalSize = totalSize
    let newStepSize = stepSize

    for (const [key, value] of descendingSortedEntries) {
       
        if (!jsonExceedMaxSize(newTotalSize) || nonTruncatableKeys.includes(key)) {
            break
        }

        json[key] = TRUNCATION_TEXT_PLACEHOLDER

        const delta = SIZE_OF_TRUNCATION_TEXT_PLACEHOLDER - utils.sizeof(value)
        newTotalSize += delta
        newStepSize += delta
    }

    return { input: json as Record<string, StepOutput>, newTotalSize, newStepSize }
}

const truncateArray: TruncateHelper<unknown[]> = (array, totalSize, stepSize) => {
    const children = array.map((value) => utils.sizeof(value))
    const descendingSortedChildren = children.map((size, index) => ({ size, index })).sort((a, b) => b.size - a.size).map(({ index }) => index)
    let newTotalSize = totalSize
    let newStepSize = stepSize

    for (const index of descendingSortedChildren) {
        if (!jsonExceedMaxSize(newTotalSize)) {
            break
        }
        array[index] = TRUNCATION_TEXT_PLACEHOLDER
        newTotalSize += SIZE_OF_TRUNCATION_TEXT_PLACEHOLDER - children[index]
        newStepSize += SIZE_OF_TRUNCATION_TEXT_PLACEHOLDER - children[index]
    }
    return { input: array as unknown[], newTotalSize, newStepSize }
}

const truncateString: TruncateHelper<string> = (string, totalSize, stepSize) => {
    if (string.length > 10) {
        const truncatedString = string.substring(0, 10) + TRUNCATION_TEXT_PLACEHOLDER
        const delta = utils.sizeof(truncatedString) - utils.sizeof(string)
        return { input: truncatedString, newTotalSize: totalSize + delta, newStepSize: stepSize + delta }
    }
    return { input: string, newTotalSize: totalSize, newStepSize: stepSize }
}

const jsonExceedMaxSize = (jsonSize: number): boolean => {
    return jsonSize > MAX_SIZE_FOR_ALL_ENTRIES
}
