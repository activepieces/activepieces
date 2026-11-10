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
