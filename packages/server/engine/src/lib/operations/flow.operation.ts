import {
    BeginExecuteFlowOperation,
    EngineResponse,
    EngineResponseStatus,
    ExecuteFlowOperation,
    ExecuteTriggerResponse,
    ExecutionType,
    FlowActionKind,
    flowStructureUtil,
    GenericStepOutput,
    isNil,
    LoopStepOutput,
    StepOutput,
    StepOutputStatus,
    TriggerHookType,
    TriggerPayload,
} from '@activepieces/shared'
import { EngineConstants } from '../handler/context/engine-constants'
import { FlowExecutorContext } from '../handler/context/flow-execution-context'
import { testExecutionContext } from '../handler/context/test-execution-context'
import { flowExecutor } from '../handler/flow-executor'
import { triggerHelper } from '../helper/trigger-helper'
import { progressService } from '../services/progress.service'

export const flowOperation = {
    execute: async (operation: ExecuteFlowOperation): Promise<EngineResponse<undefined>> => {
        const input = operation as ExecuteFlowOperation
        const constants = EngineConstants.fromExecuteFlowInput(input)
        const output: FlowExecutorContext = (await executieSingleStepOrFlowOperation(input)).finishExecution()
        console.log('[FlowOperation] Flow execution finished, calling explicit final backup')
        await progressService.backup({
            engineConstants: constants,
            flowExecutorContext: output,
        })
        console.log('[FlowOperation] Explicit final backup completed')
        return {
            status: EngineResponseStatus.OK,
            response: undefined,
            delayInSeconds: output.getDelayedInSeconds(),
        }
    },
}

const executieSingleStepOrFlowOperation = async (input: ExecuteFlowOperation): Promise<FlowExecutorContext> => {
    const constants = EngineConstants.fromExecuteFlowInput(input)
    const testSingleStepMode = !isNil(constants.stepNameToTest)
    if (testSingleStepMode) {
        const testContext = await testExecutionContext.stateFromFlowVersion({
            apiUrl: input.internalApiUrl,
            flowVersion: input.flowVersion,
            excludedStepName: input.stepNameToTest!,
            projectId: input.projectId,
            engineToken: input.engineToken,
            sampleData: input.sampleData,
            engineConstants: constants,
        })
        flowStructureUtil.getActionOrThrow(input.stepNameToTest!, input.flowVersion)
        return flowExecutor.execute({
            stepNames: [input.stepNameToTest!],
            executionState: await getFlowExecutionState(input, testContext),
            constants,
        })
    }
    return flowExecutor.executeFromTrigger({
        executionState: await getFlowExecutionState(input, FlowExecutorContext.empty()),
        constants,
        input,
    })
}

async function getFlowExecutionState(input: ExecuteFlowOperation, flowContext: FlowExecutorContext): Promise<FlowExecutorContext> {
    switch (input.executionType) {
        case ExecutionType.BEGIN: {
            const newPayload = await runOrReturnPayload(input)
            const triggerNode = flowStructureUtil.getTriggerNode(input.flowVersion.graph)!
            flowContext = flowContext.upsertStep(triggerNode.id, GenericStepOutput.create({
                type: triggerNode.data.kind,
                status: StepOutputStatus.SUCCEEDED,
                input: {},
            }).setOutput(newPayload))
            break
        }
        case ExecutionType.RESUME: {
            flowContext = flowContext.addTags(input.executionState.tags)
            break
        }
    }

    for (const [step, output] of Object.entries(input.executionState.steps)) {
        if ([StepOutputStatus.SUCCEEDED, StepOutputStatus.PAUSED].includes(output.status)) {
            const newOutput = await insertSuccessStepsOrPausedRecursively(output)
            if (!isNil(newOutput)) {
                flowContext = flowContext.upsertStep(step, newOutput)
            }
        }
    }
    return flowContext
}

async function runOrReturnPayload(input: BeginExecuteFlowOperation): Promise<TriggerPayload> {
    if (!input.executeTrigger) {
        return input.triggerPayload as TriggerPayload
    }
    const newPayload = await triggerHelper.executeTrigger({
        params: {
            ...input,
            hookType: TriggerHookType.RUN,
            test: false,
            webhookUrl: '',
            triggerPayload: input.triggerPayload as TriggerPayload,
        },
        constants: EngineConstants.fromExecuteFlowInput(input),
    }) as ExecuteTriggerResponse<TriggerHookType.RUN>
    return newPayload.output[0] as TriggerPayload
}


async function insertSuccessStepsOrPausedRecursively(stepOutput: StepOutput): Promise<StepOutput | null> {
    if (![StepOutputStatus.SUCCEEDED, StepOutputStatus.PAUSED].includes(stepOutput.status)) {
        return null
    }
    if (stepOutput.type === FlowActionKind.LOOP_ON_ITEMS) {
        const loopOutput = new LoopStepOutput(stepOutput)
        const iterations = loopOutput.output?.iterations ?? []
        const newIterations: Record<string, StepOutput>[] = []
        for (const iteration of iterations) {
            const newSteps: Record<string, StepOutput> = {}
            for (const [step, output] of Object.entries(iteration)) {
                const newOutput = await insertSuccessStepsOrPausedRecursively(output)
                if (!isNil(newOutput)) {
                    newSteps[step] = newOutput
                }
            }
            newIterations.push(newSteps)
        }
        return loopOutput.setIterations(newIterations)
    }
    return stepOutput
}