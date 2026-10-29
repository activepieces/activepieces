import { isObject } from '@activepieces/core-utils'
import { describe, expect, it, vi } from 'vitest'
import { agentWorkerTools, GateDecision } from '../../../../../../src/lib/execute/jobs/ee/agent/agent-worker-tools'
import { toolHasExecute } from '../../../../../../src/lib/execute/jobs/ee/agent/tools/tool-primitives'

describe('wrapTestFlowGate', () => {
    it('asks the user before a live test when the write check fails, and does not run it when they decline', async () => {
        const { testFlow, runTest, waitForApproval } = setup({ checkFlowWrites: async () => {
            throw new Error('rpc timeout')
        } })

        const result = await testFlow({ flowId: 'flow-1' }, { toolCallId: 'call-1' })

        expect(waitForApproval).toHaveBeenCalledWith({ gateId: 'call-1' })
        expect(runTest).not.toHaveBeenCalled()
        expect(JSON.stringify(result)).toContain('cancelled')
    })

    it('runs a read-only flow without asking', async () => {
        const { testFlow, runTest, waitForApproval } = setup({ checkFlowWrites: async () => ({ hasWrites: false }) })

        await testFlow({ flowId: 'flow-1' }, { toolCallId: 'call-1' })

        expect(waitForApproval).not.toHaveBeenCalled()
        expect(runTest).toHaveBeenCalledTimes(1)
    })
})

function setup({ checkFlowWrites }: { checkFlowWrites: (flowId: string) => Promise<unknown> }): {
    testFlow: (args: unknown, options: { toolCallId: string }) => Promise<unknown>
    runTest: ReturnType<typeof vi.fn>
    waitForApproval: ReturnType<typeof vi.fn>
} {
    const runTest = vi.fn(async () => TOOL_RESULT)
    const waitForApproval = vi.fn(async (): Promise<GateDecision> => ({ outcome: 'declined' }))
    const eventEmitter = agentWorkerTools.createEventEmitter({
        sendEvent: async () => undefined,
        userId: 'user-1',
        conversationId: 'conv-1',
    })
    const wrapped = agentWorkerTools.wrapTestFlowGate({
        mcpTools: { ap_test_flow: { execute: runTest } },
        checkFlowWrites,
        waitForApproval,
        storePendingGate: async () => undefined,
        eventEmitter,
    })
    const testFlow = wrapped['ap_test_flow']
    if (!isObject(testFlow) || !toolHasExecute(testFlow)) {
        throw new Error('ap_test_flow was not wrapped')
    }
    return { testFlow: testFlow.execute, runTest, waitForApproval }
}

const TOOL_RESULT = { content: [{ type: 'text', text: 'done' }] }
