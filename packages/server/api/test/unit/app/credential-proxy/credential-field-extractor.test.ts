import { PieceAuth, Property } from '@activepieces/pieces-framework'
import { AppConnectionType, credentialPlaceholder } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { credentialFieldExtractor } from '../../../../src/app/credential-proxy/credential-field-extractor'

const GRANT_ID = 'AbCdEfGhIjKlMnOpQrStU'

describe('credentialFieldExtractor', () => {
    it('placeholders only the password of a basic-auth connection', () => {
        const value = { type: AppConnectionType.BASIC_AUTH, username: 'alice', password: 'hunter2' } as const
        const fields = credentialFieldExtractor.extract({ value, pieceAuth: undefined })

        expect(fields).toEqual([{ index: 0, path: ['password'] }])
        expect(credentialFieldExtractor.applyPlaceholders({ value, grantId: GRANT_ID, fields })).toEqual({
            type: AppConnectionType.BASIC_AUTH,
            username: 'alice',
            password: credentialPlaceholder.build({ grantId: GRANT_ID, fieldIndex: 0 }),
        })
    })

    it('placeholders the access token and its copy in data, and redacts the refresh token copies of an OAuth2 connection', () => {
        const value = {
            type: AppConnectionType.CLOUD_OAUTH2,
            client_id: 'id',
            token_type: 'Bearer',
            access_token: 'at',
            refresh_token: 'rt',
            claimed_at: 1,
            scope: '',
            token_url: 'https://auth.example.com/token',
            data: { access_token: 'at', refresh_token: 'rt', id_token: 'idt', instance_url: 'https://acme.my.salesforce.com' },
        } as const
        const fields = credentialFieldExtractor.extract({ value, pieceAuth: undefined })

        expect(fields).toEqual([{ index: 0, path: ['access_token'] }, { index: 1, path: ['data', 'access_token'] }])
        const redacted = credentialFieldExtractor.redactUnresolvable(value)
        expect(redacted).toMatchObject({
            refresh_token: '(REDACTED)',
            data: { refresh_token: '(REDACTED)', id_token: '(REDACTED)', instance_url: 'https://acme.my.salesforce.com' },
        })
        const placeholdered = credentialFieldExtractor.applyPlaceholders({ value: redacted, grantId: GRANT_ID, fields })
        expect(placeholdered).toMatchObject({
            access_token: credentialPlaceholder.build({ grantId: GRANT_ID, fieldIndex: 0 }),
            data: { access_token: credentialPlaceholder.build({ grantId: GRANT_ID, fieldIndex: 1 }) },
        })
    })

    it('trusts the piece auth declaration for declared props and applies the name heuristic only to undeclared ones', () => {
        const pieceAuth = PieceAuth.CustomAuth({
            required: true,
            props: {
                base_url: Property.ShortText({ displayName: 'Base URL', required: true }),
                signing_secret: PieceAuth.SecretText({ displayName: 'Signing secret', required: true }),
                accessKeyId: Property.ShortText({ displayName: 'Access key id', required: true }),
                account: Property.ShortText({ displayName: 'Account', required: true }),
            },
        })
        const value = {
            type: AppConnectionType.CUSTOM_AUTH,
            props: {
                base_url: 'https://acme.example.com',
                signing_secret: 'abc123.xyzw',
                accessKeyId: 'AKIA123',
                account: 'acme',
                legacy_token: 'undeclared-but-secret-looking',
                legacy_endpoint_token: 'api.vendor.com',
            },
            access_token: 'short-lived',
        } as const

        const fields = credentialFieldExtractor.extract({ value, pieceAuth })

        expect(fields).toEqual([
            { index: 0, path: ['props', 'signing_secret'] },
            { index: 1, path: ['props', 'legacy_token'] },
            { index: 2, path: ['access_token'] },
        ])
        const placeholdered = credentialFieldExtractor.applyPlaceholders({ value, grantId: GRANT_ID, fields })
        expect(placeholdered.props.base_url).toBe('https://acme.example.com')
        expect(placeholdered.props.accessKeyId).toBe('AKIA123')
        expect(placeholdered.props.account).toBe('acme')
        expect(placeholdered.props.legacy_endpoint_token).toBe('api.vendor.com')
        expect(placeholdered.props.signing_secret).toBe(credentialPlaceholder.build({ grantId: GRANT_ID, fieldIndex: 0 }))
        expect(placeholdered.access_token).toBe(credentialPlaceholder.build({ grantId: GRANT_ID, fieldIndex: 2 }))
    })

    it('falls back to the name heuristic for every prop when the piece definition is unknown', () => {
        const fields = credentialFieldExtractor.extract({
            value: { type: AppConnectionType.CUSTOM_AUTH, props: { api_key: 'k', base_url: 'https://x.example.com', region: 'eu' } },
            pieceAuth: undefined,
        })

        expect(fields).toEqual([{ index: 0, path: ['props', 'api_key'] }])
    })

    it('reads a value back at a recorded path', () => {
        const value = { type: AppConnectionType.CUSTOM_AUTH, props: { token: 'abc', nested: { deep: 1 } } }

        expect(credentialFieldExtractor.readAtPath({ value, path: ['props', 'token'] })).toBe('abc')
        expect(credentialFieldExtractor.readAtPath({ value, path: ['props', 'nested', 'deep'] })).toBeNull()
        expect(credentialFieldExtractor.readAtPath({ value, path: ['props', 'missing'] })).toBeNull()
    })
})
