import { createAction, createPiece, PieceAuth, PieceAuthProperty, Property } from '@activepieces/pieces-framework'
import { describe, expect, it } from 'vitest'
import { generateTranslationFileFromPiece } from './generate-translation-file-for-piece'

const databaseTokenAuth = () =>
    PieceAuth.CustomAuth({
        displayName: 'Database Token (recommended)',
        description: 'Scoped, per-table access that works with 2FA.',
        required: true,
        props: {
            apiUrl: Property.ShortText({
                displayName: 'API URL',
                description: 'Your Baserow instance URL.',
                required: true,
            }),
            region: Property.StaticDropdown({
                displayName: 'Region',
                required: true,
                options: {
                    disabled: false,
                    options: [{ label: 'Europe (EU)', value: 'eu' }],
                },
            }),
        },
    })

const emailPasswordAuth = () =>
    PieceAuth.BasicAuth({
        displayName: 'Email & Password (JWT)',
        description: 'Needed to register webhooks automatically.',
        required: true,
        username: { displayName: 'Email', description: 'Your Baserow account email.' },
        password: { displayName: 'Password' },
    })

const listRows = () =>
    createAction({
        name: 'list_rows',
        displayName: 'List Rows',
        description: 'List the rows of a table.',
        props: {},
        run: async () => [],
    })

const extract = (auth: PieceAuthProperty | PieceAuthProperty[]) => {
    const piece = createPiece({
        displayName: 'Baserow',
        description: 'Read and write rows in Baserow.',
        logoUrl: 'https://example.com/logo.png',
        authors: [],
        auth,
        actions: [listRows()],
        triggers: [],
    })
    return Object.keys(generateTranslationFileFromPiece({
        actions: piece.actions(),
        triggers: piece.triggers(),
        description: piece.description,
        displayName: piece.displayName,
        auth: piece.auth,
    })).sort()
}

describe('generateTranslationFileFromPiece', () => {
    it('extracts the strings of every auth method of a multi-auth piece', () => {
        expect(extract([databaseTokenAuth(), emailPasswordAuth()])).toStrictEqual([
            'API URL',
            'Database Token (recommended)',
            'Email',
            'Email & Password (JWT)',
            'Europe (EU)',
            'List Rows',
            'List the rows of a table.',
            'Needed to register webhooks automatically.',
            'Password',
            'Read and write rows in Baserow.',
            'Region',
            'Scoped, per-table access that works with 2FA.',
            'Your Baserow account email.',
            'Your Baserow instance URL.',
        ])
    })

    it('keeps extracting the strings of a single-auth piece', () => {
        expect(extract(databaseTokenAuth())).toStrictEqual([
            'API URL',
            'Europe (EU)',
            'List Rows',
            'List the rows of a table.',
            'Read and write rows in Baserow.',
            'Region',
            'Scoped, per-table access that works with 2FA.',
            'Your Baserow instance URL.',
        ])
    })

    it('keeps extracting when an auth prop is named after a path segment', () => {
        const auth = PieceAuth.CustomAuth({
            displayName: 'Database Token (recommended)',
            description: 'Scoped, per-table access that works with 2FA.',
            required: true,
            props: {
                description: Property.ShortText({
                    displayName: 'API URL',
                    description: 'Your Baserow instance URL.',
                    required: true,
                }),
            },
        })
        expect(extract(auth)).toStrictEqual([
            'API URL',
            'List Rows',
            'List the rows of a table.',
            'Read and write rows in Baserow.',
            'Scoped, per-table access that works with 2FA.',
            'Your Baserow instance URL.',
        ])
    })
})
