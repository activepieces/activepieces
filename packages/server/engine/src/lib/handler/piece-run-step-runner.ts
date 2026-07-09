import { BaseEngineOperation, CodeAction, PieceAction, StepOutput } from '@activepieces/shared'
import { EngineConstants } from './context/engine-constants'
import { FlowExecutorContext } from './context/flow-execution-context'
import { flowExecutor } from './flow-executor'

export const pieceRunStepRunner = {
    async run({ step, operation }: RunPieceRunStepParams): Promise<StepOutput> {
        const executionState = await flowExecutor.getExecutorForAction(step.type).handle({
            action: step,
            executionState: FlowExecutorContext.empty(),
            constants: EngineConstants.fromExecuteActionInput(operation),
        })
        return executionState.steps[step.name]
    },
}

type RunPieceRunStepParams = {
    step: PieceAction | CodeAction
    operation: BaseEngineOperation
}
