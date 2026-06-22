import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import { isCustomAuthTokenStale } from '../../../../src/app/app-connection/app-connection-service/app-connection.handler'

const BUFFER_SECONDS = 15 * 60
const NOW = dayjs().unix()

describe('isCustomAuthTokenStale', () => {
    describe('when has_refresh_callback is false', () => {
        it('returns false when access_token is present (refresh is confirmed to skip)', () => {
            expect(isCustomAuthTokenStale({ has_refresh_callback: false, access_token: 'tok' })).toBe(false)
            expect(isCustomAuthTokenStale({ has_refresh_callback: false, access_token: 'tok', token_expires_at: NOW - 1 })).toBe(false)
        })

        it('returns false when recovery was already attempted', () => {
            expect(isCustomAuthTokenStale({ has_refresh_callback: false, refresh_recovery_attempted: true })).toBe(false)
        })

        it('returns true when no access_token and no recovery yet (allows one recovery attempt)', () => {
            expect(isCustomAuthTokenStale({ has_refresh_callback: false })).toBe(true)
            expect(isCustomAuthTokenStale({ has_refresh_callback: false, access_token: undefined })).toBe(true)
        })
    })

    describe('when has_refresh_callback is true or undefined (first call)', () => {
        it('returns true when access_token is missing (first call, optimistic)', () => {
            expect(isCustomAuthTokenStale({ has_refresh_callback: undefined })).toBe(true)
            expect(isCustomAuthTokenStale({ has_refresh_callback: true, access_token: undefined })).toBe(true)
            expect(isCustomAuthTokenStale({})).toBe(true)
        })

        it('returns false when access_token is present but token_expires_at is missing (no expiry)', () => {
            expect(isCustomAuthTokenStale({ access_token: 'tok', token_expires_at: undefined })).toBe(false)
            expect(isCustomAuthTokenStale({ has_refresh_callback: true, access_token: 'tok' })).toBe(false)
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
