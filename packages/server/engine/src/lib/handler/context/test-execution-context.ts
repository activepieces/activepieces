import { formatPieceError, isNil, spreadIfDefined } from '@activepieces/core-utils'
import { LATEST_CONTEXT_VERSION } from '@activepieces/pieces-framework'
import { AiRouterStepOutput, FlowActionType, flowCanvasUtils, flowStructureUtil, FlowTriggerType, FlowVersion, GenericStepOutput, LoopStepOutput, RouterStepOutput, Step, StepOutputStatus } from '@activepieces/shared'
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
        let flowExecutionContext = FlowExecutorContext.empty({
            engineApi: { engineToken, internalApiUrl: apiUrl },
            slicingEnabled: false,
        })
        if (isNil(flowVersion)) {
            return flowExecutionContext
        }
        
        const flowSteps = flowStructureUtil.getAllSteps(flowVersion.trigger)

        for (const step of flowSteps) {
            const { name } = step
            if (name === excludedStepName) {
                continue
            }

            const stepType = step.type
            switch (stepType) {
                case FlowActionType.ROUTER:
                    flowExecutionContext = await flowExecutionContext.upsertStep(
                        step.name,
                        RouterStepOutput.create({
                            input: step.settings,
                            type: stepType,
                            status: StepOutputStatus.SUCCEEDED,
                            ...spreadIfDefined('output', sampleData?.[step.name]),
                        }),
                    )
                    break
                case FlowActionType.AI_ROUTER:
                    flowExecutionContext = await flowExecutionContext.upsertStep(
                        step.name,
                        AiRouterStepOutput.create({
                            input: step.settings,
                            type: stepType,
                            status: StepOutputStatus.SUCCEEDED,
                            ...spreadIfDefined('output', sampleData?.[step.name]),
                        }),
                    )
                    break
                case FlowActionType.LOOP_ON_ITEMS: {
                    const { resolvedInput } = await createPropsResolver({
                        apiUrl,
                        projectId,
                        engineToken,
                        contextVersion: LATEST_CONTEXT_VERSION,
                        stepNames: engineConstants.stepNames,
                    }).resolve<{ items: unknown[] }>({
                        unresolvedInput: step.settings,
                        executionState: flowExecutionContext,
                    })
                    flowExecutionContext = await flowExecutionContext.upsertStep(
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
                case FlowActionType.PIECE:
                case FlowActionType.CODE:
                case FlowTriggerType.EMPTY:
                case FlowTriggerType.PIECE: {
                    const stepOutput = GenericStepOutput.create({
                        input: {},
                        type: stepType,
                        status: StepOutputStatus.SUCCEEDED,
                        ...spreadIfDefined('output', sampleData?.[step.name]),
                    })
                    flowExecutionContext = await flowExecutionContext.upsertStep(step.name, isOnFailureBranchAncestor({ step, excludedStepName })
                        ? stepOutput.setStatus(StepOutputStatus.FAILED).setErrorMessage(PLACEHOLDER_ERROR_MESSAGE)
                        : stepOutput)
                    break
                }
            }
        }
        return flowExecutionContext
    },
}

const PLACEHOLDER_ERROR_MESSAGE = JSON.stringify(formatPieceError('---runtime error message---'))

function isOnFailureBranchAncestor({ step, excludedStepName }: { step: Step, excludedStepName: string | undefined }): boolean {
    return !isNil(excludedStepName) && flowCanvasUtils.getStepBranchRelativeTo(step, excludedStepName) === 'on-failure'
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