import { ActionType, CodeAction, StepOutputStatus } from '@activepieces/shared'
import { BaseExecutor } from './base-executor'
import { EngineConstantData, ExecutionVerdict, FlowExecutorContext } from './context/flow-execution-context'
import { variableService } from '../services/variable-service'

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
        constants: EngineConstantData
    }) {
        if (executionState.isCompleted({ stepName: action.name })) {
            return executionState
        }
        const { censoredInput, resolvedInput } = await variableService.resolve({
            unresolvedInput: action.settings.input,
            executionState,
        })

        try {
            const artifactPath = `${constants.baseCodeDirectory}/${action.name}/index.js`
            const codePieceModule: CodePieceModule = await import(artifactPath)
            const output = await codePieceModule.code(resolvedInput)
            const stepOutput = {
                type: ActionType.CODE,
                status: StepOutputStatus.SUCCEEDED,
                input: censoredInput,
                output,
            }
            return executionState.upsertStep(action.name, stepOutput).setVerdict(ExecutionVerdict.SUCCEEDED)
        }
        catch (e) {
            console.error(e)
            const stepOutput = {
                type: ActionType.CODE,
                status: StepOutputStatus.FAILED,
                input: censoredInput,
                errorMessage: (e as Error).message,
            }
            return executionState.upsertStep(action.name, stepOutput).setVerdict(ExecutionVerdict.FAILED)
        }
    },
}