import { ActionType, ExecutionOutput, LoopOnItemsStepOutput, StepOutput, applyFunctionToValues } from "@activepieces/shared";
import sizeof from "object-sizeof";
import { isMemoryFilePath } from "../services/files.service";

const TRIM_SIZE_BYTE = 512 * 1024;
const TRUNCATION_TEXT_PLACEHOLDER = '(truncated)'

export const loggerUtils = {
    async trimExecution(executionState: ExecutionOutput) {
        const steps = executionState.executionState.steps;
        for (const stepName in steps) {
            const stepOutput = steps[stepName];
            steps[stepName] = await trimStepOutput(stepOutput);
        }
        return executionState;
    }
}

async function trimStepOutput(stepOutput: StepOutput): Promise<StepOutput> {
    const modified: StepOutput = JSON.parse(JSON.stringify(stepOutput));
    modified.input = await applyFunctionToValues(modified.input, trim);
    switch (modified.type) {
        case ActionType.BRANCH:
            break;
        case ActionType.CODE:
        case ActionType.PIECE:
            modified.output = await applyFunctionToValues(modified.output, trim);
            break;
        case ActionType.LOOP_ON_ITEMS: {
            const loopItem = (modified as LoopOnItemsStepOutput).output;
            if (loopItem) {
                loopItem.iterations = await applyFunctionToValues(loopItem.iterations, trim);
                loopItem.item = await applyFunctionToValues(loopItem.item, trim);
            }
            break;
        }
    }
    modified.standardOutput = await applyFunctionToValues(modified.standardOutput, trim);
    modified.errorMessage = await applyFunctionToValues(modified.errorMessage, trim);
    return modified;
}

const trim = async (obj: unknown) => {
    if (isMemoryFilePath(obj)) {
        return TRUNCATION_TEXT_PLACEHOLDER
    }

    if (objectExceedMaxSize(obj) && isObject(obj)) {
        const objectEntries = Object.entries(obj).sort(bySizeDesc)
        let i = 0

        while (i < objectEntries.length && objectEntriesExceedMaxSize(objectEntries)) {
            objectEntries[i][1] = TRUNCATION_TEXT_PLACEHOLDER
            i += 1
        }

        obj = Object.fromEntries(objectEntries)
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
    return sizeof(obj) > TRIM_SIZE_BYTE
}

const isObject = (obj: unknown): obj is Record<string, unknown> => {
    return typeof obj === 'object' && !Array.isArray(obj) && obj !== null
}

const bySizeDesc = (a: [string, unknown], b: [string, unknown]): number => {
    return sizeof(b[1]) - sizeof(a[1])
}
