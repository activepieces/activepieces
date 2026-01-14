import { PieceMetadata, PieceMetadataModel } from '@activepieces/pieces-framework'
import {
    ActivepiecesError,
    AddPieceRequestBody,
    EngineResponseStatus,
    ErrorCode,
    ExecuteExtractPieceMetadata,
    FileCompression,
    FileId,
    FileType,
    isNil,
    PackageType,
    PiecePackage,
    PieceType,
    PlatformId,
    ProjectId,
    WorkerJobType,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { EngineHelperExtractPieceInformation, EngineHelperResponse } from 'server-worker'
import { fileService } from '../file/file.service'
import { pubsub } from '../helper/pubsub'
import { userInteractionWatcher } from '../workers/user-interaction-watcher'
import { REDIS_REFRESH_LOCAL_PIECES_CHANNEL } from './metadata/local-piece-cache'
import { pieceMetadataService } from './metadata/piece-metadata-service'

export const pieceInstallService = (log: FastifyBaseLogger) => ({
    async installPiece(
        platformId: string,
        projectId: string | undefined,
        params: AddPieceRequestBody,
    ): Promise<PieceMetadataModel> {
        try {
            const piecePackage = await savePiecePackage(platformId, projectId, params, log)
            const pieceInformation = await extractPieceInformation({
                ...piecePackage,
                platformId,
            }, projectId, log)
            const archiveId = piecePackage.packageType === PackageType.ARCHIVE ? piecePackage.archiveId : undefined
            const savedPiece = await pieceMetadataService(log).create({
                pieceMetadata: {
                    ...pieceInformation,
                    minimumSupportedRelease:
                        pieceInformation.minimumSupportedRelease ?? '0.0.0',
                    maximumSupportedRelease:
                        pieceInformation.maximumSupportedRelease ?? '999.999.999',
                    name: pieceInformation.name,
                    version: pieceInformation.version,
                    i18n: pieceInformation.i18n,
                },
                packageType: params.packageType,
                platformId,
                pieceType: PieceType.CUSTOM,
                archiveId,
            })
            await pubsub.publish(REDIS_REFRESH_LOCAL_PIECES_CHANNEL, '')
            return savedPiece
        }
        catch (error) {
            log.error(error, '[PieceService#add]')

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
})


async function savePiecePackage(platformId: string | undefined, projectId: string | undefined, params: AddPieceRequestBody, log: FastifyBaseLogger): Promise<PiecePackage> {

    switch (params.packageType) {
        case PackageType.ARCHIVE: {
            const archiveId = await saveArchive({
                projectId: undefined,
                platformId,
                archive: params.pieceArchive.data as Buffer,
            }, log)
            return {
                ...params,
                pieceType: PieceType.CUSTOM,
                archiveId,
                platformId: platformId!,
                packageType: params.packageType,
            }
        }

        case PackageType.REGISTRY: {
            return {
                ...params,
                pieceType: PieceType.CUSTOM,
                platformId: platformId!,
            }
        }
    }
}

const extractPieceInformation = async (request: ExecuteExtractPieceMetadata, projectId: string | undefined, log: FastifyBaseLogger): Promise<PieceMetadata> => {
    const engineResponse = await userInteractionWatcher(log).submitAndWaitForResponse<EngineHelperResponse<EngineHelperExtractPieceInformation>>({
        jobType: WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION,
        platformId: request.platformId,
        piece: request,
        projectId,
    })

    if (engineResponse.status !== EngineResponseStatus.OK) {
        throw new Error(engineResponse.standardError)
    }
    return engineResponse.result
}

const saveArchive = async (
    params: GetPieceArchivePackageParams,
    log: FastifyBaseLogger,
): Promise<FileId> => {
    const { projectId, platformId, archive } = params

    const archiveFile = await fileService(log).save({
        projectId: isNil(platformId) ? projectId : undefined,
        platformId,
        data: archive,
        size: archive.length,
        type: FileType.PACKAGE_ARCHIVE,
        compression: FileCompression.NONE,
    })

    return archiveFile.id
}

type GetPieceArchivePackageParams = {
    archive: Buffer
    projectId?: ProjectId
    platformId?: PlatformId
}

