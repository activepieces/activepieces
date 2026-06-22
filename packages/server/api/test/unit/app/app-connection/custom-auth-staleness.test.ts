import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import { isCustomAuthTokenStale } from '../../../../src/app/app-connection/app-connection-service/app-connection.handler'

const BUFFER_SECONDS = 15 * 60
const NOW = dayjs().unix()

describe('isCustomAuthTokenStale', () => {
    describe('when access_token is missing', () => {
        it('returns true (piece never refreshed yet)', () => {
            expect(isCustomAuthTokenStale({})).toBe(true)
            expect(isCustomAuthTokenStale({ access_token: undefined })).toBe(true)
        })
    })

    describe('when access_token is present', () => {
        it('returns false when token_expires_at is missing (no expiry)', () => {
            expect(isCustomAuthTokenStale({ access_token: 'tok' })).toBe(false)
            expect(isCustomAuthTokenStale({ access_token: 'tok', token_expires_at: undefined })).toBe(false)
        })

        it('returns true when token expires within the 15-minute buffer', () => {
            const expiresWithinBuffer = NOW + BUFFER_SECONDS - 1
            expect(isCustomAuthTokenStale({ access_token: 'tok', token_expires_at: expiresWithinBuffer })).toBe(true)
        })

        it('returns true when token is already expired', () => {
            const alreadyExpired = NOW - 60
            expect(isCustomAuthTokenStale({ access_token: 'tok', token_expires_at: alreadyExpired })).toBe(true)
        })

        it('returns false when token expires well beyond the buffer', () => {
            const expiresLater = NOW + BUFFER_SECONDS + 60
            expect(isCustomAuthTokenStale({ access_token: 'tok', token_expires_at: expiresLater })).toBe(false)
        })

        it('returns true exactly at the buffer boundary', () => {
            const exactlyAtBuffer = NOW + BUFFER_SECONDS
            expect(isCustomAuthTokenStale({ access_token: 'tok', token_expires_at: exactlyAtBuffer })).toBe(true)
        })
    })
})
