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
            return executionState
                .upsertStep(action.name, stepOutput.setStatus(StepOutputStatus.FAILED).setErrorMessage((e as Error).message))
                .setVerdict(ExecutionVerdict.FAILED, undefined)
        }
    },
}
