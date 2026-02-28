import { LATEST_CONTEXT_VERSION } from '@activepieces/pieces-framework'
import {
    FlowActionKind,
    flowStructureUtil,
    FlowTriggerKind,
    FlowVersion,
    GenericStepOutput,
    isNil,
    LoopStepOutput,
    RouterStepOutput,
    spreadIfDefined,
    StepOutputStatus,
} from '@activepieces/shared'
import { createPropsResolver } from '../../variables/props-resolver'
import { EngineConstants } from './engine-constants'
import { FlowExecutorContext } from './flow-execution-context'

export const testExecutionContext = {
    async stateFromFlowVersion({
        flowVersion,
        excludedStepName,
        projectId,
        engineToken,
        apiUrl,
        sampleData,
        engineConstants,
    }: TestExecutionParams): Promise<FlowExecutorContext> {
        let flowExecutionContext = FlowExecutorContext.empty()
        if (isNil(flowVersion)) {
            return flowExecutionContext
        }

        const flowSteps = flowStructureUtil.getAllSteps(flowVersion)

        for (const step of flowSteps) {
            const stepName = step.id
            if (stepName === excludedStepName) {
                continue
            }

            const stepKind = step.data.kind
            switch (stepKind) {
                case FlowActionKind.ROUTER:
                    flowExecutionContext = flowExecutionContext.upsertStep(
                        stepName,
                        RouterStepOutput.create({
                            input: step.data.settings,
                            type: stepKind,
                            status: StepOutputStatus.SUCCEEDED,
                            ...spreadIfDefined('output', sampleData?.[stepName]),
                        }),
                    )
                    break
                case FlowActionKind.LOOP_ON_ITEMS: {
                    const { resolvedInput } = await createPropsResolver({
                        apiUrl,
                        projectId,
                        engineToken,
                        contextVersion: LATEST_CONTEXT_VERSION,
                        stepNames: engineConstants.stepNames,
                    }).resolve<{ items: unknown[] }>({
                        unresolvedInput: step.data.settings,
                        executionState: flowExecutionContext,
                    })
                    flowExecutionContext = flowExecutionContext.upsertStep(
                        stepName,
                        LoopStepOutput.init({
                            input: step.data.settings,
                        }).setOutput({
                            item: resolvedInput.items[0],
                            index: 1,
                            iterations: [],
                        }),
                    )
                    break
                }
                case FlowActionKind.PIECE:
                case FlowActionKind.CODE:
                case FlowTriggerKind.EMPTY:
                case FlowTriggerKind.PIECE:
                    flowExecutionContext = flowExecutionContext.upsertStep(stepName, GenericStepOutput.create({
                        input: {},
                        type: stepKind,
                        status: StepOutputStatus.SUCCEEDED,
                        ...spreadIfDefined('output', sampleData?.[stepName]),
                    }))
                    break
            }
        }
        return flowExecutionContext
    },
}


type TestExecutionParams = {
    engineConstants: EngineConstants
    flowVersion?: FlowVersion
    excludedStepName?: string
    projectId: string
    apiUrl: string
    engineToken: string
    sampleData?: Record<string, unknown>
}
