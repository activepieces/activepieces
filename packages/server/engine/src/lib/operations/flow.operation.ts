import {
    EngineGenericError,
    EngineResponse,
    EngineResponseStatus,
    ExecuteFlowOperation,
    ExecuteTriggerResponse,
    ExecutionError,
    ExecutionErrorType,
    ExecutionState,
    ExecutionType,
    FlowActionType,
    FlowRunStatus,
    flowStructureUtil,
    GenericStepOutput,
    isNil,
    JobPayload,
    LoopStepOutput,
    ResumePayload,
    StepOutput,
    StepOutputStatus,
    TriggerHookType,
    TriggerPayload,
    tryCatch,
} from '@activepieces/shared'
import { engineFileApi } from '../engine-file-api'
import { EngineConstants, ResolvedBeginExecuteFlowOperation, ResolvedExecuteFlowOperation } from '../handler/context/engine-constants'
import { FlowExecutorContext } from '../handler/context/flow-execution-context'
import { testExecutionContext } from '../handler/context/test-execution-context'
import { flowExecutor } from '../handler/flow-executor'
import { flowRunProgressReporter } from '../helper/flow-run-progress-reporter'
import { triggerHelper } from '../helper/trigger-helper'
import { utils } from '../utils'

export const flowOperation = {
    execute: async (operation: ExecuteFlowOperation): Promise<EngineResponse<undefined>> => {
        const input = await resolveExecuteFlowOperation(operation)
        const constants = EngineConstants.fromExecuteFlowInput(input)
        const output: FlowExecutorContext = (await executieSingleStepOrFlowOperation(input, constants)).finishExecution()
        await flowRunProgressReporter.sendUpdate({
            engineConstants: constants,
            flowExecutorContext: output,
        })
        await flowRunProgressReporter.backup()
        const status = output.verdict.status === FlowRunStatus.LOG_SIZE_EXCEEDED
            ? EngineResponseStatus.LOG_SIZE_EXCEEDED
            : EngineResponseStatus.OK
        return {
            status,
            response: undefined,
        }
    },
}

const executieSingleStepOrFlowOperation = async (input: ResolvedExecuteFlowOperation, constants: EngineConstants): Promise<FlowExecutorContext> => {
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
        const executionState = await resolveStateOrThrowOnNonUserError({ input, constants, baseContext: testContext })
        if (executionState.verdict.status !== FlowRunStatus.RUNNING) {
            return executionState
        }
        return flowExecutor.execute({
            action: step,
            executionState,
            constants,
        })
    }
    const emptyContext = FlowExecutorContext.empty({
        engineApi: {
            engineToken: constants.engineToken,
            internalApiUrl: constants.internalApiUrl,
        },
    })
    const executionState = await resolveStateOrThrowOnNonUserError({ input, constants, baseContext: emptyContext })
    if (executionState.verdict.status !== FlowRunStatus.RUNNING) {
        return executionState
    }
    return flowExecutor.executeFromTrigger({
        executionState,
        constants,
        input,
    })
}

async function resolveStateOrThrowOnNonUserError({ input, constants, baseContext }: ResolveStateParams): Promise<FlowExecutorContext> {
    const { data: executionState, error } = await tryCatch(() => getFlowExecutionState(input, constants, baseContext))
    if (!error) {
        return executionState
    }
    if (error instanceof ExecutionError && error.type === ExecutionErrorType.USER) {
        return buildFailedTriggerContext({ input, baseContext, error })
    }
    throw error
}

async function buildFailedTriggerContext({ input, baseContext, error }: BuildFailedTriggerContextParams): Promise<FlowExecutorContext> {
    const trigger = input.flowVersion.trigger
    const message = utils.formatExecutionError(error)
    const triggerPayload = input.executionType === ExecutionType.BEGIN ? input.triggerPayload : undefined
    const failedTriggerOutput = GenericStepOutput.create({
        type: trigger.type,
        status: StepOutputStatus.FAILED,
        input: triggerPayload ?? {},
    }).setErrorMessage(message)
    return (await baseContext.upsertStep(trigger.name, failedTriggerOutput)).setVerdict({
        status: FlowRunStatus.FAILED,
        failedStep: {
            name: trigger.name,
            displayName: trigger.displayName,
            message,
        },
    })
}

async function getFlowExecutionState(input: ResolvedExecuteFlowOperation, constants: EngineConstants, flowContext: FlowExecutorContext): Promise<FlowExecutorContext> {
    if (input.executionType === ExecutionType.BEGIN) {
        const newPayload = await runOrReturnPayload(input, constants)
        return flowContext.upsertStep(input.flowVersion.trigger.name,
            GenericStepOutput.create({
                type: input.flowVersion.trigger.type,
                status: StepOutputStatus.SUCCEEDED,
                input: {},
            }).setOutput(newPayload))
    }
    flowContext = flowContext.addTags(input.executionState.tags)
    for (const [step, output] of Object.entries(input.executionState.steps)) {
        if ([StepOutputStatus.SUCCEEDED, StepOutputStatus.PAUSED].includes(output.status)) {
            const newOutput = await insertSuccessStepsOrPausedRecursively(output)
            if (!isNil(newOutput)) {
                flowContext = await flowContext.upsertStep(step, newOutput)
            }
        }
    }
    return flowContext
}

async function runOrReturnPayload(input: ResolvedBeginExecuteFlowOperation, constants: EngineConstants): Promise<TriggerPayload> {
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
        constants,
    }) as ExecuteTriggerResponse<TriggerHookType.RUN>
    return newPayload.output[0] as TriggerPayload
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

async function resolveExecuteFlowOperation(operation: ExecuteFlowOperation): Promise<ResolvedExecuteFlowOperation> {
    if (operation.executionType === ExecutionType.BEGIN) {
        return {
            ...operation,
            triggerPayload: await resolveJobPayload(operation.triggerPayload, operation),
        }
    }
    const executionState = await fetchExecutionStateFromLogs(operation.logsFileId, operation)
    if (Object.keys(executionState.steps).length === 0) {
        throw new EngineGenericError('EmptyResumeStateError', 'RESUME operation received with empty execution state')
    }
    return {
        ...operation,
        resumePayload: await resolveJobPayload(operation.resumePayload, operation) as ResumePayload,
        executionState,
    }
}

async function resolveJobPayload(payload: JobPayload, operation: ExecuteFlowOperation): Promise<unknown> {
    if (payload.type === 'inline') {
        return payload.value
    }
    const bytes = await engineFileApi.download({
        fileId: payload.fileId,
        apiUrl: operation.internalApiUrl,
        engineToken: operation.engineToken,
    })
    return JSON.parse(new TextDecoder('utf-8').decode(bytes))
}

async function fetchExecutionStateFromLogs(logsFileId: string | undefined, operation: ExecuteFlowOperation): Promise<ExecutionState> {
    if (isNil(logsFileId)) {
        throw new EngineGenericError('ResumeLogsFileMissing', 'logsFileId is missing for RESUME operation')
    }
    const bytes = await engineFileApi.download({
        fileId: logsFileId,
        apiUrl: operation.internalApiUrl,
        engineToken: operation.engineToken,
    })
    const parsed = JSON.parse(new TextDecoder('utf-8').decode(bytes))
    if (isNil(parsed?.executionState)) {
        throw new EngineGenericError('ExecutionStateMissing', 'executionState is missing in logs file')
    }
    return parsed.executionState as ExecutionState
}

type ResolveStateParams = {
    input: ResolvedExecuteFlowOperation
    constants: EngineConstants
    baseContext: FlowExecutorContext
}

type BuildFailedTriggerContextParams = {
    input: ResolvedExecuteFlowOperation
    baseContext: FlowExecutorContext
    error: ExecutionError
}
