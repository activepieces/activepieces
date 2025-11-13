import { writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileSystemUtils, memoryLock, systemConstants } from '@activepieces/server-shared'
import {
    getPackageArchivePathForPiece,
    isEmpty,
    PackageType,
    PiecePackage,
    PieceType,
    unique,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { packageManager } from '../../package-manager'
import writeFileAtomic from 'write-file-atomic'
import { workerRedisConnections } from '../../../utils/worker-redis'
import { GLOBAL_CACHE_COMMON_PATH } from '../../worker-cache'
import { smartPieceCache } from './smart-piece-cache'

export const PACKAGE_ARCHIVE_PATH = resolve(systemConstants.PACKAGE_ARCHIVE_PATH)

const installedPieceRedisKey = (piece: PiecePackage) => `installed-piece:${piece.pieceName}:${piece.pieceVersion}`
const relativePiecePath = (piece: PiecePackage) => join('./', 'pieces', `${piece.pieceName}-${piece.pieceVersion}`)
const piecePath = (projectPath: string, piece: PiecePackage) => join(projectPath, 'pieces', `${piece.pieceName}-${piece.pieceVersion}`)

export const registryPieceManager = (log: FastifyBaseLogger) => ({
    install: async ({
        projectPath,
        pieces,
        skipRedisWrite = false
    }: InstallParams): Promise<void> => {

        const uniquePieces = unique(pieces)
        if (isEmpty(uniquePieces)) {
            return
        }
        const filteredPieces = await smartPieceCache(log).filterCachedPieces(projectPath, uniquePieces)
        if (isEmpty(filteredPieces)) {
            return
        }
        await savePackageArchivesToDiskIfNotCached(filteredPieces)

        await memoryLock.runExclusive({
            key: `install-pieces`,
            fn: async () => {
                await createRootPackageJson({
                    path: projectPath,
                })
                await Promise.all(filteredPieces.map(piece => createPiecePackageJson({
                    path: piecePath(projectPath, piece),
                    piecePackage: piece,
                })))

                const performanceStartTime = performance.now()
                await packageManager(log).installWorkspaces({
                    path: projectPath,
                    relativePiecePaths: filteredPieces.map(relativePiecePath),
                })
                await smartPieceCache(log).markPiecesAsCached(projectPath, filteredPieces, skipRedisWrite)

                log.info({
                    projectPath,
                    pieces: filteredPieces.map(piece => `${piece.pieceName}-${piece.pieceVersion}`),
                    timeTaken: `${Math.floor(performance.now() - performanceStartTime)}ms`,
                }, 'Installed registry pieces using bun')
            }
        })

    },
})

const savePackageArchivesToDiskIfNotCached = async (
    pieces: PiecePackage[],
): Promise<void> => {
    const saveToDiskJobs = pieces.map(async (piece) => {
        if (piece.packageType !== PackageType.ARCHIVE) {
            return
        }
        await memoryLock.runExclusive({
            key: `save-package-archive-${piece.archiveId}`,
            fn: async () => {
                const archivePath = getPackageArchivePathForPiece({
                    archiveId: piece.archiveId,
                    archivePath: PACKAGE_ARCHIVE_PATH,
                })
                if (await fileSystemUtils.fileExists(archivePath)) {
                    return
                }

                await fileSystemUtils.threadSafeMkdir(dirname(archivePath))
                await writeFile(archivePath, piece.archive as Buffer)
            }
        })
    })
    await Promise.all(saveToDiskJobs)
}

async function createRootPackageJson({ path }: { path: string }): Promise<void> {
    const packageJsonPath = join(path, 'package.json')
    await fileSystemUtils.threadSafeMkdir(dirname(packageJsonPath))
    await writeFileAtomic(packageJsonPath, JSON.stringify({
        "name": "fast-workspace",
        "version": "1.0.0",
        "workspaces": [
            "pieces/**"
        ]
    }, null, 2), 'utf8')
}

async function createPiecePackageJson({ path, piecePackage }: {
    path: string
    piecePackage: PiecePackage
}): Promise<void> {
    const packageJsonPath = join(path, 'package.json')
    const packageJson = {
        'name': `${piecePackage.pieceName}-${piecePackage.pieceVersion}`,
        'version': `${piecePackage.pieceVersion}`,
        'dependencies': {
            [piecePackage.pieceName]: piecePackage.pieceVersion,
        },
    }
    await fileSystemUtils.threadSafeMkdir(dirname(packageJsonPath))
    await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8')
}


type InstallParams = {
    projectPath: string
    pieces: PiecePackage[]
    skipRedisWrite?: boolean
}