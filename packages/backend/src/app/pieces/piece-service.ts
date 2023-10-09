import { mkdir, writeFile } from 'node:fs/promises'
import { ActivepiecesError, EngineResponseStatus, ErrorCode, PackageType, PiecePackage, PieceType, ProjectId } from '@activepieces/shared'
import { engineHelper } from '../helper/engine-helper'
import { pieceMetadataService } from './piece-metadata-service'
import { PieceMetadataModel } from './piece-metadata-entity'
import { pieceManager } from '../flows/common/piece-manager'
import { logger } from '../helper/logger'

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
            })

            return savedPiece
        }
        catch (error) {
            logger.error({ error }, '[PieceService#add]')

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
            await saveArchive(params)
            const { archive: _, ...piecePackage } = params
            return {
                ...piecePackage,
                ...common,
            }
        }

        case PackageType.REGISTRY: {
            return {
                ...params,
                ...common,
            }
        }
    }
}

const saveArchive = async (params: AddArchivePieceParams): Promise<void> => {
    const { pieceName, pieceVersion, projectId, archive } = params

    const projectPackageArchivePath = pieceManager.getProjectPackageArchivePath({
        projectId,
    })

    const piecePackageArchivePath = `${projectPackageArchivePath}/${pieceName}`
    await mkdir(piecePackageArchivePath, { recursive: true })
    await writeFile(`${piecePackageArchivePath}/${pieceVersion}.tgz`, archive)
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
