import { apId } from '@activepieces/core-utils'
import { FileLocation, FileType } from '@activepieces/shared'
import { MultipartFile } from '@fastify/multipart'
import { FastifyBaseLogger, FastifyRequest } from 'fastify'
import { s3Helper } from '../file/s3-helper'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'

export const webhookFileStreamer = {
    shouldStream(request: FastifyRequest): boolean {
        const isWebhookRoute = request.url.includes('/v1/webhooks/')
        const s3Enabled = system.get(AppSystemProp.FILE_STORAGE_LOCATION) === FileLocation.S3
        return isWebhookRoute && s3Enabled
    },
    async streamToS3({ part, log }: StreamToS3Params): Promise<StreamedMultipartFile> {
        const fileId = apId()
        const s3Key = `${FileType.FLOW_STEP_FILE}/${fileId}`
        const maxBytes = system.getNumberOrThrow(AppSystemProp.MAX_WEBHOOK_FILE_SIZE_MB) * 1024 * 1024
        const { size } = await s3Helper(log).uploadStream({ s3Key, stream: part.file, maxBytes })
        return {
            type: 'streamed-file',
            fileId,
            s3Key,
            size,
            filename: part.filename,
            mimetype: part.mimetype,
        }
    },
    isStreamedFile(value: unknown): value is StreamedMultipartFile {
        return typeof value === 'object' && value !== null && 'type' in value && value.type === 'streamed-file'
    },
}

type StreamToS3Params = {
    part: MultipartFile
    log: FastifyBaseLogger
}

export type StreamedMultipartFile = {
    type: 'streamed-file'
    fileId: string
    s3Key: string
    size: number
    filename: string
    mimetype?: string
}
