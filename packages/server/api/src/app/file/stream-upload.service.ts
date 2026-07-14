import { ActivepiecesError, ErrorCode, isNil, tryCatch } from '@activepieces/core-utils'
import { FileCompression, FileLocation, FileType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { fileRepo, fileService, getLocationForFile } from './file.service'
import { filesService } from './files-service'
import { s3Helper } from './s3-helper'

function getMaxStreamFileSizeBytes(): number {
    return system.getNumberOrThrow(AppSystemProp.MAX_STREAM_FILE_SIZE_MB) * 1024 * 1024
}

export const streamUploadService = {
    // The engine streams a file of caller-declared size straight to S3 via a single
    // presigned PUT (the engine has no S3 credentials, so it cannot use the SDK directly).
    // Size is required, so no multipart is needed: S3 caps a single PUT at 5 GB, well above
    // MAX_STREAM_FILE_SIZE_MB. The row is created up front so the retention job can reap it
    // if the engine's PUT never lands — the same orphan-tolerance as the buffered signed path.
    async create({ fileId, type, fileName, contentType, size, projectId, platformId, log }: CreateParams): Promise<CreateResult> {
        if (getLocationForFile(type) !== FileLocation.S3) {
            return { mode: 'DB' }
        }
        const maxSizeBytes = getMaxStreamFileSizeBytes()
        if (size > maxSizeBytes) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: `Streamed file size ${Math.ceil(size / (1024 * 1024))}MB exceeds the ${AppSystemProp.MAX_STREAM_FILE_SIZE_MB} limit of ${maxSizeBytes / (1024 * 1024)}MB` },
            })
        }
        // save() with null data throws if S3 is misconfigured (its DB fallback needs bytes).
        // Any failure — or an unexpected non-S3 row — means "the engine should buffer to DB".
        const fileResult = await tryCatch(() => fileService(log).save({
            fileId,
            projectId,
            platformId,
            type,
            fileName,
            compression: FileCompression.NONE,
            size,
            data: null,
            metadata: isNil(contentType) ? undefined : { mimetype: contentType },
        }))
        if (fileResult.error !== null) {
            return { mode: 'DB' }
        }
        const file = fileResult.data
        if (file.location !== FileLocation.S3 || isNil(file.s3Key)) {
            await fileRepo().delete({ id: file.id })
            return { mode: 'DB' }
        }
        const url = await s3Helper(log).putS3SignedUrl({ s3Key: file.s3Key })
        const readUrl = await filesService.constructReadUrl({ fileId, fileType: file.type, platformId })
        return { mode: 'S3', url, readUrl }
    },
}

type CreateParams = {
    fileId: string
    type: FileType.FLOW_STEP_FILE
    fileName?: string
    contentType?: string
    size: number
    projectId: string
    platformId: string
    log: FastifyBaseLogger
}

type CreateResult =
    | { mode: 'DB' }
    | { mode: 'S3', url: string, readUrl: string }
