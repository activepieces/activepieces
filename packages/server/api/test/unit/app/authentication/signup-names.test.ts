import { chatPersonalizationUtils } from '@activepieces/shared'
import { signupNames } from '../../../../src/app/authentication/lib/signup-names'

describe('signupNames', () => {
    describe('firstNameFromEmail', () => {
        it.each([
            ['ahmad@activepieces.com', 'Ahmad'],
            ['ahmad.tash@activepieces.com', 'Ahmad'],
            ['ahmad_tash@activepieces.com', 'Ahmad'],
            ['ahmad+work@activepieces.com', 'Ahmad'],
            ['AHMAD@activepieces.com', 'AHMAD'],
        ])('derives %s into %s', (email, expected) => {
            expect(signupNames.firstNameFromEmail(email)).toBe(expected)
        })

        it('falls back when the local part carries no letters or digits', () => {
            expect(signupNames.firstNameFromEmail('...@activepieces.com')).toBe('there')
        })
    })

    describe('splitFullName', () => {
        it.each([
            ['Ahmad Tash', 'Ahmad', 'Tash'],
            ['Ahmad', 'Ahmad', ''],
            ['  Ahmad   Tash  ', 'Ahmad', 'Tash'],
            ['Ahmad Bin Tash', 'Ahmad', 'Bin Tash'],
            ['ahmad tash', 'ahmad', 'tash'],
        ])('splits %s into %s / %s', (fullName, firstName, lastName) => {
            expect(
                signupNames.splitFullName({ fullName, email: 'someone@activepieces.com' }),
            ).toEqual({ firstName, lastName })
        })

        it('strips the characters the platform name rule rejects', () => {
            expect(
                signupNames.splitFullName({ fullName: 'J. Smith', email: 'j@activepieces.com' }),
            ).toEqual({ firstName: 'J', lastName: 'Smith' })
        })

        it('falls back to the email when the name carries nothing usable', () => {
            expect(
                signupNames.splitFullName({ fullName: '   ', email: 'ahmad@activepieces.com' }),
            ).toEqual({ firstName: 'Ahmad', lastName: '' })
        })
    })

    describe('platformNameFromPerson', () => {
        it.each([
            ['Ahmad', "Ahmad's Platform"],
            ['Ahmad Bin', "Ahmad's Platform"],
            ['Chris', "Chris's Platform"],
            ["Ahmad's", "Ahmad's Platform"],
        ])('names the platform from %s -> %s', (firstName, expected) => {
            expect(
                signupNames.platformNameFromPerson({ firstName, email: 'a.b@activepieces.com' }),
            ).toBe(expected)
        })

        it('falls back to the email local part when the person has no usable name', () => {
            expect(
                signupNames.platformNameFromPerson({ firstName: '', email: 'ahmad.tash@activepieces.com' }),
            ).toBe("Ahmad's Platform")
        })

        it('uses the whole fallback when neither the name nor the address yields a word', () => {
            expect(
                signupNames.platformNameFromPerson({ firstName: '', email: '___@activepieces.com' }),
            ).toBe('My Platform')
        })

        it('stays inside the platform name limit when the address is one long word', () => {
            const name = signupNames.platformNameFromPerson({
                firstName: '',
                email: `${'a'.repeat(120)}@activepieces.com`,
            })

            expect(name.length).toBeLessThanOrEqual(100)
        })

        it('never produces a name the platform name rule rejects', () => {
            const safeString = new RegExp('^[^./]+$')
            const name = signupNames.platformNameFromPerson({
                firstName: 'J./Smith',
                email: 'j@activepieces.com',
            })

            expect(name).toMatch(safeString)
            expect(name.length).toBeLessThanOrEqual(100)
        })
    })

    describe('generated platform names are recognised as personal defaults', () => {
        it.each([
            ['Ahmad'],
            ['Chris'],
            ["Ahmad's"],
            ['Ahmad Bin'],
            [''],
        ])('detects the name generated for %s', (firstName) => {
            const generated = signupNames.platformNameFromPerson({ firstName, email: 'ahmad.tash@gmail.com' })

            expect(chatPersonalizationUtils.isPersonalDefaultPlatformName(generated)).toBe(true)
            expect(chatPersonalizationUtils.companyFromPlatformName(generated)).toBeNull()
        })

        it('detects the whole-fallback name', () => {
            const generated = signupNames.platformNameFromPerson({ firstName: '', email: '___@gmail.com' })

            expect(generated).toBe('My Platform')
            expect(chatPersonalizationUtils.isPersonalDefaultPlatformName(generated)).toBe(true)
        })
    })

    describe('companyNameFromWorkEmail', () => {
        it.each([
            ['ahmad@activepieces.com', 'Activepieces'],
            ['ahmad@acme-widgets.com', 'Acme Widgets'],
            ['ahmad@mail.activepieces.com', 'Activepieces'],
            ['ahmad@activepieces.co.uk', 'Activepieces'],
            ['ahmad@eu.activepieces.co.uk', 'Activepieces'],
            ['ahmad@activepieces.io', 'Activepieces'],
        ])('reads the company out of %s -> %s', (email, expected) => {
            expect(signupNames.companyNameFromWorkEmail(email)).toBe(expected)
        })

        it.each([
            ['ahmad@gmail.com'],
            ['ahmad@googlemail.com'],
            ['ahmad@outlook.com'],
            ['ahmad@hotmail.com'],
            ['ahmad@yahoo.com'],
            ['ahmad@yahoo.co.uk'],
            ['ahmad@icloud.com'],
            ['ahmad@proton.me'],
            ['ahmad@qq.com'],
        ])('refuses the consumer provider %s', (email) => {
            expect(signupNames.companyNameFromWorkEmail(email)).toBeNull()
        })

        it.each([
            ['ahmad'],
            ['ahmad@'],
            ['ahmad@localhost'],
            ['ahmad@...'],
            [''],
        ])('refuses the unusable address %s', (email) => {
            expect(signupNames.companyNameFromWorkEmail(email)).toBeNull()
        })

        it('never produces a name the platform name rule rejects', () => {
            const safeString = new RegExp('^[^./]+$')

            expect(signupNames.companyNameFromWorkEmail('a@activepieces.com')).toMatch(safeString)
        })
    })

    describe('platformNameFromSignup', () => {
        it('prefers the company over the person on a work address', () => {
            expect(
                signupNames.platformNameFromSignup({ firstName: 'Ahmad', email: 'ahmad@activepieces.com' }),
            ).toBe('Activepieces')
        })

        it.each([
            ['Ahmad', 'ahmad@gmail.com', "Ahmad's Platform"],
            ['Chris', 'chris@yahoo.com', "Chris's Platform"],
            ['', 'ahmad.tash@gmail.com', "Ahmad's Platform"],
        ])('falls back to the person for %s at %s', (firstName, email, expected) => {
            expect(signupNames.platformNameFromSignup({ firstName, email })).toBe(expected)
        })

        it('uses the whole fallback when neither the company, the name, nor the address yields a word', () => {
            expect(
                signupNames.platformNameFromSignup({ firstName: '', email: '___@gmail.com' }),
            ).toBe('My Platform')
        })

        it('stays inside the platform name limit on a very long company domain', () => {
            const name = signupNames.platformNameFromSignup({
                firstName: '',
                email: `a@${'w'.repeat(120)}.com`,
            })

            expect(name.length).toBeLessThanOrEqual(100)
        })

        it('never produces a name the platform name rule rejects', () => {
            const safeString = new RegExp('^[^./]+$')

            for (const email of ['a@activepieces.com', 'a@gmail.com', 'a@sub.acme-co.co.uk']) {
                expect(signupNames.platformNameFromSignup({ firstName: 'J./Smith', email })).toMatch(safeString)
            }
        })
    })

    describe('isPlaceholderName', () => {
        it.each([
            ['ahmad@activepieces.com', 'Ahmad', ''],
            ['ahmad.tash@activepieces.com', 'Ahmad', ''],
            ['...@activepieces.com', 'there', ''],
            ['ahmadtash@activepieces.com', 'AhmadTash', ''],
        ])('reads the name seeded from %s as a placeholder', (email, firstName, lastName) => {
            expect(signupNames.isPlaceholderName({ firstName, lastName, email })).toBe(true)
        })

        it.each([
            ['ahmad@activepieces.com', 'Ahmad', 'Tash'],
            ['ahmad@activepieces.com', 'Sam', ''],
            ['ahmad.tash@activepieces.com', 'Ahmad Tash', ''],
        ])('reads %s named %s %s as a name its owner gave', (email, firstName, lastName) => {
            expect(signupNames.isPlaceholderName({ firstName, lastName, email })).toBe(false)
        })
    })

})
