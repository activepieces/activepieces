import { isNil, spreadIfDefined } from '@activepieces/core-utils'
import { LATEST_CONTEXT_VERSION } from '@activepieces/pieces-framework'
import { BarrierSummary, DEFAULT_BATCH_SIZE, ExecutionError, ExecutionErrorType, FlowActionType, FlowRunStatus, flowStructureUtil, GenericStepOutput, PauseType, ProcessInBatchesAction, StepOutput, StepOutputStatus } from '@activepieces/shared'
import { z } from 'zod'
import { waitpointClient } from '../piece-context/waitpoint-client'
import { utils } from '../utils'
import { extractReferencedStepNames } from '../variables/props-resolver'
import { BaseExecutor, failStep } from './base-executor'
import { EngineConstants } from './context/engine-constants'
import { FlowExecutorContext } from './context/flow-execution-context'

export const processInBatchesExecutor: BaseExecutor<ProcessInBatchesAction> = {
    async handle({ action, executionState, constants }) {
        if (executionState.isPaused({ stepName: action.name })) {
            return resumeWithSummary({ action, executionState, constants })
        }
        if (executionState.isCompleted({ stepName: action.name })) {
            return executionState
        }
        return handOverToDispatcher({ action, executionState, constants })
    },
}

async function handOverToDispatcher({ action, executionState, constants }: ExecuteParams): Promise<FlowExecutorContext> {
    const stepStartTime = performance.now()
    const stepOutput = GenericStepOutput.create({
        input: {},
        type: FlowActionType.PROCESS_IN_BATCHES,
        status: StepOutputStatus.RUNNING,
    })

    const { data: result, error } = await utils.tryCatchAndThrowOnEngineError(async () => {
        const { resolvedInput, censoredInput } = await constants.getPropsResolver({ contextVersion: LATEST_CONTEXT_VERSION }).resolve<ResolvedSettings>({
            unresolvedInput: { items: action.settings.items },
            executionState,
        })
        stepOutput.input = censoredInput
        if (!Array.isArray(resolvedInput.items)) {
            throw userError({ name: 'ProcessInBatchesItemsNotAList', message: 'The items you have selected must be a list.' })
        }
        const items = resolvedInput.items
        const requestedBatchSize = action.settings.batchSize ?? DEFAULT_BATCH_SIZE
        const bodyEntryStep = action.firstLoopAction

        if (!isNil(constants.stepNameToTest)) {
            return succeed({ action, executionState, stepOutput, output: { items: items.slice(0, requestedBatchSize) }, stepStartTime })
        }
        if (items.length === 0 || isNil(bodyEntryStep)) {
            return succeed({ action, executionState, stepOutput, output: emptySummary({ totalItems: items.length, batchSize: requestedBatchSize }), stepStartTime })
        }

        const created = await waitpointClient.create({
            apiUrl: constants.internalApiUrl,
            engineToken: constants.engineToken,
            flowRunId: constants.flowRunId,
            projectId: constants.projectId,
            stepName: executionState.currentPath.toWaitpointKey(action.name),
            type: PauseType.BARRIER,
            version: 'V1',
            barrier: {
                fanOut: {
                    entryStepName: bodyEntryStep.name,
                    batchSize: requestedBatchSize,
                    items: [...items],
                    seedSteps: buildSeed({ action, executionState, constants }),
                },
                ...spreadIfDefined('timeoutSeconds', action.settings.timeoutSeconds),
            },
        })

        const paused = stepOutput
            .setOutput({
                barrierId: created.id,
                totalItems: items.length,
                batchSize: created.barrier?.batchSize ?? requestedBatchSize,
                total: created.barrier?.signalCount ?? 0,
            })
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
    const released = BarrierSummary.safeParse(constants.resumePayload?.body)
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
    const summary: BatchStepSummary = { ...pending, ...released.data }
    const unsuccessful = summary.failed + summary.rejected + summary.notDispatched
    const continueOnFailure = action.settings.errorHandlingOptions?.continueOnFailure?.value ?? false

    if (!continueOnFailure && (unsuccessful > 0 || summary.timedOut)) {
        return failStep({
            action,
            executionState,
            stepOutput: stepOutput.setOutput(summary),
            error: summary.timedOut
                ? userError({ name: 'ProcessInBatchesTimedOut', message: `Process in Batches timed out with ${summary.stillRunning} batches still running.` })
                : userError({ name: 'ProcessInBatchesBatchFailed', message: `${unsuccessful} of ${summary.total} batches failed.` }),
            durationMs: performance.now() - stepStartTime,
        })
    }
    return succeed({ action, executionState, stepOutput, output: summary, stepStartTime })
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

function emptySummary({ totalItems, batchSize }: EmptySummaryParams): BatchStepSummary {
    return {
        barrierId: null,
        totalItems,
        batchSize,
        total: 0,
        succeeded: 0,
        failed: 0,
        rejected: 0,
        canceled: 0,
        notDispatched: 0,
        stillRunning: 0,
        timedOut: false,
        signals: [],
    }
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
    barrierId: z.string().nullable().default(null),
    totalItems: z.number().int().nonnegative(),
    batchSize: z.number().int().positive(),
})

const NOTHING_PENDING: PendingBatches = {
    barrierId: null,
    totalItems: 0,
    batchSize: 1,
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

type AssertNotScopedParams = {
    stepName: string
    executionState: FlowExecutorContext
}

type UserErrorParams = {
    name: string
    message: string
}

type EmptySummaryParams = {
    totalItems: number
    batchSize: number
}

type SucceedParams = {
    action: ProcessInBatchesAction
    executionState: FlowExecutorContext
    stepOutput: GenericStepOutput<FlowActionType.PROCESS_IN_BATCHES, unknown>
    output: unknown
    stepStartTime: number
}

export type BatchStepSummary = PendingBatches & BarrierSummary
