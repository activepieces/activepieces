import { describe, expect, it } from 'vitest'
import { chatPositionUtils } from '../../src/lib/ee/chat/position-note'

const table = {
    type: 'table',
    id: 't1',
    name: 'Leads',
    projectId: 'p1',
}

const flow = {
    type: 'flow',
    id: 'f1',
    name: 'Onboarding',
    projectId: 'p1',
}

describe('chatPositionUtils.buildPositionHistoryLine', () => {
    it('prints a baseline "is on" line for the first positioned message', () => {
        expect(
            chatPositionUtils.buildPositionHistoryLine({ activeContext: table }),
        ).toBe('📍 User is on Leads')
    })

    it('includes the focused item in the label', () => {
        expect(
            chatPositionUtils.buildPositionHistoryLine({
                activeContext: { ...table, focus: { kind: 'table-cell', label: 'row 7 · Website' } },
            }),
        ).toBe('📍 User is on Leads · row 7 · Website')
    })

    it('prints nothing when the position is unchanged', () => {
        expect(
            chatPositionUtils.buildPositionHistoryLine({
                activeContext: table,
                previousContext: table,
            }),
        ).toBe('')
    })

    it('prints nothing when nothing is open', () => {
        expect(chatPositionUtils.buildPositionHistoryLine({})).toBe('')
    })

    it('names the previous resource when moving across resources', () => {
        expect(
            chatPositionUtils.buildPositionHistoryLine({
                activeContext: flow,
                previousContext: table,
            }),
        ).toBe('📍 User moved to Onboarding (from Leads)')
    })

    it('treats a focus change within the same resource as a move, naming the previous item', () => {
        const onRow7 = { ...table, focus: { kind: 'table-cell', label: 'row 7 · Website' } }
        const onRow8 = { ...table, focus: { kind: 'table-cell', label: 'row 8 · Website' } }
        expect(
            chatPositionUtils.buildPositionHistoryLine({
                activeContext: onRow8,
                previousContext: onRow7,
            }),
        ).toBe('📍 User moved to Leads · row 8 · Website (from row 7 · Website)')
    })

    it('falls back to a page label when a resource has no name', () => {
        expect(
            chatPositionUtils.buildPositionHistoryLine({
                activeContext: { type: 'connections', projectId: 'p1' },
            }),
        ).toBe('📍 User is on the connections page')
    })
})

describe('chatPositionUtils.isSamePosition', () => {
    it('is focus-aware: same table, different cell → not same', () => {
        const a = { ...table, focus: { kind: 'table-cell', label: 'row 7 · Website', ref: 'r7' } }
        const b = { ...table, focus: { kind: 'table-cell', label: 'row 8 · Website', ref: 'r8' } }
        expect(chatPositionUtils.isSamePosition(a, b)).toBe(false)
    })

    it('same resource and same focus → same', () => {
        const a = { ...table, focus: { kind: 'table-cell', label: 'row 7 · Website', ref: 'r7' } }
        const b = { ...table, focus: { kind: 'table-cell', label: 'row 7 · Website', ref: 'r7' } }
        expect(chatPositionUtils.isSamePosition(a, b)).toBe(true)
    })

    it('distinguishes a multi-step flow selection from a single-step one', () => {
        const single = { ...flow, focus: { kind: 'flow-step', label: 'Send Email', ref: 'step_1' } }
        const multi = {
            ...flow,
            focus: { kind: 'flow-steps', label: '3 steps selected (Send Email, Filter, Code)', ref: 'step_1,step_2,step_3' },
        }
        expect(chatPositionUtils.isSamePosition(single, multi)).toBe(false)
    })
})
