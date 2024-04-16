import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import {
    getPackageArchivePathForPiece,
    PackageType,
    PiecePackage,
    PrivatePiecePackage,
} from '@activepieces/shared'
import { fileExists } from '../../file-system'
import { fileService } from '../../files/file-service'
import { packageManager } from '../../package-manager'
import { PACKAGE_ARCHIVE_PATH, PieceManager } from './piece-manager'

export class RegistryPieceManager extends PieceManager {
    protected override async installDependencies({
        projectPath,
        pieces,
    }: InstallParams): Promise<void> {
        await this.savePackageArchivesToDiskIfNotCached(pieces)
        const dependencies = pieces.map((piece) => this.pieceToDependency(piece))

        await packageManager.add({
            path: projectPath,
            dependencies,
        })
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

        const archiveData = await fileService.getData({
            id: archiveId,
        })

        const archivePath = getPackageArchivePathForPiece({
            archiveId,
            archivePath: PACKAGE_ARCHIVE_PATH,
        })

        await mkdir(dirname(archivePath), { recursive: true })
        await writeFile(archivePath, archiveData)
    }
}

type InstallParams = {
    projectPath: string
    pieces: PiecePackage[]
}
