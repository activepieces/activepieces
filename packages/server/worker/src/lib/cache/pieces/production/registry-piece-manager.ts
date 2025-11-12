import { writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { enrichErrorContext, fileSystemUtils, systemConstants } from '@activepieces/server-shared'
import {
    getPackageArchivePathForPiece,
    isEmpty,
    PackageType,
    PiecePackage,
    PieceType,
    PrivatePiecePackage,
    WebsocketServerEvent,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { PackageInfo, packageManager } from '../../package-manager'
import { GLOBAL_CACHE_COMMON_PATH } from '../../worker-cache'
import { appSocket } from '../../../app-socket'
import { PiecePackageInformation } from '@activepieces/pieces-framework'

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
        const installDir = join(projectPath, 'pieces')

        await packageManager(log).createRootPackageJson({
            path: installDir
        })
        for (const piece of pieces) {
            await packageManager(log).createPiecePackageJson({
                path: join(installDir, `${piece.pieceName}-${piece.pieceVersion}`),
                piecePackage: piece,
            })
        }

        log.info({
            installDir,
        }, 'Installing registry pieces using bun')
        
        const performanceStartTime = performance.now()
        await packageManager(log).add({
            path: installDir,
            dependencies: pieces.map((piece) => pieceToDependency(piece)),
        })
        .then(()=> {
            log.info({
                installDir,
                timeTaken: `${Math.floor(performance.now() - performanceStartTime)}ms`,
            }, 'Installed registry pieces using bun')
        })
        .catch((error) => {
            log.error({
                installDir,
                error,
            }, 'Error installing registry pieces using bun')
        })
    },

    async preWarmCache(): Promise<void> {
        log.info('Pre-warming cache')
        const pieces = await appSocket(log).emitWithAck<PiecePackageInformation[]>(WebsocketServerEvent.GET_REGISTRY_PIECES, {})

        await registryPieceManager(log).install({
            projectPath: GLOBAL_CACHE_COMMON_PATH,
            pieces: pieces.map((piece) => ({
                packageType: PackageType.REGISTRY,
                pieceType: PieceType.OFFICIAL,
                pieceName: piece.name,
                pieceVersion: piece.version,
            })),
        })
    }
})

const pieceToDependency = (piece: PiecePackage): PackageInfo => {
    return {
        alias: piece.pieceName,
        spec: piece.pieceVersion,
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

