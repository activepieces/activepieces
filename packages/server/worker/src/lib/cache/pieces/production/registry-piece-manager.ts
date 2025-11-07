import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { enrichErrorContext, fileSystemUtils, systemConstants } from '@activepieces/server-shared'
import {
    getPackageAliasForPiece,
    getPackageArchivePathForPiece,
    getPackageSpecForPiece,
    isEmpty,
    PackageType,
    PiecePackage,
    PieceType,
    PrivatePiecePackage,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { cacheState, NO_SAVE_GUARD } from '../../cache-state'
import { PackageInfo, packageManager } from '../../package-manager'
import { CacheState } from '../../worker-cache'

export const PACKAGE_ARCHIVE_PATH = resolve(systemConstants.PACKAGE_ARCHIVE_PATH)

type InstallParams = {
    projectPath: string
    pieces: PiecePackage[]
}

export const registryPieceManager = (log: FastifyBaseLogger) => ({
    install: async ({
        projectPath,
        pieces,
    }: InstallParams): Promise<void> => {
        try {
            if (isEmpty(pieces)) {
                return
            }

            const uniquePieces = removeDuplicatedPieces(pieces)

            await registryPieceManager(log).installDependencies({
                projectPath,
                pieces: uniquePieces,
            })
        }
        catch (error) {
            const contextKey = '[PieceManager#install]'
            const contextValue = { projectPath }

            const enrichedError = enrichErrorContext({
                error,
                key: contextKey,
                value: contextValue,
            })

            throw enrichedError
        }
    },

    installDependencies: async ({
        projectPath,
        pieces,
    }: InstallParams): Promise<void> => {
        await savePackageArchivesToDiskIfNotCached(pieces)

        const cache = cacheState(projectPath, log)

        await Promise.all(
            pieces.map(async (piece) => {
                const pkg = pieceToDependency(piece)

                await cache.getOrSetCache({
                    key: pkg.alias,
                    cacheMiss: (value: string) => {
                        return value !== CacheState.READY
                    },
                    installFn: async () => {
                        const exactVersionPath = join(projectPath, 'pieces', pkg.alias)
                        await mkdir(exactVersionPath, { recursive: true })

                        if (!pkg.standalone) {
                            await writePnpmWorkspaceConfig(projectPath)
                        }
                        const performanceStartTime = performance.now()
                        await packageManager(log).add({
                            path: projectPath,
                            dependencies: [pkg],
                            installDir: exactVersionPath,
                        })
                        log.info({
                            alias: pkg.alias,
                            timeTaken: `${Math.floor(performance.now() - performanceStartTime)}ms`,
                        }, 'Installed piece using pnpm')
                        return CacheState.READY
                    },
                    skipSave: NO_SAVE_GUARD,
                })
            }),
        )
    },

})

const pieceToDependency = (piece: PiecePackage): PackageInfo => {
    const packageAlias = getPackageAliasForPiece(piece)

    const packageSpec = getPackageSpecForPiece(PACKAGE_ARCHIVE_PATH, piece)
    return {
        alias: packageAlias,
        spec: packageSpec,
        standalone: piece.pieceType === PieceType.CUSTOM,
    }
}

const removeDuplicatedPieces = (pieces: PiecePackage[]): PiecePackage[] => {
    return pieces.filter(
        (piece, index, self) =>
            index ===
            self.findIndex(
                (p) =>
                    p.pieceName === piece.pieceName &&
                    p.pieceVersion === piece.pieceVersion,
            ),
    )
}

const writePnpmWorkspaceConfig = async (projectPath: string): Promise<void> => {
    const workspaceConfig = `packages:
- "pieces/*"
`
    const workspaceFilePath = join(projectPath, 'pnpm-workspace.yaml')
    await writeFile(workspaceFilePath, workspaceConfig)
}

const savePackageArchivesToDiskIfNotCached = async (
    pieces: PiecePackage[],
): Promise<void> => {
    const packages = await getUncachedArchivePackages(pieces)
    const saveToDiskJobs = packages.map((piece) =>
        getArchiveAndSaveToDisk(piece),
    )
    await Promise.all(saveToDiskJobs)
}

const getUncachedArchivePackages = async (
    pieces: PiecePackage[],
): Promise<PrivatePiecePackage[]> => {
    const packages: PrivatePiecePackage[] = []

    for (const piece of pieces) {
        if (piece.packageType !== PackageType.ARCHIVE) {
            continue
        }

        const archivePath = getPackageArchivePathForPiece({
            archiveId: piece.archiveId,
            archivePath: PACKAGE_ARCHIVE_PATH,
        })

        if (await fileSystemUtils.fileExists(archivePath)) {
            continue
        }

        packages.push(piece)
    }

    return packages
}

const getArchiveAndSaveToDisk = async (
    piece: PrivatePiecePackage,
): Promise<void> => {
    const archiveId = piece.archiveId

    const archivePath = getPackageArchivePathForPiece({
        archiveId,
        archivePath: PACKAGE_ARCHIVE_PATH,
    })

    await fileSystemUtils.threadSafeMkdir(dirname(archivePath))

    await writeFile(archivePath, piece.archive as Buffer)
}

