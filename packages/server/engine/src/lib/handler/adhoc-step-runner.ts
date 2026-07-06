import { BaseEngineOperation, CodeAction, PieceAction, StepOutput } from '@activepieces/shared'
import { EngineConstants } from './context/engine-constants'
import { FlowExecutorContext } from './context/flow-execution-context'
import { flowExecutor } from './flow-executor'

export const adhocStepRunner = {
    async run({ step, operation }: RunAdhocStepParams): Promise<StepOutput> {
        const executionState = await flowExecutor.getExecutorForAction(step.type).handle({
            action: step,
            executionState: FlowExecutorContext.empty(),
            constants: EngineConstants.fromExecuteActionInput(operation),
        })
        return executionState.steps[step.name]
    },
}

type RunAdhocStepParams = {
    step: PieceAction | CodeAction
    operation: BaseEngineOperation
}
