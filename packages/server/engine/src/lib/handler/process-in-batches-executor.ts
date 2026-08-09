import { createHash } from 'node:crypto'
import { chunk, isNil, tryCatch } from '@activepieces/core-utils'
import { LATEST_CONTEXT_VERSION } from '@activepieces/pieces-framework'
import { DEFAULT_BATCH_SIZE, ExecutionError, ExecutionErrorType, FanInSummary, FlowActionType, FlowRunStatus, flowStructureUtil, GenericStepOutput, PauseType, ProcessInBatchesAction, StepOutput, StepOutputStatus } from '@activepieces/shared'
import { z } from 'zod'
import { childRunClient } from '../piece-context/child-run-client'
import { waitpointClient } from '../piece-context/waitpoint-client'
import { utils } from '../utils'
import { extractReferencedStepNames } from '../variables/props-resolver'
import { BaseExecutor, failStep } from './base-executor'
import { EngineConstants } from './context/engine-constants'
import { FlowExecutorContext } from './context/flow-execution-context'

const MAX_DISPATCHES_IN_FLIGHT = 5

export const processInBatchesExecutor: BaseExecutor<ProcessInBatchesAction> = {
    async handle({ action, executionState, constants }) {
        if (executionState.isPaused({ stepName: action.name })) {
            return resumeWithSummary({ action, executionState, constants })
        }
        if (executionState.isCompleted({ stepName: action.name })) {
            return executionState
        }
        return dispatchBatches({ action, executionState, constants })
    },
}

async function dispatchBatches({ action, executionState, constants }: ExecuteParams): Promise<FlowExecutorContext> {
    const stepStartTime = performance.now()
    const stepOutput = GenericStepOutput.create({
        input: {},
        type: FlowActionType.PROCESS_IN_BATCHES,
        status: StepOutputStatus.RUNNING,
    })

    const { data: result, error } = await utils.tryCatchAndThrowOnEngineError(async () => {
        const { resolvedInput, censoredInput } = await constants.getPropsResolver(LATEST_CONTEXT_VERSION).resolve<ResolvedSettings>({
            unresolvedInput: { items: action.settings.items },
            executionState,
        })
        stepOutput.input = censoredInput
        if (!Array.isArray(resolvedInput.items)) {
            throw userError({ name: 'ProcessInBatchesItemsNotAList', message: 'The items you have selected must be a list.' })
        }
        const items = resolvedInput.items
        const batchSize = action.settings.batchSize ?? DEFAULT_BATCH_SIZE
        const batches = chunk(items, batchSize)
        const bodyEntryStep = action.firstLoopAction

        if (!isNil(constants.stepNameToTest)) {
            return succeed({ action, executionState, stepOutput, output: { items: batches[0] ?? [] }, stepStartTime })
        }
        if (batches.length === 0 || isNil(bodyEntryStep)) {
            return succeed({ action, executionState, stepOutput, output: emptySummary(), stepStartTime })
        }

        const seed = buildSeed({ action, executionState, constants })
        const barrier = await waitpointClient.create({
            apiUrl: constants.internalApiUrl,
            engineToken: constants.engineToken,
            flowRunId: constants.flowRunId,
            projectId: constants.projectId,
            stepName: action.name,
            type: PauseType.WEBHOOK,
            version: 'V1',
            isFanIn: true,
            intendedChildren: batches.length,
            dispatchDigest: digestOf({ seed, items }),
        })

        const dispatchBatch = (batchIndex: number): Promise<unknown> => childRunClient.dispatch({
            apiUrl: constants.internalApiUrl,
            engineToken: constants.engineToken,
            parentRunId: constants.flowRunId,
            entryStepName: bodyEntryStep.name,
            seedSteps: { ...seed, [action.name]: batchOutput(batches[batchIndex]) },
            parentWaitpointId: barrier.id,
            dispatchIndex: batchIndex,
            dispatchKey: `${barrier.id}-${batchIndex}`,
        })

        await dispatchBatch(0)
        const failedToDispatchIndices = await dispatchRemaining({ batchCount: batches.length, dispatchBatch })

        await waitpointClient.seal({
            apiUrl: constants.internalApiUrl,
            engineToken: constants.engineToken,
            waitpointId: barrier.id,
            projectId: constants.projectId,
            expectedChildren: batches.length - failedToDispatchIndices.length,
            failedToDispatch: failedToDispatchIndices.length,
        })

        const paused = stepOutput
            .setOutput({ totalItems: items.length, batchSize, failedToDispatchIndices })
            .setStatus(StepOutputStatus.PAUSED)
            .setDuration(performance.now() - stepStartTime)
        return (await executionState.upsertStep(action.name, paused))
            .incrementStepsExecuted()
            .setVerdict({ status: FlowRunStatus.PAUSED })
    })

    if (error) {
        return failStep({ action, executionState, stepOutput, error, durationMs: performance.now() - stepStartTime })
    }
    return result
}

async function resumeWithSummary({ action, executionState, constants }: ExecuteParams): Promise<FlowExecutorContext> {
    const stepStartTime = performance.now()
    const pausedOutput = executionState.getStepOutput(action.name)
    const stepOutput = GenericStepOutput.create({
        input: pausedOutput?.input ?? {},
        type: FlowActionType.PROCESS_IN_BATCHES,
        status: StepOutputStatus.RUNNING,
    })
    const released = FanInSummary.safeParse(constants.resumePayload?.body)
    if (!released.success) {
        return failStep({
            action,
            executionState,
            stepOutput,
            error: userError({ name: 'ProcessInBatchesSummaryMissing', message: 'This step resumed without a batch summary, so the outcome of its batches is unknown.' }),
            durationMs: performance.now() - stepStartTime,
        })
    }
    const pending = PendingBatches.safeParse(pausedOutput?.output).data ?? NOTHING_PENDING
    const summary = toBatchSummary({ released: released.data, pending })
    const continueOnFailure = action.settings.errorHandlingOptions?.continueOnFailure?.value ?? false

    if (!continueOnFailure && (summary.failed > 0 || summary.timedOut)) {
        return failStep({
            action,
            executionState,
            stepOutput: stepOutput.setOutput(summary),
            error: summary.timedOut
                ? userError({ name: 'ProcessInBatchesTimedOut', message: `Process in Batches timed out with ${summary.stillRunning} batches still running.` })
                : userError({ name: 'ProcessInBatchesBatchFailed', message: `${summary.failed} of ${summary.expected} batches failed.` }),
            durationMs: performance.now() - stepStartTime,
        })
    }
    return succeed({ action, executionState, stepOutput, output: summary, stepStartTime })
}

async function dispatchRemaining({ batchCount, dispatchBatch }: DispatchRemainingParams): Promise<number[]> {
    const failedToDispatchIndices: number[] = []
    let nextBatchIndex = 1
    const dispatchUntilDrained = async (): Promise<void> => {
        while (nextBatchIndex < batchCount) {
            const batchIndex = nextBatchIndex++
            const { error } = await tryCatch(() => dispatchBatch(batchIndex))
            if (!isNil(error)) {
                failedToDispatchIndices.push(batchIndex)
            }
        }
    }
    const workers = Math.min(MAX_DISPATCHES_IN_FLIGHT, Math.max(batchCount - 1, 0))
    await Promise.all(Array.from({ length: workers }, dispatchUntilDrained))
    return failedToDispatchIndices.sort((a, b) => a - b)
}

function buildSeed({ action, executionState, constants }: ExecuteParams): Record<string, StepOutput> {
    const referenced = flowStructureUtil.getAllChildSteps(action)
        .filter((step) => step.name !== action.name)
        .flatMap((step) => Array.from(extractReferencedStepNames(step.settings, constants.stepNames)))
    return Array.from(new Set(referenced)).reduce<Record<string, StepOutput>>((seed, stepName) => {
        const topLevelOutput = executionState.steps[stepName]
        if (isNil(topLevelOutput)) {
            assertNotScopedToEnclosingIteration({ stepName, executionState })
            return seed
        }
        return { ...seed, [stepName]: topLevelOutput }
    }, {})
}

function assertNotScopedToEnclosingIteration({ stepName, executionState }: AssertNotScopedParams): void {
    if (isNil(executionState.getStepOutput(stepName))) {
        return
    }
    throw userError({ name: 'ProcessInBatchesIterationScopedReference', message: `A step inside this batch references "${stepName}", which belongs to the enclosing loop iteration and cannot travel to a batch. Move that step outside the loop, or copy the value it needs into a step above the batch.` })
}

function toBatchSummary({ released, pending }: ToBatchSummaryParams): BatchSummary {
    return {
        expected: released.expected,
        succeeded: released.succeeded,
        failed: released.failed,
        canceled: released.canceled,
        stillRunning: released.stillRunning,
        notStarted: released.notStarted,
        failedToDispatch: released.failedToDispatch,
        timedOut: released.timedOut,
        exceptions: released.exceptions.flatMap((exception) => {
            if (isNil(exception.dispatchIndex)) {
                return []
            }
            const itemStart = exception.dispatchIndex * pending.batchSize
            return [{
                batchIndex: exception.dispatchIndex,
                itemStart,
                itemCount: Math.max(Math.min(pending.batchSize, pending.totalItems - itemStart), 0),
                status: exceptionStatus({ hasRun: !isNil(exception.runId), batchIndex: exception.dispatchIndex, pending }),
                childRunId: exception.runId,
            }]
        }),
    }
}

function exceptionStatus({ hasRun, batchIndex, pending }: ExceptionStatusParams): BatchExceptionStatus {
    if (hasRun) {
        return 'failed'
    }
    return pending.failedToDispatchIndices.includes(batchIndex) ? 'failedToDispatch' : 'notStarted'
}

function batchOutput(items: unknown[]): StepOutput {
    return GenericStepOutput.create({
        input: {},
        type: FlowActionType.PROCESS_IN_BATCHES,
        status: StepOutputStatus.SUCCEEDED,
    }).setOutput({ items })
}

function emptySummary(): BatchSummary {
    return {
        expected: 0,
        succeeded: 0,
        failed: 0,
        canceled: 0,
        stillRunning: 0,
        notStarted: 0,
        failedToDispatch: 0,
        timedOut: false,
        exceptions: [],
    }
}

function digestOf({ seed, items }: DigestParams): string {
    return createHash('sha256').update(JSON.stringify({ seed, items })).digest('hex')
}

function userError({ name, message }: UserErrorParams): ExecutionError {
    return new ExecutionError(name, JSON.stringify({ message }), ExecutionErrorType.USER)
}

async function succeed({ action, executionState, stepOutput, output, stepStartTime }: SucceedParams): Promise<FlowExecutorContext> {
    const succeeded = stepOutput
        .setOutput(output)
        .setStatus(StepOutputStatus.SUCCEEDED)
        .setDuration(performance.now() - stepStartTime)
    return (await executionState.upsertStep(action.name, succeeded))
        .incrementStepsExecuted()
        .setVerdict({ status: FlowRunStatus.RUNNING })
}

const PendingBatches = z.object({
    totalItems: z.number().int().nonnegative(),
    batchSize: z.number().int().positive(),
    failedToDispatchIndices: z.array(z.number().int().nonnegative()),
})

const NOTHING_PENDING: PendingBatches = {
    totalItems: 0,
    batchSize: 1,
    failedToDispatchIndices: [],
}

type PendingBatches = z.infer<typeof PendingBatches>

type ResolvedSettings = {
    items: readonly unknown[]
}

type ExecuteParams = {
    action: ProcessInBatchesAction
    executionState: FlowExecutorContext
    constants: EngineConstants
}

type DispatchRemainingParams = {
    batchCount: number
    dispatchBatch: (batchIndex: number) => Promise<unknown>
}

type AssertNotScopedParams = {
    stepName: string
    executionState: FlowExecutorContext
}

type ToBatchSummaryParams = {
    released: FanInSummary
    pending: PendingBatches
}

type UserErrorParams = {
    name: string
    message: string
}

type ExceptionStatusParams = {
    hasRun: boolean
    batchIndex: number
    pending: PendingBatches
}

type DigestParams = {
    seed: Record<string, StepOutput>
    items: unknown[]
}

type SucceedParams = {
    action: ProcessInBatchesAction
    executionState: FlowExecutorContext
    stepOutput: GenericStepOutput<FlowActionType.PROCESS_IN_BATCHES, unknown>
    output: unknown
    stepStartTime: number
}

export type BatchExceptionStatus = 'failed' | 'notStarted' | 'failedToDispatch'

export type BatchSummary = {
    expected: number
    succeeded: number
    failed: number
    canceled: number
    stillRunning: number
    notStarted: number
    failedToDispatch: number
    timedOut: boolean
    exceptions: {
        batchIndex: number
        itemStart: number
        itemCount: number
        status: BatchExceptionStatus
        childRunId: string | null
    }[]
}
