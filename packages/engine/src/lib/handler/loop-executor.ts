import { Action, ExecutionOutputStatus, ExecutionType, LoopOnItemsAction, LoopStepOutput, LoopStepResult, PauseType, StepOutput, StepOutputStatus, isNil } from '@activepieces/shared'
import { BaseExecutor } from './base-executor'
import { ExecutionVerdict, FlowExecutorContext } from './context/flow-execution-context'
import { flowExecutor } from './flow-executor'
import { EngineConstants } from './context/engine-constants'
import { createContextStore } from '../services/storage.service'
import { Store } from '@activepieces/pieces-framework'

type LoopOnActionResolvedSettings = {
    items: readonly unknown[]
}

export const loopExecutor: BaseExecutor<LoopOnItemsAction> = {
    async handle({
        action,
        executionState,
        constants,
    }: {
        action: LoopOnItemsAction
        executionState: FlowExecutorContext
        constants: EngineConstants
    }) {
        const isPaused = executionState.isPaused({ stepName: action.name })

        const { resolvedInput, censoredInput } = await constants.variableService.resolve<LoopOnActionResolvedSettings>({
            unresolvedInput: {
                items: action.settings.items,
            },
            executionState,
        })

        let stepOutput = LoopStepOutput.init({
            input: censoredInput,
        })

        const store = createContextStore({
            prefix: `Loop_${constants.flowRunId}_${action.name}`,
            flowId: constants.flowId,
            workerToken: constants.workerToken,
        })

        const firstLoopAction = action.firstLoopAction

        if (isNil(firstLoopAction) || constants.testSingleStepMode) {
            stepOutput = stepOutput.setItemAndIndex({ index: 1, item: resolvedInput.items[0] })

            return executionState.upsertStep(action.name, stepOutput)
        }

        if (!isPaused) {
            const loopIterations = triggerLoopIterations(resolvedInput, executionState, stepOutput, constants, action, firstLoopAction)

            return waitForIterationsToFinishOrPause(executionState, loopIterations, stepOutput, action.name, store)
        }

        const payload = constants.resumePayload?.queryParams as { requestId: string, path: string }

        await resumePausedIteration(store, payload, executionState, constants, firstLoopAction)

        const numberOfIterations = resolvedInput.items.length

        executionState = executionState.setPauseRequestId(payload.requestId);

        return generateNextFlowContext(store, action.name, stepOutput, executionState, numberOfIterations)
    },
}

function triggerLoopIterations(resolvedInput: LoopOnActionResolvedSettings,
    loopExecutionState: FlowExecutorContext,
    stepOutput: LoopStepOutput,
    constants: EngineConstants,
    action: LoopOnItemsAction,
    firstLoopAction: Action): Promise<FlowExecutorContext>[] {

    const loopIterations: Promise<FlowExecutorContext>[] = []

    for (let i = 0; i < resolvedInput.items.length; ++i) {
        const newCurrentPath = loopExecutionState.currentPath.loopIteration({ loopName: action.name, iteration: i })
        stepOutput = stepOutput.setItemAndIndex({ index: i + 1, item: resolvedInput.items[i] })

        const addEmptyIteration = !stepOutput.hasIteration(i)
        if (addEmptyIteration) {
            stepOutput = stepOutput.addIteration()
        }
        
        const newExecutionContext = loopExecutionState
            .upsertStep(action.name, stepOutput)
            .setCurrentPath(newCurrentPath)

        loopIterations[i] = flowExecutor.execute({
            executionState: newExecutionContext,
            action: firstLoopAction,
            constants,
        })
    }

    return loopIterations
}

async function waitForIterationsToFinishOrPause(
    loopExecutionState: FlowExecutorContext,
    loopIterations: Promise<FlowExecutorContext>[],
    loopStepOutput: LoopStepOutput,
    actionName: string,
    store: Store): Promise<FlowExecutorContext> {

    const iterationResults: { iterationContext: FlowExecutorContext, isPaused: boolean }[] = []
    let noPausedIterations = true 
    
    for (const iteration of loopIterations) {
        const iterationContext = await iteration
        const { verdict, verdictResponse } = iterationContext

        if (verdict === ExecutionVerdict.FAILED) {
            return iterationContext.setCurrentPath(iterationContext.currentPath.removeLast())
        }

        const isPaused = verdict === ExecutionVerdict.PAUSED
            && verdictResponse?.reason === ExecutionOutputStatus.PAUSED
            && verdictResponse?.pauseMetadata.type === PauseType.WEBHOOK

        if (isPaused) {
            noPausedIterations = false
        }

        iterationResults.push({ iterationContext, isPaused })
    }

    if (noPausedIterations) {
        const { iterationContext: lastIterationContext } = iterationResults[iterationResults.length - 1]
        
        return lastIterationContext.setCurrentPath(lastIterationContext.currentPath.removeLast())
    }

    await saveIterationResults(store, actionName, iterationResults)

    return pauseLoop(loopExecutionState, loopStepOutput, actionName)
}

async function saveIterationResults(store: Store, actionName: string, iterationResults: { iterationContext: FlowExecutorContext, isPaused: boolean }[]) {
    for (let i = 0; i < iterationResults.length; ++i) {
        const { iterationContext, isPaused } = iterationResults[i]

        const iterationOutput = iterationContext.currentState[actionName] as LoopStepResult
        if (isPaused) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await store.put(iterationContext.currentPath.toString(), i)
        }

        const iterationResult: IterationResult = {
            isPaused,
            item: iterationOutput.item,
            index: iterationOutput.index,
            steps: iterationOutput.iterations[i],
        }
    
        await store.put(`${i}`, iterationResult)
    }
}

async function resumePausedIteration(store: Store,
    payload: { requestId: string, path: string },
    loopExecutionState: FlowExecutorContext,
    constants: EngineConstants,
    firstLoopAction: Action): Promise<void> {

    // Get which iteration is being resumed
    const iterationIndex = await store.get(payload.path) as string
    const previousIterationResult = await store.get(iterationIndex) as IterationResult

    let newExecutionContext = loopExecutionState

    for (const stepKey in previousIterationResult.steps) {
        // Adds each step from the previous execution to the current context
        newExecutionContext = newExecutionContext.upsertStep(stepKey, previousIterationResult.steps[stepKey])
    }

    newExecutionContext = await flowExecutor.execute({
        executionState: newExecutionContext,
        action: firstLoopAction,
        constants,
    })

    await updateIterationResult(newExecutionContext, loopExecutionState, previousIterationResult, iterationIndex, store)
}

async function updateIterationResult(newExecutionContext: FlowExecutorContext,
    loopExecutionState: FlowExecutorContext,
    currentIteration: IterationResult,
    iterationIndex: string,
    store: Store): Promise<void> {
    // Get the keys of the steps that belong to the current iteration
    const newSteps = Object.keys(newExecutionContext.steps).filter(key => !(key in loopExecutionState.steps))

    const currentIterationSteps: Record<string, StepOutput> = {}
    for (const newStep of newSteps) {
        currentIterationSteps[`${newStep}`] = newExecutionContext.steps[newStep]
    }

    const iterationResult: IterationResult = {
        isPaused: newExecutionContext.verdict === ExecutionVerdict.PAUSED,
        index: currentIteration.index,
        item: currentIteration.item,
        steps: currentIterationSteps,
    }

    await store.put(iterationIndex, iterationResult)
}

async function generateNextFlowContext(store: Store, 
    actionName: string, 
    loopStepOutput: LoopStepOutput, 
    loopExecutionState: FlowExecutorContext,
    numberOfIterations: number): Promise<FlowExecutorContext> {
    let areAllStepsInLoopFinished = true

    const orig = loopStepOutput;
    for (let iterationIndex = 0; iterationIndex < numberOfIterations; ++iterationIndex) {
        const iterationResult: IterationResult | null = await store.get(`${iterationIndex}`) 
        
        if (!iterationResult || iterationResult.isPaused) {
            areAllStepsInLoopFinished = false
            break
        }

        // Add the output of the iteration to the loop output
        loopStepOutput = loopStepOutput.setItemAndIndex({ index: iterationResult.index, item: iterationResult.item })

        const loopStepResult = loopStepOutput.output as LoopStepResult
        loopStepResult.iterations[iterationResult.index - 1] = iterationResult.steps
    }

    if (!areAllStepsInLoopFinished) {
        return pauseLoop(loopExecutionState, orig, actionName)
    }

    return loopExecutionState.upsertStep(actionName, loopStepOutput)
}

function pauseLoop(executionState: FlowExecutorContext, stepOutput: LoopStepOutput, actionName: string): FlowExecutorContext {
    return executionState
        .upsertStep(actionName, stepOutput.setStatus(StepOutputStatus.PAUSED))
        .setVerdict(ExecutionVerdict.PAUSED, {
            reason: ExecutionOutputStatus.PAUSED,
            pauseMetadata: {
                requestId: executionState.pauseRequestId,
                type: PauseType.WEBHOOK,
                response: {},
            },
        })
}

type IterationResult = {
    // Iteration input
    item: unknown
    // Iteration index
    index: number
    // Iteration state
    isPaused: boolean
    // Performed steps for the iteration
    steps: Record<string, StepOutput>
}