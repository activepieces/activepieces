import {
    ActionType,
    flowStructureUtil,
    FlowVersion,
    GenericStepOutput,
    LoopStepOutput,
    RouterStepOutput,
    spreadIfDefined,
    StepOutputStatus,
    TriggerType,
} from '@activepieces/shared'
import { createPropsResolver } from '../../variables/props-resolver'
import { FlowExecutorContext } from './flow-execution-context'

export const testExecutionContext = {
    async stateFromFlowVersion({
        flowVersion,
        excludedStepName,
        projectId,
        engineToken,
        apiUrl,
        sampleData,
    }: TestExecutionParams): Promise<FlowExecutorContext> {
        const flowSteps = flowStructureUtil.getAllSteps(flowVersion.trigger)
        let flowExecutionContext = FlowExecutorContext.empty()

        for (const step of flowSteps) {
            const { name } = step
            if (name === excludedStepName) {
                continue
            }

            const stepType = step.type
            switch (stepType) {
                case ActionType.ROUTER:
                    flowExecutionContext = flowExecutionContext.upsertStep(
                        step.name,
                        RouterStepOutput.create({
                            input: step.settings,
                            type: stepType,
                            status: StepOutputStatus.SUCCEEDED,
                            ...spreadIfDefined('output', sampleData?.[step.name]),
                        }),
                    )
                    break
                case ActionType.LOOP_ON_ITEMS: {
                    const { resolvedInput } = await createPropsResolver({
                        apiUrl,
                        projectId,
                        engineToken,
                    }).resolve<{ items: unknown[] }>({
                        unresolvedInput: step.settings,
                        executionState: flowExecutionContext,
                    })
                    flowExecutionContext = flowExecutionContext.upsertStep(
                        step.name,
                        LoopStepOutput.init({
                            input: step.settings,
                        }).setOutput({
                            item: resolvedInput.items[0],
                            index: 1,
                            iterations: [],
                        }),
                    )
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
                        ...spreadIfDefined('output', sampleData?.[step.name]),
                    }))
                    break
            }
        }
        return flowExecutionContext
    },
}


type TestExecutionParams = {
    flowVersion: FlowVersion
    excludedStepName?: string
    projectId: string
    apiUrl: string
    engineToken: string
    sampleData?: Record<string, unknown>
}