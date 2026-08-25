import { SuggestionType } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { pieceSearching } from '../../../../src/app/pieces/metadata/utils/piece-searching'
import { createMockPieceMetadata } from '../../../helpers/mocks'

const pieces = [
    createMockPieceMetadata({ name: '@activepieces/piece-discord', displayName: 'Discord', description: 'Send messages to Discord channels' }),
    createMockPieceMetadata({ name: '@activepieces/piece-slack', displayName: 'Slack', description: 'Send messages to Slack channels' }),
    createMockPieceMetadata({ name: '@activepieces/piece-gmail', displayName: 'Gmail', description: 'Send and read emails' }),
]

describe('pieceSearching.search — robustness to extra query words', () => {
    it('finds Discord even when the query has an extra word ("Discord webhook")', () => {
        const results = pieceSearching.search({
            categories: undefined,
            searchQuery: 'Discord webhook',
            pieces,
            suggestionType: SuggestionType.ACTION,
        })
        expect(results.map((p) => p.displayName)).toContain('Discord')
    })

    it('finds a piece by an exact one-word name', () => {
        const results = pieceSearching.search({
            categories: undefined,
            searchQuery: 'Discord',
            pieces,
            suggestionType: SuggestionType.ACTION,
        })
        expect(results.map((p) => p.displayName)).toContain('Discord')
    })

    it('returns all pieces when there is no query', () => {
        const results = pieceSearching.search({
            categories: undefined,
            searchQuery: undefined,
            pieces,
            suggestionType: SuggestionType.ACTION,
        })
        expect(results).toHaveLength(pieces.length)
    })
})
