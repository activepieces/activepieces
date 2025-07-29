import { PieceMetadataModel, PieceMetadataModelSummary } from '@activepieces/pieces-framework'
import { AppSystemProp, PiecesSource } from '@activepieces/server-shared'
import {
    assertNotNullOrUndefined,
    PackageType,
    PiecePackage,
    PlatformId,
    PrivatePiecePackage,
    PublicPiecePackage,
    SuggestionType,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../../helper/system/system'
import { PieceMetadataSchema } from '../piece-metadata-entity'
import { FastDbPieceMetadataService } from './db-piece-metadata-service'
import { FilePieceMetadataService } from './file-piece-metadata-service'
import { PieceMetadataService } from './piece-metadata-service'


export const pieceMetadataService = (log: FastifyBaseLogger): PieceMetadataService => {
    const source = system.getOrThrow<PiecesSource>(AppSystemProp.PIECES_SOURCE)
    switch (source) {
        case PiecesSource.DB:
        case PiecesSource.CLOUD_AND_DB:
            return FastDbPieceMetadataService(log)
        case PiecesSource.FILE:
            return FilePieceMetadataService(log)
    }
}

export const getPiecePackageWithoutArchive = async (
    log: FastifyBaseLogger,
    projectId: string | undefined,
    platformId: PlatformId | undefined,
    pkg: Omit<PublicPiecePackage, 'directoryPath' | 'pieceType' | 'packageType'> | Omit<PrivatePiecePackage, 'archiveId' | 'archive' | 'pieceType' | 'packageType'>,
): Promise<PiecePackage> => {
    const pieceMetadata = await pieceMetadataService(log).getOrThrow({
        name: pkg.pieceName,
        version: pkg.pieceVersion,
        projectId,
        platformId,
    })
    switch (pieceMetadata.packageType) {
        case PackageType.ARCHIVE: {
            return {
                packageType: PackageType.ARCHIVE,
                pieceName: pkg.pieceName,
                pieceVersion: pieceMetadata.version,
                pieceType: pieceMetadata.pieceType,
                archiveId: pieceMetadata.archiveId!,
                archive: undefined,
            }
        }
        case PackageType.REGISTRY: {
            return {
                packageType: PackageType.REGISTRY,
                pieceName: pkg.pieceName,
                pieceVersion: pieceMetadata.version,
                pieceType: pieceMetadata.pieceType,
            }
        }
    }
}

export function toPieceMetadataModelSummary<T extends PieceMetadataSchema | PieceMetadataModel>(
    pieceMetadataEntityList: T[],
    originalMetadataList: T[],
    suggestionType?: SuggestionType,
): PieceMetadataModelSummary[] {
    return pieceMetadataEntityList.map((pieceMetadataEntity) => {
        const originalMetadata = originalMetadataList.find((p) => p.name === pieceMetadataEntity.name)
        assertNotNullOrUndefined(originalMetadata, `Original metadata not found for ${pieceMetadataEntity.name}`)
        return {
            ...pieceMetadataEntity,
            actions: Object.keys(originalMetadata.actions).length,
            triggers: Object.keys(originalMetadata.triggers).length,
            suggestedActions: suggestionType === SuggestionType.ACTION || suggestionType === SuggestionType.ACTION_AND_TRIGGER ?
                Object.values(pieceMetadataEntity.actions) : undefined,
            suggestedTriggers: suggestionType === SuggestionType.TRIGGER || suggestionType === SuggestionType.ACTION_AND_TRIGGER ?
                Object.values(pieceMetadataEntity.triggers) : undefined,
        }
    })
}
