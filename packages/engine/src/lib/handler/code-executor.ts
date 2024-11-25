import path from 'path'
import importFresh from '@activepieces/import-fresh-webpack'
import { ActionType, CodeAction, FlowVersionState, GenericStepOutput, StepOutputStatus } from '@activepieces/shared'
import { initCodeSandbox } from '../core/code/code-sandbox'
import { CodeModule } from '../core/code/code-sandbox-common'
import { continueIfFailureHandler, handleExecutionError, runWithExponentialBackoff } from '../helper/error-handling'
import { ActionHandler, BaseExecutor } from './base-executor'
import { ExecutionVerdict } from './context/flow-execution-context'

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
    const { censoredInput, resolvedInput } = await constants.propsResolver.resolve<Record<string, unknown>>({
        unresolvedInput: action.settings.input,
        executionState,
    })

    const stepOutput = GenericStepOutput.create({
        input: censoredInput,
        type: ActionType.CODE,
        status: StepOutputStatus.SUCCEEDED,
    })

    try {
        const artifactPath = path.resolve(`${constants.baseCodeDirectory}/${constants.flowVersionId}/${action.name}/index.js`)
        const codeModule: CodeModule = constants.flowVersionState === FlowVersionState.DRAFT ? await importFresh(artifactPath) : await import(artifactPath)
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
