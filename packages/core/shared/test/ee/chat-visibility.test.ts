import { describe, expect, it } from 'vitest'
import { ApEdition } from '../../src/lib/core/flag/flag'
import { chatVisibility } from '../../src/lib/ee/chat/chat-visibility'

const base = {
    isEmbedded: false,
    planChatEnabled: false,
    cloudRolloutOpen: false,
    userHasChatted: false,
}

describe('chatVisibility.resolveChatEnabled', () => {
    it('hides chat on Community regardless of flags', () => {
        expect(chatVisibility.resolveChatEnabled({ ...base, edition: ApEdition.COMMUNITY, planChatEnabled: true, cloudRolloutOpen: true, userHasChatted: true })).toBe(false)
    })

    it('hides chat for embedded users on every edition', () => {
        for (const edition of [ApEdition.COMMUNITY, ApEdition.ENTERPRISE, ApEdition.CLOUD]) {
            expect(chatVisibility.resolveChatEnabled({ ...base, edition, isEmbedded: true, planChatEnabled: true, cloudRolloutOpen: true, userHasChatted: true })).toBe(false)
        }
    })

    it('follows the plan flag on Enterprise', () => {
        expect(chatVisibility.resolveChatEnabled({ ...base, edition: ApEdition.ENTERPRISE, planChatEnabled: true })).toBe(true)
        expect(chatVisibility.resolveChatEnabled({ ...base, edition: ApEdition.ENTERPRISE, planChatEnabled: false, cloudRolloutOpen: true, userHasChatted: true })).toBe(false)
    })

    it('shows chat on Cloud while the rollout is open', () => {
        expect(chatVisibility.resolveChatEnabled({ ...base, edition: ApEdition.CLOUD, cloudRolloutOpen: true })).toBe(true)
    })

    it('grandfathers Cloud users who already chatted after the cap closes', () => {
        expect(chatVisibility.resolveChatEnabled({ ...base, edition: ApEdition.CLOUD, cloudRolloutOpen: false, userHasChatted: true })).toBe(true)
    })

    it('hides chat on Cloud for a fresh user once the cap closes', () => {
        expect(chatVisibility.resolveChatEnabled({ ...base, edition: ApEdition.CLOUD, cloudRolloutOpen: false, userHasChatted: false })).toBe(false)
    })

    it('keeps chat on Cloud for an entitled plan even after the cap closes', () => {
        expect(chatVisibility.resolveChatEnabled({ ...base, edition: ApEdition.CLOUD, planChatEnabled: true, cloudRolloutOpen: false })).toBe(true)
    })
})
