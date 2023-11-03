import { ActionType, FlowVersion, StepOutputStatus, TriggerType, flowHelper } from '@activepieces/shared'
import { FlowExecutorContext } from '../handler/context/flow-execution-context'
import { variableService } from '../services/variable-service'

export const testExecution = {
    async stateFromFlowVersion({ flowVersion, excludedStepName, projectId, workerToken }: {
        flowVersion: FlowVersion
        excludedStepName?: string
        projectId: string
        workerToken: string
    }): Promise<FlowExecutorContext> {
        const flowSteps = flowHelper.getAllSteps(flowVersion.trigger)
        let flowExecutionContext = FlowExecutorContext.empty()

        for (const step of flowSteps) {
            const stepsWithSampleData = [
                ActionType.CODE,
                ActionType.PIECE,
                TriggerType.PIECE,
                TriggerType.WEBHOOK,
            ]

            if (stepsWithSampleData.includes(step.type)) {
                const { name, settings: { inputUiInfo } } = step
                if (name === excludedStepName) {
                    continue
                }
                flowExecutionContext = flowExecutionContext.upsertStep(name, {
                    type: step.type,
                    input: {},
                    status: StepOutputStatus.SUCCEEDED,
                    output: inputUiInfo?.currentSelectedData,
                })
            }

            if (step.type === ActionType.LOOP_ON_ITEMS) {

                const { resolvedInput } = await variableService({
                    projectId,
                    workerToken,
                }).resolve<{ items: unknown[] }>({
                    unresolvedInput: step.settings,
                    executionState: flowExecutionContext,
                })
                flowExecutionContext = flowExecutionContext.upsertStep(step.name, {
                    type: step.type,
                    input: resolvedInput,
                    status: StepOutputStatus.SUCCEEDED,
                    output: {
                        index: 1,
                        item: resolvedInput.items[0],
                    },
                })
            }
        }
        return flowExecutionContext
    },
}

