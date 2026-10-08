import { MAX_TOOL_RESULT_BYTES } from '@activepieces/server-utils'
import { describe, expect, it } from 'vitest'
import { fitEnrichedResponse } from '../../../../src/app/mcp/tools/ap-research-pieces'

const SLIM_PIECE = { name: '@activepieces/piece-webhook', displayName: 'Webhook', description: 'Receive HTTP requests.' }

function piece({ index, actionCount, detailLength, aiLength }: { index: number, actionCount: number, detailLength: number, aiLength: number }) {
    return {
        ...SLIM_PIECE,
        name: `@activepieces/piece-${index}`,
        actions: Array.from({ length: actionCount }, (_, action) => ({
            name: `an_action_name_long_enough_to_count_${action}_of_piece_${index}`,
            displayName: `Action ${action}`,
            description: 'y'.repeat(detailLength),
            requiresAuth: true,
            cardinality: 'other' as const,
            aiDescription: 'x'.repeat(aiLength),
        })),
    }
}

function pieces({ count, actionCount, detailLength, aiLength }: { count: number, actionCount: number, detailLength: number, aiLength: number }) {
    return Array.from({ length: count }, (_, index) => piece({ index, actionCount, detailLength, aiLength }))
}

function fit(input: Array<typeof SLIM_PIECE | ReturnType<typeof piece>>) {
    return fitEnrichedResponse({ pieces: input, overflowHint: '', totalCount: input.length })
}

function byteSize(value: unknown): number {
    return Buffer.byteLength(JSON.stringify(value), 'utf8')
}

describe('what ap_research_pieces is allowed to return', () => {
    it('leaves a result that already fits completely alone', () => {
        const result = fit([SLIM_PIECE])

        expect(result.structuredContent).toMatchObject({ pieces: [SLIM_PIECE], trimmed: false })
    })

    it('measures what it sends, envelope included, not just the piece array', () => {
        const result = fit(pieces({ count: 10, actionCount: 30, detailLength: 200, aiLength: 1_200 }))

        expect(byteSize(result)).toBeLessThanOrEqual(MAX_TOOL_RESULT_BYTES)
        expect(result.structuredContent.trimmed).toBe(true)
    })

    // detailLength 0 forces the names-only rung: dropping descriptions alone leaves it over budget.
    it.each([1_200, 0])('never leaves a half-built action entry, at detail length %i', (detailLength) => {
        const result = fit(pieces({ count: 10, actionCount: 130, detailLength, aiLength: detailLength }))

        const actions = (result.structuredContent.pieces as Array<{ actions?: unknown[] }>).flatMap((found) => found.actions ?? [])
        for (const action of actions) {
            expect(action, JSON.stringify(action)).toHaveProperty('name')
        }
    })

    it('still names every piece it found, so the model can look one up', () => {
        const input = pieces({ count: 10, actionCount: 60, detailLength: 1_200, aiLength: 1_200 })

        const found = fit(input).structuredContent.pieces as Array<{ name: string }>

        expect(found.map((piece) => piece.name)).toEqual(input.map((piece) => piece.name))
    })

    it('says so rather than emitting a payload no client can read, when even names do not fit', () => {
        const result = fit(Array.from({ length: 3_000 }, (_, index) => ({
            ...SLIM_PIECE,
            name: `@activepieces/piece-with-a-fairly-long-name-${index}`,
        })))

        expect(result.content[0].text).toContain('too many to name here')
        expect(result.structuredContent).toMatchObject({ pieces: [], trimmed: true })
    })
})
