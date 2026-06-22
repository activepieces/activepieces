import { readFile, rm, writeFile } from 'node:fs/promises'
import path, { dirname, join } from 'node:path'
import { groupBy, isEmpty, isNil, tryCatch } from '@activepieces/core-utils'
import { type ApLogger, fileSystemUtils, memoryLock, wideEvent } from '@activepieces/server-utils'
import { ExecutionMode, getPieceNameFromAlias, PackageType, PiecePackage, PieceType, PrivatePiecePackage, WorkerToApiContract } from '@activepieces/shared'
import decompress from 'decompress'
import writeFileAtomic from 'write-file-atomic'
import { SandboxPoolSettings } from '../../types'
import { cacheUtils } from '../cache-paths'
import { bunRunner } from '../code/bun-runner'

const usedPiecesMemoryCache: Record<string, boolean> = {}
const relativePiecePath = (piece: PiecePackage) => join('./', 'pieces', `${piece.pieceName}-${piece.pieceVersion}`)
const piecePath = (rootWorkspace: string, piece: PiecePackage) => join(rootWorkspace, 'pieces', `${piece.pieceName}-${piece.pieceVersion}`)

export const pieceInstaller = (log: ApLogger, apiClient: WorkerToApiContract, basePath: string, getSettings: () => SandboxPoolSettings) => ({
    async install({ pieces, includeFilters }: InstallParams): Promise<void> {
        const groupedPieces = groupPiecesByPackagePath(pieces, basePath, getSettings)
        const installPromises = Object.entries(groupedPieces).map(async ([packagePath, piecesInGroup]) => {
            await installPieces(packagePath, piecesInGroup, includeFilters, log, apiClient, getSettings)
        })
        await Promise.all(installPromises)
    },

    getCustomPiecesPath(platformId: string): string {
        return getCustomPiecesPath(basePath, platformId, getSettings)
    },
})

function getCustomPiecesPath(basePath: string, platformId: string, getSettings: () => SandboxPoolSettings): string {
    const paths = cacheUtils(basePath)
    switch (getSettings().EXECUTION_MODE) {
        case ExecutionMode.SANDBOX_PROCESS:
        case ExecutionMode.SANDBOX_CODE_AND_PROCESS:
            return path.resolve(paths.getGlobalCachePathLatestVersion(), 'custom_pieces', platformId)
        case ExecutionMode.UNSANDBOXED:
        case ExecutionMode.SANDBOX_CODE_ONLY:
            return paths.getGlobalCacheCommonPath()
        default:
            throw new Error('Invalid execution mode')
    }
}

async function installPieces(rootWorkspace: string, pieces: PiecePackage[], includeFilters: boolean, log: ApLogger, apiClient: WorkerToApiContract, getSettings: () => SandboxPoolSettings): Promise<void> {
    const devPieces = getSettings().DEV_PIECES
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

            const archivePieces = piecesToInstall.filter((piece): piece is PrivatePiecePackage => piece.packageType === PackageType.ARCHIVE)
            const registryPieces = piecesToInstall.filter(piece => piece.packageType === PackageType.REGISTRY)

            await savePackageArchivesToDiskIfNotCached(rootWorkspace, archivePieces, apiClient)

            await wideEvent.timed({
                name: 'extractBundles',
                fn: async () => {
                    await Promise.all(archivePieces.map(piece => extractPieceBundle({ rootWorkspace, piecePackage: piece, log })))
                    await markPiecesAsUsed(rootWorkspace, archivePieces)
                },
            })

            if (!isEmpty(registryPieces)) {
                await installRegistryPieces({ rootWorkspace, registryPieces, includeFilters, log })
            }
        },
    })
}

async function extractPieceBundle({ rootWorkspace, piecePackage, log }: {
    rootWorkspace: string
    piecePackage: PrivatePiecePackage
    log: ApLogger
}): Promise<void> {
    const folder = piecePath(rootWorkspace, piecePackage)
    const archivePath = getPackageArchivePathForPiece(rootWorkspace, piecePackage)
    await fileSystemUtils.threadSafeMkdir(folder)
    // The published artifact is a single self-contained bundle. npm tarballs nest
    // everything under `package/`; strip it so the bundle lands at the folder root.
    await decompress(archivePath, folder, { strip: 1 })
    await installExternalDependenciesIfAny({ folder, log })
}

// Third-party deps are external by default, so a bundle ships a package.json listing its
// external closure — install it. A piece that opts into inlining (bundleDeps) ships no
// dependencies and skips the install entirely. Workspace code is always in the bundle.
async function installExternalDependenciesIfAny({ folder, log }: { folder: string, log: ApLogger }): Promise<void> {
    const { data: raw } = await tryCatch(async () => readFile(join(folder, 'package.json'), 'utf8'))
    if (isNil(raw)) {
        return
    }
    const externalDeps = JSON.parse(raw).dependencies ?? {}
    if (isEmpty(Object.keys(externalDeps))) {
        return
    }
    await bunRunner(log).install({ path: folder, filtersPath: [] })
}

async function installRegistryPieces({ rootWorkspace, registryPieces, includeFilters, log }: {
    rootWorkspace: string
    registryPieces: PiecePackage[]
    includeFilters: boolean
    log: ApLogger
}): Promise<void> {
    await createRootPackageJson({ path: rootWorkspace })

    await Promise.all(registryPieces.map(piece => createPiecePackageJson({
        rootWorkspace,
        piecePackage: piece,
    })))

    await wideEvent.timed({
        name: 'bunInstall',
        fn: async () => {
            const { error: batchError } = await tryCatch(async () => bunRunner(log).install({
                path: rootWorkspace,
                filtersPath: includeFilters ? registryPieces.map(relativePiecePath) : [],
            }))

            if (isNil(batchError)) {
                await markPiecesAsUsed(rootWorkspace, registryPieces)
                log.info({
                    rootWorkspace,
                    piecesCount: registryPieces.length,
                }, '[pieceInstaller] Installed registry pieces using bun')
                return
            }

            if (registryPieces.length === 1) {
                log.error({ rootWorkspace, error: batchError }, '[pieceInstaller] Piece installation failed, rolling back')
                await rollbackInstallation(rootWorkspace, registryPieces)
                throw batchError
            }

            log.warn({
                rootWorkspace,
                pieces: registryPieces.map(piece => `${piece.pieceName}-${piece.pieceVersion}`),
                error: batchError,
            }, '[pieceInstaller] Batch install failed, retrying pieces individually')

            const failedPieces = await tryInstallPiecesIndividually(rootWorkspace, registryPieces, log)

            if (failedPieces.length > 0) {
                const names = failedPieces.map(p => `${p.pieceName}@${p.pieceVersion}`).join(', ')
                throw new Error(`[pieceInstaller] Failed to install: ${names}`)
            }

            log.info({
                rootWorkspace,
                piecesCount: registryPieces.length,
            }, '[pieceInstaller] Installed registry pieces using bun (individual fallback)')
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
    log: ApLogger,
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

function groupPiecesByPackagePath(pieces: PiecePackage[], basePath: string, getSettings: () => SandboxPoolSettings): Record<string, PiecePackage[]> {
    const paths = cacheUtils(basePath)
    return groupBy(pieces, (piece) => {
        switch (piece.packageType) {
            case PackageType.ARCHIVE:
                return getCustomPiecesPath(basePath, piece.platformId, getSettings)
            case PackageType.REGISTRY: {
                if (piece.pieceType === PieceType.CUSTOM && !isNil(piece.platformId)) {
                    return getCustomPiecesPath(basePath, piece.platformId, getSettings)
                }
                return paths.getGlobalCacheCommonPath()
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
    const readyExists = await fileSystemUtils.fileExists(join(pieceFolder, 'ready'))
    if (!readyExists) {
        return false
    }
    // 'ready' is the primary completion signal; this is a defensive check that the extracted
    // content is still present. A bundle's entry may live at the root or under src/ (per its
    // package.json "main"), but every bundle tarball ships package.json — so check that. Keying
    // on a fixed entry filename would never match src/-entry bundles, deleting 'ready' and
    // forcing a full re-extract (and re-`bun install`) on every sandbox provision.
    const entryMarker = piece.packageType === PackageType.ARCHIVE
        ? join(pieceFolder, 'package.json')
        : join(pieceFolder, 'node_modules')
    if (!await fileSystemUtils.fileExists(entryMarker)) {
        await rm(join(pieceFolder, 'ready'), { force: true })
        return false
    }
    usedPiecesMemoryCache[pieceFolder] = true
    return true
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
