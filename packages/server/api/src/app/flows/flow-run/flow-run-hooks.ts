import { FlowRun } from '@activepieces/shared'
import { hooksFactory } from '../../helper/hooks-factory'

export type FlowRunHooks = {
    onFinish(flowRun: FlowRun): Promise<void>
}

export const flowRunHooks = hooksFactory.create<FlowRunHooks>(() => {
    return {
        onFinish: async () => {
            // Do nothing
        },
    }
})