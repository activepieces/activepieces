import { ActivepiecesError, ErrorCode, isNil, tryCatch } from '@activepieces/core-utils'
import { File, FileCompression, FileLocation, FileType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { fileRepo, fileService, getLocationForFile } from './file.service'
import { filesService } from './files-service'
import { s3Helper } from './s3-helper'

function getMaxStreamFileSizeBytes(): number {
    return system.getNumberOrThrow(AppSystemProp.MAX_STREAM_FILE_SIZE_MB) * 1024 * 1024
}

async function getStreamingFileOrThrow({ fileId, projectId, uploadId, log }: GetStreamingFileParams): Promise<{ file: File, s3Key: string }> {
    const file = await fileService(log).getFileOrThrow({ fileId, projectId, type: FileType.FLOW_STEP_FILE })
    if (file.location !== FileLocation.S3 || isNil(file.s3Key)) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: { message: `File ${fileId} is not an S3 streaming upload` },
        })
    }
    if (file.metadata?.uploadId !== uploadId) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: { message: `uploadId does not match the multipart session for file ${fileId}` },
        })
    }
    return { file, s3Key: file.s3Key }
}

export const multipartUploadService = {
    async create({ fileId, type, fileName, contentType, projectId, platformId, log }: CreateParams): Promise<CreateResult> {
        if (getLocationForFile(type) !== FileLocation.S3) {
            return { mode: 'DB' }
        }
        const file = await fileService(log).save({
            fileId,
            projectId,
            platformId,
            type,
            fileName,
            compression: FileCompression.NONE,
            size: 0,
            data: null,
            metadata: isNil(contentType) ? undefined : { mimetype: contentType },
        })
        if (file.location !== FileLocation.S3 || isNil(file.s3Key)) {
            // fileService.save silently falls back to DB on S3 errors — degrade honestly
            // instead of leaving an orphaned row the engine can never stream to.
            await fileRepo().delete({ id: file.id })
            return { mode: 'DB' }
        }
        const { data: uploadId, error } = await tryCatch(() => s3Helper(log).createMultipartUpload({
            s3Key: file.s3Key,
            contentType,
        }))
        if (!isNil(error)) {
            // S3 create failed after the placeholder row + key were reserved — drop the
            // orphan so it can never linger as a zero-byte file the engine never completes.
            await fileRepo().delete({ id: file.id })
            throw error
        }
        await fileRepo().update({ id: file.id }, { metadata: { ...file.metadata, uploadId } })
        return {
            mode: 'S3',
            uploadId,
            maxSizeBytes: getMaxStreamFileSizeBytes(),
        }
    },
    async getPartUrl({ fileId, projectId, uploadId, partNumber, log }: GetPartUrlParams): Promise<string> {
        const { s3Key } = await getStreamingFileOrThrow({ fileId, projectId, uploadId, log })
        return s3Helper(log).signPartUrl({ s3Key, uploadId, partNumber })
    },
    async complete({ fileId, projectId, platformId, uploadId, parts, log }: CompleteParams): Promise<{ readUrl: string, size: number }> {
        const { file, s3Key } = await getStreamingFileOrThrow({ fileId, projectId, uploadId, log })
        await s3Helper(log).completeMultipartUpload({ s3Key, uploadId, parts })
        const size = await s3Helper(log).getObjectSize({ s3Key })
        const maxSizeBytes = getMaxStreamFileSizeBytes()
        if (size > maxSizeBytes) {
            // The engine-side running total is advisory only — this is the authoritative check.
            await fileService(log).delete({ projectId, fileId })
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: `Streamed file size ${Math.ceil(size / (1024 * 1024))}MB exceeds the ${AppSystemProp.MAX_STREAM_FILE_SIZE_MB} limit of ${maxSizeBytes / (1024 * 1024)}MB` },
            })
        }
        await fileRepo().update({ id: file.id }, { size })
        const readUrl = await filesService.constructReadUrl({ fileId, fileType: file.type, platformId })
        return { readUrl, size }
    },
    async abort({ fileId, projectId, uploadId, log }: AbortParams): Promise<void> {
        const file = await fileService(log).getFile({ fileId, projectId, type: FileType.FLOW_STEP_FILE })
        if (!isNil(file) && !isNil(file.s3Key) && file.metadata?.uploadId === uploadId) {
            const { s3Key } = file
            await tryCatch(() => s3Helper(log).abortMultipartUpload({ s3Key, uploadId }))
            await fileRepo().delete({ id: file.id })
        }
    },
}

type GetStreamingFileParams = {
    fileId: string
    projectId: string | undefined
    uploadId: string
    log: FastifyBaseLogger
}

type CreateParams = {
    fileId: string
    type: FileType.FLOW_STEP_FILE
    fileName?: string
    contentType?: string
    projectId: string
    platformId: string
    log: FastifyBaseLogger
}

type CreateResult =
    | { mode: 'DB' }
    | { mode: 'S3', uploadId: string, maxSizeBytes: number }

type GetPartUrlParams = {
    fileId: string
    projectId: string
    uploadId: string
    partNumber: number
    log: FastifyBaseLogger
}

type CompleteParams = {
    fileId: string
    projectId: string
    platformId: string
    uploadId: string
    parts: { partNumber: number, etag: string }[]
    log: FastifyBaseLogger
}

type AbortParams = {
    fileId: string
    projectId: string
    uploadId: string
    log: FastifyBaseLogger
}
