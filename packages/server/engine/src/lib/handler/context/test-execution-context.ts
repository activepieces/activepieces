import { LATEST_CONTEXT_VERSION } from '@activepieces/pieces-framework'
import {
    FlowAction,
    FlowActionType,
    flowStructureUtil,
    FlowTrigger,
    FlowTriggerType,
    FlowVersion,
    GenericStepOutput,
    isNil,
    LoopStepOutput,
    RouterStepOutput,
    spreadIfDefined,
    StepOutputStatus,
} from '@activepieces/shared'
import { createPropsResolver, extractReferencedStepNames } from '../../variables/props-resolver'
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
        unresolvedInput,
    }: TestExecutionParams): Promise<FlowExecutorContext> {
        let flowExecutionContext = FlowExecutorContext.empty()
        if (isNil(flowVersion)) {
            return flowExecutionContext
        }

        const flowSteps = flowStructureUtil.getAllSteps(flowVersion.trigger)
        const relevantStepNames = computeRelevantStepNames({
            unresolvedInput,
            flowSteps,
            stepNames: engineConstants.stepNames,
        })

        for (const step of flowSteps) {
            const { name } = step
            if (name === excludedStepName) {
                continue
            }

            const stepType = step.type
            switch (stepType) {
                case FlowActionType.ROUTER:
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
                case FlowActionType.LOOP_ON_ITEMS: {
                    const isRelevantToInput = isNil(relevantStepNames) || relevantStepNames.has(step.name)
                    if (!isRelevantToInput) {
                        // Resolving a loop's settings copies every referenced step
                        // output into the code sandbox — with multi-megabyte sample
                        // data this takes minutes. Skip loops the resolved input
                        // never references (directly or through another loop).
                        flowExecutionContext = flowExecutionContext.upsertStep(
                            step.name,
                            LoopStepOutput.init({
                                input: step.settings,
                            }),
                        )
                        break
                    }
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
                case FlowActionType.PIECE:
                case FlowActionType.CODE:
                case FlowTriggerType.EMPTY:
                case FlowTriggerType.PIECE:
                    flowExecutionContext = flowExecutionContext.upsertStep(step.name, GenericStepOutput.create({
                        input: {},
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

/**
 * Steps whose output can influence resolving `unresolvedInput`: the steps it
 * references textually, expanded transitively through loop settings (a
 * referenced loop's `item` depends on the steps its own settings reference).
 * Returns undefined when no input is provided, meaning "everything is
 * relevant" — callers like single-step test runs keep the old behavior.
 */
function computeRelevantStepNames({ unresolvedInput, flowSteps, stepNames }: ComputeRelevantStepNamesParams): Set<string> | undefined {
    if (isNil(unresolvedInput)) {
        return undefined
    }
    const relevantStepNames = extractReferencedStepNames(unresolvedInput, stepNames)
    const loopSteps = flowSteps.filter((step) => step.type === FlowActionType.LOOP_ON_ITEMS)
    let changed = true
    while (changed) {
        changed = false
        for (const loopStep of loopSteps) {
            if (!relevantStepNames.has(loopStep.name)) {
                continue
            }
            for (const referencedStepName of extractReferencedStepNames(loopStep.settings, stepNames)) {
                if (!relevantStepNames.has(referencedStepName)) {
                    relevantStepNames.add(referencedStepName)
                    changed = true
                }
            }
        }
    }
    return relevantStepNames
}

type ComputeRelevantStepNamesParams = {
    unresolvedInput: unknown
    flowSteps: (FlowAction | FlowTrigger)[]
    stepNames: string[]
}

type TestExecutionParams = {
    engineConstants: EngineConstants
    flowVersion?: FlowVersion
    excludedStepName?: string
    projectId: string
    apiUrl: string
    engineToken: string
    sampleData?: Record<string, unknown>
    unresolvedInput?: unknown
}