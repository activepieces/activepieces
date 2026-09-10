import { ActivepiecesError, tryCatchSync } from '@activepieces/core-utils'
import { describe, expect, it } from 'vitest'
import { managedAiCaller } from '../../../../src/app/ai/managed-ai-caller'

function refusalMessageOf(pieceVersion?: string): string {
    const { error } = tryCatchSync(() => managedAiCaller.assertReportsCost({ pieceVersion }))
    if (!(error instanceof ActivepiecesError) || !('message' in error.error.params)) {
        throw new Error('expected a refusal carrying a message')
    }
    return String(error.error.params.message)
}

describe('managedAiCaller.assertReportsCost', () => {
    it('refuses a caller that sends no piece version, which is every release before cost reporting', () => {
        expect(refusalMessageOf(undefined)).toMatch(/0\.11\.0 or newer/)
    })

    it('refuses an empty piece version, which carries no more than sending none', () => {
        expect(refusalMessageOf('')).toMatch(/0\.11\.0 or newer/)
    })

    it('names the piece in the refusal so the message is actionable', () => {
        expect(refusalMessageOf(undefined)).toMatch(/@activepieces\/piece-ai/)
    })

    it('allows a caller that reports the cost-reporting version', () => {
        expect(tryCatchSync(() => managedAiCaller.assertReportsCost({ pieceVersion: '0.11.0' })).error).toBeNull()
    })

    it('allows a caller on a later version, since it also reports cost', () => {
        expect(tryCatchSync(() => managedAiCaller.assertReportsCost({ pieceVersion: '0.14.2' })).error).toBeNull()
    })
})
