import { SuggestionType, TriggerStrategy, TriggerTestStrategy } from '@activepieces/shared'
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
            untranslatedNames: new Map(),
            suggestionType: SuggestionType.ACTION,
        })
        expect(results.map((p) => p.displayName)).toContain('Discord')
    })

    it('finds a piece by an exact one-word name', () => {
        const results = pieceSearching.search({
            categories: undefined,
            searchQuery: 'Discord',
            pieces,
            untranslatedNames: new Map(),
            suggestionType: SuggestionType.ACTION,
        })
        expect(results.map((p) => p.displayName)).toContain('Discord')
    })

    it('returns all pieces when there is no query', () => {
        const results = pieceSearching.search({
            categories: undefined,
            searchQuery: undefined,
            pieces,
            untranslatedNames: new Map(),
            suggestionType: SuggestionType.ACTION,
        })
        expect(results).toHaveLength(pieces.length)
    })
})

describe('pieceSearching.search — translated display names', () => {
    it('finds a translated piece by its English name', () => {
        const textAi = createMockPieceMetadata({ name: '@activepieces/piece-text-ai', displayName: 'Text AI', description: 'Generate text with AI' })
        const textHelper = createMockPieceMetadata({ name: '@activepieces/piece-text-helper', displayName: 'テキストヘルパー', description: 'テキスト処理のためのツール' })
        const results = pieceSearching.search({
            categories: undefined,
            searchQuery: 'Text Helper',
            pieces: [...pieces, textAi, textHelper],
            untranslatedNames: new Map([['@activepieces/piece-text-helper', 'Text Helper']]),
            suggestionType: SuggestionType.ACTION,
        })
        expect(results[0]?.name).toBe('@activepieces/piece-text-helper')
    })

    it('suggests the triggers of a translated core piece searched by its English name', () => {
        const manualTrigger = createMockPieceMetadata({
            name: '@activepieces/piece-manual-trigger',
            displayName: '手動トリガー',
            triggers: {
                manual_trigger: {
                    name: 'manual_trigger',
                    displayName: '手動トリガー',
                    description: 'フローを手動で開始',
                    props: {},
                    requireAuth: false,
                    type: TriggerStrategy.MANUAL,
                    sampleData: {},
                    testStrategy: TriggerTestStrategy.SIMULATION,
                },
            },
        })
        const [result] = pieceSearching.search({
            categories: undefined,
            searchQuery: 'manual',
            pieces: [...pieces, manualTrigger],
            untranslatedNames: new Map([['@activepieces/piece-manual-trigger', 'Manual Trigger']]),
            suggestionType: SuggestionType.TRIGGER,
        })
        expect(result?.name).toBe('@activepieces/piece-manual-trigger')
        expect(Object.keys(result?.triggers ?? {})).toEqual(['manual_trigger'])
    })
})
