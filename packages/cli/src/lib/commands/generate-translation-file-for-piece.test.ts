import { describe, expect, it } from 'vitest'
import { generateTranslationFileFromPiece } from './generate-translation-file-for-piece'

const selfHostedAuth = {
    type: 'CUSTOM_AUTH',
    displayName: 'Self-hosted',
    description: 'Connect to your own instance.',
    props: {
        baseUrl: { type: 'SHORT_TEXT', displayName: 'Instance URL', description: 'Base URL of your instance.' },
        username: { type: 'SHORT_TEXT', displayName: 'Username', description: 'Your login username.' },
    },
}

const cloudAuth = {
    type: 'SECRET_TEXT',
    displayName: 'Cloud',
    description: 'Connect using an API key.',
}

const regionAuth = {
    type: 'CUSTOM_AUTH',
    displayName: 'Region picker',
    description: 'Pick a region.',
    props: {
        region: {
            type: 'STATIC_DROPDOWN',
            displayName: 'Region',
            description: 'Where your data lives.',
            options: { options: [{ label: 'Europe', value: 'eu' }, { label: 'United States', value: 'us' }] },
        },
    },
}

const pieceWith = (auth: unknown) => ({
    description: 'A test piece.',
    displayName: 'Test Piece',
    auth,
    actions: {},
    triggers: {},
})

describe('generateTranslationFileFromPiece — pieces declaring several auth methods', () => {
    it('extracts the description and props of every entry in an auth array', () => {
        const keys = Object.keys(generateTranslationFileFromPiece(pieceWith([selfHostedAuth, cloudAuth])))

        expect(keys).toEqual(expect.arrayContaining([
            'Connect to your own instance.',
            'Instance URL',
            'Base URL of your instance.',
            'Username',
            'Your login username.',
            'Connect using an API key.',
        ]))
    })

    it('extracts static dropdown option labels from inside an auth array', () => {
        const keys = Object.keys(generateTranslationFileFromPiece(pieceWith([regionAuth, cloudAuth])))

        expect(keys).toEqual(expect.arrayContaining(['Region', 'Where your data lives.', 'Europe', 'United States']))
    })

    it('maps every extracted key to itself as the source string', () => {
        const translation = generateTranslationFileFromPiece(pieceWith([selfHostedAuth, cloudAuth]))

        for (const [key, value] of Object.entries(translation)) {
            expect(typeof key).toBe('string')
            expect(value).toBe(key)
        }
    })

    it('extracts the same strings whether one auth is given alone or inside an array', () => {
        const alone = generateTranslationFileFromPiece(pieceWith(selfHostedAuth))
        const inArray = generateTranslationFileFromPiece(pieceWith([selfHostedAuth]))

        expect(inArray).toEqual(alone)
    })

    it('still extracts a single auth object', () => {
        const translation = generateTranslationFileFromPiece(pieceWith(selfHostedAuth))

        expect(Object.keys(translation)).toEqual(expect.arrayContaining([
            'A test piece.',
            'Connect to your own instance.',
            'Instance URL',
            'Username',
        ]))
    })

    it('extracts nothing from an auth array when no entry carries translatable text', () => {
        const translation = generateTranslationFileFromPiece(pieceWith([{ type: 'SECRET_TEXT' }, { type: 'SECRET_TEXT' }]))

        expect(Object.keys(translation)).toEqual(['A test piece.'])
    })
})
