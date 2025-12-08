import { rm, writeFile } from 'node:fs/promises'
import path, { dirname, join } from 'node:path'
import { exceptionHandler, fileSystemUtils, memoryLock, pubsubFactory, redisHelper, rejectedPromiseHandler } from '@activepieces/server-shared'
import {
    ExecutionMode,
    groupBy,
    isEmpty,
    isNil,
    PackageType,
    PiecePackage,
    PieceType,
    PrivatePiecePackage,
    tryCatch,
    tryCatchSync,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import writeFileAtomic from 'write-file-atomic'
import { workerApiService } from '../../../api/server-api.service'
import { workerMachine } from '../../../utils/machine'
import { workerRedisConnections } from '../../../utils/worker-redis'
import { packageManager } from '../../package-manager'
import { GLOBAL_CACHE_ALL_VERSIONS_PATH, GLOBAL_CACHE_COMMON_PATH, GLOBAL_CACHE_PATH_LATEST_VERSION } from '../../worker-cache'

const usedPiecesMemoryCache: Record<string, boolean> = {}
const relativePiecePath = (piece: PiecePackage) => join('./', 'pieces', `${piece.pieceName}-${piece.pieceVersion}`)
const piecePath = (rootWorkspace: string, piece: PiecePackage) => join(rootWorkspace, 'pieces', `${piece.pieceName}-${piece.pieceVersion}`)

const REDIS_USED_PIECES_CACHE_KEY = 'cache:pieces:v1'
const REDIS_INSTALL_PIECES_CHANNEL = 'install-pieces'
const pubsub = pubsubFactory(workerRedisConnections.create)

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
    validate: async (): Promise<void> => {
        log.info('[registryPieceManager] Validating piece installation is working')
        const testPiece: PiecePackage = {
            packageType: PackageType.REGISTRY,
            pieceType: PieceType.OFFICIAL,
            pieceName: '@activepieces/piece-webhook',
            pieceVersion: '0.1.25',
        }
        await tryCatch(async () => rollbackInstallation(GLOBAL_CACHE_COMMON_PATH, [testPiece]))
        const { error } = await tryCatch(async () => registryPieceManager(log).install({
            pieces: [testPiece],
            includeFilters: false,
            broadcast: false,
        }))
        if (error) {
            log.error({ error }, `[registryPieceManager] Piece installation is not working, try delete ${GLOBAL_CACHE_ALL_VERSIONS_PATH} folder and restart the server`)
            throw error
        }
    },
    install: async ({ pieces, includeFilters, broadcast }: InstallParams): Promise<void> => {
        const groupedPieces = groupPiecesByPackagePath(log, pieces)
        const installPromises = Object.entries(groupedPieces).map(async ([packagePath, piecesInGroup]) => {
            const { piecesToPersistOnRedis } = await installPieces(log, packagePath, piecesInGroup, includeFilters)
            return piecesToPersistOnRedis
        })

        const piecesToPersistOnRedis = await Promise.all(installPromises).then(results => results.flat())
        await persistPiecesOnRedis(piecesToPersistOnRedis)
        if (broadcast) {
            await pubsub.publish(REDIS_INSTALL_PIECES_CHANNEL, JSON.stringify(piecesToPersistOnRedis))
        }
    },
    warmup: async (): Promise<void> => {
        if (!workerMachine.preWarmCacheEnabled()) {
            log.info('[registryPieceManager] warmup cache is disabled')
            return
        }
        log.info('[registryPieceManager] Warming up pieces cache')
        const startTime = performance.now()
        const redis = await workerRedisConnections.useExisting()
        const usedPiecesKey = await redisHelper.scanAll(redis, `${REDIS_USED_PIECES_CACHE_KEY}:*`)
        const usedPiecesValues = usedPiecesKey.length > 0 ? await redis.mget(...usedPiecesKey) : []
        const usedPieces = usedPiecesKey.filter((_key, index) => !isNil(usedPiecesValues[index])).map((_key, index) => JSON.parse(usedPiecesValues[index] as string))
        await registryPieceManager(log).install({
            pieces: usedPieces,
            includeFilters: false,
            broadcast: true,
        })
        log.info({
            piecesCount: usedPieces.length,
            timeTaken: `${Math.floor(performance.now() - startTime)}ms`,
        }, '[registryPieceManager] Warmed up pieces cache')
    },
    distributedWarmup: async (): Promise<void> => {
        await pubsub.subscribe(REDIS_INSTALL_PIECES_CHANNEL, (message) => {
            log.debug('[registryPieceManager#subscribe] Received message from other worker to install pieces')
            const { data: pieces, error } = tryCatchSync(() => JSON.parse(message) as PiecePackage[])
            if (error) {
                exceptionHandler.handle(error, log)
                return
            }
            rejectedPromiseHandler(registryPieceManager(log).install({
                pieces,
                includeFilters: false,
                broadcast: false,
            }), log)
        })
    },
    getCustomPiecesPath: (platformId: string): string => {
        switch (workerMachine.getSettings().EXECUTION_MODE) {
            case ExecutionMode.SANDBOX_PROCESS:
            case ExecutionMode.SANDBOX_CODE_AND_PROCESS:
                return path.resolve(GLOBAL_CACHE_PATH_LATEST_VERSION, 'custom_pieces', platformId)
            case ExecutionMode.UNSANDBOXED:
            case ExecutionMode.SANDBOX_CODE_ONLY:
                return GLOBAL_CACHE_COMMON_PATH
            default:
                throw new Error('Invalid execution mode')
        }
    },
})

async function installPieces(log: FastifyBaseLogger, rootWorkspace: string, pieces: PiecePackage[], includeFilters: boolean): Promise<PieceInstallationResult> {
    const { piecesToInstall, piecesToPersistOnRedis } = await partitionPiecesToInstallAndToPersist(rootWorkspace, pieces)

    if (isEmpty(piecesToInstall)) {
        log.debug({ rootWorkspace }, '[registryPieceManager] No new pieces to install (already installed)')
        return {
            piecesToInstall,
            piecesToPersistOnRedis,
        }
    }
    log.info({
        rootWorkspace,
        piecesToInstall: piecesToInstall.map(piece => `${piece.pieceName}-${piece.pieceVersion}`),
    }, '[registryPieceManager] Installing pieces in workspace')
    return memoryLock.runExclusive({
        key: `install-pieces-${rootWorkspace}`,
        fn: async () => {
            const { piecesToInstall } = await partitionPiecesToInstallAndToPersist(rootWorkspace, pieces)
            if (isEmpty(piecesToInstall)) {
                log.info({ rootWorkspace }, '[registryPieceManager] No new pieces to install in lock (already installed)')
                return {
                    piecesToInstall,
                    piecesToPersistOnRedis,
                }
            }
            log.info({
                rootWorkspace,
                pieces: piecesToInstall.map(piece => `${piece.pieceName}-${piece.pieceVersion}`),
            }, '[registryPieceManager] acquired lock and starting to install pieces')

            await createRootPackageJson({
                path: rootWorkspace,
            })

            await savePackageArchivesToDiskIfNotCached(rootWorkspace, piecesToInstall)

            await Promise.all(piecesToInstall.map(piece => createPiecePackageJson({
                rootWorkspace,
                piecePackage: piece,
            })))

            const performanceStartTime = performance.now()

            const { error: installError } = await tryCatch(async () => packageManager(log).install({
                path: rootWorkspace,
                filtersPath: includeFilters ? piecesToInstall.map(relativePiecePath) : [],
            }))

            if (!isNil(installError)) {
                log.error({
                    rootWorkspace,
                    pieces: piecesToInstall.map(piece => `${piece.pieceName}-${piece.pieceVersion}`),
                    error: installError,
                }, '[registryPieceManager] Piece installation failed, rolling back')
                await rollbackInstallation(rootWorkspace, piecesToInstall)
                throw installError
            }

            await markPiecesAsUsed(rootWorkspace, piecesToInstall)

            log.info({
                rootWorkspace,
                piecesCount: piecesToInstall.length,
                timeTaken: `${Math.floor(performance.now() - performanceStartTime)}ms`,
            }, '[registryPieceManager] Installed registry pieces using bun')

            return {
                piecesToInstall,
                piecesToPersistOnRedis,
            }
        },
    })
}
async function rollbackInstallation(rootWorkspace: string, pieces: PiecePackage[]): Promise<void> {
    await Promise.all(pieces.map(piece => rm(path.resolve(rootWorkspace, relativePiecePath(piece)), {
        recursive: true,
    })))
}

function groupPiecesByPackagePath(log: FastifyBaseLogger, pieces: PiecePackage[]): Record<string, PiecePackage[]> {
    return groupBy(pieces, (piece) => {
        switch (piece.packageType) {
            case PackageType.ARCHIVE:
                return registryPieceManager(log).getCustomPiecesPath(piece.platformId)
            case PackageType.REGISTRY: {
                if (piece.pieceType === PieceType.CUSTOM && !isNil(piece.platformId)) {
                    return registryPieceManager(log).getCustomPiecesPath(piece.platformId)
                }
                return GLOBAL_CACHE_COMMON_PATH
            }
            default:
                throw new Error('Invalid package type')
        }
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

async function partitionPiecesToInstallAndToPersist(rootWorkspace: string, pieces: PiecePackage[]): Promise<PieceInstallationResult> {
    const piecesWithCheck = await Promise.all(
        pieces.map(async (piece) => {
            const check = await pieceCheckIfAlreadyInstalled(rootWorkspace, piece)
            return { piece, check }
        }),
    )

    const piecesToInstall = piecesWithCheck.filter(({ check }) => !check.installed).map(({ piece }) => piece)
    const piecesToPersistOnRedis = piecesWithCheck.filter(({ check }) => check.installed && check.source === 'disk').map(({ piece }) => piece)

    return {
        piecesToInstall,
        piecesToPersistOnRedis,
    }
}

async function pieceCheckIfAlreadyInstalled(rootWorkspace: string, piece: PiecePackage): Promise<PieceCheckIfAlreadyInstalledResult> {
    const pieceFolder = piecePath(rootWorkspace, piece)
    if (usedPiecesMemoryCache[pieceFolder]) {
        return {
            installed: true,
            source: 'memory',
        }
    }
    usedPiecesMemoryCache[pieceFolder] = await fileSystemUtils.fileExists(join(pieceFolder, 'ready'))
    return {
        installed: usedPiecesMemoryCache[pieceFolder],
        source: 'disk',
    }
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

async function persistPiecesOnRedis(pieces: PiecePackage[]): Promise<void> {
    if (isEmpty(pieces)) return
    const redis = await workerRedisConnections.useExisting()
    await redis.mset(pieces.map(piece => [redisUsedPiecesCacheKey(piece), JSON.stringify(piece)]).flat())
}

function getPackageArchivePathForPiece(rootWorkspace: string, piecePackage: PrivatePiecePackage): string {
    return join(piecePath(rootWorkspace, piecePackage), `${piecePackage.archiveId}.tgz`)
}

type InstallParams = {
    pieces: PiecePackage[]
    includeFilters: boolean
    broadcast: boolean
}

type PieceCheckIfAlreadyInstalledResult = {
    installed: boolean
    source: 'memory' | 'disk'
}

type PieceInstallationResult = {
    piecesToInstall: PiecePackage[]
    piecesToPersistOnRedis: PiecePackage[]
}
