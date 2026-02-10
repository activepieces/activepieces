import { FlowActionType, StepOutput } from '@activepieces/shared'
import PriorityQueue from 'priority-queue-typescript'
import { utils } from '../utils'

const TRUNCATION_TEXT_PLACEHOLDER = '(truncated)'
const ERROR_OFFSET = 256 * 1024
const DEFAULT_MAX_LOG_SIZE_FOR_TESTING = '10'
const MAX_LOG_SIZE = Number(process.env.AP_MAX_FLOW_RUN_LOG_SIZE_MB ?? DEFAULT_MAX_LOG_SIZE_FOR_TESTING) * 1024 * 1024
const MAX_SIZE_FOR_ALL_ENTRIES = MAX_LOG_SIZE - ERROR_OFFSET
const SIZE_OF_TRUNCATION_TEXT_PLACEHOLDER = utils.sizeof(TRUNCATION_TEXT_PLACEHOLDER)

type InputKeyEntry = {
    step: StepOutput
    stepName: string
    inputKey: string
    size: number
}

export const loggingUtils = {
    trimExecutionInput(steps: Record<string, StepOutput>, maxSize: number = MAX_SIZE_FOR_ALL_ENTRIES): Record<string, StepOutput> {
        const totalJsonSize = getTotalStepsSize(steps)

        if (!jsonExceedMaxSize(totalJsonSize, maxSize)) {
            return steps
        }

        const priorityQueue = new PriorityQueue<InputKeyEntry>(
            undefined,
            (a: InputKeyEntry, b: InputKeyEntry) => a.size - b.size,
        )
        traverseStepsAndCollectKeys(steps, priorityQueue)

        // calculate minimalSize: replace all input sizes with placeholder sizes . after that we will re-replace them with actual sizes from smallest until we exceed the limit.
        let minimalSize = getStepsSizeWithAllInputsTruncated(totalJsonSize, priorityQueue)

        // pop smallest entries from queue, accumulating their sizes until we exceed the limit
        // The keys that remain in the queue after popping are the ones we need to truncate
        const keysToRemove = new Set<InputKeyEntry>()
        while (priorityQueue.size() > 0) {
            const entry = priorityQueue.poll()!
            
            minimalSize += entry.size - SIZE_OF_TRUNCATION_TEXT_PLACEHOLDER

            // if minimalSize exceeds the limit, stop popping
            // the remaining keys in the queue and current one will be truncated
            if (minimalSize > maxSize) {
                keysToRemove.add(entry) 
                break
            }
        }

        while (priorityQueue.size() > 0) {
            const entry = priorityQueue.poll()!
            keysToRemove.add(entry)
        }
        
        removeKeysFromSteps(keysToRemove)

        return steps
    },
}

function getTotalStepsSize(steps: Record<string, StepOutput>): number {
    return utils.sizeof(steps)
}

function traverseStepsAndCollectKeys(
    steps: Record<string, StepOutput>,
    priorityQueue: PriorityQueue<InputKeyEntry>,
): void {
    for (const [stepName, step] of Object.entries(steps)) {
        if (step?.input) {
            const input = step.input as Record<string, unknown>
            for (const [inputKey, value] of Object.entries(input)) {
                const valueSize = utils.sizeof(value)
                priorityQueue.add({
                    step,
                    stepName,
                    inputKey,
                    size: valueSize,
                })
            }
        }

        if (step?.type === FlowActionType.LOOP_ON_ITEMS && step.output) {
            const loopOutput = step.output as { iterations: Record<string, StepOutput>[] }
            if (loopOutput.iterations) {
                for (const iteration of loopOutput.iterations) {
                    traverseStepsAndCollectKeys(iteration, priorityQueue)
                }
            }
        }
    }
}

function removeKeysFromSteps(
    keysToRemove: Set<InputKeyEntry>,
): void {
    for (const entry of keysToRemove) {
        if (entry.step?.input) {
            const input = entry.step.input as Record<string, unknown>
            input[entry.inputKey] = TRUNCATION_TEXT_PLACEHOLDER
        }
    }
}

const getStepsSizeWithAllInputsTruncated = (totalSize: number, priorityQueue: PriorityQueue<InputKeyEntry> ): number => {
    let size = totalSize
    for (const entry of priorityQueue) {
        size = size - entry.size + SIZE_OF_TRUNCATION_TEXT_PLACEHOLDER
    }
    return size
}

const jsonExceedMaxSize = (jsonSize: number, maxSize: number): boolean => {
    return jsonSize > maxSize
}
