import { rm, writeFile } from 'node:fs/promises'
import path, { dirname, join } from 'node:path'
import { isEmpty, isNil, tryCatch } from '@activepieces/core-utils'
import { type ApLogger, fileSystemUtils, memoryLock, wideEvent } from '@activepieces/server-utils'
import { ExecutionMode, getPieceNameFromAlias, PackageType, PiecePackage, PieceType, PrivatePiecePackage, WorkerToApiContract } from '@activepieces/shared'
import writeFileAtomic from 'write-file-atomic'
import { SandboxPoolSettings } from '../../types'
import { cacheUtils } from '../cache-paths'
import { bunRunner } from '../code/bun-runner'

const usedPiecesMemoryCache: Record<string, boolean> = {}
const VALID_SCOPED_NAME_REGEX = /^@[^/]+\/[^/]+$/
const VALID_UNSCOPED_NAME_REGEX = /^[^/]+$/
const NPM_REGISTRY_URL = 'https://registry.npmjs.org'
const relativePiecePath = (piece: PiecePackage) => join('./', 'pieces', `${piece.pieceName}-${piece.pieceVersion}`)
const piecePath = (rootWorkspace: string, piece: PiecePackage) => join(rootWorkspace, 'pieces', `${piece.pieceName}-${piece.pieceVersion}`)

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

    await memoryLock.runExclusive({
        key: `install-pieces-${rootWorkspace}`,
        fn: async () => {
            const { piecesToInstall } = await partitionPiecesToInstall(rootWorkspace, validPieces)
            if (isEmpty(piecesToInstall)) {
                return
            }
            log.info({
                rootWorkspace,
                pieces: piecesToInstall.map(piece => `${piece.pieceName}-${piece.pieceVersion}`),
            }, '[pieceInstaller] acquired lock and starting to install pieces')

            await installInWorkspace({ rootWorkspace, pieces: piecesToInstall, includeFilters, log, apiClient })
        },
    })
}

async function installInWorkspace({ rootWorkspace, pieces, includeFilters, log, apiClient }: {
    rootWorkspace: string
    pieces: PiecePackage[]
    includeFilters: boolean
    log: ApLogger
    apiClient: WorkerToApiContract
}): Promise<void> {
    const archivePieces = pieces.filter((piece): piece is PrivatePiecePackage => piece.packageType === PackageType.ARCHIVE)
    await savePackageArchivesToDiskIfNotCached(rootWorkspace, archivePieces, apiClient)

    const dependencySpecs = await Promise.all(pieces.map(piece => resolveDependencySpec(piece, apiClient)))
    await createRootPackageJson({ path: rootWorkspace })
    await Promise.all(pieces.map((piece, index) => createPiecePackageJson({ rootWorkspace, piecePackage: piece, dependencySpec: dependencySpecs[index] })))

    await wideEvent.timed({
        name: 'bunInstall',
        fn: async () => {
            const { error: batchError } = await tryCatch(async () => bunRunner(log).install({
                path: rootWorkspace,
                filtersPath: includeFilters ? pieces.map(relativePiecePath) : [],
            }))

            if (isNil(batchError)) {
                await markPiecesAsUsed(rootWorkspace, pieces)
                log.info({ rootWorkspace, piecesCount: pieces.length }, '[pieceInstaller] Installed pieces using bun')
                return
            }

            if (pieces.length === 1) {
                log.error({ rootWorkspace, error: batchError }, '[pieceInstaller] Piece installation failed, rolling back')
                await rollbackInstallation(rootWorkspace, pieces)
                throw batchError
            }

            log.warn({
                rootWorkspace,
                pieces: pieces.map(piece => `${piece.pieceName}-${piece.pieceVersion}`),
                error: batchError,
            }, '[pieceInstaller] Batch install failed, retrying pieces individually')

            const failedPieces = await tryInstallPiecesIndividually(rootWorkspace, pieces, log)
            if (failedPieces.length > 0) {
                const names = failedPieces.map(p => `${p.pieceName}@${p.pieceVersion}`).join(', ')
                throw new Error(`[pieceInstaller] Failed to install: ${names}`)
            }

            log.info({ rootWorkspace, piecesCount: failedPieces.length }, '[pieceInstaller] Installed pieces using bun (individual fallback)')
        },
    })
}

async function resolveDependencySpec(piece: PiecePackage, apiClient: WorkerToApiContract): Promise<string> {
    if (piece.packageType === PackageType.ARCHIVE) {
        return `file:./${piece.archiveId}.tgz`
    }
    const { data: bundleUrl } = await tryCatch(() => apiClient.getPieceBundleUrl({
        pieceName: piece.pieceName,
        pieceVersion: piece.pieceVersion,
    }))
    return bundleUrl ?? npmTarballUrl(piece)
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

async function createPiecePackageJson({ rootWorkspace, piecePackage, dependencySpec }: {
    rootWorkspace: string
    piecePackage: PiecePackage
    dependencySpec: string
}): Promise<void> {
    const packageJsonPath = join(piecePath(rootWorkspace, piecePackage), 'package.json')
    const packageJson = {
        'name': `${piecePackage.pieceName}-${piecePackage.pieceVersion}`,
        'version': `${piecePackage.pieceVersion}`,
        'dependencies': {
            [piecePackage.pieceName]: dependencySpec,
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
    const nodeModulesExist = await fileSystemUtils.fileExists(join(pieceFolder, 'node_modules'))
    if (!nodeModulesExist) {
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

function getPackageArchivePathForPiece(rootWorkspace: string, piecePackage: PrivatePiecePackage): string {
    return join(piecePath(rootWorkspace, piecePackage), `${piecePackage.archiveId}.tgz`)
}

function npmTarballUrl(piece: PiecePackage): string {
    return `${NPM_REGISTRY_URL}/${piece.pieceName}/-/${unscopedName(piece.pieceName)}-${piece.pieceVersion}.tgz`
}

function unscopedName(name: string): string {
    return name.startsWith('@') ? name.split('/')[1] : name
}

type InstallParams = {
    pieces: PiecePackage[]
    includeFilters: boolean
}
