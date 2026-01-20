import path from 'path'
import importFresh from '@activepieces/import-fresh-webpack'
import { LATEST_CONTEXT_VERSION } from '@activepieces/pieces-framework'
import { CodeAction, EngineGenericError, FlowActionType, FlowRunStatus, GenericStepOutput, isNil, StepOutputStatus } from '@activepieces/shared'
import { initCodeSandbox } from '../core/code/code-sandbox'
import { CodeModule } from '../core/code/code-sandbox-common'
import { continueIfFailureHandler, runWithExponentialBackoff } from '../helper/error-handling'
import { progressService } from '../services/progress.service'
import { utils } from '../utils'
import { ActionHandler, BaseExecutor } from './base-executor'

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
    const { censoredInput, resolvedInput } = await constants.getPropsResolver(LATEST_CONTEXT_VERSION).resolve<Record<string, unknown>>({
        unresolvedInput: action.settings.input,
        executionState,
    })

    const stepOutput = GenericStepOutput.create({
        input: censoredInput,
        type: FlowActionType.CODE,
        status: StepOutputStatus.RUNNING,
    })
    
    const { data: executionStateResult, error: executionStateError } = await utils.tryCatchAndThrowOnEngineError((async () => {
        await progressService.sendUpdate({
            engineConstants: constants,
            flowExecutorContext: executionState.upsertStep(action.name, stepOutput),
        })
    
        if (isNil(constants.runEnvironment)) {
            throw new EngineGenericError('RunEnvironmentNotSetError', 'Run environment is not set')
        }

        const artifactPath = path.resolve(`${constants.baseCodeDirectory}/${constants.flowVersionId}/${action.name}/index.js`)
        const codeModule: CodeModule = await importFresh(artifactPath)
        const codeSandbox = await initCodeSandbox()
    
        const output = await codeSandbox.runCodeModule({
            codeModule,
            inputs: resolvedInput,
        })
    
        return executionState.upsertStep(action.name, stepOutput.setOutput(output).setStatus(StepOutputStatus.SUCCEEDED).setDuration(performance.now() - stepStartTime)).incrementStepsExecuted()
    }))

    if (executionStateError) {
        const failedStepOutput = stepOutput
            .setStatus(StepOutputStatus.FAILED)
            .setErrorMessage(utils.formatError(executionStateError))
            .setDuration(performance.now() - stepStartTime)

        return executionState
            .upsertStep(action.name, failedStepOutput)
            .setVerdict({ status: FlowRunStatus.FAILED, failedStep: {
                name: action.name,
                displayName: action.displayName,
                message: utils.formatError(executionStateError),
            } })
    }

    return executionStateResult
}