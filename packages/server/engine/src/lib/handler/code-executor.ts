import path from 'path'
import importFresh from '@activepieces/import-fresh-webpack'
import { LATEST_CONTEXT_VERSION } from '@activepieces/pieces-framework'
import { CodeAction, EngineGenericError, FlowActionKind, FlowGraphNode, FlowRunStatus, GenericStepOutput, isNil, StepOutputStatus } from '@activepieces/shared'
import { initCodeSandbox } from '../core/code/code-sandbox'
import { CodeModule } from '../core/code/code-sandbox-common'
import { continueIfFailureHandler, runWithExponentialBackoff } from '../helper/error-handling'
import { progressService } from '../services/progress.service'
import { utils } from '../utils'
import { BaseExecutor } from './base-executor'
import { EngineConstants } from './context/engine-constants'
import { FlowExecutorContext } from './context/flow-execution-context'

export const codeExecutor: BaseExecutor = {
    async handle({
        node,
        executionState,
        constants,
    }) {
        if (executionState.isCompleted({ stepName: node.id })) {
            return executionState
        }
        const resultExecution = await runWithExponentialBackoff(executionState, node, constants, executeAction)
        return continueIfFailureHandler(resultExecution, node, constants)
    },
}

async function executeAction({ node, executionState, constants }: { node: FlowGraphNode, executionState: FlowExecutorContext, constants: EngineConstants }) {
    const action = node.data as CodeAction
    const stepName = node.id
    const stepStartTime = performance.now()
    const { censoredInput, resolvedInput } = await constants.getPropsResolver(LATEST_CONTEXT_VERSION).resolve<Record<string, unknown>>({
        unresolvedInput: action.settings.input,
        executionState,
    })

    const stepOutput = GenericStepOutput.create({
        input: censoredInput,
        type: FlowActionKind.CODE,
        status: StepOutputStatus.RUNNING,
    })

    const { data: executionStateResult, error: executionStateError } = await utils.tryCatchAndThrowOnEngineError((async () => {
        await progressService.sendUpdate({
            engineConstants: constants,
            flowExecutorContext: executionState.upsertStep(stepName, stepOutput),
            stepNameToUpdate: stepName,
        })

        if (isNil(constants.runEnvironment)) {
            throw new EngineGenericError('RunEnvironmentNotSetError', 'Run environment is not set')
        }

        const artifactPath = path.resolve(`${constants.baseCodeDirectory}/${constants.flowVersionId}/${stepName}/index.js`)
        const codeModule: CodeModule = await importFresh(artifactPath)
        const codeSandbox = await initCodeSandbox()

        const output = await codeSandbox.runCodeModule({
            codeModule,
            inputs: resolvedInput,
        })

        return executionState.upsertStep(stepName, stepOutput.setOutput(output).setStatus(StepOutputStatus.SUCCEEDED).setDuration(performance.now() - stepStartTime)).incrementStepsExecuted()
    }))

    if (executionStateError) {
        const failedStepOutput = stepOutput
            .setStatus(StepOutputStatus.FAILED)
            .setErrorMessage(utils.formatError(executionStateError))
            .setDuration(performance.now() - stepStartTime)

        return executionState
            .upsertStep(stepName, failedStepOutput)
            .setVerdict({ status: FlowRunStatus.FAILED, failedStep: {
                name: stepName,
                displayName: action.displayName,
                message: utils.formatError(executionStateError),
            } })
    }

    return executionStateResult
}
