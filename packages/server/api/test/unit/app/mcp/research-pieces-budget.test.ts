import { MAX_TOOL_RESULT_BYTES } from '@activepieces/server-utils'
import { describe, expect, it } from 'vitest'
import { fitPiecesToBudget } from '../../../../src/app/mcp/tools/ap-research-pieces'

function fatPiece(index: number) {
    return {
        name: `@activepieces/piece-${index}`,
        displayName: `Piece ${index}`,
        actions: Array.from({ length: 60 }, (_, actionIndex) => ({
            name: `action_${actionIndex}`,
            displayName: `Action ${actionIndex}`,
            aiDescription: 'x'.repeat(1_200),
        })),
    }
}

function byteSize(value: unknown): number {
    return Buffer.byteLength(JSON.stringify(value), 'utf8')
}

describe('what ap_research_pieces is allowed to return', () => {
    it('leaves a small result exactly as it was', () => {
        const pieces = [{ name: '@activepieces/piece-webhook', displayName: 'Webhook' }]

        const result = fitPiecesToBudget(pieces)

        expect(result).toEqual({ pieces, trimmed: false })
    })

    it('brings a result no client could read back under the budget, and says it trimmed', () => {
        const pieces = Array.from({ length: 10 }, (_, index) => fatPiece(index))
        expect(byteSize(pieces)).toBeGreaterThan(MAX_TOOL_RESULT_BYTES)

        const result = fitPiecesToBudget(pieces)

        expect(result.trimmed).toBe(true)
        expect(byteSize(result.pieces)).toBeLessThanOrEqual(MAX_TOOL_RESULT_BYTES)
    })

    it('still names the pieces it found after trimming, so the model can look one up', () => {
        const pieces = Array.from({ length: 10 }, (_, index) => fatPiece(index))

        const { pieces: fitted } = fitPiecesToBudget(pieces)

        expect(fitted).toHaveLength(10)
        expect(fitted.map((piece) => piece.name)).toContain('@activepieces/piece-0')
    })
})
