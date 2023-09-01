import { ActionType, ExecutionOutput, FlowVersion, LoopOnItemsStepOutput, StepOutput, applyFunctionToValues, isString } from "@activepieces/shared";
import sizeof from "object-sizeof";
import { compressMemoryFileString, handleAPFile, isApFilePath, isMemoryFilePath } from "../services/files.service";

const TRIM_SIZE_BYTE = 512 * 1024;

export const loggerUtils = {
    async trimExecution(executionState: ExecutionOutput) {
        const steps = executionState.executionState.steps;
        for (const stepName in steps) {
            const stepOutput = steps[stepName];
            steps[stepName] = await trimStepOuput(stepOutput);
        }
        return executionState;
    }
}

async function trimStepOuput(stepOutput: StepOutput): Promise<StepOutput> {
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

const trim = async (obj: any) => {
    if (isMemoryFilePath(obj)) {
        return await compressMemoryFileString(obj);
    }
    const size = sizeof(obj);
    if (size > TRIM_SIZE_BYTE) {
        return '(truncated)';
    }
    return obj;
};
