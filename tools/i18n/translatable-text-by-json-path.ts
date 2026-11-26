import { existsSync, readdirSync, readFileSync } from 'fs'
import { join, sep } from 'path'

function readPieces({ previousDirectory, currentDirectory }: ReadPiecesParams): PieceTranslatableText[] {
    return translatableTextFilesIn({ directory: currentDirectory }).flatMap((relativeFilePath) => {
        const previousFile = join(previousDirectory, relativeFilePath)
        if (!existsSync(previousFile)) {
            return []
        }
        return [{
            pieceName: pieceNameOf({ relativeFilePath }),
            oldEnglishByJsonPath: readTranslatableText({ file: previousFile }),
            newEnglishByJsonPath: readTranslatableText({ file: join(currentDirectory, relativeFilePath) }),
        }]
    })
}

function translatableTextFilesIn({ directory }: { directory: string }): string[] {
    return readdirSync(directory, { recursive: true, encoding: 'utf8' })
        .filter((relativeFilePath) => relativeFilePath.endsWith(JSON_EXTENSION))
        .sort()
}

function readTranslatableText({ file }: { file: string }): TranslatableTextByJsonPath {
    const translatableText: TranslatableTextByJsonPath = JSON.parse(readFileSync(file, 'utf8'))
    return translatableText
}

function pieceNameOf({ relativeFilePath }: { relativeFilePath: string }): string {
    return relativeFilePath.slice(0, -JSON_EXTENSION.length).split(sep).join('/')
}

const JSON_EXTENSION = '.json'

export const translatableTextByJsonPath = { readPieces }

export type TranslatableTextByJsonPath = Record<string, string>

export type PieceTranslatableText = {
    pieceName: string
    oldEnglishByJsonPath: TranslatableTextByJsonPath
    newEnglishByJsonPath: TranslatableTextByJsonPath
}

type ReadPiecesParams = {
    previousDirectory: string
    currentDirectory: string
}
