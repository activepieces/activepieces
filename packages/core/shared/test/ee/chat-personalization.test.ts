import { ChatPersonalizationStatus, chatPersonalizationUtils } from '../../src/lib/ee/agent/chat-personalization'

describe('chatPersonalizationUtils', () => {
    describe('isPersonalDefaultPlatformName', () => {
        it.each([
            ["Ahmad's Platform"],
            ['Ahmad’s Platform'],
            ["Chris's Platform"],
            ['My Platform'],
            ["  Ahmad's Platform  "],
        ])('treats %s as a generated personal default', (name) => {
            expect(chatPersonalizationUtils.isPersonalDefaultPlatformName(name)).toBe(true)
        })

        it.each([
            ['Activepieces'],
            ['Acme Widgets'],
            ['Platform'],
            ['Ahmad'],
            ['Shopify Platform Team'],
        ])('treats %s as a real name', (name) => {
            expect(chatPersonalizationUtils.isPersonalDefaultPlatformName(name)).toBe(false)
        })
    })

    describe('companyFromPlatformName', () => {
        it.each([
            ['Activepieces', 'Activepieces'],
            ['Acme Widgets', 'Acme Widgets'],
            ['  Activepieces  ', 'Activepieces'],
        ])('offers %s as the company prefill', (name, expected) => {
            expect(chatPersonalizationUtils.companyFromPlatformName(name)).toBe(expected)
        })

        it.each([
            ["Ahmad's Platform"],
            ['My Platform'],
            [''],
            ['   '],
            [null],
            [undefined],
        ])('offers nothing for %s', (name) => {
            expect(chatPersonalizationUtils.companyFromPlatformName(name)).toBeNull()
        })
    })

    describe('shouldAskOnboarding', () => {
        it('asks only when no row exists', () => {
            expect(chatPersonalizationUtils.shouldAskOnboarding({ status: ChatPersonalizationStatus.UNSET })).toBe(true)
        })

        it.each([
            [ChatPersonalizationStatus.PENDING],
            [ChatPersonalizationStatus.RESEARCHING],
            [ChatPersonalizationStatus.READY],
            [ChatPersonalizationStatus.FAILED],
            [ChatPersonalizationStatus.SKIPPED],
            [ChatPersonalizationStatus.DISMISSED_LEGACY],
        ])('never re-asks once the row says %s', (status) => {
            expect(chatPersonalizationUtils.shouldAskOnboarding({ status })).toBe(false)
        })
    })

    describe('hasAnsweredOnboarding', () => {
        it.each([
            [ChatPersonalizationStatus.PENDING],
            [ChatPersonalizationStatus.RESEARCHING],
            [ChatPersonalizationStatus.READY],
            [ChatPersonalizationStatus.FAILED],
        ])('counts %s as answered', (status) => {
            expect(chatPersonalizationUtils.hasAnsweredOnboarding({ status })).toBe(true)
        })

        it.each([
            [ChatPersonalizationStatus.UNSET],
            [ChatPersonalizationStatus.SKIPPED],
            [ChatPersonalizationStatus.DISMISSED_LEGACY],
        ])('does not count %s as answered', (status) => {
            expect(chatPersonalizationUtils.hasAnsweredOnboarding({ status })).toBe(false)
        })
    })
})
