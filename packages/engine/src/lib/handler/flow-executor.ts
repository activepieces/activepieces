import { Action, ActionType, isNil } from '@activepieces/shared'
import { codeExecutor } from './code-executor'
import { EngineConstantData, ExecutionVerdict, FlowExecutorContext } from './context/flow-execution-context'
import { branchExecutor } from './branch-executor'
import { BaseExecutor } from './base-executor'
import { loopExecutor } from './loop-executor'
import { pieceExecutor } from './piece-executor'

const executeFunction: Record<ActionType, BaseExecutor<Action>> = {
    [ActionType.CODE]: codeExecutor,
    [ActionType.BRANCH]: branchExecutor,
    [ActionType.LOOP_ON_ITEMS]: loopExecutor,
    [ActionType.PIECE]: pieceExecutor,
}

export const flowExecutorNew = {
    async execute({ action, constants, executionState }: {
        action: Action
        executionState: FlowExecutorContext
        constants: EngineConstantData
    }): Promise<FlowExecutorContext> {
        let flowExecutionContext = executionState
        let currentAction: Action | undefined = action
        while (!isNil(currentAction)) {
            const handler = executeFunction[currentAction.type]
            if (isNil(handler)) {
                throw new Error('Not implemented')
            }
            flowExecutionContext = await handler.handle({
                action: currentAction,
                executionState: flowExecutionContext,
                constants,
            })
            if (flowExecutionContext.verdict === ExecutionVerdict.FAILED) {
                return flowExecutionContext
            }
            currentAction = currentAction.nextAction
        }
        return flowExecutionContext.setVerdict(ExecutionVerdict.SUCCEEDED)
    },
}
