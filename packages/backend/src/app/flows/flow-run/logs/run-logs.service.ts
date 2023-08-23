import {
    ExecutionOutput,
    ExecutionState,
    FlowRunId,
    ProjectId,
    apId,
    isNil,
} from '@activepieces/shared'
import { S3 } from '@aws-sdk/client-s3'
import { fileService } from '../../../file/file.service'
import { StorageType, system } from '../../../helper/system/system'
import { SystemProp } from '../../../helper/system/system-prop'

export type SaveParams = {
    flowRunId?: FlowRunId | undefined
    projectId: ProjectId
    data: ExecutionOutput
}

export type GetOneParams = {
    logId: string
    projectId: ProjectId
}

const storageType = system.get(SystemProp.LOGS_STORAGE_TYPE)
const bucket = system.getOrThrow(SystemProp.S3_BUCKET)
const s3 =
  storageType === StorageType.S3
      ? new S3({
          endpoint: system.getOrThrow(SystemProp.S3_ENDPOINT),
          credentials: {
              accessKeyId: system.getOrThrow(SystemProp.S3_ACCESS_KEY_ID),
              secretAccessKey: system.getOrThrow(SystemProp.S3_SECRET_ACCESS_KEY),
          },
          region: system.getOrThrow(SystemProp.S3_REGION),
      })
      : undefined

export const logsService = {
    async save(params: SaveParams): Promise<string> {
        switch (storageType) {
            case StorageType.S3:
                return saveToS3(params)
            case StorageType.DB:
                return saveToDb(params)
        }
        throw new Error(`Unknown storage type ${storageType}`)
    },
    async getOneOrThrow(params: GetOneParams): Promise<ExecutionState> {
        const fileLocation = isStoredInS3(params.logId)
            ? StorageType.S3
            : StorageType.DB
        switch (fileLocation) {
            case StorageType.S3:
                return getOneOrThrowFromS3(params)
            case StorageType.DB:
                return getOneOrThrowFromDb(params)
        }
    },
}

const getOneOrThrowFromDb = async ({
    projectId,
    logId,
}: GetOneParams): Promise<ExecutionState> => {
    const file = await fileService.getOneOrThrow({
        fileId: logId,
        projectId,
    })
    return JSON.parse(file.data.toString())
}

const getOneOrThrowFromS3 = async ({
    projectId,
    logId,
}: GetOneParams): Promise<ExecutionState> => {
    if (isNil(s3)) {
        throw new Error('S3 is undefined')
    }
    const data = await s3.getObject({
        Bucket: bucket,
        Key: `${projectId}/${getFilePathFromS3File(logId)}`,
    })
    const str = await data.Body?.transformToString()
    return JSON.parse(str!)
}

const saveToS3 = async ({
    projectId,
    flowRunId,
    data,
}: SaveParams): Promise<string> => {
    if (isNil(s3)) {
        throw new Error('S3 is undefined')
    }

    await s3.putObject({
        Bucket: bucket,
        Key: `${projectId}/${flowRunId}/logs.json`,
        ACL: undefined,
        ContentType: 'application/json',
        Body: Buffer.from(JSON.stringify(data)),
    })
    return encodeFiileNameToS3Format(`${flowRunId}/logs.json`)
}

const saveToDb = async ({ projectId, data }: SaveParams): Promise<string> => {
    const file = await fileService.save({
        fileId: apId(),
        projectId,
        data: Buffer.from(JSON.stringify(data)),
    })
    return file.id
}

const isStoredInS3 = (encodedId: string): boolean => {
    return decodeURIComponent(encodedId).startsWith('s3://')
}

const getFilePathFromS3File = (encodedId: string): string => {
    return decodeURIComponent(encodedId).replace('s3://', '')
}

const encodeFiileNameToS3Format = (file: string): string => {
    const path = `s3://${file}`
    return encodeURIComponent(path)
}
