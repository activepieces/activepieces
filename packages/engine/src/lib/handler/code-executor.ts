import path from 'path'
import importFresh from '@activepieces/import-fresh-webpack'
import { assertNotNullOrUndefined, CodeAction, FlowActionType, GenericStepOutput, StepOutputStatus } from '@activepieces/shared'
import { initCodeSandbox } from '../core/code/code-sandbox'
import { CodeModule } from '../core/code/code-sandbox-common'
import { continueIfFailureHandler, handleExecutionError, runWithExponentialBackoff } from '../helper/error-handling'
import { tryCatch } from '../helper/try-catch'
import { progressService } from '../services/progress.service'
import { ActionHandler, BaseExecutor } from './base-executor'
import { EngineConstants } from './context/engine-constants'
import { ExecutionVerdict, FlowExecutorContext } from './context/flow-execution-context'

export const codeExecutor: BaseExecutor<CodeAction> = {
    async handle({
        action,
        executionState,
        constants,
    }) {
        if (executionState.isCompleted({ stepName: action.name })) {
            return executionState
        }
        const resultExecution = await runWithExponentialBackoff(executionState, action, constants, executeAction)
        return continueIfFailureHandler(resultExecution, action, constants)
    },
}

const executeAction: ActionHandler<CodeAction> = async ({ action, executionState, constants }) => {
    const stepStartTime = performance.now()
    const { censoredInput, resolvedInput } = await constants.propsResolver.resolve<Record<string, unknown>>({
        unresolvedInput: action.settings.input,
        executionState,
    })

    const stepOutput = GenericStepOutput.create({
        input: censoredInput,
        type: FlowActionType.CODE,
        status: StepOutputStatus.RUNNING,
    })
    
    const { data: executionStateResult, error: executionStateError } = await tryCatch(prepareAndExecuteCodeAction({ action, executionState, constants, stepOutput, resolvedInput, stepStartTime }))

    if (executionStateError) {
        const handledError = handleExecutionError(executionStateError)

        const failedStepOutput = stepOutput
            .setStatus(StepOutputStatus.FAILED)
            .setErrorMessage(handledError.message)
            .setDuration(performance.now() - stepStartTime)

        return executionState
            .upsertStep(action.name, failedStepOutput)
            .setVerdict(ExecutionVerdict.FAILED, handledError.verdictResponse)
    }

    return executionStateResult
}

async function prepareAndExecuteCodeAction({ action, executionState, constants, stepOutput, resolvedInput, stepStartTime }: PrepareAndExecuteCodeActionParams): Promise<FlowExecutorContext> {
    await progressService.sendUpdate({
        engineConstants: constants,
        flowExecutorContext: executionState.upsertStep(action.name, stepOutput),
    })

    assertNotNullOrUndefined(constants.runEnvironment, 'Run environment is required')
    const artifactPath = path.resolve(`${constants.baseCodeDirectory}/${constants.flowVersionId}/${action.name}/index.js`)
    const codeModule: CodeModule = await importFresh(artifactPath)
    const codeSandbox = await initCodeSandbox()

    const output = await codeSandbox.runCodeModule({
        codeModule,
        inputs: resolvedInput,
    })

    return executionState.upsertStep(action.name, stepOutput.setOutput(output).setStatus(StepOutputStatus.SUCCEEDED).setDuration(performance.now() - stepStartTime))
}


type PrepareAndExecuteCodeActionParams = {
    action: CodeAction
    executionState: FlowExecutorContext
    constants: EngineConstants
    stepOutput: GenericStepOutput<FlowActionType.CODE, unknown>
    resolvedInput: Record<string, unknown>
    stepStartTime: number
}