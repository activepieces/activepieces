import { describe, it, expect } from 'vitest'
import { getWebhookUrl, getAppWebhookUrl } from '../../../../src/lib/execute/utils/webhook-url'
import { ensurePublicApiUrl } from '../../../../src/lib/worker'

describe('getWebhookUrl', () => {
    const flowId = 'flow-123'

    it('strips trailing slash to avoid double slash', () => {
        expect(getWebhookUrl('https://example.com/api/', flowId))
            .toBe('https://example.com/api/v1/webhooks/flow-123')
    })

    it('works when URL has no trailing slash', () => {
        expect(getWebhookUrl('https://example.com/api', flowId))
            .toBe('https://example.com/api/v1/webhooks/flow-123')
    })

    it('appends /test suffix when simulate is true', () => {
        expect(getWebhookUrl('https://example.com/api/', flowId, true))
            .toBe('https://example.com/api/v1/webhooks/flow-123/test')
    })

    it('does not append /test when simulate is false', () => {
        expect(getWebhookUrl('https://example.com/api/', flowId, false))
            .toBe('https://example.com/api/v1/webhooks/flow-123')
    })

    it('does not append /test when simulate is undefined', () => {
        expect(getWebhookUrl('https://example.com/api/', flowId, undefined))
            .toBe('https://example.com/api/v1/webhooks/flow-123')
    })
})

describe('getAppWebhookUrl', () => {
    it('strips trailing slash to avoid double slash', () => {
        expect(getAppWebhookUrl('https://example.com/api/', 'slack'))
            .toBe('https://example.com/api/v1/app-events/slack')
    })

    it('works when URL has no trailing slash', () => {
        expect(getAppWebhookUrl('https://example.com/api', 'slack'))
            .toBe('https://example.com/api/v1/app-events/slack')
    })

    it('produces correct path', () => {
        expect(getAppWebhookUrl('https://example.com/api/', 'google-sheets'))
            .toBe('https://example.com/api/v1/app-events/google-sheets')
    })
})

describe('ensurePublicApiUrl', () => {
    it('returns as-is when URL already ends with /api/', () => {
        expect(ensurePublicApiUrl('https://example.com/api/'))
            .toBe('https://example.com/api/')
    })

    it('adds trailing slash when URL ends with /api', () => {
        expect(ensurePublicApiUrl('https://example.com/api'))
            .toBe('https://example.com/api/')
    })

    it('appends api/ when URL ends with /', () => {
        expect(ensurePublicApiUrl('https://example.com/'))
            .toBe('https://example.com/api/')
    })

    it('appends /api/ when URL has no trailing slash', () => {
        expect(ensurePublicApiUrl('https://example.com'))
            .toBe('https://example.com/api/')
    })
})

describe('end-to-end: ensurePublicApiUrl + getWebhookUrl', () => {
    const flowId = 'flow-456'

    it.each([
        'https://example.com',
        'https://example.com/',
        'https://example.com/api',
        'https://example.com/api/',
    ])('produces correct webhook URL for publicUrl=%s', (publicUrl) => {
        const apiUrl = ensurePublicApiUrl(publicUrl)
        expect(getWebhookUrl(apiUrl, flowId))
            .toBe('https://example.com/api/v1/webhooks/flow-456')
    })

    it.each([
        'https://example.com',
        'https://example.com/',
        'https://example.com/api',
        'https://example.com/api/',
    ])('produces correct app webhook URL for publicUrl=%s', (publicUrl) => {
        const apiUrl = ensurePublicApiUrl(publicUrl)
        expect(getAppWebhookUrl(apiUrl, 'slack'))
            .toBe('https://example.com/api/v1/app-events/slack')
    })
})

describe('regression: cloud.activepieces.com double-slash bug', () => {
    const flowId = 'flow-abc'

    it('old behavior would produce double slash — fixed behavior produces correct URL', () => {
        // Before the fix, PUBLIC_URL was used directly (e.g. "https://cloud.activepieces.com/")
        // which produced "https://cloud.activepieces.com//v1/webhooks/flow-abc"
        const publicUrl = 'https://cloud.activepieces.com/'
        const apiUrl = ensurePublicApiUrl(publicUrl)
        expect(apiUrl).toBe('https://cloud.activepieces.com/api/')
        expect(getWebhookUrl(apiUrl, flowId))
            .toBe('https://cloud.activepieces.com/api/v1/webhooks/flow-abc')
    })

    it('handles cloud URL without trailing slash', () => {
        const publicUrl = 'https://cloud.activepieces.com'
        const apiUrl = ensurePublicApiUrl(publicUrl)
        expect(getWebhookUrl(apiUrl, flowId))
            .toBe('https://cloud.activepieces.com/api/v1/webhooks/flow-abc')
    })

    it('produces correct app webhook URL for cloud', () => {
        const publicUrl = 'https://cloud.activepieces.com'
        const apiUrl = ensurePublicApiUrl(publicUrl)
        expect(getAppWebhookUrl(apiUrl, 'slack'))
            .toBe('https://cloud.activepieces.com/api/v1/app-events/slack')
    })
})
