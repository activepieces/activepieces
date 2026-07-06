import { isNil, tryCatch } from '@activepieces/core-utils'
import { BeginExecuteFlowOperation, EngineGenericError, EngineResponse, EngineResponseStatus, ExecuteFlowOperation, ExecuteTriggerResponse, ExecutionError, ExecutionErrorType, ExecutionState, ExecutionType, FlowActionType, FlowRunStatus, flowStructureUtil, GenericStepOutput, LoopStepOutput, ResumePayload, ResumeReason, StepOutput, StepOutputStatus, TriggerHookType, TriggerPayload } from '@activepieces/shared'
import { engineFileApi } from '../api/engine-file-api'
import { EngineConstants, ResolvedBeginExecuteFlowOperation, ResolvedExecuteFlowOperation } from '../handler/context/engine-constants'
import { FlowExecutorContext } from '../handler/context/flow-execution-context'
import { testExecutionContext } from '../handler/context/test-execution-context'
import { flowExecutor } from '../handler/flow-executor'
import { flowRunProgressReporter } from '../helper/flow-run-progress-reporter'
import { triggerHelper } from '../helper/trigger-helper'
import { utils } from '../utils'
import { resolveJobPayload } from './utils/resolve-job-payload'

export const flowOperation = {
    execute: async (operation: ExecuteFlowOperation): Promise<EngineResponse<undefined>> => {
        const { data: input, error: resolveError } = await tryCatch(() => resolveExecuteFlowOperation(operation))
        if (resolveError) {
            // Resolving the trigger payload (downloading its file) happens before flow execution. If the
            // payload file was deleted/expired (404), that is a user/data error, not an engine bug — report a
            // FAILED run instead of letting it escape as INTERNAL_ERROR, which fails+retries the worker job
            // and pages oncall. Only genuine ENGINE errors (e.g. a transient 5xx download) keep that path.
            if (operation.executionType === ExecutionType.BEGIN && !isEngineExecutionError(resolveError)) {
                return reportFailedTriggerRun({ operation, error: resolveError })
            }
            throw resolveError
        }
        const constants = EngineConstants.fromExecuteFlowInput(input)
        const { data: output, error: executionError } = await tryCatch(() => executieSingleStepOrFlowOperation(input, constants))
        if (executionError) {
            // Trigger run()/onStart() hooks and single-step test resolution can throw a plain Error/TypeError
            // or a non-ExecutionError (e.g. ENTITY_NOT_FOUND when testing a deleted step). Like an action step
            // throwing, those are user/piece-level failures and must surface as a FAILED run, never
            // INTERNAL_ERROR. Only genuine ENGINE errors keep paging + retrying.
            if (isEngineExecutionError(executionError)) {
                throw executionError
            }
            return reportFailedRun({ input, constants, error: executionError })
        }
        const finished = output.finishExecution()
        await flowRunProgressReporter.sendUpdate({
            engineConstants: constants,
            flowExecutorContext: finished,
        })
        await flowRunProgressReporter.backup()
        const status = finished.verdict.status === FlowRunStatus.LOG_SIZE_EXCEEDED
            ? EngineResponseStatus.LOG_SIZE_EXCEEDED
            : EngineResponseStatus.OK
        return {
            status,
            response: undefined,
        }
    },
}

function isEngineExecutionError(error: unknown): boolean {
    return error instanceof ExecutionError && error.type === ExecutionErrorType.ENGINE
}

async function reportFailedTriggerRun({ operation, error }: ReportFailedTriggerRunParams): Promise<EngineResponse<undefined>> {
    const input: ResolvedBeginExecuteFlowOperation = { ...operation, triggerPayload: undefined }
    return reportFailedRun({ input, constants: EngineConstants.fromExecuteFlowInput(input), error })
}

async function reportFailedRun({ input, constants, error }: ReportFailedRunParams): Promise<EngineResponse<undefined>> {
    const baseContext = FlowExecutorContext.empty({
        engineApi: {
            engineToken: constants.engineToken,
            internalApiUrl: constants.internalApiUrl,
        },
    })
    const output = (await buildFailedTriggerContext({ input, baseContext, error })).finishExecution()
    await flowRunProgressReporter.sendUpdate({
        engineConstants: constants,
        flowExecutorContext: output,
    })
    await flowRunProgressReporter.backup()
    return {
        status: EngineResponseStatus.OK,
        response: undefined,
    }
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
    const message = error instanceof ExecutionError ? utils.formatExecutionError(error) : utils.formatError(error)
    const triggerPayload = input.executionType === ExecutionType.BEGIN ? input.triggerPayload : undefined
    const failedTriggerOutput = GenericStepOutput.create({
        type: trigger.type,
        status: StepOutputStatus.FAILED,
        input: {},
    }).setOutput(triggerPayload ?? {}).setErrorMessage(message)
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
    const isWaitpointResume = input.resumeReason === ResumeReason.WAITPOINT
    for (const [step, output] of Object.entries(input.executionState.steps)) {
        if (isStepRestorable({ status: output.status, isWaitpointResume })) {
            const newOutput = await insertSuccessStepsOrPausedRecursively({ stepOutput: output, isWaitpointResume })
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
            triggerPayload: input.triggerPayload,
        },
        constants,
    }) as ExecuteTriggerResponse<TriggerHookType.RUN>
    return newPayload.output[0] as TriggerPayload
}


async function insertSuccessStepsOrPausedRecursively({ stepOutput, isWaitpointResume }: InsertStepsParams): Promise<StepOutput | null> {
    if (!isStepRestorable({ status: stepOutput.status, isWaitpointResume })) {
        return null
    }
    if (stepOutput.type === FlowActionType.LOOP_ON_ITEMS) {
        const loopOutput = new LoopStepOutput(stepOutput)
        const iterations = loopOutput.output?.iterations ?? []
        const newIterations: Record<string, StepOutput>[] = []
        for (const iteration of iterations) {
            const newSteps: Record<string, StepOutput> = {}
            for (const [step, output] of Object.entries(iteration)) {
                const newOutput = await insertSuccessStepsOrPausedRecursively({ stepOutput: output, isWaitpointResume })
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
            triggerPayload: await resolveJobPayload({ payload: operation.triggerPayload, apiUrl: operation.internalApiUrl, engineToken: operation.engineToken }),
        }
    }
    const executionState = await fetchExecutionStateFromLogs(operation.logsFileId, operation)
    if (Object.keys(executionState.steps).length === 0) {
        throw new EngineGenericError('EmptyResumeStateError', 'RESUME operation received with empty execution state')
    }
    return {
        ...operation,
        resumePayload: await resolveJobPayload({ payload: operation.resumePayload, apiUrl: operation.internalApiUrl, engineToken: operation.engineToken }) as ResumePayload,
        executionState,
    }
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

// Waitpoint resumes preserve FAILED so a `continueOnFailure` step isn't replayed,
// which would re-fire its waitpoint and let the global `constants.resumePayload`
// pollute the new output. Retry resumes (FlowRetryStrategy.FROM_FAILED_STEP) drop
// FAILED so the engine re-executes the failed step. The discriminator is the
// explicit `resumeReason` set when the run is enqueued.
function isStepRestorable({ status, isWaitpointResume }: IsStepRestorableParams): boolean {
    if (status === StepOutputStatus.SUCCEEDED || status === StepOutputStatus.PAUSED) {
        return true
    }
    return isWaitpointResume && status === StepOutputStatus.FAILED
}

type ResolveStateParams = {
    input: ResolvedExecuteFlowOperation
    constants: EngineConstants
    baseContext: FlowExecutorContext
}

type BuildFailedTriggerContextParams = {
    input: ResolvedExecuteFlowOperation
    baseContext: FlowExecutorContext
    error: Error
}

type ReportFailedTriggerRunParams = {
    operation: BeginExecuteFlowOperation
    error: Error
}

type ReportFailedRunParams = {
    input: ResolvedExecuteFlowOperation
    constants: EngineConstants
    error: Error
}

type IsStepRestorableParams = {
    status: StepOutputStatus
    isWaitpointResume: boolean
}

type InsertStepsParams = {
    stepOutput: StepOutput
    isWaitpointResume: boolean
}
