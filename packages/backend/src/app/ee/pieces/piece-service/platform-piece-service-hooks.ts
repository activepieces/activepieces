import { FileCompression, FileId, FileType, PieceType, isNil } from '@activepieces/shared'
import { GetPieceArchivePackageParams, PieceServiceHooks } from '../../../pieces/piece-service/piece-service-hooks'
import { fileService } from '../../../file/file.service'

export const platformPieceServiceHooks: PieceServiceHooks = {
    async getPieceArchivePackage(params) {
        const archiveId = await saveArchive(params)
        const { archive: _, ...piecePackage } = params

        return {
            ...piecePackage,
            pieceType: PieceType.CUSTOM,
            archiveId,
        }
    },
}

const saveArchive = async (params: GetPieceArchivePackageParams): Promise<FileId> => {
    const { projectId, platformId, archive } = params

    const archiveFile = await fileService.save({
        projectId: isNil(platformId) ? projectId : undefined,
        platformId,
        data: archive,
        type: FileType.PACKAGE_ARCHIVE,
        compression: FileCompression.NONE,
    })

    return archiveFile.id
}
