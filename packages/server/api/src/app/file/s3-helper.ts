import { Readable } from 'stream'
import { apId, FileType, isNil, ProjectId } from '@activepieces/shared'
import { DeleteObjectsCommand, GetObjectCommand, PutObjectCommand, S3, S3ClientConfig } from '@aws-sdk/client-s3'
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
