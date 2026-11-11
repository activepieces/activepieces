import { jsonSchema, tool, ToolSet } from 'ai'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
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

describe('replay live tools', () => {
    it('runs a web or catalog read live even when it has a recording, and never saves it', async () => {
        const caseReplay = replay.create({ recordedToolCalls: [{ toolName: 'ap_web_search', input: { query: 'crm' }, output: 'old answer' }] })
        const live = vi.fn(async () => 'fresh answer')

        const output = await replay.resolveCall({ caseReplay, recordMode: true, toolName: 'ap_web_search', input: { query: 'crm' }, live })

        expect(output).toBe('fresh answer')
        expect(live).toHaveBeenCalledOnce()
        expect(caseReplay.stops()).toEqual([])
        expect(caseReplay.newFixtures()).toEqual([])
    })

    it('runs a live tool with no recording outside record mode', async () => {
        const caseReplay = replay.create({ recordedToolCalls: [] })
        const live = vi.fn(async () => ({ actions: [] }))

        await replay.resolveCall({ caseReplay, recordMode: false, toolName: 'ap_search_actions', input: { query: 'send email' }, live })

        expect(live).toHaveBeenCalledOnce()
        expect(caseReplay.stops()).toEqual([])
    })

    it('still answers a workspace read from its recording', async () => {
        const caseReplay = replay.create({ recordedToolCalls: [{ toolName: 'ap_list_flows', input: { limit: 5 }, output: ['recorded flow'] }] })
        const live = vi.fn(async () => [])

        const output = await replay.resolveCall({ caseReplay, recordMode: false, toolName: 'ap_list_flows', input: { limit: 5 }, live })

        expect(output).toEqual(['recorded flow'])
        expect(live).not.toHaveBeenCalled()
    })

    it('treats every live tool as a read', () => {
        expect(['ap_web_search', 'ap_fetch_url', 'ap_search_actions', 'ap_get_piece_props', 'ap_load_skill'].every((name) => replay.isLive(name) && replay.isRead(name))).toBe(true)
        expect(replay.isLive('ap_list_flows')).toBe(false)
        expect(replay.isLive('ap_resolve_property_options')).toBe(false)
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

describe('replay input matching', () => {
    const matches = ({ recorded, called }: { recorded: unknown, called: unknown }): boolean => {
        const caseReplay = replay.create({ recordedToolCalls: [{ toolName: 'ap_list_flows', input: recorded, output: 'recorded' }] })
        return caseReplay.take({ toolName: 'ap_list_flows', input: called }).found
    }

    it('ignores surrounding and repeated whitespace', () => {
        expect(matches({ recorded: { query: 'send  email\n' }, called: { query: ' send email' } })).toBe(true)
    })

    it('ignores card title keys and key order', () => {
        expect(matches({
            recorded: { title: 'Looking up flows', activeTitle: 'a', doneTitle: 'b', limit: 5, status: 'ENABLED' },
            called: { status: 'ENABLED', limit: 5, title: 'Checking your flows' },
        })).toBe(true)
    })

    it('treats the short and full forms of a piece name as the same piece', () => {
        expect(matches({ recorded: { pieceName: '@activepieces/piece-google-sheets' }, called: { pieceName: 'google_sheets' } })).toBe(true)
        expect(matches({ recorded: { pieceName: 'piece-gmail' }, called: { pieceName: '@activepieces/piece-gmail' } })).toBe(true)
    })

    it('does not ignore letter case', () => {
        expect(matches({ recorded: { query: 'Send Email' }, called: { query: 'send email' } })).toBe(false)
    })

    it('does not ignore query strings, fragments, protocol or trailing slashes in URLs', () => {
        expect(matches({ recorded: { url: 'https://example.com/docs?page=1' }, called: { url: 'https://example.com/docs?page=2' } })).toBe(false)
        expect(matches({ recorded: { url: 'https://example.com/docs#a' }, called: { url: 'https://example.com/docs#b' } })).toBe(false)
        expect(matches({ recorded: { url: 'https://example.com/docs' }, called: { url: 'http://example.com/docs' } })).toBe(false)
        expect(matches({ recorded: { url: 'https://example.com/docs/' }, called: { url: 'https://example.com/docs' } })).toBe(false)
    })

    it('strips the piece prefix only from the pieceName field', () => {
        expect(matches({ recorded: { query: '@activepieces/piece-gmail' }, called: { query: 'gmail' } })).toBe(false)
    })

    it('ignores card titles only at the top level, not title fields inside the data', () => {
        expect(matches({ recorded: { records: [{ title: 'Buy milk' }] }, called: { records: [{ title: 'Buy eggs' }] } })).toBe(false)
    })
})

describe('replay.splitStale', () => {
    const tools: ToolSet = {
        ap_list_flows: tool({ inputSchema: z.object({ limit: z.number(), status: z.enum(['ENABLED', 'DISABLED']).optional() }) }),
        ap_add_step: tool({ inputSchema: jsonSchema({
            type: 'object',
            properties: { flowId: { type: 'string' }, stepName: { type: 'string' }, kind: { type: 'string', enum: ['PIECE', 'CODE'] } },
            required: ['flowId', 'stepName'],
            additionalProperties: false,
        }) }),
    }

    it('keeps recordings the current tools still accept', async () => {
        const recordedToolCalls: RecordedToolCall[] = [
            { toolName: 'ap_list_flows', input: { limit: 5 }, output: [] },
            { toolName: 'ap_add_step', input: { flowId: 'f1', stepName: 'step_1', kind: 'PIECE' }, output: { success: true } },
        ]

        const { fresh, stale } = await replay.splitStale({ tools, recordedToolCalls })

        expect(fresh).toEqual(recordedToolCalls)
        expect(stale).toEqual([])
    })

    it('flags a recording whose input a zod schema now rejects', async () => {
        const { fresh, stale } = await replay.splitStale({ tools, recordedToolCalls: [{ toolName: 'ap_list_flows', input: { limit: 5, status: 'ARCHIVED' }, output: [] }] })

        expect(fresh).toEqual([])
        expect(stale).toEqual([expect.objectContaining({ toolName: 'ap_list_flows', reason: expect.stringContaining('rejects the recorded input') })])
    })

    it('flags a missing required field, an unknown field and a removed enum value in a JSON schema', async () => {
        const { stale } = await replay.splitStale({ tools, recordedToolCalls: [
            { toolName: 'ap_add_step', input: { flowId: 'f1' }, output: null },
            { toolName: 'ap_add_step', input: { flowId: 'f1', stepName: 's', oldField: 1 }, output: null },
            { toolName: 'ap_add_step', input: { flowId: 'f1', stepName: 's', kind: 'BRANCH' }, output: null },
        ] })

        expect(stale.map((recording) => recording.reason)).toEqual([
            expect.stringContaining('missing required stepName'),
            expect.stringContaining('unknown oldField'),
            expect.stringContaining('kind "BRANCH" is not an allowed value'),
        ])
    })

    it('leaves recordings of live tools out of the replay without flagging them', async () => {
        const { fresh, stale } = await replay.splitStale({ tools, recordedToolCalls: [{ toolName: 'ap_web_search', input: { query: 'crm' }, output: 'old' }] })

        expect(fresh).toEqual([])
        expect(stale).toEqual([])
    })

    it('flags a recording for a tool the agent is no longer offered', async () => {
        const { stale } = await replay.splitStale({ tools, recordedToolCalls: [{ toolName: 'ap_removed_tool', input: {}, output: null }] })

        expect(stale).toEqual([{ toolName: 'ap_removed_tool', reason: 'the agent is no longer offered this tool' }])
    })
})
