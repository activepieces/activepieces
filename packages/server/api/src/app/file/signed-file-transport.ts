import { assertNotNullOrUndefined, File, FileLocation, FileType, isNil } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyReply } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { getLocationForFile } from './file.service'
import { s3Helper } from './s3-helper'

const useS3SignedUrls = system.getBoolean(AppSystemProp.S3_USE_SIGNED_URLS) ?? false

export const signedFileTransport = {
    isEnabled({ location, s3Key }: SignedFileShape): boolean {
        return useS3SignedUrls && location === FileLocation.S3 && !isNil(s3Key)
    },
    shouldRedirectForType(type: FileType): boolean {
        return useS3SignedUrls && getLocationForFile(type) === FileLocation.S3
    },
    async maybeRedirectToS3Put({ reply, log, file, contentEncoding }: PutRedirectParams): Promise<boolean> {
        if (!this.isEnabled(file)) {
            return false
        }
        assertNotNullOrUndefined(file.s3Key, 's3Key')
        const url = await s3Helper(log).putS3SignedUrl({
            s3Key: file.s3Key,
            contentEncoding,
        })
        log.info({ s3Key: file.s3Key, fileId: file.id }, 'Redirecting PUT to S3 signed URL')
        await reply
            .status(StatusCodes.TEMPORARY_REDIRECT)
            .header('Location', url)
            .send()
        return true
    },
    async maybeRedirectToS3Get({ reply, log, file }: GetRedirectParams): Promise<boolean> {
        if (!this.isEnabled(file)) {
            return false
        }
        assertNotNullOrUndefined(file.s3Key, 's3Key')
        const url = await s3Helper(log).getS3SignedUrl(file.s3Key, file.fileName ?? file.id)
        log.info({ s3Key: file.s3Key, fileId: file.id }, 'Redirecting GET to S3 signed URL')
        await reply
            .status(StatusCodes.TEMPORARY_REDIRECT)
            .header('Location', url)
            .send()
        return true
    },
}

type SignedFileShape = Pick<File, 'location' | 's3Key'>

type PutRedirectParams = {
    reply: FastifyReply
    log: FastifyBaseLogger
    file: Pick<File, 'id' | 'location' | 's3Key' | 'fileName'>
    contentEncoding?: string
}

type GetRedirectParams = {
    reply: FastifyReply
    log: FastifyBaseLogger
    file: Pick<File, 'id' | 'location' | 's3Key' | 'fileName'>
}
