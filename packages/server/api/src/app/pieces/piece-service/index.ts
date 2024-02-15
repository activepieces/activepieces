import {
    ActivepiecesError,
    ApEdition,
    EngineResponseStatus,
    ErrorCode,
    PackageType,
    PiecePackage,
    PieceScope,
    PieceType,
    AddPieceRequestBody,
} from '@activepieces/shared'
import { engineHelper } from '../../helper/engine-helper'
import { pieceMetadataService } from '../piece-metadata-service'
import { PieceMetadataModel } from '../piece-metadata-entity'
import { logger } from 'server-shared'
import { pieceServiceHooks } from './piece-service-hooks'
import { ExecutionMode, SystemProp, system } from 'server-shared'
import { getEdition } from '../../helper/secret-helper'
import { PieceMetadata } from '@activepieces/pieces-framework'

export const pieceService = {
    async installPiece(
        platformId: string | undefined,
        projectId: string,
        params: AddPieceRequestBody,
    ): Promise<PieceMetadataModel> {
        assertInstallProjectEnabled(params.scope)
        try {
            const piecePackage = await getPiecePackage(platformId, projectId, params)
            const pieceInformation = await extractPieceInformation(piecePackage)
            const savedPiece = await pieceMetadataService.create({
                pieceMetadata: {
                    ...pieceInformation,
                    minimumSupportedRelease:
            pieceInformation.minimumSupportedRelease ?? '0.0.0',
                    maximumSupportedRelease:
            pieceInformation.maximumSupportedRelease ?? '999.999.999',
                    name: pieceInformation.name,
                    version: pieceInformation.version,
                },
                projectId: params.scope === PieceScope.PROJECT ? projectId : undefined,
                packageType: params.packageType,
                platformId,
                pieceType: PieceType.CUSTOM,
                archiveId:
          piecePackage.packageType === PackageType.ARCHIVE
              ? piecePackage.archiveId
              : undefined,
            })

            return savedPiece
        }
        catch (error) {
            logger.error(error, '[PieceService#add]')

            if ((error as ActivepiecesError).error.code === ErrorCode.VALIDATION) {
                throw error
            }
            throw new ActivepiecesError({
                code: ErrorCode.ENGINE_OPERATION_FAILURE,
                params: {
                    message: JSON.stringify(error),
                },
            })
        }
    },
}

const assertInstallProjectEnabled = (scope: PieceScope): void => {
    if (scope === PieceScope.PROJECT) {
        const sandboxMode = system.getOrThrow(SystemProp.EXECUTION_MODE)
        const edition = getEdition()
        if (
            sandboxMode === ExecutionMode.UNSANDBOXED &&
      [ApEdition.ENTERPRISE, ApEdition.CLOUD].includes(edition)
        ) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHORIZATION,
                params: {
                    message:
            'Project pieces are not supported in this edition with unsandboxed execution mode',
                },
            })
        }
    }
}

const getPiecePackage = async (
    platformId: string | undefined,
    projectId: string | undefined,
    params: AddPieceRequestBody,
): Promise<PiecePackage> => {
    switch (params.packageType) {
        case PackageType.ARCHIVE: {
            return pieceServiceHooks.get().savePieceArchivePackage({
                archive: params.pieceArchive as Buffer,
                packageType: params.packageType,
                pieceName: params.pieceName,
                pieceVersion: params.pieceVersion,
                projectId: params.scope === PieceScope.PROJECT ? projectId : undefined,
                platformId,
            })
        }

        case PackageType.REGISTRY: {
            return {
                ...params,
                pieceType: PieceType.CUSTOM,
            }
        }
    }
}

const extractPieceInformation = async (
    piecePackage: PiecePackage,
): Promise<PieceMetadata> => {
    const engineResponse = await engineHelper.extractPieceMetadata(piecePackage)

    if (engineResponse.status !== EngineResponseStatus.OK) {
        throw new Error(engineResponse.standardError)
    }
    return engineResponse.result
}
