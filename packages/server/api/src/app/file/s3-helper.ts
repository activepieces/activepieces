import { Readable } from 'stream'
import { apId, isNil, ProjectId, tryCatch } from '@activepieces/core-utils'
import { FileType } from '@activepieces/shared'
import { AbortMultipartUploadCommand, CompleteMultipartUploadCommand, CreateMultipartUploadCommand, DeleteObjectsCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3, S3ClientConfig, UploadPartCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { NodeHttpHandler } from '@smithy/node-http-handler'
import contentDisposition from 'content-disposition'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { exceptionHandler } from '../helper/exception-handler'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { fileRepo } from './file.service'

export const s3Helper = (log: FastifyBaseLogger) => ({
    async constructS3Key(platformId: string | undefined, projectId: ProjectId | undefined, type: FileType, fileId: string): Promise<string> {
        const existingFile = await fileRepo().findOneBy({ id: fileId })
        if (!isNil(existingFile?.s3Key)) {
            return existingFile.s3Key
        }
        if (!isNil(platformId)) {
            return `platform/${platformId}/${type}/${fileId}`
        }
        else if (!isNil(projectId)) {
            return `project/${projectId}/${type}/${fileId}`
        }
        else {
            throw new Error('Either platformId or projectId must be provided')
        }
    },
    async uploadFile(s3Key: string, data: Buffer): Promise<string> {
        if (!Buffer.isBuffer(data)) {
            throw new Error(`Expected Buffer for S3 upload, received ${typeof data}`)
        }
        log.info({
            s3Key,
        }, 'uploading file to s3')
        try {
            await getS3Client().putObject({
                Bucket: getS3BucketName(),
                Key: s3Key,
                Body: Readable.from(data),
                ContentLength: data.length,
            })
            log.info({
                s3Key,
            }, 'file uploaded to s3')
        }
        catch (error) {
            log.error({
                s3Key,
                error,
            }, 'failed to upload file to s3')
            exceptionHandler.handle(error, log)
            throw error
        }
        return s3Key
    },

    async objectExists(s3Key: string): Promise<boolean> {
        const { error } = await tryCatch(() => getS3Client().send(new HeadObjectCommand({
            Bucket: getS3BucketName(),
            Key: s3Key,
        })))
        // A genuine miss (404) is the common case; anything else (403, expired creds, network)
        // means S3 is misconfigured — surface it so operators get a signal instead of a silent
        // npm fallback that never caches.
        const isMissing = error instanceof Error && (error.name === 'NotFound' || error.name === 'NoSuchKey')
        if (!isNil(error) && !isMissing) {
            log.warn({ s3Key, error: String(error) }, 'objectExists check failed unexpectedly, treating object as missing')
        }
        return isNil(error)
    },
    async getFile(s3Key: string): Promise<Buffer> {
        const response = await getS3Client().getObject({
            Bucket: getS3BucketName(),
            Key: s3Key,
        })
        return Buffer.from(await response.Body!.transformToByteArray())
    },
    async getS3SignedUrl(s3Key: string, fileName: string): Promise<string> {
        const client = getS3Client()
        const disposition = contentDisposition(fileName, { type: 'attachment' })
        const command = new GetObjectCommand({
            Bucket: getS3BucketName(),
            Key: s3Key,
            ResponseContentDisposition: disposition,
        })
        return getSignedUrl(client, command, {
            expiresIn: dayjs.duration(7, 'days').asSeconds(),
        })
    },
    async putS3SignedUrl({ s3Key, contentLength, contentEncoding }: PutS3SignedUrlParams): Promise<string> {
        const client = getS3Client()
        const command = new PutObjectCommand({
            Bucket: getS3BucketName(),
            Key: s3Key,
            ContentLength: contentLength,
            ContentEncoding: contentEncoding,
        })
        return getSignedUrl(client, command, {
            expiresIn: dayjs.duration(7, 'days').asSeconds(),
        })
    },
    async createMultipartUpload({ s3Key, contentType }: CreateMultipartUploadParams): Promise<string> {
        const response = await getS3Client().send(new CreateMultipartUploadCommand({
            Bucket: getS3BucketName(),
            Key: s3Key,
            ContentType: contentType,
        }))
        if (isNil(response.UploadId)) {
            throw new Error(`S3 did not return an UploadId for multipart upload of ${s3Key}`)
        }
        log.info({ s3Key }, 'multipart upload created')
        return response.UploadId
    },
    async uploadPart({ s3Key, uploadId, partNumber, body }: UploadPartParams): Promise<string> {
        const response = await getS3Client().send(new UploadPartCommand({
            Bucket: getS3BucketName(),
            Key: s3Key,
            UploadId: uploadId,
            PartNumber: partNumber,
            Body: body,
            ContentLength: body.length,
        }))
        if (isNil(response.ETag)) {
            throw new Error(`S3 did not return an ETag for part ${partNumber} of ${s3Key}`)
        }
        return response.ETag
    },
    async signPartUrl({ s3Key, uploadId, partNumber }: SignPartUrlParams): Promise<string> {
        const command = new UploadPartCommand({
            Bucket: getS3BucketName(),
            Key: s3Key,
            UploadId: uploadId,
            PartNumber: partNumber,
        })
        return getSignedUrl(getS3Client(), command, {
            expiresIn: STREAMING_URL_EXPIRY_SECONDS,
        })
    },
    async completeMultipartUpload({ s3Key, uploadId, parts }: CompleteMultipartUploadParams): Promise<void> {
        await getS3Client().send(new CompleteMultipartUploadCommand({
            Bucket: getS3BucketName(),
            Key: s3Key,
            UploadId: uploadId,
            MultipartUpload: {
                Parts: parts.map(({ partNumber, etag }) => ({ PartNumber: partNumber, ETag: etag })),
            },
        }))
        log.info({ s3Key }, 'multipart upload completed')
    },
    async abortMultipartUpload({ s3Key, uploadId }: AbortMultipartUploadParams): Promise<void> {
        await getS3Client().send(new AbortMultipartUploadCommand({
            Bucket: getS3BucketName(),
            Key: s3Key,
            UploadId: uploadId,
        }))
        log.info({ s3Key }, 'multipart upload aborted')
    },
    async getObjectSize({ s3Key }: GetObjectSizeParams): Promise<number> {
        const response = await getS3Client().send(new HeadObjectCommand({
            Bucket: getS3BucketName(),
            Key: s3Key,
        }))
        return response.ContentLength ?? 0
    },
    async deleteFiles(s3Keys: string[]): Promise<void> {
        if (s3Keys.length === 0) {
            return
        }
        // Cloudflare R2 has a limit of 100 keys per request
        const MAX_KEYS_PER_REQUEST = 100
        const chunks = chunkArray(s3Keys, MAX_KEYS_PER_REQUEST)

        try {
            for (const chunk of chunks) {
                const deleteObjects = chunk.map(Key => ({ Key }))
                await getS3Client().send(new DeleteObjectsCommand({
                    Bucket: getS3BucketName(),
                    Delete: {
                        Objects: deleteObjects,
                        Quiet: true,
                    },
                }))
                log.info({ count: chunk.length }, 'files deleted from s3')
            }
        }
        catch (error) {
            log.error({ error, count: s3Keys.length }, 'failed to delete files from s3')
            exceptionHandler.handle(error, log)
            throw error
        }
    },
    async validateS3Configuration(): Promise<void> {
        const client = getS3Client()
        const bucketName = getS3BucketName()
        const testKey = `activepieces-${apId()}-validation-test-key`

        await client.putObject({
            Bucket: bucketName,
            Key: testKey,
            Body: 'activepieces-test',
        })

        await client.headObject({
            Bucket: bucketName,
            Key: testKey,
        })

        await client.deleteObject({
            Bucket: bucketName,
            Key: testKey,
        })

    },
})


// Streaming part URLs are minted fresh per part, so a short expiry suffices.
// The legacy GET/PUT 7-day expiries above are deliberately untouched.
export const STREAMING_URL_EXPIRY_SECONDS = dayjs.duration(1, 'hour').asSeconds()

const chunkArray = (array: string[], chunkSize: number) => Array.from({ length: Math.ceil(array.length / chunkSize) }, (_, i) => array.slice(i * chunkSize, (i + 1) * chunkSize))

let cachedS3Client: S3 | null = null

const getS3Client = (): S3 => {
    if (cachedS3Client) {
        return cachedS3Client
    }
    const useIRSA = system.getBoolean(AppSystemProp.S3_USE_IRSA)
    const region = system.get<string>(AppSystemProp.S3_REGION)
    const endpoint = system.get<string>(AppSystemProp.S3_ENDPOINT)
    const options: S3ClientConfig = {
        region,
        forcePathStyle: endpoint ? true : undefined,
        endpoint,
        requestHandler: new NodeHttpHandler({
            connectionTimeout: 5_000,
            requestTimeout: 120_000,
        }),
        maxAttempts: 3,
    }
    if (!useIRSA) {
        const accessKeyId = system.getOrThrow<string>(AppSystemProp.S3_ACCESS_KEY_ID)
        const secretAccessKey = system.getOrThrow<string>(AppSystemProp.S3_SECRET_ACCESS_KEY)
        options.credentials = {
            accessKeyId,
            secretAccessKey,
        }
    }
    cachedS3Client = new S3(options)
    return cachedS3Client
}

const getS3BucketName = () => {
    return system.getOrThrow<string>(AppSystemProp.S3_BUCKET)
}

type PutS3SignedUrlParams = {
    s3Key: string
    contentLength?: number
    contentEncoding?: string
}

type CreateMultipartUploadParams = {
    s3Key: string
    contentType?: string
}

type UploadPartParams = {
    s3Key: string
    uploadId: string
    partNumber: number
    body: Buffer
}

type SignPartUrlParams = {
    s3Key: string
    uploadId: string
    partNumber: number
}

type CompleteMultipartUploadParams = {
    s3Key: string
    uploadId: string
    parts: {
        partNumber: number
        etag: string
    }[]
}

type AbortMultipartUploadParams = {
    s3Key: string
    uploadId: string
}

type GetObjectSizeParams = {
    s3Key: string
}
