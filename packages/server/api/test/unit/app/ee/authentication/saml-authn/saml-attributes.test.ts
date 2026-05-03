import { ActivepiecesError, ErrorCode } from '@activepieces/shared'
import { resolveSamlAttributes } from '../../../../../../src/app/ee/authentication/saml-authn/saml-attributes'

describe('resolveSamlAttributes', () => {
    describe('default mappings', () => {
        it('resolves simple email/firstName/lastName keys', () => {
            const result = resolveSamlAttributes({
                rawAttributes: {
                    email: 'mario@flix.com',
                    firstName: 'Mario',
                    lastName: 'Siebeck',
                },
            })

            expect(result).toEqual({
                email: 'mario@flix.com',
                firstName: 'Mario',
                lastName: 'Siebeck',
            })
        })

        it('resolves Microsoft Entra schema-qualified URIs out of the box', () => {
            const result = resolveSamlAttributes({
                rawAttributes: {
                    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': 'mario.siebeck@flix.com',
                    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname': 'Mario',
                    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname': 'Siebeck',
                },
            })

            expect(result).toEqual({
                email: 'mario.siebeck@flix.com',
                firstName: 'Mario',
                lastName: 'Siebeck',
            })
        })

        it('ignores unrelated and null-valued claims while resolving the required fields', () => {
            const result = resolveSamlAttributes({
                rawAttributes: {
                    'http://schemas.microsoft.com/identity/claims/tenantid': 'd8d0ad3e',
                    'http://schemas.microsoft.com/identity/claims/objectidentifier': '788ab09e',
                    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': null,
                    'http://schemas.microsoft.com/claims/authnmethodsreferences': [null],
                    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': 'mario.siebeck@flix.com',
                    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname': 'Mario',
                    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname': 'Siebeck',
                },
            })

            expect(result.email).toBe('mario.siebeck@flix.com')
            expect(result.firstName).toBe('Mario')
            expect(result.lastName).toBe('Siebeck')
        })

        it('flattens single-element string arrays returned by samlify', () => {
            const result = resolveSamlAttributes({
                rawAttributes: {
                    email: ['mario@flix.com'],
                    firstName: ['Mario'],
                    lastName: ['Siebeck'],
                },
            })

            expect(result.email).toBe('mario@flix.com')
            expect(result.firstName).toBe('Mario')
            expect(result.lastName).toBe('Siebeck')
        })

        it('is case-insensitive for the simple lowercase variants exposed by Entra', () => {
            const result = resolveSamlAttributes({
                rawAttributes: {
                    emailaddress: 'mario@flix.com',
                    givenname: 'Mario',
                    surname: 'Siebeck',
                },
            })

            expect(result.email).toBe('mario@flix.com')
            expect(result.firstName).toBe('Mario')
            expect(result.lastName).toBe('Siebeck')
        })
    })

    describe('custom mapping', () => {
        it('honours admin-supplied mapping ahead of the defaults', () => {
            const result = resolveSamlAttributes({
                rawAttributes: {
                    'urn:oid:0.9.2342.19200300.100.1.3': 'mario@flix.com',
                    'urn:oid:2.5.4.42': 'Mario',
                    'urn:oid:2.5.4.4': 'Siebeck',
                    email: 'fallback@flix.com',
                },
                mapping: {
                    email: 'urn:oid:0.9.2342.19200300.100.1.3',
                    firstName: 'urn:oid:2.5.4.42',
                    lastName: 'urn:oid:2.5.4.4',
                },
            })

            expect(result.email).toBe('mario@flix.com')
            expect(result.firstName).toBe('Mario')
            expect(result.lastName).toBe('Siebeck')
        })

        it('falls back to default keys when the override key is missing', () => {
            const result = resolveSamlAttributes({
                rawAttributes: {
                    email: 'mario@flix.com',
                    firstName: 'Mario',
                    lastName: 'Siebeck',
                },
                mapping: {
                    email: 'custom-email',
                    firstName: 'custom-first',
                    lastName: 'custom-last',
                },
            })

            expect(result.email).toBe('mario@flix.com')
            expect(result.firstName).toBe('Mario')
            expect(result.lastName).toBe('Siebeck')
        })

        it('treats blank override strings as unset', () => {
            const result = resolveSamlAttributes({
                rawAttributes: {
                    email: 'mario@flix.com',
                    firstName: 'Mario',
                    lastName: 'Siebeck',
                },
                mapping: {
                    email: '   ',
                    firstName: '',
                    lastName: '\t',
                },
            })

            expect(result.email).toBe('mario@flix.com')
            expect(result.firstName).toBe('Mario')
            expect(result.lastName).toBe('Siebeck')
        })
    })

    describe('error reporting', () => {
        it('throws INVALID_SAML_RESPONSE listing missing fields and received keys', () => {
            const run = () => resolveSamlAttributes({
                rawAttributes: {
                    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': 'mario@flix.com',
                },
            })

            expect(run).toThrow(ActivepiecesError)

            const error = captureActivepiecesError(run)
            expect(error.error.code).toBe(ErrorCode.INVALID_SAML_RESPONSE)
            const message = readMessage(error)
            expect(message).toContain('firstName')
            expect(message).toContain('lastName')
            expect(message).toContain('http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress')
            expect(message).toContain('attributeMapping')
        })

        it('throws when rawAttributes is null or undefined', () => {
            expect(() => resolveSamlAttributes({ rawAttributes: null })).toThrow(ActivepiecesError)
            expect(() => resolveSamlAttributes({ rawAttributes: undefined })).toThrow(ActivepiecesError)
        })

        it('treats empty-string and null-valued claims as missing', () => {
            expect(() => resolveSamlAttributes({
                rawAttributes: {
                    email: '',
                    firstName: null,
                    lastName: undefined,
                },
            })).toThrow(ActivepiecesError)
        })
    })
})

function captureActivepiecesError(run: () => unknown): ActivepiecesError {
    try {
        run()
    }
    catch (error) {
        if (error instanceof ActivepiecesError) {
            return error
        }
        throw error
    }
    throw new Error('Expected ActivepiecesError to be thrown')
}

function readMessage(error: ActivepiecesError): string {
    const params = error.error.params
    if (params && typeof params === 'object' && 'message' in params && typeof params.message === 'string') {
        return params.message
    }
    return ''
}
