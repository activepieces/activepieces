import { PieceAudienceFilter } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'

import { filterActionsByAudience } from '../../src/app/pieces/metadata/utils'

const actions = {
    slack_send_message: { audience: 'human' },
    slack_list_channels: {},
    slack_search_messages: { audience: 'ai' },
} as never

const names = (audience: PieceAudienceFilter | undefined): string[] =>
    Object.keys(filterActionsByAudience(actions, audience)).sort()

describe('filterActionsByAudience', () => {
    it('drops audience:ai actions when the caller sends no audience', () => {
        expect(names(undefined)).toEqual(['slack_list_channels', 'slack_send_message'])
    })

    it('drops audience:ai actions for HUMAN', () => {
        expect(names(PieceAudienceFilter.HUMAN)).toEqual(['slack_list_channels', 'slack_send_message'])
    })

    it('keeps every action for ALL', () => {
        expect(names(PieceAudienceFilter.ALL)).toEqual(['slack_list_channels', 'slack_search_messages', 'slack_send_message'])
    })
})
