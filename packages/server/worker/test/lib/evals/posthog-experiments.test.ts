import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { posthogDataset } from './posthog-dataset'
import { posthogExperiments } from './posthog-experiments'

vi.mock('./posthog-dataset', () => ({ posthogDataset: { request: vi.fn() } }))

describe('posthogExperiments.baseline', () => {
    const request = vi.mocked(posthogDataset.request)
    const scorerNames = ['Expected behavior', 'Valid tool calls', 'Honest about results']

    beforeEach(() => {
        request.mockReset()
    })

    function mockBaseline({ items, cells, payload }: { items: unknown[], cells: unknown[], payload: unknown }): void {
        request.mockImplementation(async ({ path, query }) => {
            if (path === '/ai_observability/offline_experiments/') {
                return { results: [{ id: 'exp-1', application_version: 'abc' }] }
            }
            if (path === '/llm_analytics/score_definitions/') {
                const name = scorerNames.find((candidate) => candidate === query?.['search'])
                return { results: [{ id: `def-${name}`, name, archived: false, current_version_id: `ver-${name}` }] }
            }
            if (path.endsWith('/items/')) {
                return { next_cursor: null, results: items }
            }
            if (path === '/ai_observability/offline_experiments/exp-1/items/tools/payload/') {
                return payload
            }
            return { results: cells }
        })
    }

    it('never creates scorers and reports no baseline when they are missing', async () => {
        request.mockImplementation(async ({ path }) => path.startsWith('/ai_observability/') ? { results: [{ id: 'exp-1', application_version: 'abc' }] } : { results: [] })

        const found = await posthogExperiments.baseline({ suiteKey: 'chat-core', modelVersion: 'm' })

        expect(found).toBeNull()
        expect(request.mock.calls.every(([params]) => (params.method ?? 'GET') === 'GET')).toBe(true)
    })

    it('reads pass and fail counts per case using only GET requests', async () => {
        mockBaseline({
            items: [{ id: 'i1', case_key: 'case-1' }, { id: 'i2', case_key: 'case-1' }],
            cells: [
                { item_id: 'i1', status: 'ok', value: true },
                { item_id: 'i1', status: 'ok', value: true },
                { item_id: 'i1', status: 'ok', value: true },
                { item_id: 'i2', status: 'ok', value: false },
            ],
            payload: null,
        })

        const found = await posthogExperiments.baseline({ suiteKey: 'chat-core', modelVersion: 'm' })

        expect(found?.counts.get('case-1')).toEqual({ pass: 1, fail: 1 })
        expect(request.mock.calls.every(([params]) => (params.method ?? 'GET') === 'GET')).toBe(true)
    })

    it('counts a run as pass only when every gate passed, like the current run does', async () => {
        mockBaseline({
            items: [{ id: 'i1', case_key: 'case-1' }, { id: 'i2', case_key: 'case-1' }],
            cells: [
                { item_id: 'i1', status: 'ok', value: true },
                { item_id: 'i1', status: 'ok', value: true },
                { item_id: 'i1', status: 'ok', value: true },
                { item_id: 'i2', status: 'not_applicable', value: null },
                { item_id: 'i2', status: 'ok', value: true },
                { item_id: 'i2', status: 'ok', value: true },
            ],
            payload: null,
        })

        const found = await posthogExperiments.baseline({ suiteKey: 'chat-core', modelVersion: 'm' })

        expect(found?.counts.get('case-1')).toEqual({ pass: 1, fail: 0 })
    })

    it('reads the tool definitions saved with the baseline and keeps them out of the case counts', async () => {
        mockBaseline({
            items: [{ id: 'i1', case_key: 'case-1' }, { id: 'tools', case_key: 'tool-definitions' }],
            cells: [{ item_id: 'i1', status: 'ok', value: true }],
            payload: { available: true, data: { input: { tools: { ap_list_flows: 'abc123' } } } },
        })

        const found = await posthogExperiments.baseline({ suiteKey: 'chat-core', modelVersion: 'm' })

        expect(found?.toolFingerprints).toEqual({ ap_list_flows: 'abc123' })
        expect([...(found?.counts.keys() ?? [])]).toEqual(['case-1'])
    })

    it('reports no tool definitions when the baseline has none or its payload expired', async () => {
        mockBaseline({ items: [{ id: 'tools', case_key: 'tool-definitions' }], cells: [], payload: { available: false, data: null } })

        const found = await posthogExperiments.baseline({ suiteKey: 'chat-core', modelVersion: 'm' })

        expect(found?.toolFingerprints).toBeNull()
    })
})

describe('posthogExperiments.upload', () => {
    const request = vi.mocked(posthogDataset.request)

    it('saves the tool definitions as one extra unscored item', async () => {
        request.mockReset()
        request.mockImplementation(async ({ path, query }) => path === '/llm_analytics/score_definitions/'
            ? { results: [{ id: 'def', name: query?.['search'], archived: false, current_version_id: `ver-${query?.['search']}` }] }
            : {})

        await posthogExperiments.upload({ runs: [], suiteKey: 'chat-core', runSource: 'local', applicationVersion: 'sha', modelVersion: 'm', promptVersion: 'p', toolFingerprints: { ap_list_flows: 'abc123' } })

        const bodies = request.mock.calls.map(([params]) => params)
        const created = bodies.find((params) => params.path === '/ai_observability/offline_experiments/' && params.method === 'POST')
        expect(created?.body).toEqual(expect.objectContaining({ expected_item_count: 1 }))
        const toolItem = bodies.flatMap((params) => UploadBody.safeParse(params.body).data?.items ?? []).find((item) => item.case_key === 'tool-definitions')
        expect(toolItem?.payload).toEqual(expect.objectContaining({ input: { tools: { ap_list_flows: 'abc123' } } }))
    })
})

const UploadBody = z.object({ items: z.array(z.object({ case_key: z.string(), payload: z.unknown() })) })
