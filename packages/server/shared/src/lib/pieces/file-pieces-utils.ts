import { readdir, readFile, stat } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { cwd } from 'node:process'
import { sep } from 'path'
import importFresh from '@activepieces/import-fresh-webpack'
import { Piece, PieceMetadata, pieceTranslation } from '@activepieces/pieces-framework'
import { extractPieceFromModule } from '@activepieces/shared'
import clearModule from 'clear-module'
import { FastifyBaseLogger } from 'fastify'
import { AppSystemProp, environmentVariables } from '../system-props'

const DIST_PIECES_PATH = resolve(cwd(), 'dist', 'packages', 'pieces')
const SOURCE_PIECES_PATH = resolve(cwd(), 'packages', 'pieces')

export const filePiecesUtils = (log: FastifyBaseLogger) => ({

    getPackageNameFromFolderPath: async (folderPath: string): Promise<string> => {
        const packageJson = await readFile(join(folderPath, 'package.json'), 'utf-8').then(JSON.parse)
        return packageJson.name
    },

    getProjectJsonFromFolderPath: async (folderPath: string): Promise<string> => {
        return join(folderPath, 'project.json')
    },

    getPieceDependencies: async (folderPath: string): Promise<Record<string, string> | null> => {
        try {
            const packageJson =  await readFile(join(folderPath, 'package.json'), 'utf-8').then(JSON.parse)
            if (!packageJson.dependencies) {
                return null
            }
            return packageJson.dependencies
        }
        catch (e) {
            return null
        }
    },

    findDistPiecePathByPackageName: async (packageName: string): Promise<string | null> => {
        const paths = await findAllPiecesFolder(DIST_PIECES_PATH)
        for (const path of paths) {
            try {
                const packageJsonName = await filePiecesUtils(log).getPackageNameFromFolderPath(path)
                if (packageJsonName === packageName) {
                    return path
                }
            }
            catch (e) {
                log.error({
                    name: 'findDistPiecePathByPackageName',
                    message: JSON.stringify(e),
                }, 'Error finding dist piece path by package name')
            }
        }
        return null
    },

    findSourcePiecePathByPieceName: async (pieceName: string): Promise<string | null> => {
        const piecesPath = await findAllPiecesFolder(SOURCE_PIECES_PATH)
        const piecePath = piecesPath.find((p) => p.endsWith(sep + pieceName))
        return piecePath ?? null
    },

    loadDistPiecesMetadata: async (piecesNames: string[]): Promise<PieceMetadata[]> => {
        try {
            const paths = (await findAllPiecesFolder(DIST_PIECES_PATH)).filter(path => piecesNames.some(name => path.endsWith(sep + name)))
            const pieces = await Promise.all(paths.map((p) => loadPieceFromFolder(p)))
            return pieces.filter((p): p is PieceMetadata => p !== null)
        }
        catch (e) {
            const err = e as Error
            log.warn({ name: 'FilePieceMetadataService#loadPiecesFromFolder', message: err.message, stack: err.stack })
            return []
        }
    },
})

const findAllPiecesFolder = async (folderPath: string): Promise<string[]> => {
    const paths = []
    const files = await readdir(folderPath)

    const ignoredFiles = ['node_modules', 'dist', 'framework', 'common']
    for (const file of files) {
        const filePath = join(folderPath, file)
        const fileStats = await stat(filePath)
        if (
            fileStats.isDirectory() &&
            !ignoredFiles.includes(file)
        ) {
            paths.push(...(await findAllPiecesFolder(filePath)))
        }
        else if (file === 'package.json') {
            paths.push(folderPath)
        }
    }
    return paths
}

const loadPieceFromFolder = async (
    folderPath: string,
): Promise<PieceMetadata | null> => {
    const indexPath = join(folderPath, 'src', 'index')
    clearModule(indexPath)
    const packageJson = importFresh<Record<string, string>>(
        join(folderPath, 'package.json'),
    )
    const module = importFresh<Record<string, unknown>>(
        indexPath,
    )
    const { name: pieceName, version: pieceVersion } = packageJson
    const piece = extractPieceFromModule<Piece>({
        module,
        pieceName,
        pieceVersion,
    })
    const originalMetadata = piece.metadata()
    const loadTranslations = environmentVariables.getBooleanEnvironment(AppSystemProp.LOAD_TRANSLATIONS_FOR_DEV_PIECES)
    const i18n = loadTranslations ? await pieceTranslation.initializeI18n(folderPath) : undefined
    const metadata: PieceMetadata = {
        ...originalMetadata,
        name: pieceName,
        version: pieceVersion,
        authors: piece.authors,
        directoryPath: folderPath,
        i18n,
    }

    return metadata
}