import { fileService } from '../../file/file.service'
import { PieceMetadataSchema } from '../piece-metadata-entity'
import { FastDbPieceMetadataService } from './db-piece-metadata-service'
import { FilePieceMetadataService } from './file-piece-metadata-service'
import { PieceMetadataService } from './piece-metadata-service'
import { PieceMetadataModel, PieceMetadataModelSummary } from '@activepieces/pieces-framework'
import { PiecesSource, system, SystemProp } from '@activepieces/server-shared'
import {
    assertNotNullOrUndefined,
    PackageType,
    PiecePackage,
    PrivatePiecePackage,
    PublicPiecePackage,
    SuggestionType,
} from '@activepieces/shared'

const pieceSource = system.getOrThrow<PiecesSource>(SystemProp.PIECES_SOURCE)


const initPieceMetadataService = (): PieceMetadataService => {
    const source = system.getOrThrow<PiecesSource>(SystemProp.PIECES_SOURCE)
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
    projectId: string,
    pkg: Omit<PublicPiecePackage, 'directoryPath'> | Omit<PrivatePiecePackage, 'archiveId' | 'archive'>,
): Promise<PiecePackage> => {
    switch (pkg.packageType) {
        case PackageType.ARCHIVE: {
            const pieceMetadata = await pieceMetadataService.getOrThrow({
                name: pkg.pieceName,
                version: pkg.pieceVersion,
                projectId,
            })
            const archiveFile = await fileService.getOneOrThrow({
                fileId: pieceMetadata.archiveId!,
            })
            return {
                packageType: PackageType.ARCHIVE,
                pieceName: pkg.pieceName,
                pieceVersion: pkg.pieceVersion,
                pieceType: pkg.pieceType,
                archiveId: pieceMetadata.archiveId!,
                archive: archiveFile.data,
            }
        }
        case PackageType.REGISTRY: {
            const directoryPath = await getDirectoryPath(projectId, pkg)
            return {
                ...pkg,
                directoryPath,
            }
        }
    }
}


async function getDirectoryPath(projectId: string,
    pkg: Omit<PublicPiecePackage, 'directoryPath'> | Omit<PrivatePiecePackage, 'archiveId' | 'archive'>): Promise<string | undefined> {
    if (pieceSource !== PiecesSource.FILE) {
        return undefined
    }
    const pieceMetadata = await pieceMetadataService.getOrThrow({
        name: pkg.pieceName,
        version: pkg.pieceVersion,
        projectId,
    })
    return pieceMetadata.directoryPath
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
