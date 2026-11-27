import { afterEach, describe, expect, it } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { dirname, join } from 'path'
import { translatableTextByJsonPath } from './translatable-text-by-json-path'

const temporaryDirectories: string[] = []

const directoryWith = ({ translatableTextByPiece }: { translatableTextByPiece: Record<string, Record<string, string>> }): string => {
    const directory = mkdtempSync(join(tmpdir(), 'ap-translatable-text-'))
    temporaryDirectories.push(directory)
    for (const [pieceName, translatableText] of Object.entries(translatableTextByPiece)) {
        const file = join(directory, `${pieceName}.json`)
        mkdirSync(dirname(file), { recursive: true })
        writeFileSync(file, JSON.stringify(translatableText))
    }
    return directory
}

afterEach(() => {
    temporaryDirectories.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true }))
})

describe('translatableTextByJsonPath.readPieces', () => {
    it('pairs the old and new English of every piece in both directories, named by its relative path', () => {
        const previousDirectory = directoryWith({ translatableTextByPiece: {
            'community/dropbox': { 'actions.upload.displayName': 'Upload' },
            'core/http': { 'actions.send.displayName': 'Send' },
        } })
        const currentDirectory = directoryWith({ translatableTextByPiece: {
            'community/dropbox': { 'actions.upload.displayName': 'Upload File' },
            'core/http': { 'actions.send.displayName': 'Send' },
        } })

        const pieces = translatableTextByJsonPath.readPieces({ previousDirectory, currentDirectory })

        expect(pieces).toEqual([
            { pieceName: 'community/dropbox', oldEnglishByJsonPath: { 'actions.upload.displayName': 'Upload' }, newEnglishByJsonPath: { 'actions.upload.displayName': 'Upload File' } },
            { pieceName: 'core/http', oldEnglishByJsonPath: { 'actions.send.displayName': 'Send' }, newEnglishByJsonPath: { 'actions.send.displayName': 'Send' } },
        ])
    })

    it('leaves out a new piece, which has nothing to rename', () => {
        const previousDirectory = directoryWith({ translatableTextByPiece: { 'community/dropbox': { description: 'Old' } } })
        const currentDirectory = directoryWith({ translatableTextByPiece: { 'community/dropbox': { description: 'New' }, 'community/fresh': { description: 'Added' } } })

        const pieces = translatableTextByJsonPath.readPieces({ previousDirectory, currentDirectory })

        expect(pieces.map(({ pieceName }) => pieceName)).toEqual(['community/dropbox'])
    })

    it('skips a piece that is gone from the current directory', () => {
        const previousDirectory = directoryWith({ translatableTextByPiece: { 'community/dropbox': { description: 'Old' }, 'community/removed': { description: 'Gone' } } })
        const currentDirectory = directoryWith({ translatableTextByPiece: { 'community/dropbox': { description: 'New' } } })

        const pieces = translatableTextByJsonPath.readPieces({ previousDirectory, currentDirectory })

        expect(pieces.map(({ pieceName }) => pieceName)).toEqual(['community/dropbox'])
    })

    it('finds nothing to rename on the first night, when the previous directory is empty', () => {
        const previousDirectory = directoryWith({ translatableTextByPiece: {} })
        const currentDirectory = directoryWith({ translatableTextByPiece: { 'community/dropbox': { description: 'New' } } })

        expect(translatableTextByJsonPath.readPieces({ previousDirectory, currentDirectory })).toEqual([])
    })

    it('finds nothing to rename on the first night, when the previous directory does not exist', () => {
        const currentDirectory = directoryWith({ translatableTextByPiece: { 'community/dropbox': { description: 'New' } } })

        expect(translatableTextByJsonPath.readPieces({ previousDirectory: join(currentDirectory, 'missing'), currentDirectory })).toEqual([])
    })

    it('stops when the current directory does not exist', () => {
        const previousDirectory = directoryWith({ translatableTextByPiece: { 'community/dropbox': { description: 'Old' } } })

        expect(() => translatableTextByJsonPath.readPieces({ previousDirectory, currentDirectory: join(previousDirectory, 'missing') })).toThrow()
    })

    it('reads only JSON files', () => {
        const previousDirectory = directoryWith({ translatableTextByPiece: { 'community/dropbox': { description: 'Old' } } })
        const currentDirectory = directoryWith({ translatableTextByPiece: { 'community/dropbox': { description: 'New' } } })
        writeFileSync(join(currentDirectory, 'community', 'README.md'), 'not a piece')

        expect(translatableTextByJsonPath.readPieces({ previousDirectory, currentDirectory }).map(({ pieceName }) => pieceName)).toEqual(['community/dropbox'])
    })
})
