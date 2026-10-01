import { describe, expect, it } from 'vitest'
import { ApEdition } from '../../src/lib/core/flag/flag'
import { chatVisibility } from '../../src/lib/ee/agent/chat-visibility'

describe('chatVisibility.resolveChatEnabled', () => {
    it('hides chat on Community regardless of the plan', () => {
        expect(chatVisibility.resolveChatEnabled({ edition: ApEdition.COMMUNITY, isEmbedded: false, planChatEnabled: true })).toBe(false)
    })

    it('hides chat for embedded users on every edition', () => {
        for (const edition of [ApEdition.COMMUNITY, ApEdition.ENTERPRISE, ApEdition.CLOUD]) {
            expect(chatVisibility.resolveChatEnabled({ edition, isEmbedded: true, planChatEnabled: true })).toBe(false)
        }
    })

    it('follows the plan flag on Enterprise', () => {
        expect(chatVisibility.resolveChatEnabled({ edition: ApEdition.ENTERPRISE, isEmbedded: false, planChatEnabled: true })).toBe(true)
        expect(chatVisibility.resolveChatEnabled({ edition: ApEdition.ENTERPRISE, isEmbedded: false, planChatEnabled: false })).toBe(false)
    })

    it('shows chat to every Cloud user, whatever their plan', () => {
        expect(chatVisibility.resolveChatEnabled({ edition: ApEdition.CLOUD, isEmbedded: false, planChatEnabled: false })).toBe(true)
        expect(chatVisibility.resolveChatEnabled({ edition: ApEdition.CLOUD, isEmbedded: false, planChatEnabled: true })).toBe(true)
    })
})
