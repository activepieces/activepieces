import { AppSystemProp, exceptionHandler, fileCompressor } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    apId,
    assertNotNullOrUndefined,
    ErrorCode,
    File,
    FileCompression,
    FileId,
    FileLocation,
    FileType,
    isNil,
    ProjectId,
} from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { In, LessThanOrEqual } from 'typeorm'
import { repoFactory } from '../core/db/repo-factory'
import { system } from '../helper/system/system'
import { FileEntity } from './file.entity'
import { s3Helper } from './s3-helper'

export const fileRepo = repoFactory<File>(FileEntity)
const EXECUTION_DATA_RETENTION_DAYS = system.getNumberOrThrow(AppSystemProp.EXECUTION_DATA_RETENTION_DAYS)

type BaseFile = Pick<File, 'id' | 'projectId' | 'platformId' | 'type' | 'fileName' | 'compression' | 'size' | 'metadata' | 'created' | 'updated'>

const saveFileToDb = async (baseFile: BaseFile, data: SaveParams['data']) => {
    assertNotNullOrUndefined(data, 'data is required')
    return fileRepo().save({
        ...baseFile,
        location: FileLocation.DB,
        data,
    })
}
export const fileService = (log: FastifyBaseLogger) => ({
    async save(params: SaveParams): Promise<File> {
        const baseFile: BaseFile = {
            id: params.fileId ?? apId(),
            projectId: params.projectId,
            platformId: params.platformId,
            type: params.type,
            fileName: params.fileName,
            compression: params.compression,
            size: params.size,
            metadata: params.metadata,
            created: dayjs().toISOString(),
            updated: dayjs().toISOString(),
        }
        const location = getLocationForFile(params.type)
        switch (location) {
            case FileLocation.DB: {
                return saveFileToDb(baseFile, params.data)
            }
            case FileLocation.S3: {
                try {
                    const s3Key = await s3Helper(log).constructS3Key(params.platformId, params.projectId, params.type, baseFile.id)
                    if (!isNil(params.data)) {
                        await s3Helper(log).uploadFile(s3Key, params.data)
                    }
                    const savedFile = await fileRepo().save({
                        ...baseFile,
                        location: FileLocation.S3,
                        s3Key,
                    })
                    return savedFile
                }
                catch (error) {
                    exceptionHandler.handle(error, log)
                    return saveFileToDb(baseFile, params.data)
                }
            }
        }
    },
    async updateSize(params: UpdateSizeParams): Promise<void> {
        await fileRepo().update(params.fileId, {
            size: params.size,
        })
    },
    async getFile({ projectId, fileId, type }: GetOneParams): Promise<File | null> {
        const file = await fileRepo().findOneBy({
            projectId,
            id: fileId,
            type,
        })
        return file
    },
    async getFileOrThrow(params: GetOneParams): Promise<File> {
        const file = await this.getFile(params)
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
    async getDataOrUndefined({ projectId, fileId, type }: GetOneParams): Promise<GetDataResponse | undefined> {
        try {
            return await this.getDataOrThrow({ projectId, fileId, type })
        }
        catch (error) {
            log.error({
                error,
            }, '[FileService#getData] error')
            return undefined
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
            data: file.location === FileLocation.DB ? file.data : await s3Helper(log).getFile(file.s3Key!),
            compression: file.compression,
        })
        return {
            metadata: file.metadata,
            data,
            fileName: file.fileName,
        }
    },
    async deleteStaleBulk(types: FileType[]) {
        const retentionDateBoundary = dayjs().subtract(EXECUTION_DATA_RETENTION_DAYS, 'days').toISOString()
        const maximumFilesToDeletePerIteration = 4000
        let affected: undefined | number = undefined
        let totalAffected = 0
        while (isNil(affected) || affected === maximumFilesToDeletePerIteration) {
            const staleFiles = await fileRepo().find({
                select: ['id', 'created', 's3Key'],
                where: {
                    type: In(types),
                    created: LessThanOrEqual(retentionDateBoundary),
                },
                take: maximumFilesToDeletePerIteration,
            })

            const s3Keys = staleFiles.filter(f => !isNil(f.s3Key)).map(f => f.s3Key!)
            await s3Helper(log).deleteFiles(s3Keys)

            const result = await fileRepo().delete({
                type: In(types),
                created: LessThanOrEqual(retentionDateBoundary),
                id: In(staleFiles.map(file => file.id)),
            })
            affected = result.affected || 0
            totalAffected += affected
            log.info({
                counts: affected,
                types,
            }, '[FileService#deleteStaleBulk] iteration completed')
        }
        log.info({
            totalAffected,
            types,
        }, '[FileService#deleteStaleBulk] completed')
    },
})

type GetDataResponse = {
    metadata?: Record<string, string>
    data: Buffer
    fileName?: string
}

type UpdateSizeParams = {
    fileId: FileId
    size: number
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
        case FileType.TRIGGER_PAYLOAD:
        case FileType.TRIGGER_EVENT_FILE:
            return true
        case FileType.SAMPLE_DATA:
        case FileType.SAMPLE_DATA_INPUT:
        case FileType.PACKAGE_ARCHIVE:
        case FileType.PROJECT_RELEASE:
            return false
        default:
            throw new Error(`File type ${type} is not supported`)
    }
}

type SaveParams = {
    fileId?: FileId | undefined
    projectId?: ProjectId
    data: Buffer | null
    size: number
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
