import { writeFile } from 'node:fs/promises'
import path, { dirname, join } from 'node:path'
import { fileSystemUtils, memoryLock } from '@activepieces/server-shared'
import {
    ExecutionMode,
    groupBy,
    isEmpty,
    PackageType,
    partition,
    PiecePackage,
    PieceType,
    PrivatePiecePackage,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import writeFileAtomic from 'write-file-atomic'
import { workerApiService } from '../../../api/server-api.service'
import { workerMachine } from '../../../utils/machine'
import { workerRedisConnections } from '../../../utils/worker-redis'
import { packageManager } from '../../package-manager'
import { GLOBAL_CACHE_COMMON_PATH, GLOBAL_CACHE_PATH_LATEST_VERSION } from '../../worker-cache'

const usedPiecesMemoryCache: Record<string, boolean> = {}
const relativePiecePath = (piece: PiecePackage) => join('./', 'pieces', `${piece.pieceName}-${piece.pieceVersion}`)
const piecePath = (rootWorkspace: string, piece: PiecePackage) => join(rootWorkspace, 'pieces', `${piece.pieceName}-${piece.pieceVersion}`)

const REDIS_USED_PIECES_CACHE_KEY = 'cache:pieces:v1'

const redisUsedPiecesCacheKey = (piece: PiecePackage) => {
    switch (piece.packageType) {
        case PackageType.REGISTRY:
            return `${REDIS_USED_PIECES_CACHE_KEY}:registry:${piece.pieceName}:${piece.pieceVersion}`
        case PackageType.ARCHIVE:
            return `${REDIS_USED_PIECES_CACHE_KEY}:archive:${piece.archiveId}`
        default:
            throw new Error('Invalid package type')
    }
}

export const registryPieceManager = (log: FastifyBaseLogger) => ({
    install: async ({
        pieces,
        applyInstallCmdFilters = true,
    }: InstallParams): Promise<void> => {
        const groupedPieces = groupPiecesByPackagePath(log, pieces)
        for (const [packagePath, pieces] of Object.entries(groupedPieces)) {
            log.debug(
                { packagePath, pieceCount: pieces.length },
                `[registryPieceManager] Installing pieces in packagePath=${packagePath}; pieceCount=${pieces.length}`,
            )
            await installPieces(log, packagePath, pieces, applyInstallCmdFilters)
        }
    },  
    warmup: async (): Promise<void> => {
        if (!workerMachine.preWarmCacheEnabled()) {
            log.info('[registryPieceManager] Pre-warm cache is disabled')
            return
        }
        log.info('[registryPieceManager] Warming up pieces cache')
        const startTime = performance.now()
        const redis = await workerRedisConnections.useExisting()
        const usedPiecesKey = await redis.keys(`${REDIS_USED_PIECES_CACHE_KEY}:*`)
        const usedPiecesValues = usedPiecesKey.length > 0 ? await redis.mget(...usedPiecesKey) : []
        const usedPieces = usedPiecesKey.filter((_key, index) => usedPiecesValues[index] !== null).map((_key, index) => JSON.parse(usedPiecesValues[index] as string))
        log.debug(
            { usedPiecesCount: usedPieces.length },
            '[registryPieceManager] Installing used pieces on warmup',
        )
        await registryPieceManager(log).install({
            pieces: usedPieces,
            applyInstallCmdFilters: false,
        })
        log.info({
            piecesCount: usedPieces.length,
            timeTaken: `${Math.floor(performance.now() - startTime)}ms`,
        }, '[registryPieceManager] Warmed up pieces cache')
    },
    getCustomPiecesPath: (platformId: string): string => {
        if (workerMachine.getSettings().EXECUTION_MODE === ExecutionMode.SANDBOX_PROCESS) {
            return path.resolve(GLOBAL_CACHE_PATH_LATEST_VERSION, 'custom_pieces', platformId)
        }
        return GLOBAL_CACHE_PATH_LATEST_VERSION
    },

})

async function installPieces(log: FastifyBaseLogger, rootWorkspace: string, pieces: PiecePackage[], applyInstallCmdFilters: boolean): Promise<void> {
    const filteredPieces = await filterPiecesThatAlreadyInstalled(rootWorkspace, pieces)
    if (isEmpty(filteredPieces)) {
        log.debug({ rootWorkspace }, '[registryPieceManager] No new pieces to install (already installed)')
        return
    }
    log.info({
        rootWorkspace,
        filteredPieces: filteredPieces.map(piece => `${piece.pieceName}-${piece.pieceVersion}`),
    }, `[registryPieceManager] Installing pieces in workspace: ${rootWorkspace}. Piece count: ${filteredPieces.length}`)
    await memoryLock.runExclusive({
        key: `install-pieces-${rootWorkspace}`,
        fn: async () => {
            const filteredPieces = await filterPiecesThatAlreadyInstalled(rootWorkspace, pieces)
            if (isEmpty(filteredPieces)) {
                log.debug({ rootWorkspace }, '[registryPieceManager] No new pieces to install in lock (already installed)')
                return
            }
            await createRootPackageJson({
                path: rootWorkspace,
            })

            await savePackageArchivesToDiskIfNotCached(rootWorkspace, filteredPieces)

            await Promise.all(filteredPieces.map(piece => createPiecePackageJson({
                rootWorkspace,
                piecePackage: piece,
            })))

            const performanceStartTime = performance.now()
           
            await packageManager(log).install({
                path: rootWorkspace,
                filtersPath: applyInstallCmdFilters ? filteredPieces.map(relativePiecePath) : [],
            })

            await markPiecesAsUsed(rootWorkspace, filteredPieces)

            log.info({
                rootWorkspace,
                piecesCount: filteredPieces.length,
                timeTaken: `${Math.floor(performance.now() - performanceStartTime)}ms`,
            }, '[registryPieceManager] Installed registry pieces using bun')
        },
    })
}

function groupPiecesByPackagePath(log: FastifyBaseLogger, pieces: PiecePackage[]): Record<string, PiecePackage[]> {
    return groupBy(pieces, (piece: PiecePackage) => {
        if (piece.packageType === PackageType.ARCHIVE || piece.pieceType === PieceType.CUSTOM) {
            return registryPieceManager(log).getCustomPiecesPath(piece.platformId)
        }
        return GLOBAL_CACHE_COMMON_PATH
    })
}


const savePackageArchivesToDiskIfNotCached = async (
    rootWorkspace: string,
    pieces: PiecePackage[],
): Promise<void> => {
    const saveToDiskJobs = pieces.map(async (piece) => {
        if (piece.packageType !== PackageType.ARCHIVE) {
            return
        }
        const archivePath = getPackageArchivePathForPiece(rootWorkspace, piece)
        if (await fileSystemUtils.fileExists(archivePath)) {
            return
        }
        await fileSystemUtils.threadSafeMkdir(dirname(archivePath))
        const archive = await workerApiService().getPieceArchive(piece.archiveId)
        await writeFile(archivePath, archive as Buffer)
    })
    await Promise.all(saveToDiskJobs)
}

async function createRootPackageJson({ path }: { path: string }): Promise<void> {
    const packageJsonPath = join(path, 'package.json')
    await fileSystemUtils.threadSafeMkdir(dirname(packageJsonPath))
    await writeFileAtomic(packageJsonPath, JSON.stringify({
        'name': 'fast-workspace',
        'version': '1.0.0',
        'workspaces': [
            'pieces/**',
        ],
    }, null, 2), 'utf8')
}

async function createPiecePackageJson({ rootWorkspace, piecePackage }: {
    rootWorkspace: string
    piecePackage: PiecePackage
}): Promise<void> {
    const packageJsonPath = join(piecePath(rootWorkspace, piecePackage), 'package.json')
    const packageJson = {
        'name': `${piecePackage.pieceName}-${piecePackage.pieceVersion}`,
        'version': `${piecePackage.pieceVersion}`,
        'dependencies': {
            [piecePackage.pieceName]: piecePackage.packageType === PackageType.REGISTRY ? piecePackage.pieceVersion : getPackageArchivePathForPiece(rootWorkspace, piecePackage),
        },
    }
    await fileSystemUtils.threadSafeMkdir(dirname(packageJsonPath))
    await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8')
}

async function filterPiecesThatAlreadyInstalled(rootWorkspace: string, pieces: PiecePackage[]): Promise<PiecePackage[]> {
    const checkResults = await Promise.all(
        pieces.map(async piece => {
            const pieceFolder = piecePath(rootWorkspace, piece)
            if (usedPiecesMemoryCache[pieceFolder]) {
                return true
            }
            usedPiecesMemoryCache[pieceFolder] = await fileSystemUtils.fileExists(join(pieceFolder, 'ready'))
            if (usedPiecesMemoryCache[pieceFolder]) {
                const redis = await workerRedisConnections.useExisting()
                await redis.set(redisUsedPiecesCacheKey(piece), JSON.stringify(piece))
            }
            return usedPiecesMemoryCache[pieceFolder]
        }),
    )
    return pieces.filter((_, idx) => !checkResults[idx])
}

async function markPiecesAsUsed(rootWorkspace: string, pieces: PiecePackage[]): Promise<void> {
    const writeToDiskJobs = pieces.map(async (piece) => {
        await writeFileAtomic(
            join(piecePath(rootWorkspace, piece), 'ready'),
            'true',
        )
    })
    await Promise.all(writeToDiskJobs)
}

function getPackageArchivePathForPiece(rootWorkspace: string, piecePackage: PrivatePiecePackage): string {
    return join(piecePath(rootWorkspace, piecePackage), `${piecePackage.archiveId}.tgz`)
}

type InstallParams = {
    pieces: PiecePackage[]
    applyInstallCmdFilters?: boolean
}
