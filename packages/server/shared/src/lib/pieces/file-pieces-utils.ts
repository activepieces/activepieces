import { readdir, readFile, stat } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { cwd } from 'node:process'
import { sep } from 'path'
import importFresh from '@activepieces/import-fresh-webpack'
import { Piece, PieceMetadata, pieceTranslation } from '@activepieces/pieces-framework'
import { extractPieceFromModule } from '@activepieces/shared'
import clearModule from 'clear-module'
import { FastifyBaseLogger } from 'fastify'
import { exceptionHandler } from '../exception-handler'
import { ApLock, memoryLock } from '../memory-lock'

const pieceCache: Record<string, PieceMetadata | null> = {}

export const filePiecesUtils = (packages: string[], log: FastifyBaseLogger) => {
    async function findAllPiecesFolder(folderPath: string): Promise<string[]> {
        const paths = []
        const files = await readdir(folderPath)

        const ignoredFiles = ['node_modules', 'dist', 'framework', 'common', 'common-ai']
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

    async function getPackageNameFromFolderPath(folderPath: string): Promise<string> {
        const packageJson = await readFile(join(folderPath, 'package.json'), 'utf-8').then(JSON.parse)
        return packageJson.name
    }

    async function getProjectJsonFromFolderPath(folderPath: string): Promise<string> {
        return join(folderPath, 'project.json')
    }

    async function findDirectoryByPackageName(packageName: string): Promise<string | null> {
        const paths = await findAllPiecesFolder(resolve(cwd(), 'dist', 'packages', 'pieces'))
        for (const path of paths) {
            try {
                const packageJsonName = await getPackageNameFromFolderPath(path)
                if (packageJsonName === packageName) {
                    return path
                }
            }
            catch (e) {
                log.error({
                    name: 'findDirectoryByPackageName',
                    message: JSON.stringify(e),
                }, 'Error finding directory by package name')
            }
        }
        return null
    }

    async function findAllPiecesDirectoryInSource(): Promise<string[]> {
        const piecesPath = resolve(cwd(), 'packages', 'pieces')
        const paths = await findAllPiecesFolder(piecesPath)
        return paths
    }

    async function findPieceDirectoryByFolderName(pieceName: string): Promise<string | null> {
        const piecesPath = await findAllPiecesDirectoryInSource()
        const piecePath = piecesPath.find((p) => p.endsWith(sep + pieceName))
        return piecePath ?? null
    }

    async function findAllPieces(): Promise<PieceMetadata[]> {
        const pieces = await loadPiecesFromFolder(resolve(cwd(), 'dist', 'packages', 'pieces'))
        return pieces
    }

    async function loadPiecesFromFolder(folderPath: string): Promise<PieceMetadata[]> {
        try {
            const paths = (await findAllPiecesFolder(folderPath)).filter(p => packages.some(packageName => p.includes(packageName)))
            const pieces = await Promise.all(paths.map((p) => loadPieceFromFolder(p)))
            return pieces.filter((p): p is PieceMetadata => p !== null)
        }
        catch (e) {
            const err = e as Error
            log.warn({ name: 'FilePieceMetadataService#loadPiecesFromFolder', message: err.message, stack: err.stack })
            return []
        }
    }

    async function loadPieceFromFolder(
        folderPath: string,
    ): Promise<PieceMetadata | null> {
        let lock: ApLock | undefined
        try {
            if (folderPath in pieceCache && pieceCache[folderPath]) {
                return pieceCache[folderPath]
            }

            lock = await memoryLock.acquire(`piece_cache_${folderPath}`, 60000)
            if (folderPath in pieceCache && pieceCache[folderPath]) {
                return pieceCache[folderPath]
            }

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
            const i18n = await pieceTranslation.initializeI18n(folderPath)
            const metadata: PieceMetadata = {
                ...originalMetadata,
                name: pieceName,
                version: pieceVersion,
                authors: piece.authors,
                directoryPath: folderPath,
                i18n,
            }

            pieceCache[folderPath] = metadata

        }
        catch (ex) {
            pieceCache[folderPath] = null
            exceptionHandler.handle(ex, log)
        }
        finally {
            if (lock) {
                await lock.release()
            }
        }
        return null
    }

    async function clearPieceCache(packageName: string): Promise<void> {
        const directoryPath = await findDirectoryByPackageName(packageName)
        if (directoryPath && directoryPath in pieceCache) {
            pieceCache[directoryPath] = null
        }
    }

    return {
        findAllPiecesFolder,
        findDirectoryByPackageName,
        findPieceDirectoryByFolderName,
        findAllPieces,
        clearPieceCache,
        getPackageNameFromFolderPath,
        getProjectJsonFromFolderPath,
    }
}
