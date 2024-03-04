import { ActionType, BranchStepOutput, FlowVersion, GenericStepOutput, LoopStepOutput, StepOutputStatus, TriggerType, flowHelper } from '@activepieces/shared'
import { FlowExecutorContext } from './flow-execution-context'
import { variableService } from '../../services/variable-service'

export const testExecutionContext = {
    async stateFromFlowVersion({ flowVersion, excludedStepName, projectId, workerToken }: {
        flowVersion: FlowVersion
        excludedStepName?: string
        projectId: string
        workerToken: string
    }): Promise<FlowExecutorContext> {
        const flowSteps = flowHelper.getAllSteps(flowVersion.trigger)
        let flowExecutionContext = FlowExecutorContext.empty()

        for (const step of flowSteps) {
            const { name, settings: { inputUiInfo } } = step
            if (name === excludedStepName) {
                continue
            }

            const stepType = step.type
            switch (stepType) {
                case ActionType.BRANCH:
                    flowExecutionContext = flowExecutionContext.upsertStep(step.name, BranchStepOutput.init({
                        input: step.settings,
                    }))
                    break
                case ActionType.LOOP_ON_ITEMS: {
                    const { resolvedInput } = await variableService({
                        projectId,
                        workerToken,
                    }).resolve<{ items: unknown[] }>({
                        unresolvedInput: step.settings,
                        executionState: flowExecutionContext,
                    })
                    flowExecutionContext = flowExecutionContext.upsertStep(step.name, LoopStepOutput.init({
                        input: step.settings,
                    }).setOutput({
                        item: resolvedInput.items[0],
                        index: 1,
                        iterations: [],
                    }))
                    break
                }
                case ActionType.PIECE:
                case ActionType.CODE:
                case TriggerType.EMPTY:
                case TriggerType.PIECE:
                    flowExecutionContext = flowExecutionContext.upsertStep(step.name, GenericStepOutput.create({
                        input: step.settings,
                        type: stepType,
                        status: StepOutputStatus.SUCCEEDED,
                        output: inputUiInfo?.currentSelectedData,
                    }))
                    break
            }
        }
        return flowExecutionContext
    },
}

