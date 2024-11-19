import { PieceMetadataModel, PieceMetadataModelSummary } from '@activepieces/pieces-framework'
import { PiecesSource, SharedSystemProp, system } from '@activepieces/server-shared'
import {
    assertNotNullOrUndefined,
    PackageType,
    PiecePackage,
    PlatformId,
    PrivatePiecePackage,
    PublicPiecePackage,
    SuggestionType,
} from '@activepieces/shared'
import { fileService } from '../../file/file.service'
import { PieceMetadataSchema } from '../piece-metadata-entity'
import { FastDbPieceMetadataService } from './db-piece-metadata-service'
import { FilePieceMetadataService } from './file-piece-metadata-service'
import { PieceMetadataService } from './piece-metadata-service'

const initPieceMetadataService = (): PieceMetadataService => {
    const source = system.getOrThrow<PiecesSource>(SharedSystemProp.PIECES_SOURCE)
    switch (source) {
        case PiecesSource.DB:
        case PiecesSource.CLOUD_AND_DB:
            return FastDbPieceMetadataService()
        case PiecesSource.FILE:
            return FilePieceMetadataService()
    }
}

export const pieceMetadataService = initPieceMetadataService()

export const getPiecePackage = async (
    projectId: string | undefined,
    platformId: PlatformId | undefined,
    pkg: Omit<PublicPiecePackage, 'directoryPath'> | Omit<PrivatePiecePackage, 'archiveId' | 'archive'>,
): Promise<PiecePackage> => {
    const pieceMetadata = await pieceMetadataService.getOrThrow({
        name: pkg.pieceName,
        version: pkg.pieceVersion,
        projectId,
        platformId,
    })
    switch (pkg.packageType) {
        case PackageType.ARCHIVE: {
            const { data } = await fileService.getDataOrThrow({
                fileId: pieceMetadata.archiveId!,
            })
            return {
                packageType: PackageType.ARCHIVE,
                pieceName: pkg.pieceName,
                pieceVersion: pieceMetadata.version,
                pieceType: pkg.pieceType,
                archiveId: pieceMetadata.archiveId!,
                archive: data,
            }
        }
        case PackageType.REGISTRY: {
            return {
                packageType: PackageType.REGISTRY,
                pieceName: pkg.pieceName,
                pieceVersion: pieceMetadata.version,
                pieceType: pkg.pieceType,
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
