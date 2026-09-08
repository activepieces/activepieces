import { isObject, tryCatch } from '@activepieces/core-utils'
import { ToolExecutionOptions } from 'ai'
import { AgentEventEmitter, GateDecision, gateNoResponseMessage, toolHasExecute } from './tool-primitives'

export function wrapTestFlowGate({ mcpTools, checkFlowWrites, waitForApproval, storePendingGate, eventEmitter, log }: {
    mcpTools: Record<string, unknown>
    checkFlowWrites: (flowId: string) => Promise<unknown>
    waitForApproval: (params: { gateId: string, timeoutMs?: number }) => Promise<GateDecision>
    storePendingGate: (params: { gateId: string, toolName: string, displayName: string, toolInput: Record<string, unknown> }) => Promise<void>
    eventEmitter: AgentEventEmitter
    log?: { info?: (obj: Record<string, unknown>, msg: string) => void, warn: (obj: Record<string, unknown>, msg: string) => void }
}): Record<string, unknown> {
    const testFlow = mcpTools['ap_test_flow']
    if (!isObject(testFlow) || !toolHasExecute(testFlow)) {
        return mcpTools
    }
    const originalExecute = testFlow.execute.bind(testFlow)
    const wrapped = Object.assign({}, testFlow, {
        execute: async (args: unknown, options?: ToolExecutionOptions<undefined>) => {
            const flowId = isObject(args) && typeof args['flowId'] === 'string' ? args['flowId'] : undefined
            const gateId = options?.toolCallId
            if (flowId && gateId) {
                const { data: check, error } = await tryCatch(() => checkFlowWrites(flowId))
                if (error) {
                    log?.warn({ error, flow: { id: flowId } }, 'ap_test_flow write-check failed, running test without confirmation gate')
                }
                else if (isObject(check) && check['hasWrites'] === true) {
                    const writeSteps = Array.isArray(check['writeSteps']) ? check['writeSteps'].filter((s): s is string => typeof s === 'string') : []
                    const flowName = typeof check['flowName'] === 'string' ? check['flowName'] : 'this flow'
                    const gateLabel = writeSteps.length > 0
                        ? `Run a live test of "${flowName}" — performs: ${writeSteps.join(', ')}`
                        : `Run a live test of "${flowName}"`
                    // Render the confirmation card in the live session (and persist it for refresh).
                    // Without the emit the gate would block silently until the approval timeout.
                    eventEmitter.emitActionPreview({
                        toolCallId: gateId,
                        pieceName: '',
                        actionName: 'ap_test_flow',
                        actionDisplayName: gateLabel,
                        input: {},
                        isBatch: false,
                    })
                    await tryCatch(() => storePendingGate({
                        gateId,
                        toolName: 'ap_test_flow',
                        displayName: gateLabel,
                        toolInput: { flowId, writeSteps },
                    }))
                    log?.info?.({ gate: { id: gateId }, tool: { name: 'ap_test_flow' }, flow: { id: flowId }, writeStepCount: writeSteps.length }, 'Test-flow write gate opened, awaiting approval')
                    const decision = await waitForApproval({ gateId })
                    log?.info?.({ gate: { id: gateId }, tool: { name: 'ap_test_flow' }, decision: decision.outcome }, 'Test-flow write gate resolved')
                    if (decision.outcome !== 'approved') {
                        if (decision.outcome === 'timeout') {
                            return { content: [{ type: 'text', text: gateNoResponseMessage('live-test approval') }] }
                        }
                        const stepList = writeSteps.length > 0 ? ` It performs real actions: ${writeSteps.join(', ')}.` : ''
                        return { content: [{ type: 'text', text: `Live test cancelled by the user.${stepList} The user declined a real run that would perform these actions. Do not run it; offer to test with mock trigger data instead, or ask whether to proceed.` }] }
                    }
                }
            }
            return originalExecute(args, options)
        },
    })
    return { ...mcpTools, ap_test_flow: wrapped }
}

