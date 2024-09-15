import { Readable } from 'stream'
import { AppSystemProp, exceptionHandler, logger, system } from '@activepieces/server-shared'
import { FileType, ProjectId } from '@activepieces/shared'
import { S3 } from '@aws-sdk/client-s3'
import dayjs from 'dayjs'
const executionRentetionInDays = system.getNumber(AppSystemProp.EXECUTION_DATA_RETENTION_DAYS)!

export const s3Helper = {
    async uploadFile(platformId: string | undefined, projectId: ProjectId | undefined, type: FileType, fileId: string, data: Buffer): Promise<string> {

        const s3Key = constructS3Key(platformId, projectId, type, fileId)
        logger.info({
            s3Key,
        }, 'uploading file to s3')
        try {
            await getS3Client().putObject({
                Bucket: getS3BucketName(),
                Key: s3Key,
                Body: Readable.from(data),
                Expires: dayjs().add(executionRentetionInDays, 'day').toDate(),
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
}


const constructS3Key = (platformId: string | undefined, projectId: ProjectId | undefined, type: FileType, fileId: string): string => {
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
}

const getS3Client = () => {
    const region = system.getOrThrow<string>(AppSystemProp.S3_REGION)
    const endpoint = system.getOrThrow<string>(AppSystemProp.S3_ENDPOINT)
    const accessKeyId = system.getOrThrow<string>(AppSystemProp.S3_ACCESS_KEY_ID)
    const secretAccessKey = system.getOrThrow<string>(AppSystemProp.S3_SECRET_ACCESS_KEY)
    return new S3({
        region,
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
