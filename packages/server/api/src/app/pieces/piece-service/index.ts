import { PieceMetadata, PieceMetadataModel } from '@activepieces/pieces-framework'
import { AppSystemProp } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    AddPieceRequestBody,
    ApEdition,
    EngineResponseStatus,
    ErrorCode,
    ExecuteExtractPieceMetadata,
    ExecutionMode,
    FileCompression,
    FileId,
    FileType,
    isNil,
    PackageType,
    PiecePackage,
    PieceScope,
    PieceType,
    PlatformId,
    ProjectId,
    WorkerJobType,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { EngineHelperExtractPieceInformation, EngineHelperResponse } from 'server-worker'
import { fileService } from '../../file/file.service'
import { system } from '../../helper/system/system'
import { userInteractionWatcher } from '../../workers/user-interaction-watcher'
import { pieceMetadataService } from '../piece-metadata-service'

export const pieceService = (log: FastifyBaseLogger) => ({
    async installPiece(
        platformId: string,
        projectId: string | undefined,
        params: AddPieceRequestBody,
    ): Promise<PieceMetadataModel> {
        assertInstallProjectEnabled(params.scope)
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
                // TODO (@abuaboud) delete after migrating everyone to their own platform
                projectId: undefined,
                packageType: params.packageType,
                platformId,
                pieceType: PieceType.CUSTOM,
                archiveId,
            })

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

const assertInstallProjectEnabled = (scope: PieceScope): void => {
    if (scope === PieceScope.PROJECT) {
        const sandboxMode = system.getOrThrow(AppSystemProp.EXECUTION_MODE)
        const edition = system.getEdition()
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
                archive: undefined,
                packageType: params.packageType,
            }
        }

        case PackageType.REGISTRY: {
            return {
                ...params,
                pieceType: PieceType.CUSTOM,
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
