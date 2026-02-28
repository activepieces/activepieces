import { performance } from 'node:perf_hooks'
import { EngineGenericError, ExecuteFlowOperation, ExecutionType, FlowAction, FlowActionKind, FlowRunStatus, flowStructureUtil, isActionNodeData, isNil, isTriggerNodeData } from '@activepieces/shared'
import dayjs from 'dayjs'
import { triggerHelper } from '../helper/trigger-helper'
import { progressService } from '../services/progress.service'
import { BaseExecutor } from './base-executor'
import { codeExecutor } from './code-executor'
import { EngineConstants } from './context/engine-constants'
import { FlowExecutorContext } from './context/flow-execution-context'
import { loopExecutor } from './loop-executor'
import { pieceExecutor } from './piece-executor'
import { routerExecuter } from './router-executor'

function getExecuteFunction(): Record<FlowActionKind, BaseExecutor<FlowAction>> {
    return {
        [FlowActionKind.CODE]: codeExecutor,
        [FlowActionKind.LOOP_ON_ITEMS]: loopExecutor,
        [FlowActionKind.PIECE]: pieceExecutor,
        [FlowActionKind.ROUTER]: routerExecuter,
    }
}

export const flowExecutor = {
    getExecutorForAction(type: FlowActionKind): BaseExecutor<FlowAction> {
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
        const triggerNode = flowStructureUtil.getTriggerNode(input.flowVersion.graph)
        if (isNil(triggerNode) || !isTriggerNodeData(triggerNode.data)) {
            throw new EngineGenericError('TriggerNotFoundError', 'Trigger node not found in flow version graph')
        }
        if (input.executionType === ExecutionType.BEGIN) {
            await triggerHelper.executeOnStart(triggerNode.data, constants, input.triggerPayload)
            await progressService.sendUpdate({
                engineConstants: constants,
                flowExecutorContext: executionState,
                stepNameToUpdate: triggerNode.id,
                startTime: dayjs().toISOString(),
            })
        }
        const successorEdge = flowStructureUtil.getSuccessorEdge(input.flowVersion.graph, triggerNode.id)
        const stepNames = successorEdge?.target
            ? flowStructureUtil.getDefaultChain(input.flowVersion.graph, successorEdge.target)
            : []
        return flowExecutor.execute({
            stepNames,
            executionState,
            constants,
        })
    },
    async execute({ stepNames, constants, executionState }: {
        stepNames: string[]
        executionState: FlowExecutorContext
        constants: EngineConstants
    }): Promise<FlowExecutorContext> {
        const flowStartTime = performance.now()
        let flowExecutionContext = executionState
        const testSingleStepMode = !isNil(constants.stepNameToTest)
        const flowVersion = constants.flowVersion!
        let previousStepName: string | undefined

        for (const stepName of stepNames) {
            const currentNode = flowStructureUtil.getActionOrThrow(stepName, flowVersion)

            if (!isActionNodeData(currentNode.data)) {
                throw new EngineGenericError('InvalidNodeDataError', `Expected action node data for step: ${stepName}`)
            }

            const actionData = currentNode.data

            if (actionData.skip && !testSingleStepMode) {
                previousStepName = stepName
                continue
            }
            const handler = this.getExecutorForAction(actionData.kind)

            await progressService.sendUpdate({
                engineConstants: constants,
                flowExecutorContext: flowExecutionContext,
                stepNameToUpdate: previousStepName,
            }).catch(error => {
                console.error('Error sending update:', error)
            })

            flowExecutionContext = await handler.handle({
                action: actionData,
                executionState: flowExecutionContext,
                constants,
            })
            const shouldBreakExecution = flowExecutionContext.verdict.status !== FlowRunStatus.RUNNING || testSingleStepMode
            previousStepName = stepName

            if (shouldBreakExecution) {
                break
            }

        }

        await progressService.sendUpdate({
            engineConstants: constants,
            flowExecutorContext: flowExecutionContext,
            stepNameToUpdate: previousStepName,
        }).catch(error => {
            console.error('Error sending update:', error)
        })

        const flowEndTime = performance.now()
        return flowExecutionContext.setDuration(flowEndTime - flowStartTime)
    },
}
