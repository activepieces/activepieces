import { isObject } from '@activepieces/core-utils'
import { SendAgentEventRequest } from '@activepieces/shared'
import { describe, expect, it, vi } from 'vitest'
import { agentWorkerTools, GateDecision } from '../../../../../../src/lib/execute/jobs/ee/agent/agent-worker-tools'
import { toolHasExecute } from '../../../../../../src/lib/execute/jobs/ee/agent/tools/tool-primitives'

describe('wrapDeleteGate', () => {
    it('asks the user before every delete, and deletes only after they approve', async () => {
        const { tools, deleteRecords, waitForApproval, sentEvents } = setup({ decision: 'approved' })

        await tools.ap_delete_records.execute({ tableId: 't1', recordIds: ['r1', 'r2'], displayName: 'Delete a harmless temp row' }, { toolCallId: 'call-1' })

        expect(JSON.stringify(sentEvents)).toContain('Delete 2 records from table t1')
        expect(JSON.stringify(sentEvents.map((event) => event.type))).toContain('ACTION_PREVIEW')
        expect(waitForApproval).toHaveBeenCalledWith({ gateId: 'call-1' })
        expect(deleteRecords).toHaveBeenCalledTimes(1)
    })

    it('does not delete when the user declines', async () => {
        const { tools, deleteRecords } = setup({ decision: 'declined' })

        const result = await tools.ap_delete_records.execute({ tableId: 't1' }, { toolCallId: 'call-1' })

        expect(deleteRecords).not.toHaveBeenCalled()
        expect(JSON.stringify(result)).toContain('declined')
    })

    it('asks before deleting a table field, but not before renaming one', async () => {
        const { tools, manageFields, waitForApproval } = setup({ decision: 'approved' })

        await tools.ap_manage_fields.execute({ tableId: 't1', operation: 'UPDATE', fieldId: 'f1', name: 'Title' }, { toolCallId: 'call-2' })
        expect(waitForApproval).not.toHaveBeenCalled()

        await tools.ap_manage_fields.execute({ tableId: 't1', operation: 'DELETE', fieldId: 'f1' }, { toolCallId: 'call-3' })
        expect(waitForApproval).toHaveBeenCalledWith({ gateId: 'call-3' })
        expect(manageFields).toHaveBeenCalledTimes(2)
    })

    it('leaves other writes alone', async () => {
        const { tools, insertRecords, waitForApproval } = setup({ decision: 'approved' })

        await tools.ap_insert_records.execute({ tableId: 't1' }, { toolCallId: 'call-4' })

        expect(waitForApproval).not.toHaveBeenCalled()
        expect(insertRecords).toHaveBeenCalledTimes(1)
    })
})

function setup({ decision }: { decision: GateDecision['outcome'] }): {
    tools: Record<string, { execute: (args: unknown, options: { toolCallId: string }) => Promise<unknown> }>
    deleteRecords: ReturnType<typeof vi.fn>
    insertRecords: ReturnType<typeof vi.fn>
    manageFields: ReturnType<typeof vi.fn>
    waitForApproval: ReturnType<typeof vi.fn>
    sentEvents: SendAgentEventRequest['event'][]
} {
    const deleteRecords = vi.fn(async () => TOOL_RESULT)
    const insertRecords = vi.fn(async () => TOOL_RESULT)
    const manageFields = vi.fn(async () => TOOL_RESULT)
    const waitForApproval = vi.fn(async (): Promise<GateDecision> => ({ outcome: decision }))
    const sentEvents: SendAgentEventRequest['event'][] = []
    const eventEmitter = agentWorkerTools.createEventEmitter({
        sendEvent: async ({ event }) => {
            sentEvents.push(event)
        },
        userId: 'user-1',
        conversationId: 'conv-1',
    })
    const wrapped = agentWorkerTools.wrapDeleteGate({
        mcpTools: { ap_delete_records: { execute: deleteRecords }, ap_insert_records: { execute: insertRecords }, ap_manage_fields: { execute: manageFields } },
        waitForApproval,
        storePendingGate: async () => undefined,
        eventEmitter,
    })
    return { tools: toolsOf(wrapped), deleteRecords, insertRecords, manageFields, waitForApproval, sentEvents }
}

function toolsOf(wrapped: Record<string, unknown>): Record<string, { execute: (args: unknown, options: { toolCallId: string }) => Promise<unknown> }> {
    return Object.fromEntries(Object.entries(wrapped).flatMap(([name, value]) => isObject(value) && toolHasExecute(value) ? [[name, value]] : []))
}

const TOOL_RESULT = { content: [{ type: 'text', text: 'done' }] }
