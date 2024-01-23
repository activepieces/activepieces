import { PiecesSource, system } from '../../helper/system/system'
import { SystemProp } from '../../helper/system/system-prop'
import { PieceMetadataService } from './piece-metadata-service'
import { FilePieceMetadataService } from './file-piece-metadata-service'
import { DbPieceMetadataService } from './db-piece-metadata-service'
import { AggregatedPieceMetadataService } from './aggregated-metadata-service'
import { PackageType, PiecePackage, PrivatePiecePackage, PublicPiecePackage } from '@activepieces/shared'

const initPieceMetadataService = (): PieceMetadataService => {
    const source = system.getOrThrow<PiecesSource>(SystemProp.PIECES_SOURCE)
    switch (source) {
        case PiecesSource.DB:
            return DbPieceMetadataService()
        case PiecesSource.FILE:
            return FilePieceMetadataService()
        case PiecesSource.CLOUD_AND_DB:
            return AggregatedPieceMetadataService()
    }
}

export const pieceMetadataService = initPieceMetadataService()

export const getPiecePackage = async (pkg: PublicPiecePackage | Omit<PrivatePiecePackage, 'archiveId'>): Promise<PiecePackage> => {
    switch (pkg.packageType) {
        case PackageType.ARCHIVE: {
            const pieceMetadata = await pieceMetadataService.getOrThrow({
                name: pkg.pieceName,
                version: pkg.pieceVersion,
            })
            return {
                packageType: PackageType.ARCHIVE,
                pieceName: pkg.pieceName,
                pieceVersion: pkg.pieceVersion,
                pieceType: pkg.pieceType,
                archiveId: pieceMetadata.archiveId!,
            }
        }
        case PackageType.REGISTRY: {
            return pkg
        }
    }
}