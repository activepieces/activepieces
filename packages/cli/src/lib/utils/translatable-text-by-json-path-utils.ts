import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { pieceTranslation } from '@activepieces/pieces-framework'

export const translatableTextByJsonPathUtils = {
    filePath({ repoRoot, pieceRoot }: FilePathParams): string {
        const pieceLocation = relative(join(repoRoot, 'packages', 'pieces'), pieceRoot)
        return join(repoRoot, TRANSLATABLE_TEXT_BY_JSON_PATH_FOLDER, `${pieceLocation}.json`)
    },

    async write({ repoRoot, pieceRoot, piece }: WriteParams): Promise<string> {
        const file = translatableTextByJsonPathUtils.filePath({ repoRoot, pieceRoot })
        const textByJsonPath = pieceTranslation.translatableTextByJsonPath({ piece })
        const sorted = Object.fromEntries(Object.keys(textByJsonPath).sort().map((jsonPath) => [jsonPath, textByJsonPath[jsonPath]]))
        await mkdir(dirname(file), { recursive: true })
        await writeFile(file, `${JSON.stringify(sorted, null, 2)}\n`)
        return file
    },
}

const TRANSLATABLE_TEXT_BY_JSON_PATH_FOLDER = join('tools', 'translatable-text-by-json-path')

type FilePathParams = {
    repoRoot: string
    pieceRoot: string
}

type WriteParams = FilePathParams & {
    piece: Parameters<typeof pieceTranslation.translatableTextByJsonPath>[0]['piece']
}
