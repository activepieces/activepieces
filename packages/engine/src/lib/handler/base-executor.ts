import { Action } from '@activepieces/shared'
import { EngineConstantData, FlowExecutorContext } from './context/flow-execution-context'

export type BaseExecutor<T extends Action> = {
    handle(request: {
        action: T
        executionState: FlowExecutorContext
        constants: EngineConstantData
    }): Promise<FlowExecutorContext>
}

