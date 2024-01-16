import { ActionType, CodeAction, GenericStepOutput, StepOutputStatus } from '@activepieces/shared'
import { BaseExecutor } from '../base-executor'
import { ExecutionVerdict, FlowExecutorContext } from '../context/flow-execution-context'
import { EngineConstants } from '../context/engine-constants'
import { CodeModule } from './code-executor-common'
import { codeExecutorSandbox } from './code-executor-sandbox'

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

            const output = await codeExecutorSandbox.run({
                codeModule,
                input: resolvedInput,
            })

            return executionState.upsertStep(action.name, stepOutput.setOutput(output)).increaseTask()
        }
        catch (e) {
            console.error(e)
            return executionState
                .upsertStep(action.name, stepOutput.setStatus(StepOutputStatus.FAILED).setErrorMessage((e as Error).message))
                .setVerdict(ExecutionVerdict.FAILED, undefined)
        }
    },
}
