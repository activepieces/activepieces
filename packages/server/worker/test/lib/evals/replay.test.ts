import { describe, expect, it, vi } from 'vitest'
import { RecordedToolCall } from './eval-case'
import { replay } from './replay'

describe('replay.resolveCall', () => {
    it('never runs a write live in record mode when it has no recording', async () => {
        const caseReplay = replay.create({ recordedToolCalls: [] })
        const live = vi.fn(async () => ({ created: true }))

        const output = await replay.resolveCall({ caseReplay, recordMode: true, toolName: 'ap_create_agent', input: { name: 'x' }, live })

        expect(live).not.toHaveBeenCalled()
        expect(output).toEqual({ error: 'This tool is unavailable right now.' })
        expect(caseReplay.stops().map((stop) => stop.kind)).toEqual(['unrecorded_write'])
        expect(caseReplay.newFixtures()).toEqual([])
    })

    it('treats a tool that is not a known read as a write', async () => {
        const caseReplay = replay.create({ recordedToolCalls: [] })
        const live = vi.fn(async () => ({ ok: true }))

        await replay.resolveCall({ caseReplay, recordMode: true, toolName: 'ap_some_new_tool', input: {}, live })

        expect(live).not.toHaveBeenCalled()
        expect(caseReplay.stops().map((stop) => stop.kind)).toEqual(['unrecorded_write'])
    })

    it('runs a read live in record mode and saves it as a new recording', async () => {
        const caseReplay = replay.create({ recordedToolCalls: [] })
        const live = vi.fn(async () => ({ flows: [] }))

        const output = await replay.resolveCall({ caseReplay, recordMode: true, toolName: 'ap_list_flows', input: { limit: 5 }, live })

        expect(live).toHaveBeenCalledOnce()
        expect(output).toEqual({ flows: [] })
        expect(caseReplay.stops()).toEqual([])
        expect(caseReplay.newFixtures()).toEqual([{ toolName: 'ap_list_flows', input: { limit: 5 }, output: { flows: [] } }])
    })

    it('stops a read with no recording outside record mode without running it', async () => {
        const caseReplay = replay.create({ recordedToolCalls: [] })
        const live = vi.fn(async () => ({ flows: [] }))

        await replay.resolveCall({ caseReplay, recordMode: false, toolName: 'ap_list_flows', input: {}, live })

        expect(live).not.toHaveBeenCalled()
        expect(caseReplay.stops().map((stop) => stop.kind)).toEqual(['missing_fixture'])
    })

    it('answers a recorded write from its recording', async () => {
        const recordedToolCalls: RecordedToolCall[] = [{ toolName: 'ap_add_step', input: { flowId: 'f1', stepName: 'step_1' }, output: { success: true } }]
        const caseReplay = replay.create({ recordedToolCalls })

        const output = await replay.resolveCall({ caseReplay, recordMode: true, toolName: 'ap_add_step', input: { flowId: 'f1', stepName: 'step_1' }, live: undefined })

        expect(output).toEqual({ success: true })
        expect(caseReplay.stops()).toEqual([])
    })
})

describe('replay matching for writes', () => {
    const recordedToolCalls: RecordedToolCall[] = [{ toolName: 'ap_add_step', input: { flowId: 'f1', stepName: 'step_1' }, output: { success: true } }]

    it('stops a write whose input differs from the recording instead of answering it', async () => {
        const caseReplay = replay.create({ recordedToolCalls })

        const output = await replay.resolveCall({ caseReplay, recordMode: false, toolName: 'ap_add_step', input: { flowId: 'f2', stepName: 'step_1' }, live: undefined })

        expect(output).toEqual({ error: 'This tool is unavailable right now.' })
        expect(caseReplay.stops()).toEqual([expect.objectContaining({ toolName: 'ap_add_step', kind: 'write_input_differs', reason: expect.stringContaining('input differs from the recording') })])
        expect(caseReplay.stops().every(replay.endsTurn)).toBe(true)
    })

    it('uses each recording once, so a repeated write is unrecorded', async () => {
        const caseReplay = replay.create({ recordedToolCalls })
        const input = { flowId: 'f1', stepName: 'step_1' }

        await replay.resolveCall({ caseReplay, recordMode: false, toolName: 'ap_add_step', input, live: undefined })
        await replay.resolveCall({ caseReplay, recordMode: false, toolName: 'ap_add_step', input, live: undefined })

        expect(caseReplay.stops().map((stop) => stop.kind)).toEqual(['unrecorded_write'])
    })

    it('does not end the turn for a read with no recording', async () => {
        const caseReplay = replay.create({ recordedToolCalls: [{ toolName: 'ap_list_flows', input: { limit: 5 }, output: [] }] })

        await replay.resolveCall({ caseReplay, recordMode: false, toolName: 'ap_list_flows', input: { limit: 10 }, live: undefined })

        expect(caseReplay.stops().map((stop) => stop.kind)).toEqual(['missing_fixture'])
        expect(caseReplay.stops().some(replay.endsTurn)).toBe(false)
    })
})
