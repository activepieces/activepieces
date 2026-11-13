import { extractMustacheTokens, isNil, isString, spreadIfDefined } from '@activepieces/core-utils'
import { LATEST_CONTEXT_VERSION } from '@activepieces/pieces-framework'
import { BarrierFanOutSource, BarrierSummary, DEFAULT_BATCH_SIZE, ExecutionError, ExecutionErrorType, FlowActionType, FlowRunStatus, flowStructureUtil, GenericStepOutput, PauseType, ProcessInBatchesAction, StepOutput, StepOutputStatus } from '@activepieces/shared'
import { z } from 'zod'
import { continueIfFailureHandler } from '../helper/error-handling'
import { waitpointClient } from '../piece-context/waitpoint-client'
import { utils } from '../utils'
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
    let barrierMayExist = false

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
        const seedSteps = buildSeed({ action, executionState, constants })

        if (!isNil(constants.stepNameToTest)) {
            return succeed({ action, executionState, stepOutput, output: { items: items.slice(0, requestedBatchSize) }, stepStartTime })
        }
        if (items.length === 0 || isNil(bodyEntryStep)) {
            return succeed({ action, executionState, stepOutput, output: emptySummary({ totalItems: items.length, batchSize: requestedBatchSize }), stepStartTime })
        }

        barrierMayExist = true
        const created = await waitpointClient.create({
            apiUrl: constants.internalApiUrl,
            engineToken: constants.engineToken,
            flowRunId: constants.flowRunId,
            projectId: constants.projectId,
            workerHandlerId: constants.workerHandlerId ?? undefined,
            httpRequestId: constants.httpRequestId ?? undefined,
            stepName: executionState.currentPath.waitpointKeyFor({ stepName: action.name }),
            type: PauseType.BARRIER,
            version: 'V1',
            barrier: {
                fanOut: {
                    entryStepName: bodyEntryStep.name,
                    batchStepName: action.name,
                    batchSize: requestedBatchSize,
                    items: [...items],
                    seedSteps,
                },
                ...spreadIfDefined('timeoutSeconds', action.settings.timeoutSeconds),
            },
        })

        const paused = stepOutput
            .setOutput({
                barrierId: created.id,
                totalItems: created.barrier?.totalItems ?? items.length,
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
        const failed = await failStep({ action, executionState, stepOutput, error, durationMs: performance.now() - stepStartTime })
        return barrierMayExist ? failed : continueIfFailureHandler(failed, action, constants)
    }
    return result
}

async function resumeWithSummary({ action, executionState, constants }: ExecuteParams): Promise<FlowExecutorContext> {
    const stepStartTime = performance.now()
    const pausedStep = executionState.getStepOutput(action.name)
    const stepOutput = GenericStepOutput.create({
        input: pausedStep?.input ?? {},
        type: FlowActionType.PROCESS_IN_BATCHES,
        status: StepOutputStatus.RUNNING,
    })
    const released = BarrierSummary.safeParse(constants.resumePayload?.body)
    const paused = PausedOutput.safeParse(pausedStep?.output)
    if (!released.success || !paused.success) {
        return failStep({
            action,
            executionState,
            stepOutput,
            error: userError({ name: 'ProcessInBatchesSummaryMissing', message: 'This step resumed without a batch summary, so the outcome of its batches is unknown.' }),
            durationMs: performance.now() - stepStartTime,
        })
    }
    const summary: BatchStepSummary = { ...paused.data, ...released.data }
    const unsuccessful = summary.failed + summary.rejected + summary.canceled + summary.notDispatched
    const continueOnFailure = action.settings.errorHandlingOptions?.continueOnFailure?.value ?? false

    if (!continueOnFailure && (unsuccessful > 0 || summary.timedOut)) {
        return failStep({
            action,
            executionState,
            stepOutput: stepOutput.setOutput(summary),
            error: summary.timedOut
                ? userError({ name: 'ProcessInBatchesTimedOut', message: `Process in Batches timed out with ${summary.stillRunning + summary.notDispatched} of ${summary.total} batches unfinished.` })
                : userError({ name: 'ProcessInBatchesBatchFailed', message: `${unsuccessful} of ${summary.total} batches did not succeed.` }),
            durationMs: performance.now() - stepStartTime,
        })
    }
    return succeed({ action, executionState, stepOutput, output: summary, stepStartTime })
}

function buildSeed({ action, executionState, constants }: ExecuteParams): BarrierFanOutSource['seedSteps'] {
    const stepNames = new Set(constants.stepNames)
    const bodySteps = flowStructureUtil.getAllChildSteps(action).filter((step) => step.name !== action.name)
    const skippedStepNames = new Set(bodySteps
        .filter((step) => 'skip' in step && step.skip === true)
        .flatMap((step) => flowStructureUtil.getAllChildSteps(step).map((child) => child.name)))
    const referenced = bodySteps
        .filter((step) => !skippedStepNames.has(step.name))
        .flatMap((step) => findReferencedStepNames({ settings: step.settings, stepNames }))
    const [topLevelSteps, ...iterationSteps] = executionState.stepMapsAlongPath()
    return Array.from(new Set(referenced)).reduce<BarrierFanOutSource['seedSteps']>((seed, stepName) => {
        assertNotScopedToEnclosingIteration({ stepName, iterationSteps })
        const topLevelOutput = topLevelSteps[stepName]
        if (isNil(topLevelOutput)) {
            return seed
        }
        return { ...seed, [stepName]: topLevelOutput.type === FlowActionType.LOOP_ON_ITEMS ? withoutPastIterations(topLevelOutput) : { ...topLevelOutput } }
    }, {})
}

function findReferencedStepNames({ settings, stepNames }: FindReferencedStepNamesParams): string[] {
    return Object.entries(settings)
        .filter(([key]) => key !== 'sampleData')
        .flatMap(([, value]) => collectStrings(value))
        .flatMap((text) => extractMustacheTokens(text))
        .flatMap(({ inner }) => inner.match(IDENTIFIER) ?? [])
        .filter((identifier) => stepNames.has(identifier))
}

function collectStrings(value: unknown): string[] {
    if (isString(value)) {
        return [value]
    }
    if (Array.isArray(value)) {
        return value.flatMap(collectStrings)
    }
    if (typeof value === 'object' && value !== null) {
        return Object.values(value).flatMap(collectStrings)
    }
    return []
}

function withoutPastIterations(loopOutput: StepOutput): SeedStep {
    return { ...loopOutput, output: LoopPosition.parse(loopOutput.output) }
}

function assertNotScopedToEnclosingIteration({ stepName, iterationSteps }: AssertNotScopedParams): void {
    if (iterationSteps.every((steps) => isNil(steps[stepName]))) {
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

const IDENTIFIER = /(?<![.\w$])[a-zA-Z_][a-zA-Z0-9_]*/g

const LoopPosition = z.object({
    item: z.unknown(),
    index: z.number(),
})

const PausedOutput = z.object({
    barrierId: z.string().nullable().default(null),
    totalItems: z.number().int().nonnegative(),
    batchSize: z.number().int().positive(),
})

type PausedOutput = z.infer<typeof PausedOutput>

type SeedStep = BarrierFanOutSource['seedSteps'][string]

type ResolvedSettings = {
    items: readonly unknown[]
}

type ExecuteParams = {
    action: ProcessInBatchesAction
    executionState: FlowExecutorContext
    constants: EngineConstants
}

type FindReferencedStepNamesParams = {
    settings: Record<string, unknown>
    stepNames: Set<string>
}

type AssertNotScopedParams = {
    stepName: string
    iterationSteps: Readonly<Record<string, StepOutput>>[]
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

type BatchStepSummary = PausedOutput & BarrierSummary
