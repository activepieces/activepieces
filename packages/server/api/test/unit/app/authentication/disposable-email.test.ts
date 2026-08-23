import { disposableEmail } from '../../../../src/app/authentication/lib/disposable-email'

describe('disposableEmail', () => {
    describe('isDisposable', () => {
        it.each([
            'someone@mailinator.com',
            'someone@guerrillamail.com',
            'someone@10minutemail.com',
        ])('rejects the throwaway provider in %s', (email) => {
            expect(disposableEmail.isDisposable(email)).toBe(true)
        })

        it.each([
            'ahmad@activepieces.com',
            'someone@gmail.com',
            'someone@outlook.com',
            'someone@googlemail.com',
        ])('accepts the real provider in %s', (email) => {
            expect(disposableEmail.isDisposable(email)).toBe(false)
        })

        it('matches a subdomain of a wildcard provider', () => {
            const wildcardHit = disposableEmail.isDisposable('someone@mail.mailinator.com')
            const unrelated = disposableEmail.isDisposable('someone@mailinator.com.activepieces.com')

            expect(wildcardHit).toBe(true)
            expect(unrelated).toBe(false)
        })

        it('ignores case and surrounding whitespace in the domain', () => {
            expect(disposableEmail.isDisposable('Someone@MAILINATOR.com ')).toBe(true)
        })

        it('treats an address with no domain as acceptable, leaving that to schema validation', () => {
            expect(disposableEmail.isDisposable('not-an-email')).toBe(false)
        })
    })
})
