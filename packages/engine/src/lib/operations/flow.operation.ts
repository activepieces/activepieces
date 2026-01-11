import {
    BeginExecuteFlowOperation,
    EngineResponse,
    EngineResponseStatus,
    ExecuteFlowOperation,
    ExecuteTriggerResponse,
    ExecutionType,
    FlowActionType,
    FlowExecutorSteps,
    flowStructureUtil,
    GenericStepOutput,
    GetStepOutputRequest,
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
import { flowStateService } from '../services/flow-state.service'

export const flowOperation = {
    execute: async (operation: ExecuteFlowOperation): Promise<EngineResponse<undefined>> => {
        const input = operation as ExecuteFlowOperation
        const constants = EngineConstants.fromExecuteFlowInput(input)
        const output: FlowExecutorContext = (await executieSingleStepOrFlowOperation(input)).finishExecution()

        await progressService.sendUpdate({
            engineConstants: constants,
            flowExecutorContext: output,
            updateImmediate: true,
        })
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
        })
        const step = flowStructureUtil.getActionOrThrow(input.stepNameToTest!, input.flowVersion.trigger)
        return flowExecutor.execute({
            action: step,
            executionState: await getFlowExecutionState(input, testContext),
            constants: EngineConstants.fromExecuteFlowInput(input),
        })
    }
    return flowExecutor.executeFromTrigger({
        executionState: await getFlowExecutionState(input, FlowExecutorContext.empty(input.flowRunId)),
        constants,
        input,
    })
}

async function getFlowExecutionState(input: ExecuteFlowOperation, flowContext: FlowExecutorContext): Promise<FlowExecutorContext> {
    switch (input.executionType) {
        case ExecutionType.BEGIN: {
            const newPayload = await runOrReturnPayload(input)
            flowContext = await flowContext.upsertStep(input.flowVersion.trigger.name, GenericStepOutput.create({
                type: input.flowVersion.trigger.type,
                status: StepOutputStatus.SUCCEEDED,
                input: {},
            }).setOutput(newPayload))
            break
        }
        case ExecutionType.RESUME: {
            break
        }
    }

    for (const [step, request] of Object.entries(input.executionState.steps)) {
        const newRequest = await insertSuccessStepsOrPausedRecursively(request)
        if (!isNil(newRequest)) {
            const newOutput = await flowStateService.getStepOutputOrThrow(newRequest)
            flowContext = await flowContext.upsertStep(step, newOutput)
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

async function insertSuccessStepsOrPausedRecursively(req: GetStepOutputRequest): Promise<GetStepOutputRequest | null> {
    const stepOutput = await flowStateService.getStepOutputOrThrow(req)
    if (![StepOutputStatus.SUCCEEDED, StepOutputStatus.PAUSED].includes(stepOutput.status)) {
        return null
    }
    
    if (stepOutput.type === FlowActionType.LOOP_ON_ITEMS) {
        const loopOutput = new LoopStepOutput(stepOutput)
        const iterations = loopOutput.output?.iterations ?? []
        
        const newIterations = await Promise.all(
            iterations.map(async (iteration) => {
                const stepEntries = await Promise.all(
                    Object.entries(iteration).map(async ([step, request]) => {
                        const newRequest = await insertSuccessStepsOrPausedRecursively(request)
                        return { step, request: newRequest }
                    })
                )
                
                const newSteps: FlowExecutorSteps = {}
                for (const { step, request } of stepEntries) {
                    if (!isNil(request)) {
                        newSteps[step] = request
                    }
                }
                return newSteps
            })
        )
        
        await flowStateService.saveStepOutput({
            stepName: req.stepName,
            path: req.path,
            runId: req.runId,
            stepOutput: loopOutput.setIterations(newIterations),
        })
        return req
    }
    
    return req
}