import {
    EngineGenericError,
    EngineResponse,
    EngineResponseStatus,
    ExecuteFlowOperation,
    ExecuteTriggerResponse,
    ExecutionType,
    FlowActionType,
    FlowRunStatus,
    flowStructureUtil,
    GenericStepOutput,
    isNil,
    LoopStepOutput,
    ResumePayload,
    StepOutput,
    StepOutputStatus,
    TriggerHookType,
    TriggerPayload,
} from '@activepieces/shared'
import { EngineConstants, ResolvedBeginExecuteFlowOperation, ResolvedExecuteFlowOperation } from '../handler/context/engine-constants'
import { FlowExecutorContext } from '../handler/context/flow-execution-context'
import { testExecutionContext } from '../handler/context/test-execution-context'
import { flowExecutor } from '../handler/flow-executor'
import { runProgressService } from '../handler/run-progress'
import { triggerHelper } from '../helper/trigger-helper'
import { resolveJobPayload } from './utils/resolve-job-payload'

export const flowOperation = {
    execute: async (operation: ExecuteFlowOperation): Promise<EngineResponse<undefined>> => {
        const input = await resolveExecuteFlowOperation(operation)
        const constants = EngineConstants.fromExecuteFlowInput(input)
        const output: FlowExecutorContext = (await executieSingleStepOrFlowOperation(input)).finishExecution()
        await runProgressService.backup({
            engineConstants: constants,
            flowExecutorContext: output,
        })
        const status = output.verdict.status === FlowRunStatus.LOG_SIZE_EXCEEDED
            ? EngineResponseStatus.LOG_SIZE_EXCEEDED
            : EngineResponseStatus.OK
        return {
            status,
            response: undefined,
        }
    },
}

const executieSingleStepOrFlowOperation = async (input: ResolvedExecuteFlowOperation): Promise<FlowExecutorContext> => {
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
        const step = flowStructureUtil.getActionOrThrow(input.stepNameToTest!, input.flowVersion.trigger)
        return flowExecutor.execute({
            action: step,
            executionState: await getFlowExecutionState(input, testContext),
            constants: EngineConstants.fromExecuteFlowInput(input),
        })
    }
    return flowExecutor.executeFromTrigger({
        executionState: await getFlowExecutionState(input, FlowExecutorContext.empty()),
        constants,
        input,
    })
}

async function getFlowExecutionState(input: ResolvedExecuteFlowOperation, flowContext: FlowExecutorContext): Promise<FlowExecutorContext> {
    switch (input.executionType) {
        case ExecutionType.BEGIN: {
            if (Object.keys(input.executionState.steps).length > 0) {
                throw new EngineGenericError('InvalidBeginStateError', 'BEGIN operation received with non-empty execution state')
            }
            const newPayload = await runOrReturnPayload(input)
            flowContext = flowContext.upsertStep(input.flowVersion.trigger.name, GenericStepOutput.create({
                type: input.flowVersion.trigger.type,
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

async function runOrReturnPayload(input: ResolvedBeginExecuteFlowOperation): Promise<TriggerPayload> {
    if (!input.executeTrigger) {
        return input.triggerPayload as TriggerPayload
    }
    const newPayload = await triggerHelper.executeTrigger({
        params: {
            ...input,
            hookType: TriggerHookType.RUN,
            test: false,
            webhookUrl: '',
            triggerPayload: input.triggerPayload,
        },
        constants: EngineConstants.fromExecuteFlowInput(input),
    }) as ExecuteTriggerResponse<TriggerHookType.RUN>
    return newPayload.output[0] as TriggerPayload
}

async function resolveExecuteFlowOperation(operation: ExecuteFlowOperation): Promise<ResolvedExecuteFlowOperation> {
    if (operation.executionType === ExecutionType.BEGIN) {
        return {
            ...operation,
            triggerPayload: await resolveJobPayload({
                payload: operation.triggerPayload,
                apiUrl: operation.internalApiUrl,
                engineToken: operation.engineToken,
            }),
        }
    }
    return {
        ...operation,
        resumePayload: await resolveJobPayload({
            payload: operation.resumePayload,
            apiUrl: operation.internalApiUrl,
            engineToken: operation.engineToken,
        }) as ResumePayload,
    }
}


async function insertSuccessStepsOrPausedRecursively(stepOutput: StepOutput): Promise<StepOutput | null> {
    if (![StepOutputStatus.SUCCEEDED, StepOutputStatus.PAUSED].includes(stepOutput.status)) {
        return null
    }
    if (stepOutput.type === FlowActionType.LOOP_ON_ITEMS) {
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