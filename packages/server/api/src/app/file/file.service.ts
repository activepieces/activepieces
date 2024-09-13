import { AppSystemProp, fileCompressor, system } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    apId,
    ErrorCode,
    File,
    FileCompression,
    FileId,
    FileLocation,
    FileType,
    isNil,
    ProjectId
} from '@activepieces/shared'
import { repoFactory } from '../core/db/repo-factory'
import { FileEntity } from './file.entity'
import { s3Helper } from './s3-helper'

export const fileRepo = repoFactory<File>(FileEntity)
const FILE_LOCATION = system.getOrThrow<FileLocation>(AppSystemProp.FILE_STORAGE_LOCATION)

export const fileService = {
    async save(params: SaveParams): Promise<File> {
        const baseFile = {
            id: params.fileId ?? apId(),
            projectId: params.projectId,
            platformId: params.platformId,
            type: params.type,
            compression: params.compression,
        }
        switch (FILE_LOCATION) {
            case FileLocation.DB:
                return fileRepo().save({
                    ...baseFile,
                    location: FileLocation.DB,
                    data: params.data,
                })
            case FileLocation.S3:{
                const s3Key = await s3Helper.uploadFile(params.platformId, params.projectId, baseFile.id, params.data)
                return fileRepo().save({
                    ...baseFile,
                    location: FileLocation.S3,
                    s3Key,
                })
            }
        }
    },
    async getDataOrThrow({ projectId, fileId }: GetOneParams): Promise<Buffer> {
        const file = await fileRepo().findOneBy({
            projectId,
            id: fileId,
        })
        if (isNil(file)) {
            throw new ActivepiecesError({
                code: ErrorCode.FILE_NOT_FOUND,
                params: {
                    id: fileId,
                },
            })
        }
        return fileCompressor.decompress({
            data: file.location === FileLocation.DB ? file.data : await s3Helper.getFile(file.s3Key!),
            compression: file.compression,
        })
    },
}


type SaveParams = {
    fileId?: FileId | undefined
    projectId?: ProjectId
    data: Buffer
    type: FileType
    platformId?: string
    compression: FileCompression
    s3Key?: string // Add this line to fix the linter error
}

type GetOneParams = {
    fileId: FileId
    projectId?: ProjectId
}
