import { performance } from 'node:perf_hooks'
import { EngineGenericError, ExecuteFlowOperation, ExecutionType, FlowAction, FlowActionType, FlowRunStatus, FlowTrigger, GenericStepOutput, isNil, StepOutputStatus } from '@activepieces/shared'
import dayjs from 'dayjs'
import { loggingUtils } from '../helper/logging-utils'
import { triggerHelper } from '../helper/trigger-helper'
import { BaseExecutor } from './base-executor'
import { codeExecutor } from './code-executor'
import { EngineConstants } from './context/engine-constants'
import { FlowExecutorContext } from './context/flow-execution-context'
import { loopExecutor } from './loop-executor'
import { pieceExecutor } from './piece-executor'
import { routerExecuter } from './router-executor'
import { runProgressService } from './run-progress'

function getExecuteFunction(): Record<FlowActionType, BaseExecutor<FlowAction>> {
    return {
        [FlowActionType.CODE]: codeExecutor,
        [FlowActionType.LOOP_ON_ITEMS]: loopExecutor,
        [FlowActionType.PIECE]: pieceExecutor,
        [FlowActionType.ROUTER]: routerExecuter,
    }
}

export const flowExecutor = {
    getExecutorForAction(type: FlowActionType): BaseExecutor<FlowAction> {
        const executeFunction = getExecuteFunction()
        const executor = executeFunction[type]

        if (isNil(executor)) {
            throw new EngineGenericError('ExecutorNotFoundError', `Executor not found for action type: ${type}`)
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
            void runProgressService.backup({
                engineConstants: constants,
                flowExecutorContext: executionState,
            }).catch((err) => {
                console.error('[Progress] Initial payload upload failed', err)
            })
            await triggerHelper.executeOnStart(trigger, constants, input.triggerPayload)
            await runProgressService.sendUpdate({
                engineConstants: constants,
                flowExecutorContext: executionState,
                stepNameToUpdate: trigger.name,
                startTime: dayjs().toISOString(),
            })
            executionState = applyLogSizeLimitIfExceeded(executionState, trigger)
            if (executionState.verdict.status !== FlowRunStatus.RUNNING) {
                return executionState
            }
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
        let previousAction: FlowAction | null | undefined = action
        let currentAction: FlowAction | null | undefined = action
        const testSingleStepMode = !isNil(constants.stepNameToTest)

        while (!isNil(currentAction)) {
            if (currentAction.skip && !testSingleStepMode) {
                previousAction = currentAction
                currentAction = currentAction.nextAction
                continue
            }
            const handler = this.getExecutorForAction(currentAction.type)

            await runProgressService.sendUpdate({
                engineConstants: constants,
                flowExecutorContext: flowExecutionContext,
                stepNameToUpdate: previousAction!.name,
            }).catch(error => {
                console.error('Error sending update:', error)
            })

            flowExecutionContext = await handler.handle({
                action: currentAction,
                executionState: flowExecutionContext,
                constants,
            })

            flowExecutionContext = applyLogSizeLimitIfExceeded(flowExecutionContext, currentAction)

            const shouldBreakExecution = flowExecutionContext.verdict.status !== FlowRunStatus.RUNNING || testSingleStepMode
            previousAction = currentAction
            currentAction = currentAction.nextAction

            if (shouldBreakExecution) {
                break
            }

        }

        await runProgressService.sendUpdate({
            engineConstants: constants,
            flowExecutorContext: flowExecutionContext,
            stepNameToUpdate: previousAction?.name,
        }).catch(error => {
            console.error('Error sending update:', error)
        })

        const flowEndTime = performance.now()
        return flowExecutionContext.setDuration(flowEndTime - flowStartTime)
    },
}

const applyLogSizeLimitIfExceeded = (
    flowExecutionContext: FlowExecutorContext,
    action: FlowAction | FlowTrigger,
): FlowExecutorContext => {
    if (loggingUtils.isWithinSizeLimit(flowExecutionContext.steps)) {
        return flowExecutionContext
    }
    return flowExecutionContext
        .upsertStep(action.name, GenericStepOutput.create({
            input: flowExecutionContext.getStepOutput(action.name)?.input,
            type: action.type,
            status: StepOutputStatus.FAILED,
            output: undefined,
        })
            .setErrorMessage(`Flow run data size exceeded the maximum allowed size of ${loggingUtils.maxLogSizeMb} MB`))
        .setVerdict({
            status: FlowRunStatus.LOG_SIZE_EXCEEDED,
            failedStep: {
                name: action.name,
                displayName: action.displayName,
                message: 'Flow run logs size exceeded',
            },
        })
}
