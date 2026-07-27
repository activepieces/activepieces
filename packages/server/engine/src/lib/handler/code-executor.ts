import path from 'path'
import { isNil, STEP_NAME_REGEX } from '@activepieces/core-utils'
import { LATEST_CONTEXT_VERSION } from '@activepieces/pieces-framework'
import { CodeAction, EngineGenericError, ExecutionError, ExecutionErrorType, FlowActionType, FlowRunStatus, GenericStepOutput, StepOutputStatus } from '@activepieces/shared'
import { initCodeSandbox } from '../core/code/code-sandbox'
import { continueIfFailureHandler, runWithExponentialBackoff } from '../helper/error-handling'
import { flowRunProgressReporter } from '../helper/flow-run-progress-reporter'
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
    const stepOutput = GenericStepOutput.create({
        input: {},
        type: FlowActionType.CODE,
        status: StepOutputStatus.RUNNING,
    })

    const { data: executionStateResult, error: executionStateError } = await utils.tryCatchAndThrowOnEngineError((async () => {
        const { censoredInput, resolvedInput } = await constants.getPropsResolver(LATEST_CONTEXT_VERSION).resolve<Record<string, unknown>>({
            unresolvedInput: action.settings.input,
            executionState,
        })
        stepOutput.input = censoredInput

        await flowRunProgressReporter.sendUpdate({
            engineConstants: constants,
            flowExecutorContext: await executionState.upsertStep(action.name, stepOutput),
            stepNameToUpdate: action.name,
        })

        if (isNil(constants.runEnvironment)) {
            throw new EngineGenericError('RunEnvironmentNotSetError', 'Run environment is not set')
        }

        if (!STEP_NAME_REGEX.test(action.name)) {
            // A malformed step name is bad user input, not an engine failure: fail the step
            // (USER) instead of raising an ENGINE error that would page oncall. Ingress + the
            // code-cache sink guard already block this upstream; this is the runtime backstop.
            throw new ExecutionError('InvalidStepName', `Invalid code step name: "${action.name}"`, ExecutionErrorType.USER)
        }
        const artifactPath = path.resolve(`${constants.baseCodeDirectory}/${constants.flowVersionId}/${action.name}/index.js`)
        const codeSandbox = await initCodeSandbox()

        const output = await codeSandbox.runCodeModule({
            codeFilePath: artifactPath,
            inputs: resolvedInput,
        })

        const succeeded = stepOutput.setOutput(output).setStatus(StepOutputStatus.SUCCEEDED).setDuration(performance.now() - stepStartTime)
        return (await executionState.upsertStep(action.name, succeeded)).incrementStepsExecuted()
    }))

    if (executionStateError) {
        const failedStepOutput = stepOutput
            .setStatus(StepOutputStatus.FAILED)
            .setErrorMessage(utils.formatError(executionStateError))
            .setDuration(performance.now() - stepStartTime)

        return (await executionState
            .upsertStep(action.name, failedStepOutput))
            .setVerdict({ status: FlowRunStatus.FAILED, failedStep: {
                name: action.name,
                displayName: action.displayName,
                message: utils.formatError(executionStateError),
            } })
    }

    return executionStateResult
}
