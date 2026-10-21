import { describe, expect, it, vi } from 'vitest'
import { declinedActions } from '../../../../../../src/lib/execute/jobs/ee/agent/declined-actions'

describe('declinedActions', () => {
    it('declines a repeat of an action the user already said no to, without showing a new card', () => {
        const emitActionPreview = vi.fn()
        const declines = declinedActions.create({ eventEmitter: emitterWith(emitActionPreview) })

        declines.eventEmitter.emitActionPreview(preview('gate-1'))
        declines.recordDecision({ gateId: 'gate-1', approved: false })
        declines.eventEmitter.emitActionPreview(preview('gate-2'))

        expect(declines.isDeclined('gate-2')).toBe(true)
        expect(emitActionPreview).toHaveBeenCalledTimes(1)
    })

    it('keeps asking after an approval, and for other actions', () => {
        const emitActionPreview = vi.fn()
        const declines = declinedActions.create({ eventEmitter: emitterWith(emitActionPreview) })

        declines.eventEmitter.emitActionPreview(preview('gate-1'))
        declines.recordDecision({ gateId: 'gate-1', approved: true })
        declines.eventEmitter.emitActionPreview(preview('gate-2'))
        declines.eventEmitter.emitActionPreview({ ...preview('gate-3'), actionName: 'ap_delete_flow' })

        expect(declines.isDeclined('gate-2')).toBe(false)
        expect(declines.isDeclined('gate-3')).toBe(false)
        expect(emitActionPreview).toHaveBeenCalledTimes(3)
    })

    it('only keeps the refused operation declined, not the same action on something else', () => {
        const emitActionPreview = vi.fn()
        const declines = declinedActions.create({ eventEmitter: emitterWith(emitActionPreview) })
        const deleteFlow = (gateId: string, flowId: string, title: string) => ({ ...preview(gateId), actionName: 'ap_delete_flow', input: { flowId, title } })

        declines.eventEmitter.emitActionPreview(deleteFlow('gate-1', 'flow-a', 'Deleting flow A'))
        declines.recordDecision({ gateId: 'gate-1', approved: false })
        declines.eventEmitter.emitActionPreview(deleteFlow('gate-2', 'flow-a', 'Removing flow A'))
        declines.eventEmitter.emitActionPreview(deleteFlow('gate-3', 'flow-b', 'Deleting flow B'))

        expect(declines.isDeclined('gate-2')).toBe(true)
        expect(declines.isDeclined('gate-3')).toBe(false)
    })
})

function preview(toolCallId: string): { toolCallId: string, pieceName: string, actionName: string, actionDisplayName: string, input: Record<string, unknown>, isBatch: boolean } {
    return { toolCallId, pieceName: 'email', actionName: 'ap_send_email', actionDisplayName: 'Send email', input: {}, isBatch: false }
}

function emitterWith(emitActionPreview: () => void): Parameters<typeof declinedActions.create>[0]['eventEmitter'] {
    return { emitToolProgress: vi.fn(), emitActionPreview, emitActionReceipt: vi.fn(), emitImageGenerated: vi.fn(), emitFileProduced: vi.fn(), emitBuildPlan: vi.fn(), emitSubagentProgress: vi.fn() }
}
