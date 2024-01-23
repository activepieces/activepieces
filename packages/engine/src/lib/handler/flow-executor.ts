import { Action, ActionType, isNil } from '@activepieces/shared'
import { codeExecutor } from './code-executor'
import { ExecutionVerdict, FlowExecutorContext } from './context/flow-execution-context'
import { branchExecutor } from './branch-executor'
import { BaseExecutor } from './base-executor'
import { loopExecutor } from './loop-executor'
import { pieceExecutor } from './piece-executor'
import { EngineConstants } from './context/engine-constants'

const executeFunction: Record<ActionType, BaseExecutor<Action>> = {
    [ActionType.CODE]: codeExecutor,
    [ActionType.BRANCH]: branchExecutor,
    [ActionType.LOOP_ON_ITEMS]: loopExecutor,
    [ActionType.PIECE]: pieceExecutor,
}

export const flowExecutor = {
    getExecutorForAction(type: ActionType): BaseExecutor<Action> {
        const executor = executeFunction[type]
        if (isNil(executor)) {
            throw new Error('Not implemented')
        }
        return executor
    },
    async execute({ action, constants, executionState }: {
        action: Action
        executionState: FlowExecutorContext
        constants: EngineConstants
    }): Promise<FlowExecutorContext> {
        const startTime = new Date().getMilliseconds()
        let flowExecutionContext = executionState
        let currentAction: Action | undefined = action
        while (!isNil(currentAction)) {
            const handler = this.getExecutorForAction(currentAction.type)
            flowExecutionContext = await handler.handle({
                action: currentAction,
                executionState: flowExecutionContext,
                constants,
            })
            if (flowExecutionContext.verdict !== ExecutionVerdict.RUNNING) {
                return flowExecutionContext
            }
            currentAction = currentAction.nextAction
        }
        return flowExecutionContext.setDuration(new Date().getMilliseconds() - startTime)
    },
}
