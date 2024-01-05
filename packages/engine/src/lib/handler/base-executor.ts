import { Action } from '@activepieces/shared'
import { FlowExecutorContext } from './context/flow-execution-context'
import { EngineConstantData } from './context/engine-constants-data'

export type BaseExecutor<T extends Action> = {
    handle(request: {
        action: T
        executionState: FlowExecutorContext
        constants: EngineConstantData
    }): Promise<FlowExecutorContext>
}

