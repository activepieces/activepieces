import { ActionType, ExecutionState, FlowVersion, TriggerType, flowHelper } from '@activepieces/shared'
import { VariableService } from '../services/variable-service'

const variableService = new VariableService()

export const testExecution = {
    async stateFromFlowVersion({ flowVersion }: FromFlowVersionParams): Promise<ExecutionState> {
        const testContext = await contextFromFlowVersion({
            flowVersion,
        })

        return stateFromContext({
            context: testContext,
        })
    },
}

const contextFromFlowVersion = async ({ flowVersion }: FromFlowVersionParams): Promise<TestExecutionContext> => {
    const flowSteps = flowHelper.getAllSteps(flowVersion.trigger)
    const testContext: TestExecutionContext = {}

    for (const step of flowSteps) {
        const stepsWithSampleData = [
            ActionType.CODE,
            ActionType.PIECE,
            TriggerType.PIECE,
            TriggerType.WEBHOOK,
        ]

        if (stepsWithSampleData.includes(step.type)) {
            const { name, settings: { inputUiInfo } } = step
            testContext[name] = inputUiInfo?.currentSelectedData
        }

        if (step.type === ActionType.LOOP_ON_ITEMS) {
            const executionState = stateFromContext({
                context: testContext,
            })

            const resolvedLoopOutput: { items: unknown[] } = await variableService.resolve({
                unresolvedInput: step.settings,
                executionState,
                logs: false,
            })

            testContext[step.name] = {
                index: 1,
                item: resolvedLoopOutput.items[0],
            }
        }
    }

    return testContext
}

const stateFromContext = ({ context }: StateFromContextParams): ExecutionState => {
    const state = new ExecutionState()

    for (const [stepName, stepOutput] of Object.entries(context)) {
        state.updateLastStep(stepOutput, stepName)
    }

    return state
}

type TestExecutionContext = Record<string, unknown>

type StateFromContextParams = {
    context: TestExecutionContext
}

type FromFlowVersionParams = {
    flowVersion: FlowVersion
}
