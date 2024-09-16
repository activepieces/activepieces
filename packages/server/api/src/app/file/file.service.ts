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
    ProjectId,
} from '@activepieces/shared'
import { repoFactory } from '../core/db/repo-factory'
import { FileEntity } from './file.entity'
import { s3Helper } from './s3-helper'

export const fileRepo = repoFactory<File>(FileEntity)

export const fileService = {
    async save(params: SaveParams): Promise<File> {
        const baseFile = {
            id: params.fileId ?? apId(),
            projectId: params.projectId,
            platformId: params.platformId,
            type: params.type,
            fileName: params.fileName,
            compression: params.compression,
            size: params.data.length,
            metadata: params.metadata,
        }
        const location = getLocationForFile(params.type)
        switch (location) {
            case FileLocation.DB:
                return fileRepo().save({
                    ...baseFile,
                    location: FileLocation.DB,
                    data: params.data,
                })
            case FileLocation.S3: {
                const s3Key = await s3Helper.uploadFile(params.platformId, params.projectId, params.type, baseFile.id, params.data)
                return fileRepo().save({
                    ...baseFile,
                    location: FileLocation.S3,
                    s3Key,
                })
            }
        }
    },
    async getDataOrThrow({ projectId, fileId, type }: GetOneParams): Promise<GetDataResponse> {
        const file = await fileRepo().findOneBy({
            projectId,
            id: fileId,
            type,
        })
        if (isNil(file)) {
            throw new ActivepiecesError({
                code: ErrorCode.FILE_NOT_FOUND,
                params: {
                    id: fileId,
                },
            })
        }
        const data = await fileCompressor.decompress({
            data: file.location === FileLocation.DB ? file.data : await s3Helper.getFile(file.s3Key!),
            compression: file.compression,
        })
        return {
            data,
            fileName: file.fileName,
        }
    },
}

type GetDataResponse = {
    data: Buffer
    fileName?: string
}
function getLocationForFile(type: FileType) {
    const FILE_LOCATION = system.getOrThrow<FileLocation>(AppSystemProp.FILE_STORAGE_LOCATION)
    if (isExecutionDataFileThatExpires(type)) {
        return FILE_LOCATION
    }
    return FileLocation.DB
}

function isExecutionDataFileThatExpires(type: FileType) {
    switch (type) {
        case FileType.FLOW_RUN_LOG:
        case FileType.FLOW_STEP_FILE:
            return true
        case FileType.PACKAGE_ARCHIVE:
            return false
        default:
            throw new Error(`File type ${type} is not supported`)
    }
}

type SaveParams = {
    fileId?: FileId | undefined
    projectId?: ProjectId
    data: Buffer
    type: FileType
    platformId?: string
    fileName?: string
    compression: FileCompression
    metadata?: Record<string, string>
}

type GetOneParams = {
    fileId: FileId
    projectId?: ProjectId
    type?: FileType
}
