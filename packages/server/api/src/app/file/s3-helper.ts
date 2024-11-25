import { Readable } from 'stream'
import { AppSystemProp, exceptionHandler, logger, system } from '@activepieces/server-shared'
import { FileType, ProjectId } from '@activepieces/shared'
import { DeleteObjectsCommand, GetObjectCommand, PutObjectCommand, S3 } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import dayjs from 'dayjs'

export const s3Helper = {
    constructS3Key(platformId: string | undefined, projectId: ProjectId | undefined, type: FileType, fileId: string): string {
        const now = dayjs()
        const datePath = `${now.format('YYYY/MM/DD/HH')}`
        if (platformId) {
            return `platform/${platformId}/${type}/${datePath}/${fileId}`
        }
        else if (projectId) {
            return `project/${projectId}/${type}/${datePath}/${fileId}`
        }
        else {
            throw new Error('Either platformId or projectId must be provided')
        }
    },
    async uploadFile(s3Key: string, data: Buffer): Promise<string> {

        logger.info({
            s3Key,
        }, 'uploading file to s3')
        try {
            await getS3Client().putObject({
                Bucket: getS3BucketName(),
                Key: s3Key,
                Body: Readable.from(data),
                ContentLength: data.length,
            })
            logger.info({
                s3Key,
            }, 'file uploaded to s3')
        }
        catch (error) {
            logger.error({
                s3Key,
                error,
            }, 'failed to upload file to s3')
            exceptionHandler.handle(error)
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
        const command = new GetObjectCommand({
            Bucket: getS3BucketName(),
            Key: s3Key,
            ResponseContentDisposition: `attachment; filename="${fileName}"`,
        })
        return getSignedUrl(client, command)
    },
    async putS3SignedUrl(s3Key: string, contentLength: number): Promise<string> {
        const client = getS3Client()
        const command = new PutObjectCommand({
            Bucket: getS3BucketName(),
            Key: s3Key,
            ContentLength: contentLength,
        })
        return getSignedUrl(client, command)
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
                logger.info({ count: chunk.length }, 'files deleted from s3')
            }
        }
        catch (error) {
            logger.error({ error, count: s3Keys.length }, 'failed to delete files from s3')
            exceptionHandler.handle(error)
            throw error
        }
    },
}


const chunkArray = (array: string[], chunkSize: number) => Array.from({ length: Math.ceil(array.length / chunkSize) }, (_, i) => array.slice(i * chunkSize, (i + 1) * chunkSize))

const getS3Client = () => {
    const region = system.getOrThrow<string>(AppSystemProp.S3_REGION)
    const endpoint = system.getOrThrow<string>(AppSystemProp.S3_ENDPOINT)
    const accessKeyId = system.getOrThrow<string>(AppSystemProp.S3_ACCESS_KEY_ID)
    const secretAccessKey = system.getOrThrow<string>(AppSystemProp.S3_SECRET_ACCESS_KEY)
    return new S3({
        region,
        forcePathStyle: endpoint ? true : undefined,
        credentials: {
            accessKeyId,
            secretAccessKey,
        },
        endpoint,
    })
}

const getS3BucketName = () => {
    return system.getOrThrow<string>(AppSystemProp.S3_BUCKET)
}
