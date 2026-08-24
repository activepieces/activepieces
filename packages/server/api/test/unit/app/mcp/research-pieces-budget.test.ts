import { MAX_TOOL_RESULT_BYTES } from '@activepieces/server-utils'
import { describe, expect, it } from 'vitest'
import { fitEnrichedResponse } from '../../../../src/app/mcp/tools/ap-research-pieces'

function component(index: number) {
    return {
        name: `action_${index}`,
        displayName: `Action ${index}`,
        description: 'y'.repeat(200),
        requiresAuth: true,
        cardinality: 'other' as const,
        aiDescription: 'x'.repeat(1_200),
    }
}

function fatPiece(index: number) {
    return {
        name: `@activepieces/piece-${index}`,
        displayName: `Piece ${index}`,
        description: `Piece ${index} description`,
        actions: Array.from({ length: 60 }, (_, actionIndex) => component(actionIndex)),
        triggers: Array.from({ length: 20 }, (_, triggerIndex) => component(triggerIndex)),
    }
}

// Sized so that keeping name plus displayName is the first rung that fits: enough components that
// the rung below (which also keeps requiresAuth and cardinality) is still over budget.
function wideePiece(index: number) {
    return {
        name: `@activepieces/piece-wide-${index}`,
        displayName: `Wide piece ${index}`,
        description: '',
        actions: Array.from({ length: 130 }, (_, actionIndex) => ({
            ...component(actionIndex),
            name: `a_fairly_long_action_name_number_${actionIndex}_for_piece_${index}`,
            description: '',
            aiDescription: '',
        })),
    }
}

function slimPiece() {
    return { name: '@activepieces/piece-webhook', displayName: 'Webhook', description: 'Receive HTTP requests.' }
}

function byteSize(value: unknown): number {
    return Buffer.byteLength(JSON.stringify(value), 'utf8')
}

function fit(pieces: ReturnType<typeof fatPiece>[] | ReturnType<typeof slimPiece>[]) {
    return fitEnrichedResponse({ pieces, overflowHint: '', totalCount: pieces.length })
}

describe('what ap_research_pieces is allowed to return', () => {
    it('leaves a result that already fits completely alone', () => {
        const response = fit([slimPiece()])

        expect(response.structuredContent.trimmed).toBe(false)
        expect(response.structuredContent.pieces).toEqual([slimPiece()])
    })

    it('measures what it actually sends, not just the piece array', () => {
        const response = fit(Array.from({ length: 10 }, (_, index) => fatPiece(index)))

        expect(byteSize(response)).toBeLessThanOrEqual(MAX_TOOL_RESULT_BYTES)
        expect(response.structuredContent.trimmed).toBe(true)
    })

    it.each([
        ['a rung that drops descriptions', Array.from({ length: 10 }, (_, index) => fatPiece(index))],
        ['a rung that keeps only names', Array.from({ length: 10 }, (_, index) => wideePiece(index))],
    ])('never leaves a half-built entry in an action list, at %s', (_label, pieces) => {
        const response = fit(pieces)

        for (const piece of response.structuredContent.pieces as Array<Record<string, unknown>>) {
            for (const key of ['actions', 'triggers']) {
                const components = piece[key]
                if (components === undefined) {
                    continue
                }
                for (const entry of components as unknown[]) {
                    expect(typeof entry, JSON.stringify(entry)).toBe('object')
                    expect(entry).toHaveProperty('name')
                }
            }
        }
    })

    it('still names every piece it found, so the model can look one up', () => {
        const pieces = Array.from({ length: 10 }, (_, index) => fatPiece(index))

        const response = fit(pieces)

        const names = (response.structuredContent.pieces as Array<{ name: string }>).map((piece) => piece.name)
        expect(names).toEqual(pieces.map((piece) => piece.name))
    })

    it('says so rather than emitting a payload no client can read, when even names do not fit', () => {
        const manyNames = Array.from({ length: 3_000 }, (_, index) => ({
            name: `@activepieces/piece-with-a-fairly-long-name-${index}`,
            displayName: `Piece With A Fairly Long Display Name ${index}`,
            description: '',
        }))

        const response = fitEnrichedResponse({ pieces: manyNames, overflowHint: '', totalCount: manyNames.length })

        expect(response.content[0].text).toContain('too many to describe here')
        expect(response.structuredContent.trimmed).toBe(true)
    })
})
