import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { pieceTranslationPaths } from '@activepieces/pieces-framework'

export const translationPathsUtils = {
    filePath({ repoRoot, pieceRoot }: FilePathParams): string {
        const pieceLocation = relative(join(repoRoot, 'packages', 'pieces'), pieceRoot)
        return join(repoRoot, PATHS_FOLDER, `${pieceLocation}.json`)
    },

    async write({ repoRoot, pieceRoot, piece }: WriteParams): Promise<string> {
        const file = translationPathsUtils.filePath({ repoRoot, pieceRoot })
        const englishByPath = pieceTranslationPaths.englishByPath({ piece })
        const sorted = Object.fromEntries(Object.keys(englishByPath).sort().map((path) => [path, englishByPath[path]]))
        await mkdir(dirname(file), { recursive: true })
        await writeFile(file, `${JSON.stringify(sorted, null, 2)}\n`)
        return file
    },
}

const PATHS_FOLDER = join('tools', 'i18n-paths')

type FilePathParams = {
    repoRoot: string
    pieceRoot: string
}

type WriteParams = FilePathParams & {
    piece: Parameters<typeof pieceTranslationPaths.englishByPath>[0]['piece']
}
