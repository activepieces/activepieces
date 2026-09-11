import { readFile, rm, stat, writeFile } from 'node:fs/promises'
import path, { dirname, join } from 'node:path'
import { ActivepiecesError, ensureTrailingSlash, ErrorCode, groupBy, isEmpty, isNil, tryCatch } from '@activepieces/core-utils'
import { type ApLogger, fileSystemUtils, memoryLock, wideEvent } from '@activepieces/server-utils'
import { ExecutionMode, getPieceNameFromAlias, PackageType, PiecePackage, PieceType } from '@activepieces/shared'
import writeFileAtomic from 'write-file-atomic'
import { SandboxSettings } from '../../types'
import { bunRunner } from '../../utils/bun-runner'
import { cacheUtils } from '../cache-paths'

const BUNDLE_DOWNLOAD_ATTEMPTS = 3
const VALID_SCOPED_NAME_REGEX = /^@[^/]+\/[^/]+$/
const VALID_UNSCOPED_NAME_REGEX = /^[^/]+$/
const relativePiecePath = (piece: PiecePackage) => join('./', 'pieces', `${piece.pieceName}-${piece.pieceVersion}`)
const piecePath = (rootWorkspace: string, piece: PiecePackage) => join(rootWorkspace, 'pieces', `${piece.pieceName}-${piece.pieceVersion}`)

export const pieceInstaller = (log: ApLogger, basePath: string, getSettings: () => SandboxSettings) => ({
    async install({ pieces, includeFilters, publicApiUrl, engineToken, bestEffort }: InstallParams): Promise<void> {
        const groupedPieces = groupPiecesByPackagePath(pieces, basePath, getSettings)
        const installPromises = Object.entries(groupedPieces).map(async ([packagePath, piecesInGroup]) => {
            await installPieces(packagePath, piecesInGroup, includeFilters, log, { publicApiUrl, engineToken }, getSettings, bestEffort ?? false)
        })
        await Promise.all(installPromises)
    },

    getCustomPiecesPath(platformId: string): string {
        return getCustomPiecesPath(basePath, platformId, getSettings)
    },
})

function getCustomPiecesPath(basePath: string, platformId: string, getSettings: () => SandboxSettings): string {
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

async function installPieces(rootWorkspace: string, pieces: PiecePackage[], includeFilters: boolean, log: ApLogger, bundleSource: BundleSource, getSettings: () => SandboxSettings, bestEffort: boolean): Promise<void> {
    const devPieces = getSettings().DEV_PIECES
    const nonDevPieces = pieces.filter(piece => !devPieces.includes(getPieceNameFromAlias(piece.pieceName)))
    const { validPieces, invalidPieces } = partitionValidPieceNames(nonDevPieces)
    if (!isEmpty(invalidPieces)) {
        log.error({
            rootWorkspace,
            invalidPieces: invalidPieces.map(piece => `${piece.pieceName}@${piece.pieceVersion}`),
        }, '[pieceInstaller] Skipping pieces with invalid package names to protect the shared lockfile')
    }
    const { piecesToInstall } = await partitionPiecesToInstall(rootWorkspace, validPieces)

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
            const { piecesToInstall } = await partitionPiecesToInstall(rootWorkspace, validPieces)
            if (isEmpty(piecesToInstall)) {
                log.info({ rootWorkspace }, '[pieceInstaller] No new pieces to install in lock (already installed)')
                return
            }
            log.info({
                rootWorkspace,
                pieces: piecesToInstall.map(piece => `${piece.pieceName}-${piece.pieceVersion}`),
            }, '[pieceInstaller] acquired lock and starting to install pieces')

            await createRootWorkspaceFiles({
                path: rootWorkspace,
            })

            const { downloaded, failures } = await saveBundlesToDiskIfNotCached(rootWorkspace, piecesToInstall, bundleSource)

            if (!isEmpty(failures)) {
                log.error({
                    rootWorkspace,
                    failedPieces: failures.map(({ piece }) => `${piece.pieceName}@${piece.pieceVersion}`),
                }, '[pieceInstaller] Skipping pieces whose bundle download failed after retries')
            }

            if (!isEmpty(downloaded)) {
                await Promise.all(downloaded.map(piece => createPiecePackageJson({
                    rootWorkspace,
                    piecePackage: piece,
                })))

                await wideEvent.timed({
                    name: 'bunInstall',
                    fn: async () => {
                        const { error: batchError } = await tryCatch(async () => bunRunner(log).install({
                            path: rootWorkspace,
                            filtersPath: includeFilters ? downloaded.map(relativePiecePath) : [],
                        }))

                        if (isNil(batchError)) {
                            await markPiecesAsUsed(rootWorkspace, downloaded)
                            log.info({
                                rootWorkspace,
                                piecesCount: downloaded.length,
                            }, '[pieceInstaller] Installed registry pieces using bun')
                            return
                        }

                        if (downloaded.length === 1) {
                            log.error({ rootWorkspace, error: batchError }, '[pieceInstaller] Piece installation failed, rolling back')
                            await rollbackInstallation(rootWorkspace, downloaded)
                            throw batchError
                        }

                        log.warn({
                            rootWorkspace,
                            pieces: downloaded.map(piece => `${piece.pieceName}-${piece.pieceVersion}`),
                            error: batchError,
                        }, '[pieceInstaller] Batch install failed, retrying pieces individually')

                        const failedPieces = await tryInstallPiecesIndividually(rootWorkspace, downloaded, log)

                        if (failedPieces.length > 0) {
                            const names = failedPieces.map(p => `${p.pieceName}@${p.pieceVersion}`).join(', ')
                            throw new Error(`[pieceInstaller] Failed to install: ${names}`)
                        }

                        log.info({
                            rootWorkspace,
                            piecesCount: downloaded.length,
                        }, '[pieceInstaller] Installed registry pieces using bun (individual fallback)')
                    },
                })
            }

            if (!bestEffort && !isEmpty(failures)) {
                throw failures[0].error
            }
        },
    })
}

// A workspace member name (and its dependency key) must be a plain npm package name. A relative
// path such as `../../../common/pieces/@activepieces/piece-x` — fed in via stale `usedPieces` data
// from a since-reverted build — makes bun write an unparseable resolution token into the SHARED
// bun.lock. That lock then fails to parse on the next install and takes down EVERY piece in the
// workspace (so cache pre-warm and the deploy fail). Worse, because the install joins the name onto
// `<workspace>/pieces/`, a `..` name escapes a per-platform `custom_pieces/<id>` workspace and lands
// the poisoned member inside the shared `common` workspace. Such names are skipped at the source.
export function isValidPackageName(name: string): boolean {
    if (name.includes('..')) {
        return false
    }
    return VALID_SCOPED_NAME_REGEX.test(name) || VALID_UNSCOPED_NAME_REGEX.test(name)
}

function partitionValidPieceNames(pieces: PiecePackage[]): { validPieces: PiecePackage[], invalidPieces: PiecePackage[] } {
    return {
        validPieces: pieces.filter(piece => isValidPackageName(piece.pieceName)),
        invalidPieces: pieces.filter(piece => !isValidPackageName(piece.pieceName)),
    }
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

function groupPiecesByPackagePath(pieces: PiecePackage[], basePath: string, getSettings: () => SandboxSettings): Record<string, PiecePackage[]> {
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

const WORKSPACE_BUNFIG = '[install]\nlinker = "isolated"\nminimumReleaseAge = 259200\n'

async function createRootWorkspaceFiles({ path }: { path: string }): Promise<void> {
    const packageJsonPath = join(path, 'package.json')
    await fileSystemUtils.threadSafeMkdir(dirname(packageJsonPath))
    await writeFileAtomic(packageJsonPath, JSON.stringify({
        'name': 'fast-workspace',
        'version': '1.0.0',
        'workspaces': [
            'pieces/**',
        ],
    }, null, 2), 'utf8')
    await writeFileAtomic(join(path, 'bunfig.toml'), WORKSPACE_BUNFIG, 'utf8')
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
            [piecePackage.pieceName]: bundleTgzPath(rootWorkspace, piecePackage),
        },
    }
    await fileSystemUtils.threadSafeMkdir(dirname(packageJsonPath))
    await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8')
}

function bundleTgzPath(rootWorkspace: string, piece: PiecePackage): string {
    return join(piecePath(rootWorkspace, piece), 'bundle.tgz')
}

// Downloads each piece tarball from the engine bundle endpoint (which 307-redirects to npm /
// signed-S3, or streams the custom archive) to a local .tgz. We download here — rather than handing
// the URL to `bun install` — because bun derives a cache directory name from the dependency spec,
// and a long signed-S3 / engine-token URL overflows the filesystem name limit (ENAMETOOLONG).
// `fetch` follows the redirect and carries the engine token in the Authorization header.
// ARCHIVE pieces are fetched by archiveId (they may not be registered in metadata yet, e.g. during
// EXTRACT_PIECE_METADATA); REGISTRY pieces by name@version.
async function saveBundlesToDiskIfNotCached(rootWorkspace: string, pieces: PiecePackage[], bundleSource: BundleSource): Promise<BundleDownloadResult> {
    const results = await Promise.all(pieces.map(async (piece) => {
        const { error } = await tryCatch(() => downloadBundleWithRetry({ rootWorkspace, piece, bundleSource }))
        return { piece, error }
    }))
    const downloaded: PiecePackage[] = []
    const failures: BundleDownloadFailure[] = []
    for (const { piece, error } of results) {
        if (isNil(error)) {
            downloaded.push(piece)
        }
        else {
            failures.push({ piece, error })
        }
    }
    return { downloaded, failures }
}

async function downloadBundleWithRetry({ rootWorkspace, piece, bundleSource }: DownloadBundleParams): Promise<void> {
    let lastError: Error | undefined
    for (let attempt = 1; attempt <= BUNDLE_DOWNLOAD_ATTEMPTS; attempt++) {
        const { error } = await tryCatch(() => downloadBundleIfNotCached({ rootWorkspace, piece, bundleSource }))
        if (isNil(error)) {
            return
        }
        lastError = error
        if (error instanceof ActivepiecesError && error.error.code === ErrorCode.PIECE_BUNDLE_NOT_AVAILABLE) {
            break
        }
    }
    throw lastError
}

async function downloadBundleIfNotCached({ rootWorkspace, piece, bundleSource: { publicApiUrl, engineToken } }: DownloadBundleParams): Promise<void> {
    const bundlePath = bundleTgzPath(rootWorkspace, piece)
    if (await fileSystemUtils.fileExists(bundlePath)) {
        return
    }
    const url = pieceBundleEndpointUrl(publicApiUrl, piece)
    const response = await fetch(url, { headers: { Authorization: `Bearer ${engineToken}` } })
    if (!response.ok) {
        if (response.status === 404 || response.status === 410) {
            throw new ActivepiecesError({
                code: ErrorCode.PIECE_BUNDLE_NOT_AVAILABLE,
                params: { pieceName: piece.pieceName, pieceVersion: piece.pieceVersion, status: response.status },
            })
        }
        throw new Error(`Failed to fetch piece bundle ${piece.pieceName}@${piece.pieceVersion}: ${response.status} ${response.statusText}`)
    }
    await fileSystemUtils.threadSafeMkdir(dirname(bundlePath))
    await writeFile(bundlePath, Buffer.from(await response.arrayBuffer()))
}

function pieceBundleEndpointUrl(publicApiUrl: string, piece: PiecePackage): string {
    const base = `${ensureTrailingSlash(publicApiUrl)}v1/engine/pieces/bundle`
    if (piece.packageType === PackageType.ARCHIVE) {
        return `${base}?archiveId=${encodeURIComponent(piece.archiveId)}`
    }
    return `${base}?name=${encodeURIComponent(piece.pieceName)}&version=${encodeURIComponent(piece.pieceVersion)}`
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
    const readyExists = await fileSystemUtils.fileExists(join(pieceFolder, 'ready'))
    if (!readyExists) {
        return false
    }
    const engineCanResolve = await pieceEntryFileExists({ pieceFolder, pieceName: piece.pieceName })
    if (!engineCanResolve) {
        await rm(join(pieceFolder, 'ready'), { force: true })
        return false
    }
    return true
}

async function pieceEntryFileExists({ pieceFolder, pieceName }: PieceEntryFileExistsParams): Promise<boolean> {
    const packageDir = join(pieceFolder, 'node_modules', pieceName)
    const { data: declaredMain } = await tryCatch(async () => {
        const manifest: unknown = JSON.parse(await readFile(join(packageDir, 'package.json'), 'utf8'))
        if (typeof manifest !== 'object' || isNil(manifest) || !('main' in manifest)) {
            return null
        }
        const { main } = manifest
        return typeof main === 'string' ? main : null
    })
    if (!isNil(declaredMain)) {
        const mainPath = join(packageDir, declaredMain)
        if (await fileSystemUtils.fileExists(mainPath)) {
            return isLoadableEntry(mainPath)
        }
    }
    return isLoadableEntry(join(packageDir, 'src', 'index.js'))
}

async function isLoadableEntry(entryPath: string): Promise<boolean> {
    if (await isLoadableFile(entryPath)) {
        return true
    }
    return isLoadableFile(join(entryPath, 'index.js'))
}

async function isLoadableFile(entryPath: string): Promise<boolean> {
    const { data: stats } = await tryCatch(async () => stat(entryPath))
    return stats?.isFile() ?? false
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

type PieceEntryFileExistsParams = {
    pieceFolder: string
    pieceName: string
}

type InstallParams = {
    pieces: PiecePackage[]
    includeFilters: boolean
    publicApiUrl: string
    engineToken: string
    bestEffort?: boolean
}

type BundleSource = {
    publicApiUrl: string
    engineToken: string
}

type PieceInstallationResult = {
    piecesToInstall: PiecePackage[]
}

type BundleDownloadResult = {
    downloaded: PiecePackage[]
    failures: BundleDownloadFailure[]
}

type BundleDownloadFailure = {
    piece: PiecePackage
    error: Error
}

type DownloadBundleParams = {
    rootWorkspace: string
    piece: PiecePackage
    bundleSource: BundleSource
}
