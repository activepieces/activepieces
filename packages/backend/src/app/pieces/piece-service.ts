import {
    ActivepiecesError,
    EngineResponseStatus,
    ErrorCode,
    FileCompression,
    FileId,
    FileType,
    PackageType,
    PiecePackage,
    PieceType,
    ProjectId,
} from '@activepieces/shared'
import { engineHelper } from '../helper/engine-helper'
import { pieceMetadataService } from './piece-metadata-service'
import { PieceMetadataModel } from './piece-metadata-entity'
import { logger } from '../helper/logger'
import { fileService } from '../file/file.service'

export const pieceService = {
    async add(params: AddPieceParams): Promise<PieceMetadataModel> {
        try {
            const piecePackage = await getPiecePackage(params)
            const engineResponse = await engineHelper.extractPieceMetadata(piecePackage)

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
                projectId: params.projectId,
                packageType: params.packageType,
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
    const common = {
        pieceType: PieceType.CUSTOM,
    }

    switch (params.packageType) {
        case PackageType.ARCHIVE: {
            const archiveId = await saveArchive(params)
            const { archive: _, ...piecePackage } = params
            return {
                ...piecePackage,
                ...common,
                archiveId,
            }
        }

        case PackageType.REGISTRY: {
            return {
                ...params,
                ...common,
                archiveId: undefined,
            }
        }
    }
}

const saveArchive = async (params: AddArchivePieceParams): Promise<FileId> => {
    const { projectId, archive } = params

    const archiveFile = await fileService.save({
        projectId,
        data: archive,
        type: FileType.PACKAGE_ARCHIVE,
        compression: FileCompression.NONE,
    })

    return archiveFile.id
}

type BaseAddPieceParams<PT extends PackageType> = {
    packageType: PT
    pieceName: string
    pieceVersion: string
    projectId: ProjectId
}

type AddRegistryPieceParams = BaseAddPieceParams<PackageType.REGISTRY>

type AddArchivePieceParams = BaseAddPieceParams<PackageType.ARCHIVE> & {
    archive: Buffer
}

type AddPieceParams =
    | AddRegistryPieceParams
    | AddArchivePieceParams
