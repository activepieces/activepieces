import { dirname } from 'node:path'
import {
    ActivepiecesError,
    ErrorCode,
    PackageType,
    PiecePackage,
    getPackageArchivePathForPiece,
    isNil,
} from '@activepieces/shared'
import { packageManager } from '../../../helper/package-manager'
import { PieceManager } from './piece-manager'
import { fileService } from '../../../file/file.service'
import { fileExists } from '../../../helper/file-system'
import { mkdir, writeFile } from 'node:fs/promises'
import { pieceMetadataService } from '../../../pieces/piece-metadata-service'

export class RegistryPieceManager extends PieceManager {
    protected override async installDependencies({ projectPath, pieces }: InstallParams): Promise<void> {
        await this.savePackageArchivesToDiskIfNotCached(pieces)
        const dependencies = pieces.map(this.pieceToDependency, this)

        await packageManager.add({
            path: projectPath,
            dependencies,
        })
    }

    private async savePackageArchivesToDiskIfNotCached(pieces: PiecePackage[]): Promise<void> {
        const packages = await this.getUncachedArchivePackages(pieces)
        const saveToDiskJobs = packages.map(this.getArchiveAndSaveToDisk, this)
        await Promise.all(saveToDiskJobs)
    }

    private async getUncachedArchivePackages(pieces: PiecePackage[]): Promise<PiecePackage[]> {
        const packages: PiecePackage[] = []

        for (const piece of pieces) {
            if (piece.packageType !== PackageType.ARCHIVE) {
                continue
            }

            const projectPackageArchivePath = this.getProjectPackageArchivePath({
                projectId: piece.projectId,
            })

            const archivePath = getPackageArchivePathForPiece({
                pieceName: piece.pieceName,
                pieceVersion: piece.pieceVersion,
                packageArchivePath: projectPackageArchivePath,
            })

            if (await fileExists(archivePath)) {
                continue
            }

            packages.push(piece)
        }

        return packages
    }

    private async getArchiveAndSaveToDisk(piece: PiecePackage): Promise<void> {
        const archiveId = piece.archiveId ?? await this.getArchiveIdOrThrow(piece)

        const archiveFile = await fileService.getOneOrThrow({
            projectId: piece.projectId,
            fileId: archiveId,
        })

        const projectPackageArchivePath = this.getProjectPackageArchivePath({
            projectId: piece.projectId,
        })

        const archivePath = getPackageArchivePathForPiece({
            pieceName: piece.pieceName,
            pieceVersion: piece.pieceVersion,
            packageArchivePath: projectPackageArchivePath,
        })

        await mkdir(dirname(archivePath), { recursive: true })
        await writeFile(archivePath, archiveFile.data)
    }

    private async getArchiveIdOrThrow(piece: PiecePackage): Promise<string> {
        const pieceMetadata = await pieceMetadataService.getOrThrow({
            name: piece.pieceName,
            version: piece.pieceVersion,
            projectId: piece.projectId,
        })

        if (isNil(pieceMetadata.archiveId)) {
            throw new ActivepiecesError({
                code: ErrorCode.PIECE_NOT_FOUND,
                params: {
                    pieceName: piece.pieceName,
                    pieceVersion: piece.pieceVersion,
                },
            })
        }

        return pieceMetadata.archiveId
    }
}

type InstallParams = {
    projectPath: string
    pieces: PiecePackage[]
}
