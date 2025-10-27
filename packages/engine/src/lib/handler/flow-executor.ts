import { performance } from 'node:perf_hooks'
import { ExecuteFlowOperation, ExecutionType, FlowAction, FlowActionType, isNil } from '@activepieces/shared'
import { triggerHelper } from '../helper/trigger-helper'
import { progressService } from '../services/progress.service'
import { BaseExecutor } from './base-executor'
import { codeExecutor } from './code-executor'
import { EngineConstants } from './context/engine-constants'
import { ExecutionVerdict, FlowExecutorContext } from './context/flow-execution-context'
import { loopExecutor } from './loop-executor'
import { pieceExecutor } from './piece-executor'
import { routerExecuter } from './router-executor'

const executeFunction: Record<FlowActionType, BaseExecutor<FlowAction>> = {
    [FlowActionType.CODE]: codeExecutor,
    [FlowActionType.LOOP_ON_ITEMS]: loopExecutor,
    [FlowActionType.PIECE]: pieceExecutor,
    [FlowActionType.ROUTER]: routerExecuter,
}

export const flowExecutor = {
    getExecutorForAction(type: FlowActionType): BaseExecutor<FlowAction> {
        const executor = executeFunction[type]
        if (isNil(executor)) {
            throw new Error('Not implemented')
        }
        return executor
    },
    async executeFromTrigger({ executionState, constants, input }: {
        executionState: FlowExecutorContext
        constants: EngineConstants
        input: ExecuteFlowOperation
    }): Promise<FlowExecutorContext> {
        const trigger = input.flowVersion.trigger
        if (input.executionType === ExecutionType.BEGIN) {
            await triggerHelper.executeOnStart(trigger, constants, input.triggerPayload)
        }
        return flowExecutor.execute({
            action: trigger.nextAction,
            executionState,
            constants,
        })
    },
    async execute({ action, constants, executionState }: {
        action: FlowAction | null | undefined
        executionState: FlowExecutorContext
        constants: EngineConstants
    }): Promise<FlowExecutorContext> {
        const flowStartTime = performance.now()
        let flowExecutionContext = executionState
        let currentAction: FlowAction | null | undefined = action

        while (!isNil(currentAction)) {
            if (currentAction.skip) {
                currentAction = currentAction.nextAction
                continue
            }
            const handler = this.getExecutorForAction(currentAction.type)

            progressService.sendUpdate({
                engineConstants: constants,
                flowExecutorContext: flowExecutionContext,
            }).catch(error => {
                console.error('Error sending update:', error)
            })

            flowExecutionContext = await handler.handle({
                action: currentAction,
                executionState: flowExecutionContext,
                constants,
            })
            const testSingleStepMode = !isNil(constants.stepNameToTest)
            const shouldBreakExecution = flowExecutionContext.verdict !== ExecutionVerdict.RUNNING || testSingleStepMode

            if (shouldBreakExecution) {
                break
            }

            currentAction = currentAction.nextAction
        }

        const flowEndTime = performance.now()
        return flowExecutionContext.setDuration(flowEndTime - flowStartTime)
    },
}

