import { describe, expect, it } from 'vitest'
import { attributionUtils, SignUpMethod, UserIdentityProvider } from '../../../src'

describe('attributionUtils.signUpMethodFromProvider', () => {
    it.each([
        [UserIdentityProvider.EMAIL, SignUpMethod.EMAIL_CODE],
        [UserIdentityProvider.GOOGLE, SignUpMethod.GOOGLE],
        [UserIdentityProvider.SAML, SignUpMethod.SAML],
        [UserIdentityProvider.JWT, SignUpMethod.JWT],
    ])('should map %s to %s', (provider, method) => {
        expect(attributionUtils.signUpMethodFromProvider({ provider })).toBe(method)
    })

    it('should never record a Google identity finishing onboarding as an email-code sign-up', () => {
        expect(attributionUtils.signUpMethodFromProvider({ provider: UserIdentityProvider.GOOGLE })).not.toBe(SignUpMethod.EMAIL_CODE)
    })
})
