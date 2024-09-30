import { performance } from 'node:perf_hooks'
import { Action, ActionType, isNil, ProgressUpdateType } from '@activepieces/shared'
import { progressService } from '../services/progress.service'
import { BaseExecutor } from './base-executor'
import { branchExecutor } from './branch-executor'
import { codeExecutor } from './code-executor'
import { EngineConstants } from './context/engine-constants'
import { ExecutionVerdict, FlowExecutorContext } from './context/flow-execution-context'
import { loopExecutor } from './loop-executor'
import { pieceExecutor } from './piece-executor'

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
        const flowStartTime = performance.now()
        let flowExecutionContext = executionState
        let currentAction: Action | undefined = action

        while (!isNil(currentAction)) {
            const handler = this.getExecutorForAction(currentAction.type)

            const stepStartTime = performance.now()
            flowExecutionContext = await handler.handle({
                action: currentAction,
                executionState: flowExecutionContext,
                constants,
            })
            const stepEndTime = performance.now()

            flowExecutionContext = flowExecutionContext.setStepDuration({
                stepName: currentAction.name,
                duration: stepEndTime - stepStartTime,
            })

            if (flowExecutionContext.verdict !== ExecutionVerdict.RUNNING) {
                break
            }

            const isNotNested = flowExecutionContext.currentPath.path.length === 0
            const sendContinuousProgress = isNotNested
                && constants.progressUpdateType === ProgressUpdateType.TEST_FLOW
            if (sendContinuousProgress) {
                progressService.sendUpdate({
                    engineConstants: constants,
                    flowExecutorContext: flowExecutionContext,
                }).catch((error) => {
                    console.error('Error sending progress update', error)
                })
            }

            currentAction = currentAction.nextAction
        }

        const flowEndTime = performance.now()
        return flowExecutionContext.setDuration(flowEndTime - flowStartTime)
    },
}
