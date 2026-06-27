import { describe, expect, it } from 'vitest'
import { pieceExpertise } from '../../../../src/app/mcp/tools/piece-expertise'

describe('pieceExpertise.getNotes', () => {
    it('returns curated notes by short name and by full piece name', () => {
        expect(pieceExpertise.getNotes({ pieceName: 'airtable' })).toMatch(/linked-record/i)
        expect(pieceExpertise.getNotes({ pieceName: '@activepieces/piece-airtable' })).toMatch(/linked-record/i)
    })

    it('appends the action-specific note when an action is given', () => {
        const note = pieceExpertise.getNotes({ pieceName: 'airtable', actionName: 'find_record' })
        expect(note).toContain('list_records')
    })

    it('encodes the high-value traps (Stripe dollars, Sheets letters, Slack channel id)', () => {
        expect(pieceExpertise.getNotes({ pieceName: 'stripe' })).toMatch(/decimal|dollars|smallest unit/i)
        expect(pieceExpertise.getNotes({ pieceName: 'google-sheets' })).toMatch(/letter/i)
        expect(pieceExpertise.getNotes({ pieceName: 'slack' })).toMatch(/channel id|Cxxxx|resolved/i)
    })

    it('returns undefined for an uncurated piece (generic-first: absence is fine)', () => {
        expect(pieceExpertise.getNotes({ pieceName: 'some-obscure-piece' })).toBeUndefined()
        expect(pieceExpertise.hasNotes({ pieceName: 'some-obscure-piece' })).toBe(false)
    })
})
