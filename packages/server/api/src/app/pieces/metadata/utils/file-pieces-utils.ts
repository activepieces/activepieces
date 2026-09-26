import { realpathSync } from 'node:fs'
import { readdir, readFile, rm, stat } from 'node:fs/promises'
import Module from 'node:module'
import { join, resolve } from 'node:path'
import { cwd } from 'node:process'
import { sep } from 'path'
import { isNil } from '@activepieces/core-utils'
import { Piece, PieceMetadata, pieceTranslation } from '@activepieces/pieces-framework'
import { fileSystemUtils } from '@activepieces/server-utils'
import { extractPieceFromModule } from '@activepieces/shared'
import clearModule from 'clear-module'
import { FastifyBaseLogger } from 'fastify'
import { AppSystemProp, environmentVariables } from '../../../helper/system/system-props'

const SOURCE_PIECES_PATH = resolve(cwd(), 'packages', 'pieces')

export const filePiecesUtils = (log: FastifyBaseLogger) => ({

    getPackageNameFromFolderPath: async (folderPath: string): Promise<string> => {
        const packageJson = await readFile(join(folderPath, 'package.json'), 'utf-8').then(JSON.parse)
        return packageJson.name
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
        const paths = await findAllDistPiecesFolders(SOURCE_PIECES_PATH)
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
            const devPieces = await findAllDistPiecesFolders(SOURCE_PIECES_PATH)
            const paths = devPieces.filter(path => piecesNames.some(name => path.endsWith(sep + name + sep + 'dist')))
            const pieces = await Promise.all(paths.map((p) => loadPieceFromFolder(p)))
            return pieces.filter((p): p is PieceMetadata => p !== null)
        }
        catch (e) {
            const err = e as Error
            log.warn({ error: err }, '[filePieceMetadataService#loadDistPiecesMetadata] Failed to load pieces from folder')
            return []
        }
    },


    clearPieceModuleCache: (distFolderPath: string): void => {
        const indexPath = join(distFolderPath, 'src', 'index')
        const packageJsonPath = join(distFolderPath, 'package.json')
        clearModule(indexPath)
        clearModule(packageJsonPath)
        const realDistFolderPath = realpathSync(distFolderPath)
        Object.keys(require.cache)
            .filter((id) => isInsideFolder({ filePath: id, folderPath: realDistFolderPath }))
            .forEach((id) => Reflect.deleteProperty(require.cache, id))
        const resolvedPathCache: unknown = Reflect.get(Module, '_pathCache')
        if (typeof resolvedPathCache === 'object' && !isNil(resolvedPathCache)) {
            Object.entries(resolvedPathCache)
                .filter(([, resolvedPath]) => typeof resolvedPath === 'string' && isInsideFolder({ filePath: resolvedPath, folderPath: realDistFolderPath }))
                .forEach(([request]) => Reflect.deleteProperty(resolvedPathCache, request))
        }
    },

    removeOrphanedBuildOutputs: async (pieceDirectory: string): Promise<void> => {
        const distSrcDir = join(pieceDirectory, 'dist', 'src')
        const outputs = await readdir(distSrcDir, { recursive: true })
        const orphans = await Promise.all(outputs.map(async (output) => {
            const sourceBase = BUILD_OUTPUT_REGEX.exec(output)?.[1]
            if (isNil(sourceBase)) {
                return null
            }
            const sourceExists = await fileSystemUtils.fileExists(join(pieceDirectory, 'src', `${sourceBase}.ts`))
            return sourceExists ? null : output
        }))
        await Promise.all(orphans.filter((orphan) => !isNil(orphan)).map((orphan) => rm(join(distSrcDir, orphan), { force: true })))
    },
})

function isInsideFolder({ filePath, folderPath }: { filePath: string, folderPath: string }): boolean {
    return filePath.startsWith(folderPath + sep)
}

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

const findAllDistPiecesFolders = async (sourcePiecesPath: string): Promise<string[]> => {
    const sourceFolders = await findAllPiecesFolder(sourcePiecesPath)
    const distFolders = []
    for (const folder of sourceFolders) {
        const distPath = join(folder, 'dist')
        try {
            const distStats = await stat(distPath)
            if (distStats.isDirectory()) {
                distFolders.push(distPath)
            }
        }
        catch {
            // dist folder doesn't exist for this piece, skip
        }
    }
    return distFolders
}

const loadPieceFromFolder = async (
    folderPath: string,
): Promise<PieceMetadata | null> => {
    const indexPath = join(folderPath, 'src', 'index')
    const packageJsonPath = join(folderPath, 'package.json')
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const packageJson = require(packageJsonPath)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const module = require(indexPath)
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

const BUILD_OUTPUT_REGEX = /^(.*)\.(?:js|js\.map|d\.ts|d\.ts\.map)$/
