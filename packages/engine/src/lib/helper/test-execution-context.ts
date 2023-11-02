import { ActionType, FlowVersion, StepOutput, StepOutputStatus, TriggerType, flowHelper } from '@activepieces/shared'
import { FlowExecutorContext } from '../handler/context/flow-execution-context'

export const testExecution = {
    async stateFromFlowVersion({ flowVersion }: {
        flowVersion: FlowVersion
    }): Promise<FlowExecutorContext> {
        const testContext = await contextFromFlowVersion({
            flowVersion,
        })

        let flowExecutionContext = FlowExecutorContext.empty()
        for (const [key, value] of Object.entries(testContext)) {
            flowExecutionContext = flowExecutionContext.upsertStep(key, value)
        }
        return flowExecutionContext
    },
}

const contextFromFlowVersion = async ({ flowVersion }: {
    flowVersion: FlowVersion
}): Promise<Record<string, StepOutput>> => {
    const flowSteps = flowHelper.getAllSteps(flowVersion.trigger)
    const testContext: Record<string, StepOutput> = {}

    for (const step of flowSteps) {
        const stepsWithSampleData = [
            ActionType.CODE,
            ActionType.PIECE,
            TriggerType.PIECE,
            TriggerType.WEBHOOK,
        ]

        if (stepsWithSampleData.includes(step.type)) {
            const { name, settings: { inputUiInfo } } = step
            testContext[name] = {
                type: step.type,
                input: {},
                status: StepOutputStatus.SUCCEEDED,
                output: inputUiInfo?.currentSelectedData,
            }
        }

        if (step.type === ActionType.LOOP_ON_ITEMS) {
            // TODO FIX
            /*const executionState = stateFromContext({
                context: testContext,
            })

            const resolvedLoopOutput: { items: unknown[] } = await variableService.resolveOld({
                unresolvedInput: step.settings,
                executionState,
                logs: false,
            })

            testContext[step.name] = {
                type: ActionType.LOOP_ON_ITEMS,
                input: {},
                status: StepOutputStatus.SUCCEEDED,
                output: {
                    index: 1,
                    item: resolvedLoopOutput.items[0],
                },
            }*/
        }
    }

    return testContext
}
