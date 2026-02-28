import { FlowGraphNode } from '@activepieces/shared'
import { EngineConstants } from './context/engine-constants'
import { FlowExecutorContext } from './context/flow-execution-context'

export type BaseExecutor = {
    handle(request: {
        node: FlowGraphNode
        executionState: FlowExecutorContext
        constants: EngineConstants
    }): Promise<FlowExecutorContext>
}
