import { rm, writeFile } from 'node:fs/promises'
import path, { dirname, join } from 'node:path'
import { fileSystemUtils, memoryLock } from '@activepieces/server-utils'
import {
    ExecutionMode,
    getPieceNameFromAlias,
    groupBy,
    isEmpty,
    isNil,
    PackageType,
    PiecePackage,
    PieceType,
    PrivatePiecePackage,
    tryCatch,
    WorkerToApiContract,
} from '@activepieces/shared'
import { trace } from '@opentelemetry/api'
import { Logger } from 'pino'
import writeFileAtomic from 'write-file-atomic'
import { workerSettings } from '../../config/worker-settings'
import { getGlobalCacheCommonPath, getGlobalCachePathLatestVersion } from '../cache-paths'
import { bunRunner } from '../code/bun-runner'

const tracer = trace.getTracer('piece-installer')

const usedPiecesMemoryCache: Record<string, boolean> = {}
const relativePiecePath = (piece: PiecePackage) => join('./', 'pieces', `${piece.pieceName}-${piece.pieceVersion}`)
const piecePath = (rootWorkspace: string, piece: PiecePackage) => join(rootWorkspace, 'pieces', `${piece.pieceName}-${piece.pieceVersion}`)

export const pieceInstaller = (log: Logger, apiClient: WorkerToApiContract) => ({
    async install({ pieces, includeFilters }: InstallParams): Promise<void> {
        const groupedPieces = groupPiecesByPackagePath(pieces)
        const installPromises = Object.entries(groupedPieces).map(async ([packagePath, piecesInGroup]) => {
            await installPieces(packagePath, piecesInGroup, includeFilters, log, apiClient)
        })
        await Promise.all(installPromises)
    },

    getCustomPiecesPath,
})

function getCustomPiecesPath(platformId: string): string {
    switch (workerSettings.getSettings().EXECUTION_MODE) {
        case ExecutionMode.SANDBOX_PROCESS:
        case ExecutionMode.SANDBOX_CODE_AND_PROCESS:
            return path.resolve(getGlobalCachePathLatestVersion(), 'custom_pieces', platformId)
        case ExecutionMode.UNSANDBOXED:
        case ExecutionMode.SANDBOX_CODE_ONLY:
            return getGlobalCacheCommonPath()
        default:
            throw new Error('Invalid execution mode')
    }
}

async function installPieces(rootWorkspace: string, pieces: PiecePackage[], includeFilters: boolean, log: Logger, apiClient: WorkerToApiContract): Promise<void> {
    const devPieces = workerSettings.getSettings().DEV_PIECES
    const nonDevPieces = pieces.filter(piece => !devPieces.includes(getPieceNameFromAlias(piece.pieceName)))
    const { piecesToInstall } = await partitionPiecesToInstall(rootWorkspace, nonDevPieces)

    if (isEmpty(piecesToInstall)) {
        log.debug({ rootWorkspace }, '[pieceInstaller] No new pieces to install (already installed)')
        return
    }
    log.info({
        rootWorkspace,
        piecesToInstall: piecesToInstall.map(piece => `${piece.pieceName}-${piece.pieceVersion}`),
    }, '[pieceInstaller] Installing pieces in workspace')

    await memoryLock.runExclusive({
        key: `install-pieces-${rootWorkspace}`,
        fn: async () => {
            const { piecesToInstall } = await partitionPiecesToInstall(rootWorkspace, pieces)
            if (isEmpty(piecesToInstall)) {
                log.info({ rootWorkspace }, '[pieceInstaller] No new pieces to install in lock (already installed)')
                return
            }
            log.info({
                rootWorkspace,
                pieces: piecesToInstall.map(piece => `${piece.pieceName}-${piece.pieceVersion}`),
            }, '[pieceInstaller] acquired lock and starting to install pieces')

            await createRootPackageJson({
                path: rootWorkspace,
            })

            await savePackageArchivesToDiskIfNotCached(rootWorkspace, piecesToInstall, apiClient)

            await Promise.all(piecesToInstall.map(piece => createPiecePackageJson({
                rootWorkspace,
                piecePackage: piece,
            })))

            await tracer.startActiveSpan('pieceInstaller.bunInstall', async (span) => {
                try {
                    span.setAttribute('pieces.count', piecesToInstall.length)
                    span.setAttribute('pieces.rootWorkspace', rootWorkspace)

                    const { error: batchError } = await tryCatch(async () => bunRunner(log).install({
                        path: rootWorkspace,
                        filtersPath: includeFilters ? piecesToInstall.map(relativePiecePath) : [],
                    }))

                    if (isNil(batchError)) {
                        await markPiecesAsUsed(rootWorkspace, piecesToInstall)
                        log.info({
                            rootWorkspace,
                            piecesCount: piecesToInstall.length,
                        }, '[pieceInstaller] Installed registry pieces using bun')
                        return
                    }

                    span.recordException(batchError instanceof Error ? batchError : new Error(String(batchError)))

                    if (piecesToInstall.length === 1) {
                        log.error({ rootWorkspace, error: batchError }, '[pieceInstaller] Piece installation failed, rolling back')
                        await rollbackInstallation(rootWorkspace, piecesToInstall)
                        throw batchError
                    }

                    log.warn({
                        rootWorkspace,
                        pieces: piecesToInstall.map(piece => `${piece.pieceName}-${piece.pieceVersion}`),
                        error: batchError,
                    }, '[pieceInstaller] Batch install failed, retrying pieces individually')

                    const failedPieces = await tryInstallPiecesIndividually(rootWorkspace, piecesToInstall, log)

                    if (failedPieces.length > 0) {
                        const names = failedPieces.map(p => `${p.pieceName}@${p.pieceVersion}`).join(', ')
                        throw new Error(`[pieceInstaller] Failed to install: ${names}`)
                    }

                    log.info({
                        rootWorkspace,
                        piecesCount: piecesToInstall.length,
                    }, '[pieceInstaller] Installed registry pieces using bun (individual fallback)')
                }
                finally {
                    span.end()
                }
            })
        },
    })
}

async function rollbackInstallation(rootWorkspace: string, pieces: PiecePackage[]): Promise<void> {
    await Promise.all(pieces.map(piece => rm(path.resolve(rootWorkspace, relativePiecePath(piece)), {
        recursive: true,
        force: true,
    })))
}

async function tryInstallPiecesIndividually(
    rootWorkspace: string,
    pieces: PiecePackage[],
    log: Logger,
): Promise<PiecePackage[]> {
    const failures: PiecePackage[] = []
    for (const piece of pieces) {
        const { error } = await tryCatch(async () =>
            bunRunner(log).install({
                path: rootWorkspace,
                filtersPath: [relativePiecePath(piece)],
            }),
        )
        if (error) {
            log.error({
                piece: `${piece.pieceName}@${piece.pieceVersion}`,
                error,
            }, '[pieceInstaller] Individual piece installation failed, rolling back')
            await rollbackInstallation(rootWorkspace, [piece])
            failures.push(piece)
        }
        else {
            await markPiecesAsUsed(rootWorkspace, [piece])
        }
    }
    return failures
}

function groupPiecesByPackagePath(pieces: PiecePackage[]): Record<string, PiecePackage[]> {
    return groupBy(pieces, (piece) => {
        switch (piece.packageType) {
            case PackageType.ARCHIVE:
                return getCustomPiecesPath(piece.platformId)
            case PackageType.REGISTRY: {
                if (piece.pieceType === PieceType.CUSTOM && !isNil(piece.platformId)) {
                    return getCustomPiecesPath(piece.platformId)
                }
                return getGlobalCacheCommonPath()
            }
            default:
                throw new Error('Invalid package type')
        }
    })
}

async function savePackageArchivesToDiskIfNotCached(
    rootWorkspace: string,
    pieces: PiecePackage[],
    apiClient: WorkerToApiContract,
): Promise<void> {
    const saveToDiskJobs = pieces.map(async (piece) => {
        if (piece.packageType !== PackageType.ARCHIVE) {
            return
        }
        const archivePath = getPackageArchivePathForPiece(rootWorkspace, piece)
        if (await fileSystemUtils.fileExists(archivePath)) {
            return
        }
        await fileSystemUtils.threadSafeMkdir(dirname(archivePath))
        const archive = await apiClient.getPieceArchive({ archiveId: piece.archiveId })
        await writeFile(archivePath, archive)
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

async function partitionPiecesToInstall(rootWorkspace: string, pieces: PiecePackage[]): Promise<PieceInstallationResult> {
    const piecesWithCheck = await Promise.all(
        pieces.map(async (piece) => {
            const installed = await pieceCheckIfAlreadyInstalled(rootWorkspace, piece)
            return { piece, installed }
        }),
    )

    const piecesToInstall = piecesWithCheck.filter(({ installed }) => !installed).map(({ piece }) => piece)

    return {
        piecesToInstall,
    }
}

async function pieceCheckIfAlreadyInstalled(rootWorkspace: string, piece: PiecePackage): Promise<boolean> {
    const pieceFolder = piecePath(rootWorkspace, piece)
    if (usedPiecesMemoryCache[pieceFolder]) {
        return true
    }
    usedPiecesMemoryCache[pieceFolder] = await fileSystemUtils.fileExists(join(pieceFolder, 'ready'))
    return usedPiecesMemoryCache[pieceFolder]
}

async function markPiecesAsUsed(rootWorkspace: string, pieces: PiecePackage[]): Promise<void> {
    const writeToDiskJobs = pieces.map(async (piece) => {
        const pieceFolder = piecePath(rootWorkspace, piece)
        await fileSystemUtils.threadSafeMkdir(pieceFolder)
        await writeFileAtomic(
            join(pieceFolder, 'ready'),
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
    includeFilters: boolean
}

type PieceInstallationResult = {
    piecesToInstall: PiecePackage[]
}
