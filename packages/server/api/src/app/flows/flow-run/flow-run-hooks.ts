import { FlowRun } from '@activepieces/shared'

export type FlowRunHooks = {
    onFinish(flowRun: FlowRun): Promise<void>
}

const emptyHooks: FlowRunHooks = {
    async onFinish() {
        // DO NOTHING
    },
}

let hooks = emptyHooks

export const flowRunHooks = {
    setHooks(newHooks: FlowRunHooks) {
        hooks = newHooks
    },
    getHooks() {
        return hooks
    },
}
