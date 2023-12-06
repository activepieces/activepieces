import {
    ActivepiecesError,
    EngineResponseStatus,
    ErrorCode,
    PackageType,
    PiecePackage,
    PieceType,
    ProjectId,
    isNil,
} from '@activepieces/shared'
import { engineHelper } from '../../helper/engine-helper'
import { pieceMetadataService } from '../piece-metadata-service'
import { PieceMetadataModel } from '../piece-metadata-entity'
import { logger } from '../../helper/logger'
import { pieceServiceHooks } from './piece-service-hooks'

export const pieceService = {
    async installPiece(params: AddPieceParams): Promise<PieceMetadataModel> {
        try {
            const piecePackage = await getPiecePackage(params)
            const engineResponse = await engineHelper.extractPieceMetadata({
                ...piecePackage,
                projectId: params.projectId,
            })

            if (engineResponse.status !== EngineResponseStatus.OK) {
                throw new Error(engineResponse.standardError)
            }

            const savedPiece = await pieceMetadataService.create({
                pieceMetadata: {
                    ...engineResponse.result,
                    minimumSupportedRelease: engineResponse.result.minimumSupportedRelease ?? '0.0.0',
                    maximumSupportedRelease: engineResponse.result.maximumSupportedRelease ?? '999.999.999',
                    name: params.pieceName,
                    version: params.pieceVersion,
                },
                projectId: isNil(params.platformId) ? params.projectId : undefined,
                packageType: params.packageType,
                platformId: params.platformId,
                pieceType: PieceType.CUSTOM,
                archiveId: piecePackage.archiveId,
            })

            return savedPiece
        }
        catch (error) {
            logger.error(error, '[PieceService#add]')

            throw new ActivepiecesError({
                code: ErrorCode.PIECE_NOT_FOUND,
                params: {
                    pieceName: params.pieceName,
                    pieceVersion: params.pieceVersion,
                },
            })
        }
    },
}

const getPiecePackage = async (params: AddPieceParams): Promise<PiecePackage> => {
    switch (params.packageType) {
        case PackageType.ARCHIVE: {
            return pieceServiceHooks.get().getPieceArchivePackage(params)
        }

        case PackageType.REGISTRY: {
            return {
                ...params,
                pieceType: PieceType.CUSTOM,
            }
        }
    }
}

type BaseAddPieceParams<PT extends PackageType> = {
    packageType: PT
    pieceName: string
    pieceVersion: string
    projectId: ProjectId
    platformId?: string
}

type AddRegistryPieceParams = BaseAddPieceParams<PackageType.REGISTRY>

type AddArchivePieceParams = BaseAddPieceParams<PackageType.ARCHIVE> & {
    archive: Buffer
}

type AddPieceParams =
    | AddRegistryPieceParams
    | AddArchivePieceParams
