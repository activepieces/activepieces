import { OAuth2GrantType } from '@activepieces/shared'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { oauth2Util } from '../../../../src/app/app-connection/app-connection-service/oauth2/oauth2-util'

const util = oauth2Util({} as never)
const nowSeconds = Math.round(Date.now() / 1000)

function connectionWith({ claimedAt, expiresIn }: { claimedAt: number | string, expiresIn?: number | string }): never {
    return {
        access_token: 'token',
        refresh_token: 'refresh',
        claimed_at: claimedAt,
        expires_in: expiresIn,
        grant_type: OAuth2GrantType.AUTHORIZATION_CODE,
    } as never
}

describe('oauth2Util.isExpired', () => {
    beforeAll(() => {
        vi.useFakeTimers()
        vi.setSystemTime(nowSeconds * 1000)
    })

    afterAll(() => {
        vi.useRealTimers()
    })

    it('numeric expires_in 3600, claimed 2h ago → expired', () => {
        expect(util.isExpired(connectionWith({ claimedAt: nowSeconds - 2 * 60 * 60, expiresIn: 3600 }))).toBe(true)
    })

    it('string expires_in "3600", claimed 2h ago → expired', () => {
        expect(util.isExpired(connectionWith({ claimedAt: nowSeconds - 2 * 60 * 60, expiresIn: '3600' }))).toBe(true)
    })

    it('string expires_in "3600", freshly claimed → not expired', () => {
        expect(util.isExpired(connectionWith({ claimedAt: nowSeconds, expiresIn: '3600' }))).toBe(false)
    })

    it('missing expires_in falls back to 1h: claimed 2h ago → expired', () => {
        expect(util.isExpired(connectionWith({ claimedAt: nowSeconds - 2 * 60 * 60 }))).toBe(true)
    })

    it('non-numeric expires_in falls back to 1h: claimed 2h ago → expired', () => {
        expect(util.isExpired(connectionWith({ claimedAt: nowSeconds - 2 * 60 * 60, expiresIn: 'not-a-number' }))).toBe(true)
    })

    it('zero expires_in falls back to 1h: freshly claimed → not expired', () => {
        expect(util.isExpired(connectionWith({ claimedAt: nowSeconds, expiresIn: 0 }))).toBe(false)
    })

    it('negative expires_in falls back to 1h: freshly claimed → not expired', () => {
        expect(util.isExpired(connectionWith({ claimedAt: nowSeconds, expiresIn: '-5' }))).toBe(false)
    })

    it('infinite expires_in falls back to 1h: claimed 2h ago → expired', () => {
        expect(util.isExpired(connectionWith({ claimedAt: nowSeconds - 2 * 60 * 60, expiresIn: '1e999' }))).toBe(true)
    })

    it('string claimed_at is coerced (would concatenate with expires_in otherwise) → expired', () => {
        expect(util.isExpired(connectionWith({ claimedAt: String(nowSeconds - 2 * 60 * 60), expiresIn: 3600 }))).toBe(true)
    })

    it('non-numeric claimed_at is treated as epoch → expired', () => {
        expect(util.isExpired(connectionWith({ claimedAt: 'not-a-number', expiresIn: 3600 }))).toBe(true)
    })

    it('infinite claimed_at is treated as epoch → expired', () => {
        expect(util.isExpired(connectionWith({ claimedAt: '1e999', expiresIn: 3600 }))).toBe(true)
    })
})

describe('oauth2Util.formatOAuth2Response', () => {
    it('normalizes a string expires_in from the token endpoint to a number', () => {
        const formatted = util.formatOAuth2Response({ access_token: 'token', expires_in: '3600' } as never)
        expect(formatted.expires_in).toBe(3600)
    })

    it('keeps a numeric expires_in as-is', () => {
        const formatted = util.formatOAuth2Response({ access_token: 'token', expires_in: 3600 } as never)
        expect(formatted.expires_in).toBe(3600)
    })

    it('drops a non-numeric expires_in so consumers fall back to the default lifetime', () => {
        const formatted = util.formatOAuth2Response({ access_token: 'token', expires_in: 'not-a-number' } as never)
        expect(formatted.expires_in).toBeUndefined()
    })

    it('drops zero, negative, and infinite expires_in', () => {
        expect(util.formatOAuth2Response({ access_token: 'token', expires_in: 0 } as never).expires_in).toBeUndefined()
        expect(util.formatOAuth2Response({ access_token: 'token', expires_in: '-5' } as never).expires_in).toBeUndefined()
        expect(util.formatOAuth2Response({ access_token: 'token', expires_in: '1e999' } as never).expires_in).toBeUndefined()
    })
})
