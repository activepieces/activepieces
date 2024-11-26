import { readdir, readFile, stat } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { cwd } from 'node:process'
import importFresh from '@activepieces/import-fresh-webpack'
import { Piece, PieceMetadata } from '@activepieces/pieces-framework'
import { extractPieceFromModule } from '@activepieces/shared'
import clearModule from 'clear-module'
import { exceptionHandler } from '../exception-handler'
import { logger } from '../logger'
import { ApLock, memoryLock } from '../memory-lock'
import { system } from '../system/system'
import { AppSystemProp } from '../system/system-prop'

const packages = system.get(AppSystemProp.DEV_PIECES)?.split(',') || []

const pieceCache: Record<string, PieceMetadata | null> = {}

async function findAllPiecesFolder(folderPath: string): Promise<string[]> {
    const paths = []
    const files = await readdir(folderPath)

    for (const file of files) {
        const filePath = join(folderPath, file)
        const fileStats = await stat(filePath)
        if (
            fileStats.isDirectory() &&
            file !== 'node_modules' &&
            file !== 'dist' &&
            file !== 'framework' &&
            file !== 'common'
        ) {
            paths.push(...(await findAllPiecesFolder(filePath)))
        }
        else if (file === 'package.json') {
            paths.push(folderPath)
        }
    }
    return paths
}

async function findDirectoryByPackageName(packageName: string): Promise<string | null> {
    const paths = await findAllPiecesFolder(resolve(cwd(), 'dist', 'packages', 'pieces'))
    for (const path of paths) {
        try {
            const packageJson = await readFile(join(path, 'package.json'), 'utf-8').then(JSON.parse)
            if (packageJson.name === packageName) {
                return path
            }
        }
        catch (e) {
            logger.error({
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
    const piecePath = piecesPath.find((p) => p.endsWith('/' + pieceName))
    return piecePath ?? null
}


async function findAllPieces(): Promise<PieceMetadata[]> {
    const pieces = await loadPiecesFromFolder(resolve(cwd(), 'dist', 'packages', 'pieces'))
    return pieces
}


async function loadPiecesFromFolder(folderPath: string): Promise<PieceMetadata[]> {
    try {
        const paths = (await filePiecesUtils.findAllPiecesFolder(folderPath)).filter(p => packages.some(packageName => p.includes(packageName)))
        const pieces = await Promise.all(paths.map((p) => loadPieceFromFolder(p)))
        return pieces.filter((p): p is PieceMetadata => p !== null)
    }
    catch (e) {
        const err = e as Error
        logger.warn({ name: 'FilePieceMetadataService#loadPiecesFromFolder', message: err.message, stack: err.stack })
        return []
    }
}

async function loadPieceFromFolder(
    folderPath: string,
): Promise<PieceMetadata | null> {
    let lock: ApLock | undefined
    try {
        if (folderPath in pieceCache) {
            return pieceCache[folderPath]
        }

        const lockKey = `piece_cache_${folderPath}`
        lock = await memoryLock.acquire(lockKey)
        if (folderPath in pieceCache) {
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
        const metadata = {
            ...piece.metadata(),
            name: pieceName,
            version: pieceVersion,
            authors: piece.authors,
            directoryPath: folderPath,
        }

        pieceCache[folderPath] = metadata

    }
    catch (ex) {
        pieceCache[folderPath] = null
        logger.warn({ name: 'FilePieceMetadataService#loadPieceFromFolder', message: ex }, 'Failed to load piece from folder')
        exceptionHandler.handle(ex)
    }
    finally {
        if (lock) {
            await lock.release()
        }
    }
    return null
}

async function clearPieceCache(pieceName: string): Promise<void> {
    const directoryPath = await findDirectoryByPackageName(pieceName)
    if (directoryPath && directoryPath in pieceCache) {
        pieceCache[directoryPath] = null
    }
}

export const filePiecesUtils = {
    findAllPiecesFolder,
    findDirectoryByPackageName,
    findPieceDirectoryByFolderName,
    findAllPieces,
    clearPieceCache,
}
