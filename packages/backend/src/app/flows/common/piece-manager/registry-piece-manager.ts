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
    protected override async installDependencies({ projectId, projectPath, pieces }: InstallParams): Promise<void> {
        await this.savePackageArchivesToDiskIfNotCached(projectId, pieces)
        const dependencies = pieces.map(piece => this.pieceToDependency(projectId, piece))

        await packageManager.add({
            path: projectPath,
            dependencies,
        })
    }

    private async savePackageArchivesToDiskIfNotCached(projectId: string, pieces: PiecePackage[]): Promise<void> {
        const packages = await this.getUncachedArchivePackages(projectId, pieces)
        const saveToDiskJobs = packages.map((piece) => this.getArchiveAndSaveToDisk(projectId, piece))
        await Promise.all(saveToDiskJobs)
    }

    private async getUncachedArchivePackages(projectId: string, pieces: PiecePackage[]): Promise<PiecePackage[]> {
        const packages: PiecePackage[] = []

        for (const piece of pieces) {
            if (piece.packageType !== PackageType.ARCHIVE) {
                continue
            }

            const projectPackageArchivePath = this.getProjectPackageArchivePath({
                projectId,
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

    private async getArchiveAndSaveToDisk(projectId: string, piece: PiecePackage): Promise<void> {
        const archiveId = piece.archiveId ?? await this.getArchiveIdOrThrow(projectId, piece)

        const archiveFile = await fileService.getOneOrThrow({
            fileId: archiveId,
        })

        const projectPackageArchivePath = this.getProjectPackageArchivePath({
            projectId,
        })

        const archivePath = getPackageArchivePathForPiece({
            pieceName: piece.pieceName,
            pieceVersion: piece.pieceVersion,
            packageArchivePath: projectPackageArchivePath,
        })

        await mkdir(dirname(archivePath), { recursive: true })
        await writeFile(archivePath, archiveFile.data)
    }

    private async getArchiveIdOrThrow(projectId: string, piece: PiecePackage): Promise<string> {
        const pieceMetadata = await pieceMetadataService.getOrThrow({
            name: piece.pieceName,
            version: piece.pieceVersion,
            projectId,
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
    projectId: string
    projectPath: string
    pieces: PiecePackage[]
}
