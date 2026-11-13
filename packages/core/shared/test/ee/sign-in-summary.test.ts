import { describe, expect, it } from 'vitest'
import { ApplicationEventName, buildMockEvent, SignUpEvent, summarizeApplicationEvent, UserIdentityProvider, UserSignedInEvent } from '../../src/index'

function signedInEvent(data: UserSignedInEvent['data']): UserSignedInEvent {
    const mock = UserSignedInEvent.parse(buildMockEvent({ event: ApplicationEventName.USER_SIGNED_IN, platformId: 'platform-id' }))
    return { ...mock, userEmail: 'priya@acme.com', data }
}

function signedUpEvent(data: SignUpEvent['data']): SignUpEvent {
    const mock = SignUpEvent.parse(buildMockEvent({ event: ApplicationEventName.USER_SIGNED_UP, platformId: 'platform-id' }))
    return { ...mock, userEmail: 'priya@acme.com', data }
}

describe('summarizes sign-in and sign-up rows with their method', () => {
    it.each([
        { data: { method: UserIdentityProvider.EMAIL }, expected: 'User priya@acme.com signed in with email' },
        { data: { method: UserIdentityProvider.GOOGLE }, expected: 'User priya@acme.com signed in with Google' },
        { data: { method: UserIdentityProvider.SAML }, expected: 'User priya@acme.com signed in with SAML' },
        { data: {}, expected: 'User priya@acme.com signed in' },
    ])('describes a sign-in with $data as "$expected"', ({ data, expected }) => {
        expect(summarizeApplicationEvent(signedInEvent(data))).toBe(expected)
    })

    it.each([
        { data: { method: UserIdentityProvider.GOOGLE, source: 'sso' as const }, expected: 'User priya@acme.com signed up with Google' },
        { data: { method: UserIdentityProvider.JWT, source: 'managed' as const }, expected: 'User priya@acme.com signed up with JWT' },
        { data: { source: 'sso' as const }, expected: 'User priya@acme.com signed up using email from sso' },
        { data: {}, expected: 'User priya@acme.com signed up' },
    ])('describes a sign-up with $data as "$expected"', ({ data, expected }) => {
        expect(summarizeApplicationEvent(signedUpEvent(data))).toBe(expected)
    })
})
