import { Action } from '@activepieces/shared'
import { FlowExecutorContext } from './context/flow-execution-context'
import { EngineConstants } from './context/engine-constants'

export type ActionHandler<T extends Action> = (request: { action: T, executionState: FlowExecutorContext, constants: EngineConstants }) => Promise<FlowExecutorContext>

export type BaseExecutor<T extends Action> = {
    handle(request: {
        action: T
        executionState: FlowExecutorContext
        constants: EngineConstants
    }): Promise<FlowExecutorContext>
}
