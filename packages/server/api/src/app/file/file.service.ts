import { databaseConnection } from '../database/database-connection'
import { FileEntity } from './file.entity'
import { fileCompressor, logger } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    apId,
    ErrorCode,
    File,
    FileCompression,
    FileId,
    FileType,
    isNil,
    ProjectId } from '@activepieces/shared'

type SaveParams = {
    fileId?: FileId | undefined
    projectId?: ProjectId
    data: Buffer
    type: FileType
    platformId?: string
    compression: FileCompression
}

type GetOneParams = {
    fileId: FileId
    projectId?: ProjectId
}

type DeleteOneParams = {
    fileId: FileId
    projectId: ProjectId
}

const fileRepo = databaseConnection.getRepository<File>(FileEntity)

export const fileService = {
    async save({
        fileId,
        projectId,
        platformId,
        data,
        type,
        compression,
    }: SaveParams): Promise<File> {
        const file = {
            id: fileId ?? apId(),
            projectId,
            platformId,
            data,
            type,
            compression,
        }

        const savedFile = await fileRepo.save(file)

        logger.info(
            `[FileService#save] fileId=${savedFile.id} data.length=${data.length}`,
        )

        return savedFile
    },

    async getOne({ projectId, fileId }: GetOneParams): Promise<File | null> {
        const file = await fileRepo.findOneBy({
            projectId,
            id: fileId,
        })

        if (isNil(file)) {
            return null
        }

        const decompressedData = await fileCompressor.decompress({
            data: file.data,
            compression: file.compression,
        })

        file.data = decompressedData
        return file
    },

    async getOneOrThrow(params: GetOneParams): Promise<File> {
        const file = await this.getOne(params)

        if (isNil(file)) {
            throw new ActivepiecesError({
                code: ErrorCode.FILE_NOT_FOUND,
                params: {
                    id: params.fileId,
                },
            })
        }

        return file
    },

    async delete({ fileId, projectId }: DeleteOneParams): Promise<void> {
        logger.info('Deleted file with Id ' + fileId)
        await fileRepo.delete({ id: fileId, projectId })
    },
}
