import { FlowActionType, GenericStepOutput, ProcessInBatchesAction, StepOutputStatus } from '@activepieces/shared'
import { BaseExecutor, failStep } from './base-executor'

export const processInBatchesExecutor: BaseExecutor<ProcessInBatchesAction> = {
    async handle({ action, executionState }) {
        return failStep({
            action,
            executionState,
            stepOutput: GenericStepOutput.create({
                input: {},
                type: FlowActionType.PROCESS_IN_BATCHES,
                status: StepOutputStatus.FAILED,
                output: undefined,
            }),
            error: 'Process in Batches cannot run yet on this version.',
        })
    },
}
