import { readFile, rm, writeFile } from 'node:fs/promises'
import path, { dirname, join } from 'node:path'
import { isEmpty, isNil, tryCatch } from '@activepieces/core-utils'
import { type ApLogger, fileSystemUtils, memoryLock, safeHttp, wideEvent } from '@activepieces/server-utils'
import { ExecutionMode, getPieceNameFromAlias, PackageType, PiecePackage, PieceType, PrivatePiecePackage, WorkerToApiContract } from '@activepieces/shared'
import decompress from 'decompress'
import writeFileAtomic from 'write-file-atomic'
import { SandboxPoolSettings } from '../../types'
import { cacheUtils } from '../cache-paths'
import { bunRunner } from '../code/bun-runner'

export const pieceInstaller = (log: ApLogger, apiClient: WorkerToApiContract, basePath: string, getSettings: () => SandboxPoolSettings) => ({
    async install({ pieces, includeFilters }: InstallParams): Promise<void> {
        const groupedPieces = groupPiecesByPackagePath(pieces, basePath, getSettings)
        await Promise.all(Object.entries(groupedPieces).map(([packagePath, piecesInGroup]) =>
            installPieces(packagePath, piecesInGroup, includeFilters, log, apiClient, getSettings),
        ))
    },

    getCustomPiecesPath(platformId: string): string {
        return getCustomPiecesPath(basePath, platformId, getSettings)
    },
})

async function installPieces(rootWorkspace: string, pieces: PiecePackage[], includeFilters: boolean, log: ApLogger, apiClient: WorkerToApiContract, getSettings: () => SandboxPoolSettings): Promise<void> {
    const devPieces = getSettings().DEV_PIECES
    const nonDevPieces = pieces.filter(piece => !devPieces.includes(getPieceNameFromAlias(piece.pieceName)))
    const { piecesToInstall } = await partitionPiecesToInstall(rootWorkspace, nonDevPieces)
    if (isEmpty(piecesToInstall)) {
        log.debug({ rootWorkspace }, '[pieceInstaller] No new pieces to install (already installed)')
        return
    }

    await memoryLock.runExclusive({
        key: `install-pieces-${rootWorkspace}`,
        fn: async () => {
            const { piecesToInstall } = await partitionPiecesToInstall(rootWorkspace, nonDevPieces)
            if (isEmpty(piecesToInstall)) {
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
                name: 'extractArchiveBundles',
                fn: async () => {
                    await Promise.all(archivePieces.map(piece => extractArchiveBundle({ rootWorkspace, piecePackage: piece, log })))
                    await markPiecesAsUsed(rootWorkspace, archivePieces)
                },
            })

            if (!isEmpty(registryPieces)) {
                await wideEvent.timed({
                    name: 'installRegistryPieces',
                    fn: async () => {
                        await installRegistryPieces({ rootWorkspace, registryPieces, includeFilters, log, apiClient })
                    },
                })
            }
        },
    })
}

// Registry pieces are downloaded as tarballs — from the bundle store via a presigned URL the
// API hands out (when S3 is configured), otherwise from npm — written to disk, then installed
// with bun so the piece's dependency closure is resolved into node_modules.
async function installRegistryPieces({ rootWorkspace, registryPieces, includeFilters, log, apiClient }: {
    rootWorkspace: string
    registryPieces: PiecePackage[]
    includeFilters: boolean
    log: ApLogger
    apiClient: WorkerToApiContract
}): Promise<void> {
    await saveRegistryTarballsToDiskIfNotCached(rootWorkspace, registryPieces, log, apiClient)
    await createRootPackageJson({ path: rootWorkspace })
    await Promise.all(registryPieces.map(piece => createPiecePackageJson({ rootWorkspace, piecePackage: piece })))

    await wideEvent.timed({
        name: 'bunInstall',
        fn: async () => {
            const { error: batchError } = await tryCatch(async () => bunRunner(log).install({
                path: rootWorkspace,
                filtersPath: includeFilters ? registryPieces.map(relativePiecePath) : [],
            }))

            if (isNil(batchError)) {
                await markPiecesAsUsed(rootWorkspace, registryPieces)
                log.info({ rootWorkspace, piecesCount: registryPieces.length }, '[pieceInstaller] Installed registry pieces using bun')
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

            log.info({ rootWorkspace, piecesCount: registryPieces.length }, '[pieceInstaller] Installed registry pieces using bun (individual fallback)')
        },
    })
}

async function saveRegistryTarballsToDiskIfNotCached(rootWorkspace: string, pieces: PiecePackage[], log: ApLogger, apiClient: WorkerToApiContract): Promise<void> {
    await Promise.all(pieces.map(async (piece) => {
        const tarballPath = getRegistryTarballPath(rootWorkspace, piece)
        if (await fileSystemUtils.fileExists(tarballPath)) {
            return
        }
        const bundle = await downloadBundle(piece, log, apiClient)
        await fileSystemUtils.threadSafeMkdir(dirname(tarballPath))
        await writeFile(tarballPath, bundle)
    }))
}

async function downloadBundle(piece: PiecePackage, log: ApLogger, apiClient: WorkerToApiContract): Promise<Buffer> {
    const { data: signedUrl } = await tryCatch(() => apiClient.getPieceBundleUrl({
        pieceName: piece.pieceName,
        pieceVersion: piece.pieceVersion,
    }))
    if (!isNil(signedUrl)) {
        const fromStore = await tryCatch(() => downloadFromUrl(signedUrl))
        if (isNil(fromStore.error) && !isNil(fromStore.data)) {
            return fromStore.data
        }
        log.info({ piece: { name: piece.pieceName, version: piece.pieceVersion } }, '[pieceInstaller] Bundle store download failed, falling back to npm')
    }
    return downloadFromUrl(npmTarballUrl(piece))
}

async function downloadFromUrl(url: string): Promise<Buffer> {
    const response = await safeHttp.retryingAxios.get<ArrayBuffer>(url, {
        responseType: 'arraybuffer',
    })
    return Buffer.from(response.data)
}

async function extractArchiveBundle({ rootWorkspace, piecePackage, log }: {
    rootWorkspace: string
    piecePackage: PrivatePiecePackage
    log: ApLogger
}): Promise<void> {
    const folder = piecePath(rootWorkspace, piecePackage)
    const archivePath = getPackageArchivePathForPiece(rootWorkspace, piecePackage)
    await fileSystemUtils.threadSafeMkdir(folder)
    await decompress(archivePath, folder, { strip: 1 })
    await installExternalDependenciesIfAny({ folder, log })
}

async function savePackageArchivesToDiskIfNotCached(
    rootWorkspace: string,
    pieces: PrivatePiecePackage[],
    apiClient: WorkerToApiContract,
): Promise<void> {
    const saveToDiskJobs = pieces.map(async (piece) => {
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

async function rollbackInstallation(rootWorkspace: string, pieces: PiecePackage[]): Promise<void> {
    await Promise.all(pieces.map(piece => rm(path.resolve(rootWorkspace, relativePiecePath(piece)), {
        recursive: true,
        force: true,
    })))
}

async function tryInstallPiecesIndividually(rootWorkspace: string, pieces: PiecePackage[], log: ApLogger): Promise<PiecePackage[]> {
    const failures: PiecePackage[] = []
    for (const piece of pieces) {
        const { error } = await tryCatch(async () =>
            bunRunner(log).install({
                path: rootWorkspace,
                filtersPath: [relativePiecePath(piece)],
            }),
        )
        if (error) {
            log.error({ piece: `${piece.pieceName}@${piece.pieceVersion}`, error }, '[pieceInstaller] Individual piece installation failed, rolling back')
            await rollbackInstallation(rootWorkspace, [piece])
            failures.push(piece)
        }
        else {
            await markPiecesAsUsed(rootWorkspace, [piece])
        }
    }
    return failures
}

async function createRootPackageJson({ path: rootPath }: { path: string }): Promise<void> {
    const packageJsonPath = join(rootPath, 'package.json')
    await fileSystemUtils.threadSafeMkdir(dirname(packageJsonPath))
    await writeFileAtomic(packageJsonPath, JSON.stringify({
        'name': 'fast-workspace',
        'version': '1.0.0',
        'workspaces': ['pieces/**'],
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
            [piecePackage.pieceName]: `file:./${REGISTRY_TARBALL_FILENAME}`,
        },
    }
    await fileSystemUtils.threadSafeMkdir(dirname(packageJsonPath))
    await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8')
}

function groupPiecesByPackagePath(pieces: PiecePackage[], basePath: string, getSettings: () => SandboxPoolSettings): Record<string, PiecePackage[]> {
    const paths = cacheUtils(basePath)
    return pieces.reduce<Record<string, PiecePackage[]>>((groups, piece) => {
        const packagePath = packagePathForPiece(piece, basePath, paths, getSettings)
        groups[packagePath] = [...(groups[packagePath] ?? []), piece]
        return groups
    }, {})
}

function packagePathForPiece(piece: PiecePackage, basePath: string, paths: ReturnType<typeof cacheUtils>, getSettings: () => SandboxPoolSettings): string {
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
}

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

async function partitionPiecesToInstall(rootWorkspace: string, pieces: PiecePackage[]): Promise<{ piecesToInstall: PiecePackage[] }> {
    const piecesWithCheck = await Promise.all(
        pieces.map(async (piece) => {
            const installed = await pieceCheckIfAlreadyInstalled(rootWorkspace, piece)
            return { piece, installed }
        }),
    )
    return {
        piecesToInstall: piecesWithCheck.filter(({ installed }) => !installed).map(({ piece }) => piece),
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
    const entryMarker = piece.packageType === PackageType.ARCHIVE
        ? join(pieceFolder, PIECE_BUNDLE_FILENAME)
        : join(pieceFolder, 'node_modules')
    if (!await fileSystemUtils.fileExists(entryMarker)) {
        await rm(join(pieceFolder, 'ready'), { force: true })
        return false
    }
    usedPiecesMemoryCache[pieceFolder] = true
    return true
}

async function markPiecesAsUsed(rootWorkspace: string, pieces: PiecePackage[]): Promise<void> {
    await Promise.all(pieces.map(async (piece) => {
        const pieceFolder = piecePath(rootWorkspace, piece)
        await fileSystemUtils.threadSafeMkdir(pieceFolder)
        await writeFileAtomic(join(pieceFolder, 'ready'), 'true')
        usedPiecesMemoryCache[pieceFolder] = true
    }))
}

function relativePiecePath(piece: PiecePackage): string {
    return join('./', 'pieces', `${piece.pieceName}-${piece.pieceVersion}`)
}

function piecePath(rootWorkspace: string, piece: PiecePackage): string {
    return join(rootWorkspace, 'pieces', `${piece.pieceName}-${piece.pieceVersion}`)
}

function getPackageArchivePathForPiece(rootWorkspace: string, piecePackage: PrivatePiecePackage): string {
    return join(piecePath(rootWorkspace, piecePackage), `${piecePackage.archiveId}.tgz`)
}

function getRegistryTarballPath(rootWorkspace: string, piece: PiecePackage): string {
    return join(piecePath(rootWorkspace, piece), REGISTRY_TARBALL_FILENAME)
}

function npmTarballUrl(piece: PiecePackage): string {
    return `${NPM_REGISTRY_URL}/${piece.pieceName}/-/${unscopedName(piece.pieceName)}-${piece.pieceVersion}.tgz`
}

function unscopedName(name: string): string {
    return name.startsWith('@') ? name.split('/')[1] : name
}

const usedPiecesMemoryCache: Record<string, boolean> = {}
const NPM_REGISTRY_URL = 'https://registry.npmjs.org'
const REGISTRY_TARBALL_FILENAME = 'package.tgz'

export const PIECE_BUNDLE_FILENAME = 'index.bundle.js'

type InstallParams = {
    pieces: PiecePackage[]
    includeFilters: boolean
}
