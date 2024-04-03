import { Action } from '@activepieces/shared'
import { EngineConstants } from './context/engine-constants'
import { FlowExecutorContext } from './context/flow-execution-context'

export type ActionHandler<T extends Action> = (request: { action: T, executionState: FlowExecutorContext, constants: EngineConstants }) => Promise<FlowExecutorContext>

export type BaseExecutor<T extends Action> = {
    handle(request: {
        action: T
        executionState: FlowExecutorContext
        constants: EngineConstants
    }): Promise<FlowExecutorContext>
}
