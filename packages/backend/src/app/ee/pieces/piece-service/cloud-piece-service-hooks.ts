import { FileCompression, FileId, FileType, PieceType } from '@activepieces/shared'
import { GetPieceArchivePackageParams, PieceServiceHooks } from '../../../pieces/piece-service/piece-service-hooks'
import { fileService } from '../../../file/file.service'

export const cloudPieceServiceHooks: PieceServiceHooks = {
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
    const { projectId, archive } = params

    const archiveFile = await fileService.save({
        projectId,
        data: archive,
        type: FileType.PACKAGE_ARCHIVE,
        compression: FileCompression.NONE,
    })

    return archiveFile.id
}
