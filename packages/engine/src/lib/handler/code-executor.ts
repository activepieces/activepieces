import { ActionType, CodeAction, GenericStepOutput, StepOutputStatus } from '@activepieces/shared'
import { ActionHandler, BaseExecutor } from './base-executor'
import { ExecutionVerdict, FlowExecutorContext } from './context/flow-execution-context'
import { EngineConstants } from './context/engine-constants'
import { continueIfFailureHandler, handleExecutionError, runWithExponentialBackoff } from '../helper/error-handling'
import { initCodeSandbox } from '../core/code/code-sandbox'
import { CodeModule } from '../core/code/code-sandbox-common'

export const codeExecutor: BaseExecutor<CodeAction> = {
    async handle({
        action,
        executionState,
        constants,
    }: {
        action: CodeAction
        executionState: FlowExecutorContext
        constants: EngineConstants
    }) {
        if (executionState.isCompleted({ stepName: action.name })) {
            return executionState
        }
        const resultExecution = await runWithExponentialBackoff(executionState, action, constants, executeAction)
        return continueIfFailureHandler(resultExecution, action, constants)
    },
}

const executeAction: ActionHandler<CodeAction> = async ({ action, executionState, constants }) => {
    const { censoredInput, resolvedInput } = await constants.variableService.resolve<Record<string, unknown>>({
        unresolvedInput: action.settings.input,
        executionState,
    })

    const stepOutput = GenericStepOutput.create({
        input: censoredInput,
        type: ActionType.CODE,
        status: StepOutputStatus.SUCCEEDED,
    })

    try {
        const artifactPath = `${constants.baseCodeDirectory}/${action.name}/index.js`
        const codeModule: CodeModule = await import(artifactPath)
        const codeSandbox = await initCodeSandbox()

        const output = await codeSandbox.runCodeModule({
            codeModule,
            inputs: resolvedInput,
        })

        return executionState.upsertStep(action.name, stepOutput.setOutput(output)).increaseTask()
    }
    catch (e) {
        const handledError = handleExecutionError(e)

        const failedStepOutput = stepOutput
            .setStatus(StepOutputStatus.FAILED)
            .setErrorMessage(handledError.message)

        return executionState
            .upsertStep(action.name, failedStepOutput)
            .setVerdict(ExecutionVerdict.FAILED, handledError.verdictResponse)
    }
}
