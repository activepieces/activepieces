import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileExists, memoryLock, PackageInfo, packageManager, threadSafeMkdir } from '@activepieces/server-shared'
import {
    getPackageArchivePathForPiece,
    PackageType,
    PiecePackage,
    PrivatePiecePackage,
} from '@activepieces/shared'
import { PACKAGE_ARCHIVE_PATH, PieceManager } from './piece-manager'

export class RegistryPieceManager extends PieceManager {
    protected override async installDependencies({
        projectPath,
        pieces,
    }: InstallParams): Promise<void> {
        await this.savePackageArchivesToDiskIfNotCached(pieces)

        const dependenciesToInstall = await this.filterExistingPieces(projectPath, pieces)
        if (dependenciesToInstall.length === 0) {
            return
        }
        const installPromises = pieces.map(async (piece) => {
            const pnpmAddLock = await memoryLock.acquire(`pnpm-add-${projectPath}-${piece.pieceName}-${piece.pieceVersion}`)
            try {
                const dependencies = await this.filterExistingPieces(projectPath, [piece])
                await packageManager.add({ path: projectPath, dependencies })
            }
            finally {
                await pnpmAddLock.release()
            }
        })
        await Promise.all(installPromises)
    }

    private async savePackageArchivesToDiskIfNotCached(
        pieces: PiecePackage[],
    ): Promise<void> {
        const packages = await this.getUncachedArchivePackages(pieces)
        const saveToDiskJobs = packages.map((piece) =>
            this.getArchiveAndSaveToDisk(piece),
        )
        await Promise.all(saveToDiskJobs)
    }

    private async getUncachedArchivePackages(
        pieces: PiecePackage[],
    ): Promise<PrivatePiecePackage[]> {
        const packages: PrivatePiecePackage[] = []

        for (const piece of pieces) {
            if (piece.packageType !== PackageType.ARCHIVE) {
                continue
            }

            const archivePath = getPackageArchivePathForPiece({
                archiveId: piece.archiveId,
                archivePath: PACKAGE_ARCHIVE_PATH,
            })

            if (await fileExists(archivePath)) {
                continue
            }

            packages.push(piece)
        }

        return packages
    }

    private async getArchiveAndSaveToDisk(
        piece: PrivatePiecePackage,
    ): Promise<void> {
        const archiveId = piece.archiveId

        const archivePath = getPackageArchivePathForPiece({
            archiveId,
            archivePath: PACKAGE_ARCHIVE_PATH,
        })

        await threadSafeMkdir(dirname(archivePath))

        await writeFile(archivePath, piece.archive as Buffer)
    }

    private async filterExistingPieces(projectPath: string, pieces: PiecePackage[]): Promise<PackageInfo[]> {
        const enrichedDependencies = await Promise.all(
            pieces.map(async (piece) => {
                const pkg = this.pieceToDependency(piece)
                const fExists = await fileExists(join(projectPath, 'node_modules', pkg.alias))
                return { pkg, fExists }
            }),
        )
        return enrichedDependencies.filter(({ fExists }) => !fExists).map(({ pkg }) => pkg)
    }
}

type InstallParams = {
    projectPath: string
    pieces: PiecePackage[]
}
