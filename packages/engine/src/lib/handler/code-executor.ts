import { ActionType, CodeAction, GenricStepOutput, StepOutputStatus } from '@activepieces/shared'
import { BaseExecutor } from './base-executor'
import { ExecutionVerdict, FlowExecutorContext } from './context/flow-execution-context'
import { EngineConstants } from './context/engine-constants'

type CodePieceModule = {
    code(params: unknown): Promise<unknown>
}

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

        const runWithExponentialBackoff = async (retryCount = 0): Promise<FlowExecutorContext> => {
            const { censoredInput, resolvedInput } = await constants.variableService.resolve({
                unresolvedInput: action.settings.input,
                executionState,
            })
            const stepOutput = GenricStepOutput.create({
                input: censoredInput,
                type: ActionType.CODE,
                status: StepOutputStatus.SUCCEEDED,
            })
            try {
                const artifactPath = `${constants.baseCodeDirectory}/${action.name}/index.js`
                const codePieceModule: CodePieceModule = await import(artifactPath)
                const output = await codePieceModule.code(resolvedInput)
                return executionState.upsertStep(action.name, stepOutput.setOutput(output)).increaseTask()
            }
            catch (e) {
                console.error(e)

                if (!constants.testSingleStepMode && action.settings.errorHandlingOptions?.retryOnFailure && retryCount < EngineConstants.MAX_RETRIES) {
                    const backoffTime = Math.pow(6, retryCount) * 1000
                    await new Promise(resolve => setTimeout(resolve, backoffTime))
                    return runWithExponentialBackoff(retryCount + 1)
                }

                if (!constants.testSingleStepMode && action.settings.errorHandlingOptions?.continueOnFailure) {
                    return executionState.upsertStep(action.name, stepOutput.setStatus(StepOutputStatus.FAILED).setErrorMessage((e as Error).message)).increaseTask()
                }
                else {
                    return executionState
                        .upsertStep(action.name, stepOutput.setStatus(StepOutputStatus.FAILED).setErrorMessage((e as Error).message))
                        .setVerdict(ExecutionVerdict.FAILED, undefined)
                }
            }
        }

        // Initial call
        return runWithExponentialBackoff()
    },
}
