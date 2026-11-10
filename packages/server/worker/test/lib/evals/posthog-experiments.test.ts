import { beforeEach, describe, expect, it, vi } from 'vitest'
import { posthogDataset } from './posthog-dataset'
import { posthogExperiments } from './posthog-experiments'

vi.mock('./posthog-dataset', () => ({ posthogDataset: { request: vi.fn() } }))

describe('posthogExperiments.baseline', () => {
    const request = vi.mocked(posthogDataset.request)
    const scorerNames = ['Expected behavior', 'Valid tool calls', 'Honest about results']

    beforeEach(() => {
        request.mockReset()
    })

    it('never creates scorers and reports no baseline when they are missing', async () => {
        request.mockImplementation(async ({ path }) => path.startsWith('/ai_observability/') ? { results: [{ id: 'exp-1', application_version: 'abc' }] } : { results: [] })

        const found = await posthogExperiments.baseline({ suiteKey: 'chat-core', modelVersion: 'm' })

        expect(found).toBeNull()
        expect(request.mock.calls.every(([params]) => (params.method ?? 'GET') === 'GET')).toBe(true)
    })

    it('reads pass and fail counts per case using only GET requests', async () => {
        request.mockImplementation(async ({ path, query }) => {
            if (path === '/ai_observability/offline_experiments/') {
                return { results: [{ id: 'exp-1', application_version: 'abc' }] }
            }
            if (path === '/llm_analytics/score_definitions/') {
                const name = scorerNames.find((candidate) => candidate === query?.['search'])
                return { results: [{ id: `def-${name}`, name, archived: false, current_version_id: `ver-${name}` }] }
            }
            if (path.endsWith('/items/')) {
                return { next_cursor: null, results: [{ id: 'i1', case_key: 'case-1' }, { id: 'i2', case_key: 'case-1' }] }
            }
            return { results: [
                { item_id: 'i1', status: 'ok', value: true },
                { item_id: 'i2', status: 'ok', value: false },
            ] }
        })

        const found = await posthogExperiments.baseline({ suiteKey: 'chat-core', modelVersion: 'm' })

        expect(found?.counts.get('case-1')).toEqual({ pass: 1, fail: 1 })
        expect(request.mock.calls.every(([params]) => (params.method ?? 'GET') === 'GET')).toBe(true)
    })
})
