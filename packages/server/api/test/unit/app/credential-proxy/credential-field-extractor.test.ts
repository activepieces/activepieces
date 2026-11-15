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

    it('gives the OAuth2 access token and its copy in data one placeholder, redacts the refresh token copies and keeps the id token', () => {
        const value = {
            type: AppConnectionType.CLOUD_OAUTH2,
            client_id: 'id',
            token_type: 'Bearer',
            access_token: 'at',
            refresh_token: 'rt',
            claimed_at: 1,
            scope: '',
            token_url: 'https://auth.example.com/token',
            data: { access_token: 'at', refresh_token: 'rt', id_token: 'idt', instance_url: 'https://acme.my.salesforce.com', authed_user: { id: 'U1', access_token: 'user-at', refresh_token: 'user-rt' } },
        } as const
        const fields = credentialFieldExtractor.extract({ value, pieceAuth: undefined })

        expect(fields).toEqual([{ index: 0, path: ['access_token'] }, { index: 1, path: ['data', 'authed_user', 'access_token'] }])
        const redacted = credentialFieldExtractor.redactUnresolvable(value)
        expect(redacted).toMatchObject({
            refresh_token: '(REDACTED)',
            data: { refresh_token: '(REDACTED)', id_token: 'idt', instance_url: 'https://acme.my.salesforce.com', authed_user: { id: 'U1', refresh_token: '(REDACTED)' } },
        })
        const placeholdered = credentialFieldExtractor.applyPlaceholders({ value: redacted, grantId: GRANT_ID, fields })
        expect(placeholdered).toMatchObject({
            access_token: credentialPlaceholder.build({ grantId: GRANT_ID, fieldIndex: 0 }),
            data: {
                access_token: credentialPlaceholder.build({ grantId: GRANT_ID, fieldIndex: 0 }),
                authed_user: { access_token: credentialPlaceholder.build({ grantId: GRANT_ID, fieldIndex: 1 }) },
            },
        })
    })

    it('placeholders props declared secret or named like a secret, and leaves identifiers and host-like values alone', () => {
        const pieceAuth = PieceAuth.CustomAuth({
            required: true,
            props: {
                base_url: Property.ShortText({ displayName: 'Base URL', required: true }),
                signing_secret: PieceAuth.SecretText({ displayName: 'Signing secret', required: true }),
                apiKey: Property.ShortText({ displayName: 'API key', required: true }),
                webhook_id: PieceAuth.SecretText({ displayName: 'Webhook id', required: true }),
                account: Property.ShortText({ displayName: 'Account', required: true }),
            },
        })
        const value = {
            type: AppConnectionType.CUSTOM_AUTH,
            props: {
                base_url: 'https://acme.example.com',
                signing_secret: 'abc123.xyzw',
                apiKey: 'declared-as-short-text',
                webhook_id: 'declared-secret-plain-name',
                account: 'acme',
                legacy_token: 'undeclared-but-secret-looking',
                legacy_endpoint_token: 'api.vendor.com',
            },
            access_token: 'short-lived',
        } as const

        const fields = credentialFieldExtractor.extract({ value, pieceAuth })

        expect(fields).toEqual([
            { index: 0, path: ['props', 'signing_secret'] },
            { index: 1, path: ['props', 'apiKey'] },
            { index: 2, path: ['props', 'webhook_id'] },
            { index: 3, path: ['props', 'legacy_token'] },
            { index: 4, path: ['access_token'] },
        ])
        const placeholdered = credentialFieldExtractor.applyPlaceholders({ value, grantId: GRANT_ID, fields })
        expect(placeholdered.props.base_url).toBe('https://acme.example.com')
        expect(placeholdered.props.account).toBe('acme')
        expect(placeholdered.props.legacy_endpoint_token).toBe('api.vendor.com')
        expect(placeholdered.props.signing_secret).toBe(credentialPlaceholder.build({ grantId: GRANT_ID, fieldIndex: 0 }))
        expect(placeholdered.access_token).toBe(credentialPlaceholder.build({ grantId: GRANT_ID, fieldIndex: 4 }))
    })

    it('keeps declared non-text props and secret-looking identifiers real', () => {
        const pieceAuth = PieceAuth.CustomAuth({
            required: true,
            props: {
                keyType: Property.StaticDropdown({ displayName: 'Key type', required: true, options: { options: [{ label: 'Account', value: 'account' }] } }),
                apiKeyHeader: Property.ShortText({ displayName: 'Header', required: true }),
                accessKeyId: Property.ShortText({ displayName: 'Access key id', required: true }),
                personalAccessTokenName: Property.ShortText({ displayName: 'Token name', required: true }),
                publicKey: Property.ShortText({ displayName: 'Public key', required: true }),
                apiKey: Property.ShortText({ displayName: 'API key', required: true }),
            },
        })
        const fields = credentialFieldExtractor.extract({
            value: {
                type: AppConnectionType.CUSTOM_AUTH,
                props: { keyType: 'account', apiKeyHeader: 'X-API-Key', accessKeyId: 'AKIA1', personalAccessTokenName: 'ci', publicKey: 'pk_1', apiKey: 'sk_1' },
            },
            pieceAuth,
        })

        expect(fields).toEqual([{ index: 0, path: ['props', 'apiKey'] }])
    })

    it('finds access tokens inside arrays under data', () => {
        const base = {
            type: AppConnectionType.CLOUD_OAUTH2,
            client_id: 'id',
            token_type: 'Bearer',
            access_token: 'at',
            refresh_token: 'rt',
            claimed_at: 1,
            scope: '',
            token_url: 'https://auth.example.com/token',
        } as const
        const withArray = { ...base, data: { accounts: [{ id: 'a', access_token: 'array-at', refresh_token: 'array-rt' }] } }
        const fields = credentialFieldExtractor.extract({ value: withArray, pieceAuth: undefined })

        expect(fields).toEqual([{ index: 0, path: ['access_token'] }, { index: 1, path: ['data', 'accounts', '0', 'access_token'] }])
        const placeholdered = credentialFieldExtractor.applyPlaceholders({ value: credentialFieldExtractor.redactUnresolvable(withArray), grantId: GRANT_ID, fields })
        expect(credentialFieldExtractor.readAtPath({ value: placeholdered, path: ['data', 'accounts', '0', 'access_token'] })).toBe(credentialPlaceholder.build({ grantId: GRANT_ID, fieldIndex: 1 }))
        expect(credentialFieldExtractor.readAtPath({ value: placeholdered, path: ['data', 'accounts', '0', 'refresh_token'] })).toBe('(REDACTED)')
        expect(credentialFieldExtractor.readAtPath({ value: placeholdered, path: ['data', 'accounts', '0', 'id'] })).toBe('a')
        expect(credentialFieldExtractor.readAtPath({ value: withArray, path: ['data', 'accounts', '0', 'access_token'] })).toBe('array-at')
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
